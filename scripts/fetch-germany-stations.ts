/**
 * Fetch German fuel-station data via tankerkoenig.de.
 *
 * Architecture: tankerkoenig has NO bulk station endpoint. We cover Germany
 * with an overlapping hex-packed grid of radius-25km searches via list.php,
 * which returns station details + current prices inline. Stations are
 * deduplicated by ID across overlapping cells.
 *
 * REQUIRES: TANKERKOENIG_API_KEY environment variable.
 *   - Apply for a free non-commercial key at
 *     https://creativecommons.tankerkoenig.de/api.html (24–48 hours approval).
 *   - For architecture testing without a real key, set
 *     TANKERKOENIG_API_KEY to the documented demo UUID
 *     00000000-0000-0000-0000-000000000002 — the API returns station
 *     locations but no real prices, so aggregation files will populate
 *     with empty fuel stats. This proves the pipeline end-to-end.
 *
 * Output: data/germany-fuel-prices.json
 *         data/germany-land/{code}.json (one per Bundesland)
 *         data/germany-city-index.json
 *
 * Cadence: daily via update-data.yml. Script exits 0 with a clear message
 * when TANKERKOENIG_API_KEY is not set, so the rest of the pipeline isn't
 * blocked.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BUNDESLAENDER, bundeslandFromPlz } from '../lib/germany-geo';

const TK_BASE = 'https://creativecommons.tankerkoenig.de';
const LIST_ENDPOINT = `${TK_BASE}/json/list.php`;

// Documented public demo key — returns station locations but no real prices.
const DEMO_KEY = '00000000-0000-0000-0000-000000000002';

// Search circle radius (max 25 km per docs)
const SEARCH_RADIUS_KM = 25;
// Distance between hex-grid centres (km). 37.5 = 1.5 × radius gives clear
// overlap so no gaps even where the grid bumps up against Germany's borders.
const GRID_SPACING_KM = 37.5;
// Inter-call politeness delay. tankerkoenig is a small non-profit and will
// 503 then firewall-block (ECONNREFUSED) your IP if you fire requests faster
// than roughly 1/sec — a 150ms sweep of ~570 cells got us temporarily banned.
// Default to a courteous ~1 req/sec; override with TK_DELAY_MS if needed.
const REQUEST_DELAY_MS = Number(process.env.TK_DELAY_MS ?? 1000);
// Per-cell retry policy for transient 503/429 (overload / soft rate-limit).
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2000;
// Circuit breaker: if this many cells fail in a row, the API has almost
// certainly blocked us — abort cleanly rather than hammering into a hard ban.
const MAX_CONSECUTIVE_FAILURES = 15;
// Sanity floor. Germany has ~14k–15k stations; a healthy sweep maps most of
// them. Anything far below this means the sweep failed, and we must NOT let
// the degraded result overwrite good data on disk.
const MIN_PLAUSIBLE_STATIONS = 3000;

// Germany bounding box (padded slightly beyond actual borders).
// Sylt to Bodensee, Aachen to Görlitz.
const BOUNDS = { minLat: 47.0, maxLat: 55.5, minLng: 5.5, maxLng: 15.5 };

const FUEL_KEYS = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'] as const;
type FuelKey = (typeof FUEL_KEYS)[number];

interface TKStation {
  id: string;
  name?: string;
  brand?: string;
  street?: string;
  houseNumber?: string;
  postCode?: number;
  place?: string;
  lat?: number;
  lng?: number;
  dist?: number;
  diesel?: number | false;
  e5?: number | false;
  e10?: number | false;
  isOpen?: boolean;
}

interface TKListResponse {
  ok: boolean;
  license?: string;
  data?: string;
  status?: string;
  message?: string;
  stations?: TKStation[];
}

interface StationOut {
  id: string;
  cp: string;
  ville: string;
  adresse: string;
  brand: string;
  lat: number | null;
  lng: number | null;
  fuels: Partial<Record<FuelKey, number>>;
}

interface FuelStats {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
}

interface AreaStats {
  name: string;
  stationCount: number;
  fuels: Partial<Record<FuelKey, FuelStats>>;
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stats(values: number[]): FuelStats | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    mean: +(sum / values.length).toFixed(4),
    median: +median(values).toFixed(4),
    min: +Math.min(...values).toFixed(4),
    max: +Math.max(...values).toFixed(4),
  };
}

function titleCase(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .split(/(\s|-|\/|\.)/)
    .map((p) => (/^[a-zà-ÿäöüß']+$/i.test(p) ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join('');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Yield hex-packed grid centres covering Germany's bounding box.
 *
 * Honeycomb packing: rows are spaced by spacing × √3/2; alternating rows are
 * offset by half a column to give true hex coverage rather than a square
 * grid (more efficient — fewer cells for the same coverage).
 */
