/**
 * Fetch Italian fuel-station data from MIMIT (Ministero delle Imprese e del
 * Made in Italy), aggregate to provincia + regione + national level, and
 * write the aggregate file + 107 per-provincia files + city index.
 *
 * Source consists of two CSVs joined by idImpianto:
 *   - anagrafica_impianti_attivi.csv: station registry (location, brand)
 *   - prezzo_alle_8.csv: prices, multiple rows per station (one per
 *     fuel × self-service combination)
 *
 * Italian CSV format: ';' separator, ',' decimal. Files start with one
 * banner line ("Estrazione del DD/MM/YYYY alle ore HH:MM:SS") which we skip.
 *
 * Cadence: daily via update-data.yml GitHub Action.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { PROVINCES, REGIONS } from '../lib/italy-geo';

const ANAGRAFICA_URL =
  'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv';
const PRICES_URL =
  'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv';

const FUEL_KEYS = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'] as const;
type FuelKey = (typeof FUEL_KEYS)[number];

// Italian fuel descriptions → standardised keys.
// MIMIT uses a few synonyms; lowercased substring match is the most resilient.
const FUEL_MATCHERS: { key: FuelKey; tests: (s: string) => boolean }[] = [
  // Diesel — "Gasolio" (sometimes "Gasolio energy", "Gasolio premium" etc.)
  // We accept any "gasolio" variant as the standard diesel.
  { key: 'gazole', tests: (s) => s.includes('gasolio') && !s.includes('gpl') },
  // Premium 98 — "Benzina Plus" / "Super Plus" / contains "98"
  { key: 'sp98', tests: (s) => /(super.?plus|benzina.?plus|98)/.test(s) },
  // E10 — "Benzina E10" (uncommon in Italy but present in some stations)
  { key: 'e10', tests: (s) => s.includes('e10') },
  // GPL / LPG — "GPL" or "gas di petrolio liquefatto"
  { key: 'gplc', tests: (s) => s.includes('gpl') },
  // Bioetanolo / E85 — "biodiesel" appears but isn't E85; we treat "ethanolo" / "biocarburante" only
  { key: 'e85', tests: (s) => s.includes('etano') && !s.includes('gasolio') },
  // Fallback regular Benzina = SP95 (Italian "Benzina" is 95 RON by default)
  { key: 'sp95', tests: (s) => s.includes('benzina') },
];

function classifyFuel(desc: string): FuelKey | null {
  const s = desc.toLowerCase().trim();
  for (const { key, tests } of FUEL_MATCHERS) {
    if (tests(s)) return key;
  }
  return null;
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

function toPrice(v: string | undefined): number | null {
  if (!v) return null;
  // Italian data uses '.' as decimal (not ',' like Spain). Just normalise ',' → '.'
  // so the function works for either style; do NOT strip dots.
  const norm = v.trim().replace(',', '.');
  if (!norm) return null;
  const n = parseFloat(norm);
  if (!Number.isFinite(n)) return null;
  if (n <= 0 || n > 5) return null;
  return n;
}

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

function titleCase(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .split(/(\s|-|\/|')/)
    .map((p) => (/^[a-zà-ÿ]+$/i.test(p) ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join('');
}

/** Skip the first banner line, then parse remaining CSV body. */
function parseMimitCsv<T = Record<string, string>>(text: string): T[] {
  const lines = text.split(/\r?\n/);
  // First line is the extraction banner; second line is the header
  const body = lines.slice(1).join('\n');
  return parse(body, {
    delimiter: '|',
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  }) as T[];
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'EuroOilWatch fetch-italy-stations.ts (https://eurooilwatch.com)' },
  });
  if (!res.ok) throw new Error(`[italy] HTTP ${res.status} from ${url}`);
  return await res.text();
}

interface AnagraficaRow {
  idImpianto: string;
  Gestore?: string;
  Bandiera?: string;
  'Tipo Impianto'?: string;
  'Nome Impianto'?: string;
  Indirizzo?: string;
  Comune?: string;
  Provincia?: string;
  Latitudine?: string;
  Longitudine?: string;
  [k: string]: string | undefined;
}

interface PriceRow {
  idImpianto: string;
  descCarburante?: string;
  prezzo?: string;
  isSelf?: string;
  dtComu?: string;
  [k: string]: string | undefined;
}

