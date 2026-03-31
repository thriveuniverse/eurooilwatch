#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Brent Crude Price Fetcher
 * ==========================================
 * Fetches current Brent crude oil price from free APIs.
 *
 * Usage: npx tsx scripts/fetch-brent.ts
 * Output: data/brent.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { BrentData } from '../lib/types';

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'brent.json');

/**
 * Try Yahoo Finance chart API (no key needed, but may rate-limit).
 * BZ=F is the Brent crude futures symbol.
 */
async function fetchFromYahoo(): Promise<BrentData | null> {
  console.log('📈 Trying Yahoo Finance...');
  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=5d',
      { headers: { 'User-Agent': 'EuroOilWatch/0.1' } }
    );

    if (!response.ok) {
      console.log(`  ⚠️ Yahoo returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const closes = result.indicators?.quote?.[0]?.close?.filter((c: any) => c != null) || [];
    if (closes.length < 2) return null;

    const latest = closes[closes.length - 1];
    const previous = closes[closes.length - 2];
    const change = latest - previous;
    const changePct = (change / previous) * 100;

    // Convert to EUR (rough estimate — ideally fetch EUR/USD rate too)
    const eurUsdRate = 0.92; // Approximate — will be fetched separately in production
    const priceEur = latest * eurUsdRate;

    console.log(`  ✅ Brent: $${latest.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)})`);

    return {
      lastUpdated: new Date().toISOString(),
      priceUsd: Math.round(latest * 100) / 100,
      priceEur: Math.round(priceEur * 100) / 100,
      changeUsd: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
      dataSource: 'Yahoo Finance (BZ=F)',
    };
  } catch (err: any) {
    console.log(`  ⚠️ Yahoo Finance failed: ${err.message}`);
    return null;
  }
}

/**
 * Fallback: generate a reasonable estimate for development.
 */
function seedBrentData(): BrentData {
  console.log('🌱 Using seed Brent data for development');
  return {
    lastUpdated: new Date().toISOString(),
    priceUsd: 85.42,
    priceEur: 78.59,
    changeUsd: 1.23,
    changePct: 1.46,
    dataSource: 'SEED DATA — approximate',
  };
}

async function main() {
  console.log('🛢️  EuroOilWatch — Fetching Brent Crude Price');
  console.log('==============================================');

  let data = await fetchFromYahoo();

  if (!data) {
    data = seedBrentData();
  }

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

  console.log(`\n✅ Written to ${OUTPUT_FILE}`);
  console.log(`   Brent: $${data.priceUsd} / €${data.priceEur}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
