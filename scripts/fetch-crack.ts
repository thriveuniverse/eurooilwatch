#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Brent 3-2-1 Crack Spread
 * =======================================
 * The 3-2-1 crack spread is the cleanest single proxy for refining margin: what
 * a refiner earns turning 3 barrels of crude into 2 of gasoline and 1 of
 * distillate. It answers the question a falling crude price cannot — do refiners
 * have any incentive to keep running, and will pump/diesel prices actually
 * follow crude down, or stay stubbornly high?
 *
 *   crack ($/bbl) = [ 2×(gasoline $/gal × 42) + 1×(distillate $/gal × 42)
 *                     − 3×(crude $/bbl) ] ÷ 3
 *
 * Crude leg is BRENT (Europe's benchmark). The product legs use NY Harbor spot
 * as an Atlantic-Basin proxy: EIA publishes no free European (Rotterdam/NWE)
 * product spot series, and light-product cracks are tightly arbitraged across
 * the Atlantic, so NY Harbor tracks NWE within a few $/bbl. This is a proxy for
 * European refining economics, not a traded NWE quote — the panel says so.
 *
 * All legs are pulled from EIA's KEYLESS daily .xls bulk files (same source and
 * pattern as fetch-brent-eia.ts) — no API key required.
 *
 * Output: data/crack.json
 */

import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const OUT_PATH = path.join(process.cwd(), 'data', 'crack.json');
const GAL_PER_BBL = 42;

const SERIES = {
  brent:    'https://www.eia.gov/dnav/pet/hist_xls/RBRTEd.xls',                     // Europe Brent spot, $/bbl
  gasoline: 'https://www.eia.gov/dnav/pet/hist_xls/EER_EPMRU_PF4_Y35NY_DPGd.xls',   // NY Harbor conv. regular gasoline, $/gal
  ulsd:     'https://www.eia.gov/dnav/pet/hist_xls/EER_EPD2DXL0_PF4_Y35NY_DPGd.xls', // NY Harbor ULSD, $/gal
};

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4,  May: 5,  Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function parseEiaDate(s: string): string | null {
  const m = String(s).match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!m) return null;
  const mm = MONTHS[m[1].slice(0, 3)];
  if (!mm) return null;
  return `${m[3]}-${String(mm).padStart(2, '0')}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
}

async function fetchSeries(url: string): Promise<Map<string, number>> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`EIA download failed (${res.status}) for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const wb = xlsx.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames.find(s => s.startsWith('Data')) ?? 'Data 1';
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet 'Data' not found in ${url}`);
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false }) as string[][];

  const map = new Map<string, number>();
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0] || r[1] == null || r[1] === '') continue;
    const iso = parseEiaDate(r[0]);
    if (!iso) continue;
    const v = parseFloat(r[1]);
    if (!isFinite(v) || v <= 0) continue;
    map.set(iso, v);
  }
  return map;
}

function crack321(crude: number, gasGal: number, ulsdGal: number): number {
  return (2 * gasGal * GAL_PER_BBL + 1 * ulsdGal * GAL_PER_BBL - 3 * crude) / 3;
}

function isoOffsetDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log('📡 Brent 3-2-1 Crack Spread (EIA keyless .xls)');
  console.log('='.repeat(46));

  const [brent, gas, ulsd] = await Promise.all([
    fetchSeries(SERIES.brent),
    fetchSeries(SERIES.gasoline),
    fetchSeries(SERIES.ulsd),
  ]);
  console.log(`  Parsed ${brent.size} Brent, ${gas.size} gasoline, ${ulsd.size} ULSD daily points`);

  // Only dates where all three legs settled — the crack is undefined otherwise.
  const series = [...brent.keys()]
    .filter(d => gas.has(d) && ulsd.has(d))
    .sort((a, b) => (a < b ? 1 : -1)) // newest first
    .map(date => {
      const c = brent.get(date)!, g = gas.get(date)!, u = ulsd.get(date)!;
      return {
        date,
        crackUsd: +crack321(c, g, u).toFixed(2),
        brentUsd: +c.toFixed(2),
        gasolineUsdGal: +g.toFixed(3),
        ulsdUsdGal: +u.toFixed(3),
      };
    });

  if (series.length < 2) {
    console.error(`❌ Only ${series.length} aligned point(s) — refusing to overwrite crack.json`);
    process.exit(1);
  }

  const latest = series[0];
  const prev = series[1];
  const yearAgo = series.find(s => s.date <= isoOffsetDays(latest.date, -365)) ?? series[series.length - 1];

  const out = {
    lastUpdated: new Date().toISOString(),
    latestDate: latest.date,
    crackUsd: latest.crackUsd,
    crackChangeUsd: +(latest.crackUsd - prev.crackUsd).toFixed(2),
    crackVsYearAgoUsd: +(latest.crackUsd - yearAgo.crackUsd).toFixed(2),
    components: {
      brentUsd: latest.brentUsd,
      gasolineUsdGal: latest.gasolineUsdGal,
      ulsdUsdGal: latest.ulsdUsdGal,
    },
    history: series.slice(0, 120).reverse().map(s => ({ date: s.date, crackUsd: s.crackUsd })),
    formula: '3-2-1: (2×gasoline$/gal×42 + 1×ULSD$/gal×42 − 3×Brent$/bbl) ÷ 3',
    legs: {
      crude: 'Europe Brent spot (EIA RBRTE)',
      gasoline: 'NY Harbor conventional regular gasoline spot (EIA) — Atlantic-Basin proxy',
      distillate: 'NY Harbor ULSD spot (EIA) — Atlantic-Basin proxy',
    },
    basis: 'Brent crude vs NY Harbor products as an Atlantic-Basin proxy. EIA publishes no free NWE/Rotterdam product spot; light-product cracks arbitrage across the Atlantic, so NY Harbor tracks NWE within a few $/bbl. Proxy for European refining economics, not a traded NWE quote.',
    dataSource: 'US Energy Information Administration (EIA), daily spot prices',
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`  ✓ Brent 3-2-1: $${out.crackUsd}/bbl (${out.crackChangeUsd >= 0 ? '+' : ''}${out.crackChangeUsd} d/d) — ${latest.date}`);
  console.log(`    Brent $${latest.brentUsd} · gasoline $${latest.gasolineUsdGal}/gal · ULSD $${latest.ulsdUsdGal}/gal`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
