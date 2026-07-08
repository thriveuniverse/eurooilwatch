#!/usr/bin/env npx tsx
/**
 * Dow–Nasdaq Market-Leadership Divergence
 * =======================================
 * A breadth / risk-off gauge: the spread between the Dow's and the Nasdaq
 * Composite's trailing 7-session percentage returns.
 *
 *   Δ7 = R(Dow, 7 sessions) − R(Nasdaq Composite, 7 sessions)
 *
 * A large POSITIVE spread — the blue-chip Dow holding while the tech-heavy
 * Nasdaq sells off — is a late-cycle "leadership" warning. Per MarketWatch
 * (Mark Hulbert, 30 Jun 2026, figures attributed to Ned Davis Research), a
 * spread of ≈5.5pp+ over 7 sessions occurred on ~1% of days since 1971, and
 * 66.9% of those were in a bear phase within three months, vs a 24.8%
 * baseline. It is a warning indicator, NOT a forecast (see the panel caveat).
 *
 * Source: FRED (keyless) — DJIA + NASDAQCOM daily closes. No API key needed.
 * Output: data/divergence.json
 */

import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'data', 'divergence.json');
const H = 7;             // trailing sessions for the return spread
const THRESHOLD = 5.5;   // pp — the MarketWatch/NDR trigger level

async function fred(id: string): Promise<Map<string, number>> {
  const r = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`, { headers: { 'User-Agent': 'OilWatch/1.0' } });
  if (!r.ok) throw new Error(`FRED HTTP ${r.status} for ${id}`);
  const m = new Map<string, number>();
  for (const line of (await r.text()).trim().split('\n').slice(1)) {
    const [d, v] = line.split(',');
    if (d && v && v !== '.' && isFinite(+v)) m.set(d, +v);
  }
  return m;
}

async function main() {
  console.log('📉 Dow–Nasdaq divergence (FRED DJIA + NASDAQCOM)');
  const [dj, nc] = await Promise.all([fred('DJIA'), fred('NASDAQCOM')]);
  const dates = Array.from(dj.keys()).filter(d => nc.has(d)).sort();
  if (dates.length < H + 2) throw new Error(`Only ${dates.length} aligned trading days`);

  const D = dates.map(d => dj.get(d)!);
  const N = dates.map(d => nc.get(d)!);

  const series: { date: string; spread: number }[] = [];
  for (let i = H; i < dates.length; i++) {
    const dowR = (D[i] / D[i - H] - 1) * 100;
    const nasR = (N[i] / N[i - H] - 1) * 100;
    series.push({ date: dates[i], spread: +(dowR - nasR).toFixed(2) });
  }

  const li = dates.length - 1;
  const dowRet7 = +((D[li] / D[li - H] - 1) * 100).toFixed(2);
  const nasRet7 = +((N[li] / N[li - H] - 1) * 100).toFixed(2);
  const spread = +(dowRet7 - nasRet7).toFixed(2);
  if (!isFinite(spread) || Math.abs(spread) > 40) throw new Error(`Implausible spread ${spread} — refusing to write`);

  const out = {
    lastUpdated: new Date().toISOString(),
    latestDate: dates[li],
    windowSessions: H,
    spread,
    dowRet7,
    nasRet7,
    dowClose: +D[li].toFixed(2),
    nasClose: +N[li].toFixed(2),
    threshold: THRESHOLD,
    triggered: spread >= THRESHOLD,
    history: series.slice(-120),
    dataSource: 'FRED — Dow Jones Industrial Average (DJIA) & Nasdaq Composite (NASDAQCOM), daily closes',
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`  ✓ spread ${spread >= 0 ? '+' : ''}${spread}pp  (Dow ${dowRet7 >= 0 ? '+' : ''}${dowRet7}% / Nasdaq ${nasRet7 >= 0 ? '+' : ''}${nasRet7}%) — ${dates[li]}${out.triggered ? '  [TRIGGER]' : ''}`);
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
