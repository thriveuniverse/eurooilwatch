/**
 * Fetch French fuel station data from the official prix-carburants.gouv.fr
 * open data feed (via the data.economie.gouv.fr opendatasoft API), aggregate
 * to département + région + national level, and write a single JSON file.
 *
 * Output: data/france-fuel-prices.json
 *
 * Cadence: daily via update-data.yml GitHub Action.
 * Source:  https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/
 */

import * as fs from 'fs';
import * as path from 'path';
import { DEPARTMENTS, REGIONS, deptFromPostalCode } from '../lib/france-geo';

const ENDPOINT =
  'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/' +
  'prix-des-carburants-en-france-flux-instantane-v2/exports/json';

const FRESHNESS_DAYS = 14;
const FRESHNESS_MS = FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

const FUEL_KEYS = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'] as const;
type FuelKey = (typeof FUEL_KEYS)[number];

interface StationRecord {
  id?: string | number;
  cp?: string;
  ville?: string;
  pop?: string; // A = autoroute, R = route
  adresse?: string;
  latitude?: number | string;
  longitude?: number | string;

  gazole_prix?: number | string | null;
  gazole_maj?: string | null;
  sp95_prix?: number | string | null;
  sp95_maj?: string | null;
  sp98_prix?: number | string | null;
  sp98_maj?: string | null;
  e10_prix?: number | string | null;
  e10_maj?: string | null;
  e85_prix?: number | string | null;
  e85_maj?: string | null;
  gplc_prix?: number | string | null;
  gplc_maj?: string | null;
}

interface StationOut {
  id: string;
  cp: string;
  ville: string;
  adresse: string;
  pop: 'A' | 'R' | null;
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
  regionCode?: string;
  departmentCount?: number;
  stationCount: number;
  fuels: Partial<Record<FuelKey, FuelStats>>;
}

interface Output {
  asOf: string;
  source: string;
  freshnessFilterDays: number;
  totalStations: number;
  freshStations: number;
  national: { stationCount: number; fuels: Partial<Record<FuelKey, FuelStats>> };
  regions: Record<string, AreaStats>;
  departments: Record<string, AreaStats>;
}

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!Number.isFinite(n)) return null;
  if (n <= 0 || n > 5) return null; // sanity-bound: any pump price outside €0–€5/L is bogus
  return n;
}

