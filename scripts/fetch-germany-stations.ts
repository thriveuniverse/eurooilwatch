/**
 * Fetch German fuel-station data via tankerkoenig.de (which wraps the
 * Bundeskartellamt's MTS-K data with appropriate consumer-data licensing).
 *
 * REQUIRES: TANKERKOENIG_API_KEY environment variable.
 *   Apply for a free non-commercial key at
 *   https://creativecommons.tankerkoenig.de/api.html
 *   Approval typically takes 24–48 hours.
 *
 * Output: data/germany-fuel-prices.json
 *         data/germany-land/{code}.json (16 files — one per Bundesland)
 *         data/germany-city-index.json
 *
 * Strategy:
 *   1. Fetch the bulk station list (tankerkoenig publishes this as a JSON
 *      dump at /json/stationen.json — free for keyholders).
 *   2. Fetch latest prices for each station via the /json/prices.php?ids=…
 *      endpoint, chunked to ≤10 stations per call per their rate limit.
 *   3. Map each station to a Bundesland via PLZ-prefix lookup.
 *   4. Aggregate to national + Bundesland level, write JSON files.
 *
 * Cadence: daily via update-data.yml. The script exits 0 (no-op) when the
 * key is missing, so the rest of the pipeline isn't blocked.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BUNDESLAENDER, bundeslandFromPlz } from '../lib/germany-geo';

const TK_BASE = 'https://creativecommons.tankerkoenig.de';
// Bulk station list. Free for keyholders, ~16k stations.
const STATIONS_ENDPOINT = `${TK_BASE}/json/stationen.json`;
// Price lookup. Up to 10 station IDs per call.
const PRICES_ENDPOINT = `${TK_BASE}/json/prices.php`;
const PRICE_BATCH_SIZE = 10;
// Soft inter-call delay to stay polite to the public endpoint.
const REQUEST_DELAY_MS = 100;

const FUEL_KEYS = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'] as const;
type FuelKey = (typeof FUEL_KEYS)[number];

// tankerkoenig fuel codes → standardised keys
//   diesel  → gazole  (B7 diesel)
//   e5      → sp95    (E5 95 RON, Germany's "Super")
//   e10     → e10     (E10 95 RON, Germany's "Super E10")
//   (no separate sp98 — Germany's "Super Plus" isn't in the standard
//    tankerkoenig fuel mix; some stations include it as "super plus" but
//    it's optional. We'll map it if present.)

interface TKStation {
  id: string;
  name?: string;
  brand?: string;
  street?: string;
  houseNumber?: string;
  postCode?: string | number;
  place?: string;
  lat?: number;
  lng?: number;
}

interface TKPriceResponse {
  ok: boolean;
  message?: string;
  prices: Record<
    string,
    {
      status?: string;
      e5?: number | false;
      e10?: number | false;
      diesel?: number | false;
    }
  >;
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
    .split(/(\s|-|\/)/)
    .map((p) => (/^[a-zà-ÿäöüß']+$/i.test(p) ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join('');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'EuroOilWatch fetch-germany-stations.ts (https://eurooilwatch.com)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} from ${url}`);
  return (await res.json()) as T;
}

async function main() {
  const apiKey = process.env.TANKERKOENIG_API_KEY;
  if (!apiKey) {
    console.log(
      '[germany] TANKERKOENIG_API_KEY not set — skipping fetch.\n' +
        '         Apply for a free key at https://creativecommons.tankerkoenig.de/api.html\n' +
        '         Then add TANKERKOENIG_API_KEY to .env.local + Netlify env vars.\n' +
        '         This script will populate Germany pages on the next cron tick once the key is in place.'
    );
    process.exit(0);
  }

  console.log('[germany] fetching tankerkoenig bulk station list...');
  const t0 = Date.now();

  const stations = await fetchJson<TKStation[]>(STATIONS_ENDPOINT);
  console.log(`[germany] received ${stations.length} stations in ${(Date.now() - t0) / 1000}s`);

  // Query prices in batches of 10
  const allFuels = new Map<string, Partial<Record<FuelKey, number>>>();
  console.log(`[germany] fetching prices in batches of ${PRICE_BATCH_SIZE}...`);
  for (let i = 0; i < stations.length; i += PRICE_BATCH_SIZE) {
    const batch = stations.slice(i, i + PRICE_BATCH_SIZE);
    const ids = batch.map((s) => s.id).join(',');
    const url = `${PRICES_ENDPOINT}?ids=${encodeURIComponent(ids)}&apikey=${apiKey}`;
    try {
      const r = await fetchJson<TKPriceResponse>(url);
      if (r.ok && r.prices) {
        for (const [id, p] of Object.entries(r.prices)) {
          if (p.status !== 'open') continue;
          const fuels: Partial<Record<FuelKey, number>> = {};
          if (typeof p.diesel === 'number' && p.diesel > 0 && p.diesel < 5) fuels.gazole = p.diesel;
          if (typeof p.e5 === 'number' && p.e5 > 0 && p.e5 < 5) fuels.sp95 = p.e5;
          if (typeof p.e10 === 'number' && p.e10 > 0 && p.e10 < 5) fuels.e10 = p.e10;
          if (Object.keys(fuels).length > 0) allFuels.set(id, fuels);
        }
      }
    } catch (err) {
      console.warn(`[germany] batch ${i / PRICE_BATCH_SIZE} failed:`, err);
    }
    if (REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS);
  }

  console.log(`[germany] resolved ${allFuels.size} stations with prices`);

  // Aggregate
  type Bucket = Record<FuelKey, number[]>;
  const empty = (): Bucket => ({ gazole: [], sp95: [], sp98: [], e10: [], e85: [], gplc: [] });
  const national: Bucket = empty();
  const lands: Record<string, Bucket> = {};
  const landStationCount: Record<string, number> = {};
  const landStations: Record<string, StationOut[]> = {};
  let freshStationCount = 0;

  for (const meta of stations) {
    const fuels = allFuels.get(meta.id);
    if (!fuels) continue;
    const plz = String(meta.postCode ?? '').trim();
    const landCode = bundeslandFromPlz(plz);
    if (!landCode || !BUNDESLAENDER[landCode]) continue;

    for (const f of FUEL_KEYS) {
      const v = fuels[f];
      if (v === undefined) continue;
      national[f].push(v);
      if (!lands[landCode]) lands[landCode] = empty();
      lands[landCode][f].push(v);
    }

    freshStationCount++;
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

  const out = {
    asOf: new Date().toISOString(),
    source: 'https://creativecommons.tankerkoenig.de/',
    licence: 'CC BY 4.0 — Bundeskartellamt MTS-K via tankerkoenig.de',
    totalStations: stations.length,
    freshStations: freshStationCount,
    national: { stationCount: freshStationCount, fuels: computeFuels(national) },
    bundeslaender: Object.fromEntries(
      Object.entries(lands).map(([code, bucket]) => {
        const land = BUNDESLAENDER[code];
        return [
          code,
          {
            name: land?.name || code,
            stationCount: landStationCount[code] || 0,
            fuels: computeFuels(bucket),
          } as AreaStats,
        ];
      })
    ),
  };

  const outPath = path.join(process.cwd(), 'data', 'germany-fuel-prices.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  // City index for homepage typeahead
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

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[germany] wrote ${outPath} + ${written.size} per-Bundesland files + ${cityIndex.length} cities  ` +
      `(${out.freshStations} priced / ${out.totalStations} total stations, ${dt}s)`
  );
}

main().catch((err) => {
  console.error('[germany] FATAL:', err);
  process.exit(1);
});
