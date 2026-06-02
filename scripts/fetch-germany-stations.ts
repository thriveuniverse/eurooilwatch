/**
 * Build German fuel-station aggregates from tankerkoenig's BULK CSV dataset.
 *
 * WHY NOT THE LIVE API: tankerkoenig's list.php is rate-limited to ~1 request
 * per minute and explicitly "not meant for massive data fetching". Sweeping
 * all of Germany (~570 radius searches) got our IP firewall-blocked. The
 * supported way to get whole-country data is their bulk CSV git repo, which
 * carries the full MTS-K (Bundeskartellamt) dataset with no rate limit.
 *
 * DATA SOURCE: the tankerkoenig-data git repo on Azure DevOps
 *   https://dev.azure.com/tankerkoenig/_git/tankerkoenig-data
 *   - stations/<YYYY>/<MM>/<YYYY-MM-DD>-stations.csv  (one snapshot per day)
 *       cols: uuid,name,brand,street,house_number,post_code,city,
 *             latitude,longitude,first_active,openingtimes_json
 *   - prices/<YYYY>/<MM>/<YYYY-MM-DD>-prices.csv      (price CHANGES per day)
 *       cols: date,station_uuid,diesel,e5,e10,dieselchange,e5change,e10change
 *   Licence: CC BY-NC-SA 4.0 (non-commercial).
 *
 * This script does NOT clone the repo (the full history is ~20 GB). It reads
 * already-checked-out CSVs from TANKERKOENIG_DATA_DIR. Populate that dir with
 * a sparse, shallow, partial clone of just the current + previous month — see
 * the "Fetch German station data" step in .github/workflows/update-data.yml,
 * or scripts/clone-germany-data.sh for the local equivalent.
 *
 * Because the prices files are CHANGE logs (a station only appears on days it
 * changed price), we read the last TK_PRICE_DAYS days and keep the most recent
 * valid price per station per fuel. German stations repriced many times daily,
 * so a few days covers essentially every active station.
 *
 * Output (unchanged shape — consumed by app/country/[code] + de/land/[code]):
 *   data/germany-fuel-prices.json
 *   data/germany-land/{code}.json
 *   data/germany-city-index.json
 *
 * Exits 0 with a clear message when TANKERKOENIG_DATA_DIR is unset/empty, so
 * the rest of the daily pipeline isn't blocked.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { BUNDESLAENDER, bundeslandFromPlz } from '../lib/germany-geo';

// How many recent daily price files to merge (covers stations that didn't
// change price in the last day or two). Override with TK_PRICE_DAYS.
const PRICE_DAYS = Number(process.env.TK_PRICE_DAYS ?? 3);

// Sanity floor. Germany has ~14k–15k stations; a healthy dataset maps most of
// them. Far below this means the CSVs were truncated/partial — don't let a
// degraded result overwrite good data on disk.
const MIN_PLAUSIBLE_STATIONS = 3000;

const FUEL_KEYS = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'] as const;
type FuelKey = (typeof FUEL_KEYS)[number];

interface StationCsvRow {
  uuid: string;
  name?: string;
  brand?: string;
  street?: string;
  house_number?: string;
  post_code?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  [k: string]: string | undefined;
}

interface PriceCsvRow {
  date?: string;
  station_uuid: string;
  diesel?: string;
  e5?: string;
  e10?: string;
  [k: string]: string | undefined;
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

/** A finite price in the plausible €/litre range, else null. */
function toPrice(v: string | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 && n < 5 ? n : null;
}

/** Recursively collect files under `dir` whose name ends with `suffix`. */
function findCsvs(dir: string, suffix: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findCsvs(full, suffix));
    else if (entry.isFile() && entry.name.endsWith(suffix)) out.push(full);
  }
  return out;
}

function parseCsv<T>(file: string): T[] {
  return parse(fs.readFileSync(file, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  }) as T[];
}