function* gridCentres(): Generator<{ lat: number; lng: number }> {
  const meanLat = (BOUNDS.minLat + BOUNDS.maxLat) / 2;
  const dLat = GRID_SPACING_KM / 111; // ~111 km per ° latitude
  const dLng = GRID_SPACING_KM / (111 * Math.cos((meanLat * Math.PI) / 180));
  const rowStep = (dLat * Math.sqrt(3)) / 2;

  let row = 0;
  for (let lat = BOUNDS.minLat; lat <= BOUNDS.maxLat; lat += rowStep) {
    const lngOffset = row % 2 === 0 ? 0 : dLng / 2;
    for (let lng = BOUNDS.minLng + lngOffset; lng <= BOUNDS.maxLng; lng += dLng) {
      yield { lat: +lat.toFixed(4), lng: +lng.toFixed(4) };
    }
    row++;
  }
}

async function fetchCircle(
  lat: number,
  lng: number,
  apiKey: string
): Promise<TKListResponse> {
  const url =
    `${LIST_ENDPOINT}?lat=${lat}&lng=${lng}&rad=${SEARCH_RADIUS_KM}` +
    `&sort=dist&type=all&apikey=${apiKey}`;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'EuroOilWatch fetch-germany-stations.ts (https://eurooilwatch.com)' },
      });
      // 503 (overload) and 429 (rate-limit) are transient — back off and retry,
      // honouring Retry-After if the server sent one.
      if (res.status === 503 || res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : RETRY_BASE_MS * 2 ** attempt; // exponential backoff
        if (attempt < MAX_RETRIES) {
          await sleep(wait);
          continue;
        }
        throw new Error(`HTTP ${res.status} ${res.statusText} (exhausted ${MAX_RETRIES} retries)`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return (await res.json()) as TKListResponse;
    } catch (err) {
      lastErr = err;
      // Connection-level failure (e.g. ECONNREFUSED from an IP block) — back
      // off and retry a couple of times in case it's transient.
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_MS * 2 ** attempt);
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function main() {
  const apiKey = process.env.TANKERKOENIG_API_KEY;
  if (!apiKey) {
    console.log(
      '[germany] TANKERKOENIG_API_KEY not set — skipping fetch.\n' +
        '         Apply at https://creativecommons.tankerkoenig.de/api.html (24–48h).\n' +
        '         For architecture testing, set TANKERKOENIG_API_KEY=' +
        DEMO_KEY +
        ' (no real prices, but proves the pipeline).'
    );
    process.exit(0);
  }

  const isDemo = apiKey === DEMO_KEY;
  if (isDemo) {
    console.log(
      '[germany] DEMO KEY mode — station locations will populate but prices will be empty.'
    );
  }

  const centres = Array.from(gridCentres());
  console.log(
    `[germany] sweeping Germany with ${centres.length} radius-${SEARCH_RADIUS_KM}km search circles...`
  );
  const t0 = Date.now();

  // Dedupe stations by id (overlapping circles will return the same station)
  const uniqueStations = new Map<string, TKStation>();
  let failedCells = 0;
  let consecutiveFailures = 0;

  for (let i = 0; i < centres.length; i++) {
    const { lat, lng } = centres[i];
    try {
      const r = await fetchCircle(lat, lng, apiKey);
      if (r.ok && Array.isArray(r.stations)) {
        for (const s of r.stations) {
          if (!s.id) continue;
          // First-seen wins; later overlapping calls would just return the
          // same station data with a different `dist` field.
          if (!uniqueStations.has(s.id)) {
            uniqueStations.set(s.id, s);
          }
        }
        consecutiveFailures = 0;
      } else if (!r.ok && r.message) {
        // Hard fail on the first error — usually means the key is wrong or
        // rate-limited. Don't burn 600 more calls.
        console.error(`[germany] API error: ${r.message}`);
        process.exit(1);
      }
    } catch (err) {
      failedCells++;
      consecutiveFailures++;
      if (failedCells <= 3) {
        console.warn(`[germany] cell ${i}/${centres.length} (${lat},${lng}) failed:`, err);
      }
      // Circuit breaker: a run of back-to-back failures (after per-cell retries
      // already exhausted) means the API has blocked us. Abort cleanly instead
      // of hammering all remaining cells and deepening the ban.
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error(
          `[germany] ABORTING: ${consecutiveFailures} consecutive cell failures — ` +
            `tankerkoenig is rate-limiting or blocking us. Backing off so we don't ` +
            `escalate to a hard IP ban. No files written; existing data left intact.`
        );
        process.exit(1);
      }
    }
    // Progress log every 50 cells
    if ((i + 1) % 50 === 0) {
      console.log(
        `[germany] swept ${i + 1}/${centres.length} cells, ${uniqueStations.size} unique stations so far`
      );
    }
    if (REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS);
  }

  console.log(
    `[germany] grid sweep done: ${uniqueStations.size} unique stations from ${centres.length} cells ` +
      `(${failedCells} failed) in ${((Date.now() - t0) / 1000).toFixed(1)}s`
  );

  // Aggregate
  type Bucket = Record<FuelKey, number[]>;
  const empty = (): Bucket => ({ gazole: [], sp95: [], sp98: [], e10: [], e85: [], gplc: [] });
  const national: Bucket = empty();
  const lands: Record<string, Bucket> = {};
  const landStationCount: Record<string, number> = {};
  const landStations: Record<string, StationOut[]> = {};
  let pricedStationCount = 0;
  let mappedStationCount = 0;

  for (const meta of uniqueStations.values()) {
    const plz = String(meta.postCode ?? '').padStart(5, '0');
    const landCode = bundeslandFromPlz(plz);
    if (!landCode || !BUNDESLAENDER[landCode]) continue;
    mappedStationCount++;

    const fuels: Partial<Record<FuelKey, number>> = {};
    if (typeof meta.diesel === 'number' && meta.diesel > 0 && meta.diesel < 5) fuels.gazole = meta.diesel;
    if (typeof meta.e5 === 'number' && meta.e5 > 0 && meta.e5 < 5) fuels.sp95 = meta.e5;
    if (typeof meta.e10 === 'number' && meta.e10 > 0 && meta.e10 < 5) fuels.e10 = meta.e10;

    const hasAny = Object.keys(fuels).length > 0;
    if (hasAny) pricedStationCount++;

    for (const f of FUEL_KEYS) {
      const v = fuels[f];
      if (v === undefined) continue;
      national[f].push(v);
      if (!lands[landCode]) lands[landCode] = empty();
      lands[landCode][f].push(v);
    }

    // Always record the station (even without prices) so per-Land files and
    // city index populate. Demo-mode runs go this path; real runs add prices.
    landStationCount[landCode] = (landStationCount[landCode] || 0) + 1;
    const ville = titleCase(meta.place ?? '');
    const adresse = titleCase(
      `${meta.street ?? ''}${meta.houseNumber ? ' ' + meta.houseNumber : ''}`.trim()
    );
    const brand = titleCase(meta.brand ?? '');
    if (!landStations[landCode]) landStations[landCode] = [];
    landStations[landCode].push({
      id: meta.id,
      cp: plz,
      ville,
      adresse,
      brand,
      lat: typeof meta.lat === 'number' ? meta.lat : null,
      lng: typeof meta.lng === 'number' ? meta.lng : null,
      fuels,
    });
  }

  const computeFuels = (bucket: Bucket): Partial<Record<FuelKey, FuelStats>> => {
    const out: Partial<Record<FuelKey, FuelStats>> = {};
    for (const f of FUEL_KEYS) {
      const s = stats(bucket[f]);
      if (s) out[f] = s;
    }
    return out;
  };

  // Build region map (each Bundesland is its own region — Germany is flat)
  const regions: Record<string, AreaStats> = {};
  for (const code of Object.keys(BUNDESLAENDER)) {
    regions[code] = {
      name: BUNDESLAENDER[code].name,
      stationCount: landStationCount[code] || 0,
      fuels: computeFuels(lands[code] || empty()),
    };
  }

  const out = {
    asOf: new Date().toISOString(),
    source: 'https://creativecommons.tankerkoenig.de/',
    licence: 'CC BY 4.0 — Bundeskartellamt MTS-K via tankerkoenig.de',
    mode: isDemo ? 'demo' : 'live',
    totalStations: uniqueStations.size,
    mappedStations: mappedStationCount,
    pricedStations: pricedStationCount,
    freshStations: pricedStationCount, // alias used by the route page
    national: { stationCount: pricedStationCount, fuels: computeFuels(national) },
    // GermanyRegionalView (cloned from Italy/Spain) reads `regions` + `provinces`.
    // Germany has only one level (Bundesländer), so we emit it under both shapes:
    // - `regions` so the component renders without further changes
    // - `provinces: {}` so the dropdown is empty / hidden
    // - `bundeslaender` retained for any future consumer that wants the canonical
    //   field name
    regions,
    provinces: {} as Record<string, AreaStats>,
    bundeslaender: regions,
  };

  // In demo mode, just print verification stats and exit without writing.
  // Writing demo data to disk would (a) leak misleading €1.009 prices into
  // the live site if the files got committed, and (b) need to be cleaned
  // up later anyway. The architecture is verified by the grid sweep itself.
  if (isDemo) {
    const uniqueCities = new Set<string>();
    for (const stationsList of Object.values(landStations)) {
      for (const s of stationsList) {
        const v = s.ville.trim();
        if (v) uniqueCities.add(v.toLowerCase());
      }
    }
    console.log(
      `[germany] DEMO verification COMPLETE: ${out.totalStations} unique stations, ` +
        `${Object.values(out.regions).filter((r) => r.stationCount > 0).length}/16 Bundesländer mapped, ` +
        `${uniqueCities.size} unique cities. No files written. ` +
        `Swap in the real key (env TANKERKOENIG_API_KEY) to run for real.`
    );
    process.exit(0);
  }

  // Sanity guard: refuse to write an implausibly small result over good data.
  // A healthy sweep maps most of Germany's ~14k stations; a few hundred means
  // the sweep was throttled/blocked partway and the output is garbage.
  if (out.mappedStations < MIN_PLAUSIBLE_STATIONS) {
    console.error(
      `[germany] ABORTING: only ${out.mappedStations} stations mapped ` +
        `(< ${MIN_PLAUSIBLE_STATIONS} expected) — the sweep was almost certainly ` +
        `throttled or blocked. NOT writing; existing data left intact.`
    );
    process.exit(1);
  }

  const outPath = path.join(process.cwd(), 'data', 'germany-fuel-prices.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  // City index
  const cityAgg = new Map<string, { ville: string; land: string; n: number }>();
  for (const [landCode, stationsList] of Object.entries(landStations)) {
    for (const s of stationsList) {
      const ville = s.ville.trim();
      if (!ville) continue;
      const key = `${landCode}|${ville.toLowerCase()}`;
      const ex = cityAgg.get(key);
      if (ex) ex.n++;
      else cityAgg.set(key, { ville, land: landCode, n: 1 });
    }
  }
  const cityIndex = Array.from(cityAgg.values())
    .sort((a, b) => b.n - a.n || a.ville.localeCompare(b.ville))
    .map((c) => [c.ville, c.land, c.n] as [string, string, number]);
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'germany-city-index.json'),
    JSON.stringify({ asOf: out.asOf, source: out.source, count: cityIndex.length, cities: cityIndex })
  );

  // Per-Bundesland files
  const landDir = path.join(process.cwd(), 'data', 'germany-land');
  fs.mkdirSync(landDir, { recursive: true });
  const written = new Set<string>();
  for (const [code, stationsList] of Object.entries(landStations)) {
    const land = BUNDESLAENDER[code];
    if (!land) continue;
    stationsList.sort((a, b) => a.ville.localeCompare(b.ville) || a.adresse.localeCompare(b.adresse));
    const landOut = {
      code,
      name: land.name,
      fullName: land.fullName,
      asOf: out.asOf,
      source: out.source,
      licence: out.licence,
      mode: out.mode,
      stationCount: stationsList.length,
      fuels: out.bundeslaender[code]?.fuels ?? {},
      stations: stationsList,
    };
    fs.writeFileSync(path.join(landDir, `${code}.json`), JSON.stringify(landOut, null, 2));
    written.add(`${code}.json`);
  }
  for (const f of fs.readdirSync(landDir)) {
    if (f.endsWith('.json') && !written.has(f)) fs.unlinkSync(path.join(landDir, f));
  }

  console.log(
    `[germany] wrote ${outPath} + ${written.size} per-Land files + ${cityIndex.length} cities  ` +
      `(${out.pricedStations} priced / ${out.mappedStations} mapped / ${out.totalStations} total unique stations)`
  );
  if (isDemo) {
    console.log(
      '[germany] DEMO mode complete — architecture verified end-to-end. ' +
        'Swap the real key in and run again for live prices.'
    );
  }
}

main().catch((err) => {
  console.error('[germany] FATAL:', err);
  process.exit(1);
});
