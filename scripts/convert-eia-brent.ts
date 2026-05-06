/**
 * Convert EIA Europe Brent Spot Price FOB daily series (RBRTEd.xls) to JSON.
 *
 * Source:  https://www.eia.gov/dnav/pet/hist_xls/RBRTEd.xls
 * Series:  RBRTE — daily, USD/bbl, since 20 May 1987
 *
 * Usage:
 *   tsx scripts/convert-eia-brent.ts <path-to-RBRTEd.xls> <output-json>
 *
 * Without args, defaults to /mnt/c/Users/julie/Downloads/RBRTEd.xls
 * → ukoilwatch/data/brent-eia-daily.json
 */

import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

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

interface Entry { date: string; priceUsd: number; }

function convert(xlsPath: string, outPath: string): void {
  const wb = xlsx.readFile(xlsPath);
  const ws = wb.Sheets['Data 1'];
  if (!ws) throw new Error("Sheet 'Data 1' not found in workbook");
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false }) as string[][];

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

  const peak = data.reduce((m, d) => d.priceUsd > m.priceUsd ? d : m, data[0]);
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

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out));

  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`Wrote ${data.length} records (${data[0].date} → ${data[data.length - 1].date}) to ${outPath} (${sizeKb} KB)`);
  console.log(`All-time high: $${peak.priceUsd} on ${peak.date}`);
  console.log(`All-time low:  $${trough.priceUsd} on ${trough.date}`);
}

const xlsArg = process.argv[2] ?? '/mnt/c/Users/julie/Downloads/RBRTEd.xls';
const outArg = process.argv[3] ?? path.join(process.cwd(), 'data/brent-eia-daily.json');
convert(xlsArg, outArg);
