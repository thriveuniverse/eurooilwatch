#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Bunker Fuel Price Estimator
 * ==========================================
 * Derives VLSFO and MGO prices for Rotterdam, Fujairah, and Singapore
 * from the current Brent crude price using well-established market
 * relationships. Writes to data/bunker.json.
 *
 * Formula:
 *   VLSFO ($/mt) ≈ Brent ($/bbl) × 6.5 + 10   [Rotterdam base]
 *   MGO   ($/mt) ≈ Brent ($/bbl) × 6.5 + 130  [Rotterdam base]
 *
 * Port premiums over Rotterdam:
 *   Fujairah: VLSFO +15, MGO +15
 *   Singapore: VLSFO +8, MGO +10
 *
 * These relationships hold well over normal market conditions.
 * For exact market prices: Ship & Bunker (shipandbunker.com), Platts.
 */

import fs   from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

interface BrentData {
  priceUsd:  number;
  changeUsd: number;
  changePct: number;
}

interface BunkerPort {
  name:       string;
  code:       string;
  region:     string;
  relevance:  string;
  vlsfo:      number;
  mgo:        number;
  vlsfoChange: number;
  mgoChange:   number;
}

interface BunkerData {
  lastUpdated: string;
  brentBasis:  number;
  brentChange: number;
  note:        string;
  ports:       BunkerPort[];
}

function compute(brentUsd: number, brentChange: number): BunkerPort[] {
  const base = brentUsd * 6.5;
  const baseChange = brentChange * 6.5;

  return [
    {
      name:        'Rotterdam',
      code:        'ARA',
      region:      'NW Europe',
      relevance:   'Primary EU/UK supply hub — leading indicator for diesel and gasoil',
      vlsfo:       Math.round(base + 10),
      mgo:         Math.round(base + 130),
      vlsfoChange: Math.round(baseChange * 10) / 10,
      mgoChange:   Math.round(baseChange * 10) / 10,
    },
    {
      name:        'Fujairah',
      code:        'FUJA',
      region:      'Middle East',
      relevance:   'Gulf supply stress indicator — rises under Hormuz/Red Sea disruption',
      vlsfo:       Math.round(base + 25),
      mgo:         Math.round(base + 145),
      vlsfoChange: Math.round(baseChange * 10) / 10,
      mgoChange:   Math.round(baseChange * 10) / 10,
    },
    {
      name:        'Singapore',
      code:        'SING',
      region:      'Asia-Pacific',
      relevance:   'Global benchmark — reflects competition between Asian and EU buyers',
      vlsfo:       Math.round(base + 18),
      mgo:         Math.round(base + 140),
      vlsfoChange: Math.round(baseChange * 10) / 10,
      mgoChange:   Math.round(baseChange * 10) / 10,
    },
  ];
}

interface BunkerHistoryEntry {
  date: string;
  brentBasis: number;
  rotterdam: { vlsfo: number; mgo: number };
  fujairah:  { vlsfo: number; mgo: number };
  singapore: { vlsfo: number; mgo: number };
}

function updateBunkerHistory(ports: BunkerPort[], brentUsd: number): void {
  const histPath = path.join(DATA_DIR, 'bunker-history.json');
  const today = new Date().toISOString().slice(0, 10);

  let history: { lastUpdated: string; entries: BunkerHistoryEntry[] } = { lastUpdated: '', entries: [] };
  if (fs.existsSync(histPath)) {
    try { history = JSON.parse(fs.readFileSync(histPath, 'utf-8')); } catch { /* start fresh */ }
  }

  const byCode = Object.fromEntries(ports.map(p => [p.code, p]));
  history.entries = history.entries.filter(e => e.date !== today);
  history.entries.push({
    date: today, brentBasis: brentUsd,
    rotterdam: { vlsfo: byCode['ARA'].vlsfo,  mgo: byCode['ARA'].mgo },
    fujairah:  { vlsfo: byCode['FUJA'].vlsfo, mgo: byCode['FUJA'].mgo },
    singapore: { vlsfo: byCode['SING'].vlsfo, mgo: byCode['SING'].mgo },
  });
  history.entries = history.entries.sort((a, b) => a.date.localeCompare(b.date)).slice(-365);
  history.lastUpdated = new Date().toISOString();

  fs.writeFileSync(histPath, JSON.stringify(history, null, 2));
  console.log(`   📊 Bunker history: ${history.entries.length} entries`);
}

async function main() {
  const brentPath = path.join(DATA_DIR, 'brent.json');
  if (!fs.existsSync(brentPath)) {
    console.error('❌ data/brent.json not found — run fetch:brent first');
    process.exit(1);
  }

  const brent: BrentData = JSON.parse(fs.readFileSync(brentPath, 'utf-8'));
  console.log(`📦 Brent basis: $${brent.priceUsd}/bbl (${brent.changeUsd >= 0 ? '+' : ''}${brent.changeUsd?.toFixed(2)} today)`);

  const ports = compute(brent.priceUsd, brent.changeUsd ?? 0);

  const output: BunkerData = {
    lastUpdated: new Date().toISOString(),
    brentBasis:  brent.priceUsd,
    brentChange: brent.changeUsd ?? 0,
    note:        'Estimated from Brent crude benchmark. For exact market prices: Ship & Bunker, Platts.',
    ports,
  };

  fs.writeFileSync(path.join(DATA_DIR, 'bunker.json'), JSON.stringify(output, null, 2));
  console.log('✅ data/bunker.json written');
  for (const p of ports) {
    console.log(`   ${p.name.padEnd(12)} VLSFO $${p.vlsfo}/mt  MGO $${p.mgo}/mt`);
  }

  updateBunkerHistory(ports, brent.priceUsd);
}

main().catch(err => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
