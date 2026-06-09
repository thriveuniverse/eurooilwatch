/**
 * Fetch daily tanker oil-flow estimates at major ports from IMF PortWatch.
 * Per port: trailing-7-day tanker import / export volume (PortWatch trade-volume
 * estimate, metric tonnes) vs a 2023 baseline, with a 90-day throughput series.
 *
 * Source: IMF PortWatch Daily_Ports_Data FeatureServer (open, free; cite
 * "IMF PortWatch, portwatch.imf.org"). Volumes are AIS-derived ESTIMATES.
 * Output: data/port-flows.json   Cadence: daily via update-data.yml.
 */
import * as fs from 'fs';
import * as path from 'path';

const FS_URL =
  'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Ports_Data/FeatureServer/0/query';
const UA = 'OilWatch fetch-port-flows.ts';
const BASELINE_YEAR = 2023;

// Major crude/product ports with good AIS coverage (Saudi terminals read ~0 in
// PortWatch and are deliberately excluded). cc = flag/region tag.
const PORTS = [
  { id: 'port1114', key: 'rotterdam', name: 'Rotterdam', cc: 'NL' },
  { id: 'port57', key: 'antwerp', name: 'Antwerp', cc: 'BE' },
  { id: 'port264', key: 'corpus', name: 'Corpus Christi', cc: 'US' },
  { id: 'port664', key: 'la-lb', name: 'Los Angeles–Long Beach', cc: 'US' },
  { id: 'port373', key: 'galveston', name: 'Galveston', cc: 'US' },
  { id: 'port833', key: 'novorossiysk', name: 'Novorossiysk', cc: 'RU' },
  { id: 'port362', key: 'fujairah', name: 'Fujairah', cc: 'AE' },
  { id: 'port1160', key: 'santos', name: 'Santos', cc: 'BR' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function aget(params: Record<string, string>): Promise<any> {
  const url = new URL(FS_URL);
  url.searchParams.set('f', 'json');
  url.searchParams.set('returnGeometry', 'false');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
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
const avg = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(0) : null);
const pct = (a: number | null, b: number | null) => (a != null && b && b > 0 ? Math.round((a / b) * 100) : null);

function build(p: { id: string; key: string; name: string; cc: string }, rows: any[], base: { imp: number | null; exp: number | null }) {
  if (!rows.length) return null;
  rows.sort((a, b) => b.date - a.date);
  const f7 = rows.slice(0, 7);
  const imp7 = avg(f7.map((r) => r.imp));
  const exp7 = avg(f7.map((r) => r.exp));
  const total7 = imp7 != null && exp7 != null ? imp7 + exp7 : null;
  const baseTotal = base.imp != null && base.exp != null ? base.imp + base.exp : null;
  const dir = imp7 != null && exp7 != null ? (imp7 > exp7 * 1.25 ? 'import' : exp7 > imp7 * 1.25 ? 'export' : 'balanced') : null;
  const series = rows.slice(0, 90).reverse().map((r) => ({ d: isoDate(r.date), v: r.imp + r.exp }));
  return {
    key: p.key, name: p.name, cc: p.cc, portid: p.id,
    latestDate: isoDate(rows[0].date),
    imp7, exp7, total7,
    baseline2023Total: baseTotal,
    pctTotal: pct(total7, baseTotal),
    dir, series,
  };
}

async function main() {
  console.log('[port-flows] fetching daily tanker import/export by port (2 batched queries)...');
  const ids = PORTS.map((p) => `'${p.id}'`).join(',');
  const cutoff = new Date(Date.now() - 130 * 86400000).toISOString().slice(0, 10);

  const recent = await aget({
    where: `portid IN (${ids}) AND date >= DATE '${cutoff}'`,
    outFields: 'portid,date,import_tanker,export_tanker',
    orderByFields: 'date DESC',
    resultRecordCount: '2000',
  });
  const byId: Record<string, any[]> = {};
  for (const f of recent.features || []) {
    const a = f.attributes;
    (byId[a.portid] ||= []).push({ date: a.date, imp: a.import_tanker ?? 0, exp: a.export_tanker ?? 0 });
  }

  const stats = await aget({
    where: `portid IN (${ids}) AND year=${BASELINE_YEAR}`,
    outStatistics: JSON.stringify([
      { statisticType: 'avg', onStatisticField: 'import_tanker', outStatisticFieldName: 'a_imp' },
      { statisticType: 'avg', onStatisticField: 'export_tanker', outStatisticFieldName: 'a_exp' },
    ]),
    groupByFieldsForStatistics: 'portid',
  });
  const baseById: Record<string, { imp: number | null; exp: number | null }> = {};
  for (const f of stats.features || []) {
    const a = f.attributes;
    baseById[a.portid] = { imp: a.a_imp != null ? +(+a.a_imp).toFixed(0) : null, exp: a.a_exp != null ? +(+a.a_exp).toFixed(0) : null };
  }

  const ports = [];
  for (const p of PORTS) {
    const r = build(p, byId[p.id] || [], baseById[p.id] || { imp: null, exp: null });
    if (r) { ports.push(r); console.log(`  ✓ ${p.name}: in ${r.imp7} / out ${r.exp7} t/d (${r.pctTotal}% of 2023, ${r.dir})`); }
    else console.warn(`  ⚠ ${p.name}: no recent rows`);
  }
  if (!ports.length) { console.warn('[port-flows] no data — leaving existing file untouched'); return; }
  const out = {
    asOf: new Date().toISOString(),
    source: 'IMF PortWatch',
    sourceUrl: 'https://portwatch.imf.org',
    units: 'metric tonnes/day (tanker cargo, estimated)',
    note: 'Daily tanker import/export volume estimated from satellite AIS. Current = trailing 7-day average; baseline = 2023 daily average. Estimates, not customs data.',
    baselineYear: BASELINE_YEAR,
    ports,
  };
  fs.writeFileSync(path.join(process.cwd(), 'data', 'port-flows.json'), JSON.stringify(out, null, 2));
  console.log(`[port-flows] wrote ${ports.length} ports`);
}
main().catch((e) => { console.error('[port-flows] FATAL:', e); process.exit(1); });
