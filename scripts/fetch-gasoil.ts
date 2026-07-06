#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — European Gasoil (Diesel) Crack
 * =============================================
 * The single most-watched European refining margin. Europe runs a diesel-long
 * slate, so the gasoil crack — ICE Low-Sulphur Gasoil minus Brent — is THE
 * number EU refiners and traders track, more than a blended 3-2-1.
 *
 *   gasoil crack ($/bbl) = ICE Gasoil ($/tonne ÷ 7.45) − Brent ($/bbl)
 *
 * This is a *true* European metric (ICE Gasoil is the NWE diesel benchmark),
 * unlike the Brent 3-2-1 panel which uses NY Harbor products as a proxy.
 *
 * Sources (both already trusted elsewhere in this repo):
 *   - ICE Gasoil daily history: Stooq (qs.f), USD/tonne — same host as the
 *     Brent feed in fetch-brent.ts (cb.f).
 *   - Brent daily history: local data/brent-eia-daily.json (EIA RBRTE),
 *     already produced by fetch-brent-eia.ts — no extra network call, and the
 *     authoritative benchmark.
 *
 * Guarded: if the gasoil price or resulting crack falls outside a sane band
 * (i.e. the ticker returned something other than ICE Gasoil), the script
 * REFUSES to write — better an absent panel than a wrong number.
 *
 * Output: data/gasoil.json
 */

import fs from 'fs';
import path from 'path';

const OUT_PATH   = path.join(process.cwd(), 'data', 'gasoil.json');
const BRENT_PATH = path.join(process.cwd(), 'data', 'brent-eia-daily.json');
const BBL_PER_TONNE_GASOIL = 7.45; // industry-standard density conversion for gasoil/diesel

// Sanity bands — reject anything that isn't plausibly ICE Gasoil vs Brent.
const TONNE_MIN = 350, TONNE_MAX = 1500;   // ICE Gasoil realistic range, $/tonne
const CRACK_MIN = -5,  CRACK_MAX = 90;     // gasoil crack realistic range, $/bbl

async function fetchStooqGasoilHistory(): Promise<Map<string, number>> {
  // Stooq daily-history CSV: "Date,Open,High,Low,Close,Volume", dates YYYY-MM-DD.
  const url = 'https://stooq.com/q/d/l/?s=qs.f&i=d';
  const res = await fetch(url, { headers: { 'User-Agent': 'EuroOilWatch/0.1' } });
  if (!res.ok) throw new Error(`Stooq gasoil HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split('\n');
  if (!lines.length || !/^Date,/i.test(lines[0])) {
    throw new Error(`Stooq did not return CSV for qs.f (got: ${text.slice(0, 60).replace(/\s+/g, ' ')})`);
  }
  const map = new Map<string, number>();
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(',');
    if (c.length < 5) continue;
    const date = c[0];
    const close = parseFloat(c[4]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isFinite(close) || close <= 0) continue;
    map.set(date, close);
  }
  if (map.size < 30) throw new Error(`Stooq gasoil history too short (${map.size} rows)`);
  return map;
}

function loadBrentHistory(): Map<string, number> {
  if (!fs.existsSync(BRENT_PATH)) throw new Error(`Missing ${BRENT_PATH} (run fetch:brent-eia first)`);
  const raw = JSON.parse(fs.readFileSync(BRENT_PATH, 'utf-8')) as { entries: { date: string; priceUsd: number }[] };
  const map = new Map<string, number>();
  for (const e of raw.entries ?? []) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(e.date) && isFinite(e.priceUsd) && e.priceUsd > 0) map.set(e.date, e.priceUsd);
  }
  if (map.size < 30) throw new Error(`Brent history too short (${map.size} rows)`);
  return map;
}

function isoOffsetDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log('📡 European Gasoil (Diesel) Crack — ICE Gasoil vs Brent');
  console.log('='.repeat(54));

  const gasoilTonne = await fetchStooqGasoilHistory();
  const brent = loadBrentHistory();
  console.log(`  Parsed ${gasoilTonne.size} ICE Gasoil, ${brent.size} Brent daily points`);

  const series = [...gasoilTonne.keys()]
    .filter(d => brent.has(d))
    .sort((a, b) => (a < b ? 1 : -1)) // newest first
    .map(date => {
      const tonne = gasoilTonne.get(date)!;
      const gasoilBbl = tonne / BBL_PER_TONNE_GASOIL;
      const b = brent.get(date)!;
      return {
        date,
        crackUsd: +(gasoilBbl - b).toFixed(2),
        brentUsd: +b.toFixed(2),
        gasoilUsdTonne: +tonne.toFixed(2),
        gasoilUsdBbl: +gasoilBbl.toFixed(2),
      };
    });

  if (series.length < 2) throw new Error(`Only ${series.length} aligned point(s) — refusing to write`);

  const latest = series[0];
  const prev = series[1];

  // Guard: reject implausible values (wrong ticker, unit mismatch, bad parse).
  if (latest.gasoilUsdTonne < TONNE_MIN || latest.gasoilUsdTonne > TONNE_MAX) {
    throw new Error(`Gasoil $${latest.gasoilUsdTonne}/t outside sane band [${TONNE_MIN},${TONNE_MAX}] — wrong ticker? Refusing to write.`);
  }
  if (latest.crackUsd < CRACK_MIN || latest.crackUsd > CRACK_MAX) {
    throw new Error(`Crack $${latest.crackUsd}/bbl outside sane band [${CRACK_MIN},${CRACK_MAX}] — refusing to write.`);
  }

  const yearAgo = series.find(s => s.date <= isoOffsetDays(latest.date, -365)) ?? series[series.length - 1];

  const out = {
    lastUpdated: new Date().toISOString(),
    latestDate: latest.date,
    crackUsd: latest.crackUsd,
    crackChangeUsd: +(latest.crackUsd - prev.crackUsd).toFixed(2),
    crackVsYearAgoUsd: +(latest.crackUsd - yearAgo.crackUsd).toFixed(2),
    components: {
      brentUsd: latest.brentUsd,
      gasoilUsdTonne: latest.gasoilUsdTonne,
      gasoilUsdBbl: latest.gasoilUsdBbl,
    },
    history: series.slice(0, 120).reverse().map(s => ({ date: s.date, crackUsd: s.crackUsd })),
    formula: 'Gasoil crack = ICE Low-Sulphur Gasoil ($/tonne ÷ 7.45) − Brent ($/bbl)',
    legs: {
      crude: 'Europe Brent spot (EIA RBRTE)',
      distillate: 'ICE Low-Sulphur Gasoil front-month (Stooq qs.f), $/tonne',
    },
    basis: 'The benchmark European diesel refining margin — ICE Gasoil is the NWE distillate reference. A true traded European crack (unlike the Brent 3-2-1 panel, which uses NY Harbor products as a proxy).',
    dataSource: 'ICE Gasoil via Stooq (qs.f) · Brent via EIA (RBRTE)',
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`  ✓ Gasoil crack: $${out.crackUsd}/bbl (${out.crackChangeUsd >= 0 ? '+' : ''}${out.crackChangeUsd} d/d) — ${latest.date}`);
  console.log(`    Brent $${latest.brentUsd} · ICE Gasoil $${latest.gasoilUsdTonne}/t ($${latest.gasoilUsdBbl}/bbl)`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
