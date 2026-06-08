/**
 * Fetch Portuguese fuel-station data from DGEG (Direção-Geral de Energia e
 * Geologia) "Preços dos Combustíveis Online", aggregate to distrito + region +
 * national level, and write the aggregate file + per-distrito files + city index.
 *
 * Source: the PesquisarPostos endpoint returns, in a single bulk call per fuel,
 * every station with price + brand + district + municipality + coordinates:
 *   GET /api/PrecoComb/PesquisarPostos?idsTiposComb=<fuelId>&qtdPorPagina=20000&pagina=1
 * Fuel ids: 2101 = Gasóleo simples (diesel), 3201 = Gasolina simples 95.
 *
 * Licence: DGEG data is free to use but NON-COMMERCIAL. It is shown on the
 * consumer /country/pt pages only and is deliberately NOT exposed via /api/v1.
 *
 * Cadence: daily via update-data.yml GitHub Action.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PROVINCES, REGIONS, districtCode } from '../lib/portugal-geo';

const BASE = 'https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PesquisarPostos';
const FUELS = [
  { id: 2101, key: 'gazole' as const },
  { id: 3201, key: 'sp95' as const },
];
const FUEL_KEYS = ['gazole', 'sp95'] as const;
type FuelKey = (typeof FUEL_KEYS)[number];

const SOURCE = 'https://precoscombustiveis.dgeg.gov.pt/';

interface DgegRecord {
  Id: number;
  Nome?: string;
  Marca?: string;
  Municipio?: string;
  Distrito?: string;
  Morada?: string;
  Localidade?: string;
  CodPostal?: string;
  Preco?: string;
  Combustivel?: string;
  Latitude?: number;
  Longitude?: number;
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
interface FuelStats { count: number; mean: number; median: number; min: number; max: number; }

function toPrice(v: string | undefined): number | null {
  if (!v) return null;
  const norm = v.replace(/[^0-9,.]/g, '').replace(',', '.');
  const n = parseFloat(norm);
  if (!Number.isFinite(n) || n <= 0 || n > 5) return null;
  return +n.toFixed(4);
}
function toCoord(v: number | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v !== 0 ? v : null;
}
function median(values: number[]): number {
  if (!values.length) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function stats(values: number[]): FuelStats | null {
  if (!values.length) return null;
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
  return s.toLowerCase().split(/(\s|-|\/|')/).map((p) => (/^[a-zà-ÿ]+$/i.test(p) ? p.charAt(0).toUpperCase() + p.slice(1) : p)).join('');
}

async function fetchFuel(fuelId: number): Promise<DgegRecord[]> {
  const url = `${BASE}?idsTiposComb=${fuelId}&qtdPorPagina=20000&pagina=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'EuroOilWatch fetch-portugal-stations.ts (https://eurooilwatch.com)' } });
  if (!res.ok) throw new Error(`[portugal] HTTP ${res.status} for fuel ${fuelId}`);
  const json = (await res.json()) as { status: boolean; resultado?: DgegRecord[] };
  if (!json.status || !Array.isArray(json.resultado)) throw new Error(`[portugal] bad payload for fuel ${fuelId}`);
  return json.resultado;
}

async function main() {
  console.log('[portugal] fetching DGEG PesquisarPostos (diesel + gasoline 95)...');
  const t0 = Date.now();

  const stations = new Map<string, StationOut & { dist: string | null }>();
  let totalRows = 0;
  for (const { id, key } of FUELS) {
    const rows = await fetchFuel(id);
    totalRows += rows.length;
    for (const r of rows) {
      const price = toPrice(r.Preco);
      if (price === null) continue;
      const sid = String(r.Id);
      let st = stations.get(sid);
      if (!st) {
        st = {
          id: sid,
          cp: (r.CodPostal || '').trim(),
          ville: titleCase((r.Municipio || '').trim()),
          adresse: titleCase((r.Morada || '').trim()),
          brand: titleCase((r.Marca || '').trim()),
          lat: toCoord(r.Latitude),
          lng: toCoord(r.Longitude),
          dist: districtCode(r.Distrito),
          fuels: {},
        };
        stations.set(sid, st);
      }
      st.fuels[key] = price;
    }
    console.log(`[portugal]  fuel ${id} (${key}): ${rows.length} rows`);
  }

  // Aggregate
  type Bucket = Record<FuelKey, number[]>;
  const empty = (): Bucket => ({ gazole: [], sp95: [] });
  const national = empty();
  const regions: Record<string, Bucket> = {};
  const provinces: Record<string, Bucket> = {};
  const provCount: Record<string, number> = {};
  const regionCount: Record<string, number> = {};
  const provStations: Record<string, StationOut[]> = {};
  let fresh = 0;

  for (const st of stations.values()) {
    const code = st.dist;
    if (!code || !PROVINCES[code]) continue;
    const regionCode = PROVINCES[code].regionCode;
    let hasAny = false;
    for (const f of FUEL_KEYS) {
      const v = st.fuels[f];
      if (v === undefined) continue;
      national[f].push(v);
      (regions[regionCode] ||= empty())[f].push(v);
      (provinces[code] ||= empty())[f].push(v);
      hasAny = true;
    }
    if (!hasAny) continue;
    fresh++;
    provCount[code] = (provCount[code] || 0) + 1;
    regionCount[regionCode] = (regionCount[regionCode] || 0) + 1;
    (provStations[code] ||= []).push({ id: st.id, cp: st.cp, ville: st.ville, adresse: st.adresse, brand: st.brand, lat: st.lat, lng: st.lng, fuels: st.fuels });
  }

  const computeFuels = (b: Bucket): Partial<Record<FuelKey, FuelStats>> => {
    const out: Partial<Record<FuelKey, FuelStats>> = {};
    for (const f of FUEL_KEYS) { const s = stats(b[f]); if (s) out[f] = s; }
    return out;
  };

  const out = {
    asOf: new Date().toISOString(),
    source: SOURCE,
    licence: 'DGEG — free, non-commercial use',
    totalStations: stations.size,
    freshStations: fresh,
    national: { stationCount: fresh, fuels: computeFuels(national) },
    regions: Object.fromEntries(Object.entries(regions).map(([code, b]) => {
      const provCnt = Object.values(PROVINCES).filter((p) => p.regionCode === code).length;
      return [code, { name: REGIONS[code]?.name || code, provinceCount: provCnt, stationCount: regionCount[code] || 0, fuels: computeFuels(b) }];
    })),
    provinces: Object.fromEntries(Object.entries(provinces).map(([code, b]) => {
      const p = PROVINCES[code];
      return [code, { name: p?.name || code, regionCode: p?.regionCode, stationCount: provCount[code] || 0, fuels: computeFuels(b) }];
    })),
  };

  const dataDir = path.join(process.cwd(), 'data');
  fs.writeFileSync(path.join(dataDir, 'portugal-fuel-prices.json'), JSON.stringify(out, null, 2));

  // City index
  const cityAgg = new Map<string, { ville: string; prov: string; n: number }>();
  for (const [code, sts] of Object.entries(provStations)) {
    for (const s of sts) {
      const ville = s.ville.trim();
      if (!ville) continue;
      const key = `${code}|${ville.toLowerCase()}`;
      const ex = cityAgg.get(key);
      if (ex) ex.n++; else cityAgg.set(key, { ville, prov: code, n: 1 });
    }
  }
  const cities = Array.from(cityAgg.values()).sort((a, b) => b.n - a.n || a.ville.localeCompare(b.ville)).map((c) => [c.ville, c.prov, c.n]);
  fs.writeFileSync(path.join(dataDir, 'portugal-city-index.json'), JSON.stringify({ asOf: out.asOf, source: SOURCE, count: cities.length, cities }));

  // Per-distrito files
  const provDir = path.join(dataDir, 'pt-distrito');
  fs.mkdirSync(provDir, { recursive: true });
  const written = new Set<string>();
  for (const [code, sts] of Object.entries(provStations)) {
    const p = PROVINCES[code];
    if (!p) continue;
    sts.sort((a, b) => a.ville.localeCompare(b.ville) || a.adresse.localeCompare(b.adresse));
    fs.writeFileSync(path.join(provDir, `${code}.json`), JSON.stringify({
      code, name: p.name, regionCode: p.regionCode, regionName: REGIONS[p.regionCode]?.name ?? p.regionCode,
      asOf: out.asOf, source: SOURCE, stationCount: sts.length, fuels: out.provinces[code]?.fuels ?? {}, stations: sts,
    }, null, 2));
    written.add(`${code}.json`);
  }
  if (fs.existsSync(provDir)) for (const f of fs.readdirSync(provDir)) if (f.endsWith('.json') && !written.has(f)) fs.unlinkSync(path.join(provDir, f));

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[portugal] wrote portugal-fuel-prices.json + ${written.size} distrito files + ${cities.length} cities (${fresh} priced / ${stations.size} stations, ${totalRows} rows, ${dt}s)`);
}

main().catch((e) => { console.error('[portugal] FATAL:', e); process.exit(1); });
