#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Brent Crude Price Fetcher
 * ==========================================
 * Primary source: Stooq (cb.f front-month futures, ~15 min delayed, CSV).
 * Fallback: Yahoo Finance (BZ=F) — kept because it worked for history seeding.
 *
 * Day-over-day change is computed from our own brent-history.json so we
 * don't need Stooq's historical endpoint (which rate-limits without a session).
 *
 * Usage: npx tsx scripts/fetch-brent.ts
 * Output: data/brent.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { BrentData } from '../lib/types';

const OUTPUT_FILE  = path.join(__dirname, '..', 'data', 'brent.json');
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'brent-history.json');
const EUR_USD_FALLBACK = 1.087; // USD per EUR — used only if the live FX fetch fails (matches fetch-gas.ts)

interface HistoryEntry { date: string; priceUsd: number; priceEur: number; }
interface BrentHistory { lastUpdated: string; entries: HistoryEntry[]; }

async function fetchFromStooq(): Promise<number | null> {
  console.log('📈 Trying Stooq (cb.f)...');
  try {
    const res = await fetch('https://stooq.com/q/l/?s=cb.f&f=sd2t2ohlcv&h&e=csv', {
      headers: { 'User-Agent': 'EuroOilWatch/0.1' },
    });
    if (!res.ok) { console.log(`  ⚠️ Stooq returned ${res.status}`); return null; }
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return null;

    const cols = lines[1].split(',');
    const close = parseFloat(cols[6]);
    if (!isFinite(close) || close <= 0) {
      console.log(`  ⚠️ Stooq returned invalid close: ${cols[6]}`);
      return null;
    }
    console.log(`  ✅ Stooq Brent close: $${close.toFixed(2)}`);
    return close;
  } catch (err: any) {
    console.log(`  ⚠️ Stooq failed: ${err.message}`);
    return null;
  }
}