async function main() {
  console.log('[italy] fetching MIMIT anagrafica + prices...');
  const t0 = Date.now();

  const [anagraficaText, pricesText] = await Promise.all([
    fetchText(ANAGRAFICA_URL),
    fetchText(PRICES_URL),
  ]);

  const stationsRaw = parseMimitCsv<AnagraficaRow>(anagraficaText);
  const pricesRaw = parseMimitCsv<PriceRow>(pricesText);
  console.log(`[italy] received ${stationsRaw.length} stations + ${pricesRaw.length} price rows in ${(Date.now() - t0) / 1000}s`);

  // Index station meta by idImpianto
  const stationMeta = new Map<string, AnagraficaRow>();
  for (const s of stationsRaw) {
    if (s.idImpianto) stationMeta.set(s.idImpianto.trim(), s);
  }

  // Index best (cheapest) self-service price per fuel per station
  // (Italian stations list both self and servito; the self price is the headline)
  const stationFuels = new Map<string, Partial<Record<FuelKey, number>>>();
  for (const p of pricesRaw) {
    const id = (p.idImpianto || '').trim();
    if (!id) continue;
    const desc = p.descCarburante || '';
    const fuel = classifyFuel(desc);
    if (!fuel) continue;
    const price = toPrice(p.prezzo);
    if (price === null) continue;
    // isSelf: "1" = self, "0" = servito. Prefer self; fall back to servito if no self yet.
    const isSelf = (p.isSelf || '').trim() === '1';

    const existing = stationFuels.get(id) || {};
    if (existing[fuel] === undefined) {
      existing[fuel] = price;
    } else if (isSelf) {
      // Self price always wins if we have it
      existing[fuel] = Math.min(existing[fuel] as number, price);
    }
    stationFuels.set(id, existing);
  }

  // Aggregate
  type Bucket = Record<FuelKey, number[]>;
  const empty = (): Bucket => ({ gazole: [], sp95: [], sp98: [], e10: [], e85: [], gplc: [] });
  const national: Bucket = empty();
  const regions: Record<string, Bucket> = {};
  const provinces: Record<string, Bucket> = {};
  const provStationCount: Record<string, number> = {};
  const regionStationCount: Record<string, number> = {};
  const provStations: Record<string, StationOut[]> = {};
  let freshStationCount = 0;

  for (const [id, fuels] of stationFuels) {
    const meta = stationMeta.get(id);
    if (!meta) continue;
    const provCode = (meta.Provincia || '').trim().toUpperCase();
    if (!provCode || !PROVINCES[provCode]) continue;
    const regionCode = PROVINCES[provCode].regionCode;

    let hasAny = false;
    for (const f of FUEL_KEYS) {
      const v = fuels[f];
      if (v === undefined) continue;
      national[f].push(v);
      if (!regions[regionCode]) regions[regionCode] = empty();
      regions[regionCode][f].push(v);
      if (!provinces[provCode]) provinces[provCode] = empty();
      provinces[provCode][f].push(v);
      hasAny = true;
    }
    if (!hasAny) continue;

    freshStationCount++;
    provStationCount[provCode] = (provStationCount[provCode] || 0) + 1;
    regionStationCount[regionCode] = (regionStationCount[regionCode] || 0) + 1;

    const ville = titleCase((meta.Comune || '').trim());
    const adresse = titleCase((meta.Indirizzo || '').trim());
    const brand = titleCase((meta.Bandiera || '').trim());
    const lat = toCoord(meta.Latitudine);
    const lng = toCoord(meta.Longitudine);
    if (!provStations[provCode]) provStations[provCode] = [];
    provStations[provCode].push({
      id,
      cp: '', // MIMIT anagrafica doesn't reliably include CAP
      ville,
      adresse,
      brand,
      lat,
      lng,
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
    source: 'https://www.mimit.gov.it/it/open-data/elenco-dataset/2032336-dataset-prezzi-carburanti',
    totalStations: stationsRaw.length,
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

  // Main aggregate
  const outPath = path.join(process.cwd(), 'data', 'italy-fuel-prices.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  // City index for homepage typeahead
  const cityAgg = new Map<string, { ville: string; prov: string; n: number }>();
  for (const [provCode, stations] of Object.entries(provStations)) {
    for (const s of stations) {
      const ville = s.ville.trim();
      if (!ville) continue;
      const key = `${provCode}|${ville.toLowerCase()}`;
      const ex = cityAgg.get(key);
      if (ex) ex.n++;
      else cityAgg.set(key, { ville, prov: provCode, n: 1 });
    }
  }
  const cityIndex = Array.from(cityAgg.values())
    .sort((a, b) => b.n - a.n || a.ville.localeCompare(b.ville))
    .map((c) => [c.ville, c.prov, c.n] as [string, string, number]);
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'italy-city-index.json'),
    JSON.stringify({ asOf: out.asOf, source: out.source, count: cityIndex.length, cities: cityIndex })
  );

  // Per-provincia files
  const provDir = path.join(process.cwd(), 'data', 'italy-prov');
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
    `[italy] wrote ${outPath} + ${written.size} per-prov files + ${cityIndex.length} cities  ` +
      `(${out.freshStations} priced / ${out.totalStations} total stations, ` +
      `${Object.keys(out.regions).length} regions, ${Object.keys(out.provinces).length} provinces, ${dt}s)`
  );
}

main().catch((err) => {
  console.error('[italy] FATAL:', err);
  process.exit(1);
});
