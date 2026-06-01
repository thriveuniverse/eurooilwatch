/**
 * Fetch Spanish fuel-station data from the Ministerio para la Transición
 * Ecológica's Geoportal de Hidrocarburos, aggregate to provincia + autonomous
 * community + national level, and write a single JSON file plus per-provincia
 * files for the static /country/es/prov/[code] route.
 *
 * Output: data/spain-fuel-prices.json
 *         data/spain-prov/{code}.json (52 files)
 *         data/spain-city-index.json (for homepage typeahead)
 *
 * Cadence: daily via update-data.yml GitHub Action.
 * Source:  https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/
 *          PreciosCarburantes/help/operations/EstacionesTerrestres
 */

import * as fs from 'fs';
import * as path from 'path';
import { PROVINCES, REGIONS, provFromPostalCode } from '../lib/spain-geo';

const ENDPOINT =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/' +
  'PreciosCarburantes/EstacionesTerrestres/';

const FUEL_KEYS = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'] as const;
type FuelKey = (typeof FUEL_KEYS)[number];

// Spanish fuel field names → standardised keys (shared with France for UI consistency)
const FUEL_MAP: Record<FuelKey, string> = {
  gazole: 'Precio Gasoleo A',
  sp95: 'Precio Gasolina 95 E5',
  sp98: 'Precio Gasolina 98 E5',
  e10: 'Precio Gasolina 95 E10',
  e85: 'Precio Bioetanol',
  gplc: 'Precio Gases licuados del petróleo',
};

interface ApiResponse {
  Fecha?: string;
  ListaEESSPrecio?: Record<string, string>[];
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
  regionCode?: string;
  provinceCount?: number;
  stationCount: number;
  fuels: Partial<Record<FuelKey, FuelStats>>;
}

/** Spanish numbers use ',' as decimal separator. Price-range sanity bound. */
function toPrice(v: string | undefined): number | null {
  if (!v) return null;
  const norm = v.trim().replace(/\./g, '').replace(',', '.');
  if (!norm) return null;
  const n = parseFloat(norm);
  if (!Number.isFinite(n)) return null;
  if (n <= 0 || n > 5) return null;
  return n;
}