async function fetchFromYahoo(): Promise<number | null> {
  console.log('📈 Falling back to Yahoo Finance (BZ=F)...');
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=5d',
      { headers: { 'User-Agent': 'EuroOilWatch/0.1' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const closes = (result.indicators?.quote?.[0]?.close ?? []).filter((c: any) => c != null);
    if (closes.length === 0) return null;
    const latest = closes[closes.length - 1];
    console.log(`  ⚠️ Yahoo Brent close: $${latest.toFixed(2)} (used as fallback)`);
    return latest;
  } catch (err: any) {
    console.log(`  ⚠️ Yahoo failed: ${err.message}`);
    return null;
  }
}

async function fetchEurUsd(): Promise<number | null> {
  // Live EUR/USD (USD per EUR) from Yahoo — the SAME source fetch-gas.ts uses,
  // so every EUR figure on the site reconciles to one rate. This was previously
  // a hardcoded 0.92, which drifted ~5% from the live market rate.
  console.log('💱 Fetching live EUR/USD (EURUSD=X)...');
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=1d&range=5d',
      { headers: { 'User-Agent': 'EuroOilWatch/0.1' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const closes = (data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []).filter((c: any) => c != null);
    if (closes.length === 0) return null;
    const rate = closes[closes.length - 1];
    if (!isFinite(rate) || rate < 0.5 || rate > 2) return null;
    console.log(`  ✅ EUR/USD: ${rate.toFixed(4)}`);
    return rate;
  } catch (err: any) {
    console.log(`  ⚠️ EUR/USD fetch failed: ${err.message} — using fallback ${EUR_USD_FALLBACK}`);
    return null;
  }
}

function getPreviousClose(today: string): { price: number; date: string } | null {
  if (!fs.existsSync(HISTORY_FILE)) return null;
  try {
    const hist: BrentHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    const prior = hist.entries
      .filter(e => e.date < today)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (prior.length === 0) return null;
    const latest = prior[prior.length - 1];
    return { price: latest.priceUsd, date: latest.date };
  } catch { return null; }
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

async function updateBrentHistory(priceUsd: number, priceEur: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  let history: BrentHistory = fs.existsSync(HISTORY_FILE)
    ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    : { lastUpdated: new Date().toISOString(), entries: [] };

  history.entries = history.entries.filter(e => e.date !== today);
  history.entries.push({ date: today, priceUsd, priceEur });
  history.entries = history.entries.sort((a, b) => a.date.localeCompare(b.date)).slice(-365);
  history.lastUpdated = new Date().toISOString();

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log(`   📊 History: ${history.entries.length} entries (${history.entries[0]?.date} → ${today})`);
}

async function main() {
  console.log('🛢️  EuroOilWatch — Fetching Brent Crude Price');
  console.log('==============================================');

  const today = new Date().toISOString().slice(0, 10);
  const prev  = getPreviousClose(today);

  // --- Roll-artifact guard ---------------------------------------------------
  // Stooq's cb.f is a *continuous front-month* series: on contract roll it can
  // print a large artificial step (especially in backwardation) that looks like
  // a crash or spike but is not a real market move — e.g. on 23 Jul 2026 it
  // showed -8.5% against a Reuters +2.6% print an hour earlier. Any single-day
  // move beyond MAX_DAILY_MOVE_PCT is corroborated against Yahoo (BZ=F, the
  // actual front-month) before we trust it; an uncorroborated spike is refused
  // rather than published (the last good brent.json is kept).
  const MAX_DAILY_MOVE_PCT = 6;
  const movePct = (price: number): number | null =>
    (!prev || daysBetween(prev.date, today) > 5) ? null : ((price - prev.price) / prev.price) * 100;

  const stooq = await fetchFromStooq();
  let priceUsd: number | null = stooq;
  let dataSource = 'Stooq (cb.f front-month)';

  const stooqMove = stooq !== null ? movePct(stooq) : null;
  if (stooq !== null && stooqMove !== null && Math.abs(stooqMove) > MAX_DAILY_MOVE_PCT) {
    console.log(`  ⚠️ Stooq implies a ${stooqMove.toFixed(1)}% move vs ${prev?.date} ($${prev?.price}) — beyond ±${MAX_DAILY_MOVE_PCT}%. Corroborating against Yahoo (possible front-month roll artifact)...`);
    const yahoo = await fetchFromYahoo();
    const yahooMove = yahoo !== null ? movePct(yahoo) : null;
    if (yahoo !== null && yahooMove !== null && Math.abs(yahooMove) <= MAX_DAILY_MOVE_PCT) {
      console.log(`  ✅ Yahoo shows only ${yahooMove.toFixed(1)}% ($${yahoo.toFixed(2)}) — treating the Stooq print as a roll artifact and using Yahoo.`);
      priceUsd = yahoo;
      dataSource = 'Yahoo Finance (BZ=F)';
    } else if (yahoo !== null) {
      console.log(`  ✅ Yahoo also shows a large move (${(yahooMove ?? 0).toFixed(1)}%, $${yahoo.toFixed(2)}) — corroborated by two sources, treating as real.`);
    } else {
      console.error(`❌ Stooq shows a ${stooqMove.toFixed(1)}% move and Yahoo could not corroborate — refusing to overwrite brent.json with an unverified spike. Keeping the last good value.`);
      process.exit(1);
    }
  } else if (stooq === null) {
    console.log('  ↪ Stooq unavailable — using Yahoo fallback.');
    priceUsd = await fetchFromYahoo();
    dataSource = 'Yahoo Finance (BZ=F)';
  }

  if (priceUsd === null) {
    console.error('❌ All sources failed — not overwriting brent.json');
    process.exit(1);
  }

  const eurUsd   = await fetchEurUsd() ?? EUR_USD_FALLBACK;
  const priceEur = Math.round((priceUsd / eurUsd) * 100) / 100;

  let changeUsd = 0;
  let changePct = 0;
  if (prev) {
    const gap = daysBetween(prev.date, today);
    if (gap <= 5) {
      changeUsd = Math.round((priceUsd - prev.price) * 100) / 100;
      changePct = Math.round(((priceUsd - prev.price) / prev.price) * 10000) / 100;
    } else {
      console.log(`  ⚠️ Most recent history entry (${prev.date}) is ${gap} days old — skipping change calc`);
    }
  }

  const data: BrentData = {
    lastUpdated: new Date().toISOString(),
    priceUsd:    Math.round(priceUsd * 100) / 100,
    priceEur,
    eurUsd:      Math.round(eurUsd * 10000) / 10000,
    changeUsd,
    changePct,
    dataSource,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`\n✅ Written to ${OUTPUT_FILE}`);
  console.log(`   Brent: $${data.priceUsd} / €${data.priceEur} @ EUR/USD ${data.eurUsd} (${changeUsd >= 0 ? '+' : ''}${changeUsd} USD, ${changePct >= 0 ? '+' : ''}${changePct}%)`);

  await updateBrentHistory(data.priceUsd, data.priceEur);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
