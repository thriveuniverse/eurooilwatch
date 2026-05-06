/**
 * Fetch EIA Europe Brent Spot Price FOB daily series from eia.gov,
 * parse the .xls and emit data/brent-eia-daily.json.
 *
 * Source:  https://www.eia.gov/dnav/pet/hist_xls/RBRTEd.xls
 * Series:  RBRTE — daily, USD/bbl, since 20 May 1987
 *
 * Designed for the daily update-data.yml workflow. Standalone — does not
 * require a local copy of the .xls.
 */

import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const EIA_URL = 'https://www.eia.gov/dnav/pet/hist_xls/RBRTEd.xls';
const OUT_PATH = path.join(process.cwd(), 'data', 'brent-eia-daily.json');

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4,  May: 5,  Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function parseEiaDate(s: string): string | null {
  const m = String(s).match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!m) return null;
  const mm = MONTHS[m[1].slice(0, 3)];
  if (!mm) return null;
  const dd = parseInt(m[2], 10);
  return `${m[3]}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

async function main() {
  console.log(`Downloading ${EIA_URL}…`);
  const res = await fetch(EIA_URL);
  if (!res.ok) throw new Error(`EIA download failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded ${(buf.length / 1024).toFixed(0)} KB`);

  const wb = xlsx.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['Data 1'];
  if (!ws) throw new Error("Sheet 'Data 1' not found");
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false }) as string[][];

  interface Entry { date: string; priceUsd: number; }
  const data: Entry[] = [];
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0] || !r[1]) continue;
    const iso = parseEiaDate(r[0]);
    if (!iso) continue;
    const price = parseFloat(r[1]);
    if (isNaN(price)) continue;
    data.push({ date: iso, priceUsd: price });
  }
  data.sort((a, b) => a.date.localeCompare(b.date));

  if (!data.length) throw new Error('No usable rows parsed from EIA workbook');

  const peak   = data.reduce((m, d) => d.priceUsd > m.priceUsd ? d : m, data[0]);
  const trough = data.reduce((m, d) => d.priceUsd < m.priceUsd ? d : m, data[0]);

  const out = {
    source: 'U.S. Energy Information Administration — Europe Brent Spot Price FOB',
    sourceKey: 'RBRTE',
    sourceUrl: 'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RBRTE&f=D',
    unit: 'USD per barrel',
    frequency: 'daily',
    lastUpdated: new Date().toISOString(),
    firstDate: data[0].date,
    lastDate:  data[data.length - 1].date,
    count: data.length,
    allTimeHigh: { date: peak.date,   priceUsd: peak.priceUsd },
    allTimeLow:  { date: trough.date, priceUsd: trough.priceUsd },
    entries: data,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  console.log(`Wrote ${data.length} records (${data[0].date} → ${data[data.length - 1].date}) to ${OUT_PATH}`);
  console.log(`Latest print: $${data[data.length - 1].priceUsd} on ${data[data.length - 1].date}`);
}

main().catch(e => { console.error(e); process.exit(1); });