function isFresh(majIso: string | null | undefined, now: number): boolean {
  if (!majIso) return false;
  const t = Date.parse(majIso);
  if (Number.isNaN(t)) return false;
  return now - t <= FRESHNESS_MS;
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

async function main() {
  console.log('[france] fetching prix-carburants instantane...');
  const t0 = Date.now();

  const res = await fetch(ENDPOINT, {
    headers: { 'User-Agent': 'EuroOilWatch fetch-france-stations.ts (https://eurooilwatch.com)' },
  });
  if (!res.ok) {
    throw new Error(`[france] HTTP ${res.status} ${res.statusText} from ${ENDPOINT}`);
  }

  const records = (await res.json()) as StationRecord[];
  console.log(`[france] received ${records.length} stations in ${(Date.now() - t0) / 1000}s`);

  const now = Date.now();

  // Pre-compute per-fuel arrays at every aggregation level
  type Bucket = Record<FuelKey, number[]>;
  const empty = (): Bucket => ({ gazole: [], sp95: [], sp98: [], e10: [], e85: [], gplc: [] });

  const national: Bucket = empty();
  const regions: Record<string, Bucket> = {};
  const departments: Record<string, Bucket> = {};
  const deptStationCount: Record<string, number> = {};
  const regionStationCount: Record<string, number> = {};
  const deptStations: Record<string, StationOut[]> = {};
  let freshStationCount = 0;

  for (const r of records) {
    const deptCode = deptFromPostalCode(r.cp || '');
    if (!deptCode || !DEPARTMENTS[deptCode]) continue;
    const regionCode = DEPARTMENTS[deptCode].regionCode;

    let stationHasAnyFreshFuel = false;
    const stationFuels: Partial<Record<FuelKey, number>> = {};

    for (const f of FUEL_KEYS) {
      const price = toNum(r[`${f}_prix` as keyof StationRecord] as never);
      const maj = r[`${f}_maj` as keyof StationRecord] as string | null | undefined;
      if (price === null) continue;
      if (!isFresh(maj, now)) continue;

      national[f].push(price);
      if (!regions[regionCode]) regions[regionCode] = empty();
      regions[regionCode][f].push(price);
      if (!departments[deptCode]) departments[deptCode] = empty();
      departments[deptCode][f].push(price);
      stationFuels[f] = price;

      stationHasAnyFreshFuel = true;
    }

    if (stationHasAnyFreshFuel) {
      freshStationCount++;
      deptStationCount[deptCode] = (deptStationCount[deptCode] || 0) + 1;
      regionStationCount[regionCode] = (regionStationCount[regionCode] || 0) + 1;

      // Track full station record for the per-département file
      const lat = typeof r.latitude === 'number' ? r.latitude : parseFloat(String(r.latitude ?? ''));
      const lng = typeof r.longitude === 'number' ? r.longitude : parseFloat(String(r.longitude ?? ''));
      const popValue = r.pop === 'A' || r.pop === 'R' ? r.pop : null;
      if (!deptStations[deptCode]) deptStations[deptCode] = [];
      deptStations[deptCode].push({
        id: String(r.id ?? ''),
        cp: (r.cp ?? '').toString().trim(),
        ville: (r.ville ?? '').toString().trim(),
        adresse: (r.adresse ?? '').toString().trim(),
        pop: popValue,
        lat: Number.isFinite(lat) ? +lat.toFixed(5) : null,
        lng: Number.isFinite(lng) ? +lng.toFixed(5) : null,
        fuels: stationFuels,
      });
    }
  }

  const computeFuels = (bucket: Bucket): Partial<Record<FuelKey, FuelStats>> => {
    const out: Partial<Record<FuelKey, FuelStats>> = {};
    for (const f of FUEL_KEYS) {
      const s = stats(bucket[f]);
      if (s) out[f] = s;
    }
    return out;
  };

  const out: Output = {
    asOf: new Date().toISOString(),
    source:
      'https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/',
    freshnessFilterDays: FRESHNESS_DAYS,
    totalStations: records.length,
    freshStations: freshStationCount,
    national: { stationCount: freshStationCount, fuels: computeFuels(national) },
    regions: Object.fromEntries(
      Object.entries(regions).map(([code, bucket]) => {
        const region = REGIONS[code];
        const deptCount = Object.values(DEPARTMENTS).filter((d) => d.regionCode === code).length;
        return [
          code,
          {
            name: region?.name || code,
            departmentCount: deptCount,
            stationCount: regionStationCount[code] || 0,
            fuels: computeFuels(bucket),
          } as AreaStats,
        ];
      })
    ),
    departments: Object.fromEntries(
      Object.entries(departments).map(([code, bucket]) => {
        const d = DEPARTMENTS[code];
        return [
          code,
          {
            name: d?.name || code,
            regionCode: d?.regionCode,
            stationCount: deptStationCount[code] || 0,
            fuels: computeFuels(bucket),
          } as AreaStats,
        ];
      })
    ),
  };

  const outPath = path.join(process.cwd(), 'data', 'france-fuel-prices.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  // City index for the homepage search autocomplete (ville → dept + station count)
  // We aggregate identical city names within a département (e.g. "Toulouse" might
  // have stations across postal codes 31000–31500 — collapse to one entry).
  type CityKey = string; // `${dept}|${normalisedVille}`
  const cityAgg = new Map<CityKey, { ville: string; dept: string; n: number }>();
  for (const [deptCode, stations] of Object.entries(deptStations)) {
    for (const s of stations) {
      const ville = (s.ville || '').trim();
      if (!ville) continue;
      const key = `${deptCode}|${ville.toLowerCase()}`;
      const existing = cityAgg.get(key);
      if (existing) {
        existing.n++;
      } else {
        cityAgg.set(key, { ville, dept: deptCode, n: 1 });
      }
    }
  }
  // Sort by station count desc, then alphabetical. Emit as array tuples
  // [ville, dept, stationCount] to halve the JSON size vs object form.
  const cityIndex = Array.from(cityAgg.values())
    .sort((a, b) => b.n - a.n || a.ville.localeCompare(b.ville))
    .map((c) => [c.ville, c.dept, c.n] as [string, string, number]);

  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'france-city-index.json'),
    JSON.stringify({
      asOf: out.asOf,
      source: out.source,
      count: cityIndex.length,
      cities: cityIndex,
    })
  );

  // Per-département files for the static /country/fr/dept/[code] route
  const deptDir = path.join(process.cwd(), 'data', 'france-dept');
  fs.mkdirSync(deptDir, { recursive: true });

  // Clean any obsolete files (départements that disappeared from the feed)
  const written = new Set<string>();
  for (const [code, stations] of Object.entries(deptStations)) {
    const d = DEPARTMENTS[code];
    if (!d) continue;
    // Sort stations: ville A→Z, then adresse
    stations.sort((a, b) => a.ville.localeCompare(b.ville) || a.adresse.localeCompare(b.adresse));
    const deptOut = {
      code,
      name: d.name,
      regionCode: d.regionCode,
      regionName: REGIONS[d.regionCode]?.name ?? d.regionCode,
      asOf: out.asOf,
      source: out.source,
      freshnessFilterDays: FRESHNESS_DAYS,
      stationCount: stations.length,
      fuels: out.departments[code]?.fuels ?? {},
      stations,
    };
    fs.writeFileSync(path.join(deptDir, `${code}.json`), JSON.stringify(deptOut, null, 2));
    written.add(`${code}.json`);
  }
  // Sweep stale dept files
  for (const f of fs.readdirSync(deptDir)) {
    if (f.endsWith('.json') && !written.has(f)) {
      fs.unlinkSync(path.join(deptDir, f));
    }
  }

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[france] wrote ${outPath} + ${written.size} per-dept files  ` +
      `(${out.freshStations} fresh / ${out.totalStations} total stations, ` +
      `${Object.keys(out.regions).length} regions, ` +
      `${Object.keys(out.departments).length} départements, ${dt}s total)`
  );
}

main().catch((err) => {
  console.error('[france] FATAL:', err);
  process.exit(1);
});
