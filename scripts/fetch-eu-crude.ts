#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — EU-27 Crude Oil Import Origins Fetcher
 * =====================================================
 * Pulls EU-27 crude oil imports by partner country from Eurostat and writes
 * data/eu-crude-imports.json. Source of truth is Eurostat volume (thousand
 * tonnes → Mt); mb/d is a *derived* convenience figure, not sourced.
 *
 * Dataset : NRG_TI_OIL  (Imports of oil and petroleum products by partner country)
 * Product : O4100_TOT   (Crude oil)
 * Reporter: EU27_2020
 *
 * Usage:  npx tsx scripts/fetch-eu-crude.ts
 * Output: data/eu-crude-imports.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type { EurostatResponse } from '../lib/types';

const BASE_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const DATASET = 'NRG_TI_OIL';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'eu-crude-imports.json');

const FACTOR = 7.33; // barrels per tonne, world-average crude (EIA/BP convention)
const MIN_MT = 2;    // list partners reaching >= 2 Mt in any year; rest -> "Other"

// Region grouping for the "group by region" view.
const REGION: Record<string, string> = {
  US: 'N. America', CA: 'N. America', MX: 'N. America',
  NO: 'Europe (non-EU)', UK: 'Europe (non-EU)',
  RU: 'Russia',
  KZ: 'Caspian / C. Asia', AZ: 'Caspian / C. Asia', TM: 'Caspian / C. Asia', UZ: 'Caspian / C. Asia',
  SA: 'Middle East', IQ: 'Middle East', IR: 'Middle East', KW: 'Middle East',
  AE: 'Middle East', QA: 'Middle East', OM: 'Middle East', BH: 'Middle East',
  LY: 'Africa', NG: 'Africa', DZ: 'Africa', AO: 'Africa', EG: 'Africa', GH: 'Africa',
  CG: 'Africa', GQ: 'Africa', GA: 'Africa', TN: 'Africa', SD: 'Africa', CM: 'Africa',
  BR: 'S. America', GY: 'S. America', VE: 'S. America', CO: 'S. America',
  EC: 'S. America', AR: 'S. America', TT: 'S. America',
};

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchEurostat(params: Record<string, string>): Promise<EurostatResponse> {
  const url = new URL(`${BASE_URL}/${DATASET}`);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('lang', 'EN');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  console.log(`  Fetching: ${DATASET} (${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ')})`);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url.toString(), { headers: { 'User-Agent': 'EuroOilWatch/0.1' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as EurostatResponse;
      console.log(`  ✅ ${Object.keys(data.value || {}).length} values, updated ${data.updated}`);
      return data;
    } catch (err: any) {
      console.log(`  ⚠️ Attempt ${attempt}: ${err.message}`);
      if (attempt < 3) await sleep(5000); else throw err;
    }
  }
  throw new Error('unreachable');
}

/** Decode JSON-stat into a partner|time -> value map (thousand tonnes). */
function parsePartnerTime(data: EurostatResponse): { byKey: Map<string, number>; years: string[] } {
  const dims = data.id;
  const sizes = data.size;
  const dimCodes: string[][] = dims.map((name) => {
    const idx = data.dimension[name]?.category?.index || {};
    const arr: string[] = [];
    for (const [code, pos] of Object.entries(idx)) arr[pos as number] = code;
    return arr;
  });
  const pDim = dims.indexOf('partner');
  const tDim = dims.indexOf('time');
  const byKey = new Map<string, number>();
  for (const [flatIdx, value] of Object.entries(data.value)) {
    let remaining = parseInt(flatIdx, 10);
    const coords: string[] = new Array(dims.length);
    for (let d = dims.length - 1; d >= 0; d--) {
      coords[d] = dimCodes[d][remaining % sizes[d]];
      remaining = Math.floor(remaining / sizes[d]);
    }
    byKey.set(`${coords[pDim]}|${coords[tDim]}`, value);
  }
  const years = Object.keys(data.dimension.time.category.index).sort();
  return { byKey, years };
}

async function main() {
  console.log('🛢️  EuroOilWatch — EU crude oil import origins (Eurostat NRG_TI_OIL)');
  console.log('====================================================================\n');

  const data = await fetchEurostat({ geo: 'EU27_2020', siec: 'O4100_TOT' });
  const { byKey, years } = parsePartnerTime(data);
  const partLabels = data.dimension.partner.category.label;
  const partCodes = Object.keys(data.dimension.partner.category.index);

  const mt = (code: string, y: string) => +(((byKey.get(`${code}|${y}`) ?? 0) / 1000).toFixed(2));

  const keep = partCodes.filter(
    (c) => c !== 'TOTAL' && c !== 'NSP' && years.some((y) => (byKey.get(`${c}|${y}`) ?? 0) >= MIN_MT * 1000),
  );

  const partners: Record<string, { name: string; region: string; mt: Record<string, number> }> = {};
  for (const code of keep) {
    const series: Record<string, number> = {};
    for (const y of years) series[y] = mt(code, y);
    partners[code] = { name: partLabels[code], region: REGION[code] || 'Other', mt: series };
  }
  const total_mt: Record<string, number> = {};
  for (const y of years) total_mt[y] = mt('TOTAL', y);

  const out = {
    meta: {
      title: 'EU-27 crude oil imports by partner country',
      source: 'Eurostat — dataset NRG_TI_OIL (Imports of oil and petroleum products by partner country)',
      source_url: 'https://ec.europa.eu/eurostat/databrowser/view/NRG_TI_OIL/',
      api: `${BASE_URL}/${DATASET}?format=JSON&lang=EN&geo=EU27_2020&siec=O4100_TOT`,
      product: 'O4100_TOT (Crude oil)',
      reporter: 'EU27_2020',
      unit_source: 'thousand tonnes (converted to Mt)',
      conversion: 'mb/d = Mt per year x 7.33 barrels per tonne / 365 days',
      conversion_factor_bbl_per_tonne: FACTOR,
      retrieved: new Date().toISOString().slice(0, 10),
      note: 'Spine is Eurostat volume (Mt). mb/d is derived, not sourced. "Other" is computed = total minus listed partners.',
    },
    years,
    total_mt,
    partners,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2) + '\n');

  const latest = years[years.length - 1];
  const top = Object.values(partners).map((p) => [p.name, p.mt[latest]] as const).sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log(`\n📂 Output: ${OUTPUT_FILE}`);
  console.log(`📊 ${keep.length} partners, ${years[0]}–${latest}, EU total ${total_mt[latest]} Mt`);
  console.log(`   Top ${latest}: ${top.map(([n, v]) => `${n} ${v}Mt`).join(', ')}`);
}

main().catch((err) => { console.error('❌ Fatal:', err.message); process.exit(1); });