/** Coordinate parser — Spanish lat/lng use ',' decimal too, no value bound. */
function toCoord(v: string | undefined): number | null {
  if (!v) return null;
  const norm = v.trim().replace(',', '.');
  const n = parseFloat(norm);
  return Number.isFinite(n) ? n : null;
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

/** Convert Spanish ALL-CAPS names to Title Case for display (PEREZ → Perez, MADRID → Madrid) */
function titleCase(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .split(/(\s|-|\/)/)
    .map((p) => (/^[a-zà-ÿñ']+$/i.test(p) ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join('');
}

async function main() {
  console.log('[spain] fetching geoportal-de-hidrocarburos...');
  const t0 = Date.now();

  const res = await fetch(ENDPOINT, {
    headers: { 'User-Agent': 'EuroOilWatch fetch-spain-stations.ts (https://eurooilwatch.com)' },
  });
  if (!res.ok) {
    throw new Error(`[spain] HTTP ${res.status} ${res.statusText} from ${ENDPOINT}`);
  }
  const body = (await res.json()) as ApiResponse;
  const records = body.ListaEESSPrecio ?? [];
  console.log(`[spain] received ${records.length} stations (Fecha=${body.Fecha ?? 'n/a'}) in ${(Date.now() - t0) / 1000}s`);

  type Bucket = Record<FuelKey, number[]>;
  const empty = (): Bucket => ({ gazole: [], sp95: [], sp98: [], e10: [], e85: [], gplc: [] });

  const national: Bucket = empty();
  const regions: Record<string, Bucket> = {};
  const provinces: Record<string, Bucket> = {};
  const provStationCount: Record<string, number> = {};
  const regionStationCount: Record<string, number> = {};
  const provStations: Record<string, StationOut[]> = {};
  let freshStationCount = 0;

  for (const r of records) {
    const cpRaw = r['C.P.'] || '';
    const provCode = provFromPostalCode(cpRaw);
    if (!provCode || !PROVINCES[provCode]) continue;
    const regionCode = PROVINCES[provCode].regionCode;

    const stationFuels: Partial<Record<FuelKey, number>> = {};
    let hasAny = false;

    for (const f of FUEL_KEYS) {
      const price = toPrice(r[FUEL_MAP[f]]);
      if (price === null) continue;
      national[f].push(price);
      if (!regions[regionCode]) regions[regionCode] = empty();
      regions[regionCode][f].push(price);
      if (!provinces[provCode]) provinces[provCode] = empty();
      provinces[provCode][f].push(price);
      stationFuels[f] = price;
      hasAny = true;
    }

    if (hasAny) {
      freshStationCount++;
      provStationCount[provCode] = (provStationCount[provCode] || 0) + 1;
      regionStationCount[regionCode] = (regionStationCount[regionCode] || 0) + 1;

      const lat = toCoord(r['Latitud']);
      const lng = toCoord(r['Longitud (WGS84)']);
      const ville = titleCase(r['Localidad'] || r['Municipio'] || '');
      const adresse = titleCase(r['Dirección'] || '');
      const brand = titleCase(r['Rótulo'] || '');
      if (!provStations[provCode]) provStations[provCode] = [];
      provStations[provCode].push({
        id: String(r['IDEESS'] ?? ''),
        cp: cpRaw.trim(),
        ville,
        adresse,
        brand,
        lat,
        lng,
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

  const out = {
    asOf: new Date().toISOString(),
    sourceTimestamp: body.Fecha ?? null,
    source: 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/',
    totalStations: records.length,
    freshStations: freshStationCount,
    national: { stationCount: freshStationCount, fuels: computeFuels(national) },
    regions: Object.fromEntries(
      Object.entries(regions).map(([code, bucket]) => {
        const region = REGIONS[code];
        const provCount = Object.values(PROVINCES).filter((p) => p.regionCode === code).length;
        return [
          code,
          {
            name: region?.name || code,
            provinceCount: provCount,
            stationCount: regionStationCount[code] || 0,
            fuels: computeFuels(bucket),
          } as AreaStats,
        ];
      })
    ),
    provinces: Object.fromEntries(
      Object.entries(provinces).map(([code, bucket]) => {
        const p = PROVINCES[code];
        return [
          code,
          {
            name: p?.name || code,
            regionCode: p?.regionCode,
            stationCount: provStationCount[code] || 0,
            fuels: computeFuels(bucket),
          } as AreaStats,
        ];
      })
    ),
  };

  // Main aggregate file
  const outPath = path.join(process.cwd(), 'data', 'spain-fuel-prices.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  // City index for homepage typeahead
  type CityKey = string;
  const cityAgg = new Map<CityKey, { ville: string; prov: string; n: number }>();
  for (const [provCode, stations] of Object.entries(provStations)) {
    for (const s of stations) {
      const ville = s.ville.trim();
      if (!ville) continue;
      const key = `${provCode}|${ville.toLowerCase()}`;
      const existing = cityAgg.get(key);
      if (existing) {
        existing.n++;
      } else {
        cityAgg.set(key, { ville, prov: provCode, n: 1 });
      }
    }
  }
  const cityIndex = Array.from(cityAgg.values())
    .sort((a, b) => b.n - a.n || a.ville.localeCompare(b.ville))
    .map((c) => [c.ville, c.prov, c.n] as [string, string, number]);
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'spain-city-index.json'),
    JSON.stringify({ asOf: out.asOf, source: out.source, count: cityIndex.length, cities: cityIndex })
  );

  // Per-provincia files
  const provDir = path.join(process.cwd(), 'data', 'spain-prov');
  fs.mkdirSync(provDir, { recursive: true });
  const written = new Set<string>();
  for (const [code, stations] of Object.entries(provStations)) {
    const p = PROVINCES[code];
    if (!p) continue;
    stations.sort((a, b) => a.ville.localeCompare(b.ville) || a.adresse.localeCompare(b.adresse));
    const provOut = {
      code,
      name: p.name,
      regionCode: p.regionCode,
      regionName: REGIONS[p.regionCode]?.name ?? p.regionCode,
      asOf: out.asOf,
      source: out.source,
      stationCount: stations.length,
      fuels: out.provinces[code]?.fuels ?? {},
      stations,
    };
    fs.writeFileSync(path.join(provDir, `${code}.json`), JSON.stringify(provOut, null, 2));
    written.add(`${code}.json`);
  }
  for (const f of fs.readdirSync(provDir)) {
    if (f.endsWith('.json') && !written.has(f)) fs.unlinkSync(path.join(provDir, f));
  }

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[spain] wrote ${outPath} + ${written.size} per-prov files + ${cityIndex.length} cities  ` +
      `(${out.freshStations} priced / ${out.totalStations} total stations, ` +
      `${Object.keys(out.regions).length} regions, ${Object.keys(out.provinces).length} provinces, ${dt}s)`
  );
}

main().catch((err) => {
  console.error('[spain] FATAL:', err);
  process.exit(1);
});