function main() {
  const dataDir = process.env.TANKERKOENIG_DATA_DIR;
  if (!dataDir || !fs.existsSync(dataDir)) {
    console.log(
      '[germany] TANKERKOENIG_DATA_DIR unset or missing — skipping.\n' +
        '         Populate it with a sparse clone of the tankerkoenig-data repo\n' +
        '         (see scripts/clone-germany-data.sh), then re-run.'
    );
    process.exit(0);
  }

  // Newest stations snapshot (filenames sort lexically = chronologically).
  const stationFiles = findCsvs(path.join(dataDir, 'stations'), '-stations.csv').sort();
  if (stationFiles.length === 0) {
    console.log('[germany] no *-stations.csv found under TANKERKOENIG_DATA_DIR/stations — skipping.');
    process.exit(0);
  }
  const stationsFile = stationFiles[stationFiles.length - 1];

  // Last PRICE_DAYS price-change files, oldest first so newer rows overwrite.
  const priceFiles = findCsvs(path.join(dataDir, 'prices'), '-prices.csv').sort();
  if (priceFiles.length === 0) {
    console.log('[germany] no *-prices.csv found under TANKERKOENIG_DATA_DIR/prices — skipping.');
    process.exit(0);
  }
  const recentPriceFiles = priceFiles.slice(-PRICE_DAYS);

  const t0 = Date.now();
  console.log(
    `[germany] reading ${path.basename(stationsFile)} + ${recentPriceFiles.length} price file(s): ` +
      recentPriceFiles.map((f) => path.basename(f)).join(', ')
  );

  // Station metadata
  const stationMeta = new Map<string, StationCsvRow>();
  for (const s of parseCsv<StationCsvRow>(stationsFile)) {
    if (s.uuid) stationMeta.set(s.uuid.trim(), s);
  }

  // Latest valid price per station per fuel, merged across recent days
  // (oldest file first, top-to-bottom chronological → last valid value wins).
  const stationFuels = new Map<string, Partial<Record<FuelKey, number>>>();
  let priceRows = 0;
  for (const file of recentPriceFiles) {
    for (const p of parseCsv<PriceCsvRow>(file)) {
      const id = (p.station_uuid || '').trim();
      if (!id) continue;
      priceRows++;
      const cur = stationFuels.get(id) || {};
      const d = toPrice(p.diesel);
      const e5 = toPrice(p.e5);
      const e10 = toPrice(p.e10);
      if (d !== null) cur.gazole = d;
      if (e5 !== null) cur.sp95 = e5;
      if (e10 !== null) cur.e10 = e10;
      stationFuels.set(id, cur);
    }
  }
  console.log(
    `[germany] parsed ${stationMeta.size} stations + ${priceRows} price rows ` +
      `(${stationFuels.size} stations with a recent price) in ${((Date.now() - t0) / 1000).toFixed(1)}s`
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

  for (const [id, meta] of stationMeta) {
    const plz = String(meta.post_code ?? '').padStart(5, '0');
    const landCode = bundeslandFromPlz(plz);
    if (!landCode || !BUNDESLAENDER[landCode]) continue;
    mappedStationCount++;

    const fuels = stationFuels.get(id) ?? {};
    const hasAny = Object.keys(fuels).length > 0;
    if (hasAny) pricedStationCount++;

    for (const f of FUEL_KEYS) {
      const v = fuels[f];
      if (v === undefined) continue;
      national[f].push(v);
      if (!lands[landCode]) lands[landCode] = empty();
      lands[landCode][f].push(v);
    }

    // Always record the station (even without a recent price) so per-Land
    // files and the city index stay complete.
    landStationCount[landCode] = (landStationCount[landCode] || 0) + 1;
    const ville = titleCase(meta.city ?? '');
    const adresse = titleCase(
      `${meta.street ?? ''}${meta.house_number ? ' ' + meta.house_number : ''}`.trim()
    );
    const brand = titleCase(meta.brand ?? '');
    const lat = meta.latitude ? parseFloat(meta.latitude) : NaN;
    const lng = meta.longitude ? parseFloat(meta.longitude) : NaN;
    if (!landStations[landCode]) landStations[landCode] = [];
    landStations[landCode].push({
      id,
      cp: plz,
      ville,
      adresse,
      brand,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
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
    source: 'https://dev.azure.com/tankerkoenig/_git/tankerkoenig-data',
    licence: 'CC BY-NC-SA 4.0 — Bundeskartellamt MTS-K via tankerkoenig.de',
    mode: 'live',
    totalStations: stationMeta.size,
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

  // Sanity guard: refuse to write an implausibly small result over good data.
  if (out.mappedStations < MIN_PLAUSIBLE_STATIONS) {
    console.error(
      `[germany] ABORTING: only ${out.mappedStations} stations mapped ` +
        `(< ${MIN_PLAUSIBLE_STATIONS} expected) — the CSV dataset looks partial/truncated. ` +
        `NOT writing; existing data left intact.`
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
      `(${out.pricedStations} priced / ${out.mappedStations} mapped / ${out.totalStations} total stations)`
  );
}

main();
