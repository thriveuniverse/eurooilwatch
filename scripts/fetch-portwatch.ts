/**
 * Fetch daily chokepoint transit data from IMF PortWatch (satellite-AIS derived)
 * and write a compact panel feed: current transit level vs a 2023 baseline, by
 * total ships and tankers, plus a 90-day sparkline series.
 *
 * Source: IMF PortWatch — Daily_Chokepoints_Data FeatureServer (open, free; cite
 * "IMF PortWatch, portwatch.imf.org"). Figures are ESTIMATES derived from AIS, not
 * customs truth — attribute as such.
 *
 * Cadence: daily via update-data.yml. Output: data/portwatch-chokepoints.json
 */
import * as fs from 'fs';
import * as path from 'path';

const FS_URL =
  'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query';
const UA = 'EuroOilWatch fetch-portwatch.ts (https://eurooilwatch.com)';
const BASELINE_YEAR = 2023; // clean pre-disruption reference

const CHOKEPOINTS = [
  { id: 'chokepoint6', key: 'hormuz', name: 'Strait of Hormuz' },
  { id: 'chokepoint4', key: 'bab-el-mandeb', name: 'Bab el-Mandeb Strait' },
  { id: 'chokepoint1', key: 'suez', name: 'Suez Canal' },
  { id: 'chokepoint2', key: 'panama', name: 'Panama Canal' },
  { id: 'chokepoint7', key: 'cape', name: 'Cape of Good Hope' },
  { id: 'chokepoint3', key: 'bosporus', name: 'Bosporus Strait' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function aget(params: Record<string, string>): Promise<any> {
  const url = new URL(FS_URL);
  url.searchParams.set('f', 'json');
  url.searchParams.set('returnGeometry', 'false');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  // PortWatch's ArcGIS service has a shared org-wide quota (~6000 units/min) — retry on 429.
  const waits = [15000, 30000, 65000];
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url.toString(), { headers: { 'User-Agent': UA } });
    const j = await res.json().catch(() => ({}));
    if (res.ok && !j.error) return j;
    const is429 = res.status === 429 || j?.error?.code === 429;
    if (is429 && attempt < waits.length) { console.warn(`  …429, waiting ${waits[attempt] / 1000}s`); await sleep(waits[attempt]); continue; }
    throw new Error(`PortWatch ${res.status} ${j?.error ? JSON.stringify(j.error) : ''}`);
  }
}

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const avg = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : null);
const pct = (a: number | null, b: number | null) => (a != null && b && b > 0 ? Math.round((a / b) * 100) : null);

function buildChokepoint(cp: { id: string; key: string; name: string }, rows: any[], base: { total: number | null; tanker: number | null; captanker: number | null }) {
  if (!rows.length) return null;
  rows.sort((a, b) => b.date - a.date); // newest first
  const first = (n: number) => rows.slice(0, n);
  const avg7 = { total: avg(first(7).map((r) => r.total)), tanker: avg(first(7).map((r) => r.tanker)) };
  const tankerTonnage7 = avg(first(7).map((r) => r.captanker)); // DWT-weighted, the truer flow proxy
  const series = rows.slice(0, 90).reverse().map((r) => ({ d: isoDate(r.date), t: r.total, k: r.tanker, c: r.captanker }));
  return {
    key: cp.key, name: cp.name, portid: cp.id,
    latestDate: isoDate(rows[0].date),
    latest: { total: rows[0].total, tanker: rows[0].tanker },
    avg7,
    tankerTonnage7,
    baseline2023: base,
    pctTotal: pct(avg7.total, base.total),
    pctTanker: pct(avg7.tanker, base.tanker),
    pctTankerTonnage: pct(tankerTonnage7, base.captanker), // headline: DWT vs 2023
    series,
  };
}

async function main() {
  console.log('[portwatch] fetching daily chokepoint transit data (2 batched queries)...');
  const ids = CHOKEPOINTS.map((c) => `'${c.id}'`).join(',');
  const cutoff = new Date(Date.now() - 130 * 86400000).toISOString().slice(0, 10);

  // Query 1: recent daily rows for ALL chokepoints in one call
  const recent = await aget({
    where: `portid IN (${ids}) AND date >= DATE '${cutoff}'`,
    outFields: 'portid,date,n_total,n_tanker,capacity_tanker',
    orderByFields: 'date DESC',
    resultRecordCount: '2000',
  });
  const byId: Record<string, any[]> = {};
  for (const f of recent.features || []) {
    const a = f.attributes;
    (byId[a.portid] ||= []).push({ date: a.date, total: a.n_total ?? 0, tanker: a.n_tanker ?? 0, captanker: a.capacity_tanker ?? 0 });
  }

  // Query 2: 2023 baseline averages, grouped by chokepoint
  const stats = await aget({
    where: `portid IN (${ids}) AND year=${BASELINE_YEAR}`,
    outStatistics: JSON.stringify([
      { statisticType: 'avg', onStatisticField: 'n_total', outStatisticFieldName: 'a_total' },
      { statisticType: 'avg', onStatisticField: 'n_tanker', outStatisticFieldName: 'a_tanker' },
      { statisticType: 'avg', onStatisticField: 'capacity_tanker', outStatisticFieldName: 'a_capt' },
    ]),
    groupByFieldsForStatistics: 'portid',
  });
  const baseById: Record<string, { total: number | null; tanker: number | null; captanker: number | null }> = {};
  for (const f of stats.features || []) {
    const a = f.attributes;
    baseById[a.portid] = {
      total: a.a_total != null ? +(+a.a_total).toFixed(1) : null,
      tanker: a.a_tanker != null ? +(+a.a_tanker).toFixed(1) : null,
      captanker: a.a_capt != null ? +(+a.a_capt).toFixed(0) : null,
    };
  }

  const chokepoints = [];
  for (const cp of CHOKEPOINTS) {
    const r = buildChokepoint(cp, byId[cp.id] || [], baseById[cp.id] || { total: null, tanker: null, captanker: null });
    if (r) { chokepoints.push(r); console.log(`  ✓ ${cp.name}: ${r.avg7.total}/day total, ${r.avg7.tanker} tanker (${r.pctTotal}% of 2023)`); }
    else console.warn(`  ⚠ ${cp.name}: no recent rows`);
  }
  if (!chokepoints.length) { console.warn('[portwatch] no data — leaving existing file untouched'); return; }
  const out = {
    asOf: new Date().toISOString(),
    source: 'IMF PortWatch',
    sourceUrl: 'https://portwatch.imf.org',
    note: 'Daily ship-transit counts estimated from satellite AIS; tanker counts are a crude/product-flow proxy. Current = trailing 7-day average; baseline = 2023 daily average. Estimates, not customs data.',
    baselineYear: BASELINE_YEAR,
    chokepoints,
  };
  fs.writeFileSync(path.join(process.cwd(), 'data', 'portwatch-chokepoints.json'), JSON.stringify(out, null, 2));
  console.log(`[portwatch] wrote ${chokepoints.length} chokepoints`);
}
main().catch((e) => { console.error('[portwatch] FATAL:', e); process.exit(1); });
