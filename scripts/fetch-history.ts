#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Historical Data Generator
 * ==========================================
 * Pulls 18 months of stock + price history from Eurostat and saves
 * as time series for charting. Run after fetch:stocks.
 *
 * Usage: npx tsx scripts/fetch-history.ts
 * Output: data/history.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type { EurostatResponse, FuelType, CountryCode } from '../lib/types';
import { COUNTRIES, EU27_CODES, FUEL_SIEC_CODES } from '../lib/countries';

const BASE_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'history.json');

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchEurostat(dataset: string, params: Record<string, string | string[]>): Promise<EurostatResponse> {
  const url = new URL(`${BASE_URL}/${dataset}`);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('lang', 'en');
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach(v => url.searchParams.append(key, v));
    else url.searchParams.set(key, value);
  }
  console.log(`  Fetching: ${dataset} ...`);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url.toString(), { headers: { 'User-Agent': 'EuroOilWatch/0.1' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as EurostatResponse;
      console.log(`  ✅ ${Object.keys(data.value || {}).length} values`);
      return data;
    } catch (err: any) {
      console.log(`  ⚠️ Attempt ${attempt}: ${err.message}`);
      if (attempt < 3) await sleep(5000); else throw err;
    }
  }
  throw new Error('unreachable');
}

function parseValues(data: EurostatResponse): Map<string, number> {
  const result = new Map<string, number>();
  const dims = data.id;
  const sizes = data.size;
  const dimCodes: string[][] = dims.map(dimName => {
    const idx = data.dimension[dimName]?.category?.index || {};
    const arr: string[] = [];
    for (const [code, pos] of Object.entries(idx)) arr[pos as number] = code;
    return arr;
  });
  for (const [flatIdx, value] of Object.entries(data.value)) {
    let remaining = parseInt(flatIdx);
    const coords: string[] = new Array(dims.length);
    for (let d = dims.length - 1; d >= 0; d--) {
      coords[d] = dimCodes[d][remaining % sizes[d]];
      remaining = Math.floor(remaining / sizes[d]);
    }
    const geo = coords[dims.indexOf('geo')] || '';
    const siec = coords[dims.indexOf('siec')] || '';
    const time = coords[dims.indexOf('time')] || '';
    result.set(`${geo}|${siec}|${time}`, value);
  }
  return result;
}

function getTimePeriods(data: EurostatResponse): string[] {
  const idx = data.dimension?.time?.category?.index || {};
  return Object.keys(idx).sort();
}

export interface HistoryPoint {
  period: string;
  petrolDays: number | null;
  dieselDays: number | null;
  jetDays: number | null;
}

export interface CountryHistory {
  countryCode: string;
  countryName: string;
  data: HistoryPoint[];
}

export interface HistoryDataset {
  lastUpdated: string;
  periods: string[];
  countries: CountryHistory[];
  euAverage: HistoryPoint[];
}

async function main() {
  console.log('📈 EuroOilWatch — Building Historical Data');
  console.log('============================================\n');

  const geoCodes = EU27_CODES.map(c => COUNTRIES[c].eurostatCode);
  const fuelEntries = Object.entries(FUEL_SIEC_CODES) as [FuelType, string][];
  const siecCodes = fuelEntries.map(([, code]) => code);

  // Fetch 18 months of stocks
  console.log('📦 Fetching 18 months of stock data...');
  const stockData = await fetchEurostat('nrg_stk_oilm', {
    siec: siecCodes, geo: geoCodes, stk_flow: 'STK_CL', unit: 'THS_T', lastTimePeriod: '18',
  });
  const stockValues = parseValues(stockData);
  const periods = getTimePeriods(stockData);

  // Fetch consumption for days calculation
  console.log('📊 Fetching consumption data...');
  const consData = await fetchEurostat('nrg_cb_oilm', {
    siec: siecCodes, geo: geoCodes, nrg_bal: 'GID_OBS', unit: 'THS_T', lastTimePeriod: '18',
  });
  const consValues = parseValues(consData);

  console.log(`\n  Periods: ${periods.join(', ')}`);
  console.log(`  Building time series for ${EU27_CODES.length} countries...\n`);

  const countries: CountryHistory[] = [];

  // EU totals for averaging
  const euTotals: Record<string, { petrol: number[]; diesel: number[]; jet: number[] }> = {};
  for (const p of periods) {
    euTotals[p] = { petrol: [], diesel: [], jet: [] };
  }

  for (const countryCode of EU27_CODES) {
    const geo = COUNTRIES[countryCode].eurostatCode;
    const dataPoints: HistoryPoint[] = [];

    for (const period of periods) {
      const point: HistoryPoint = { period, petrolDays: null, dieselDays: null, jetDays: null };

      for (const [fuelType, siecCode] of fuelEntries) {
        const stock = stockValues.get(`${geo}|${siecCode}|${period}`);
        if (!stock || stock === 0) continue;

        // Find consumption — same period or nearby
        let cons = consValues.get(`${geo}|${siecCode}|${period}`);
        if (!cons || cons === 0) {
          // Try previous months
          const [y, m] = period.split('-').map(Number);
          for (let i = 1; i <= 3; i++) {
            let month = m - i, year = y;
            while (month <= 0) { month += 12; year--; }
            const prev = `${year}-${String(month).padStart(2, '0')}`;
            cons = consValues.get(`${geo}|${siecCode}|${prev}`);
            if (cons && cons > 0) break;
          }
        }

        let days: number | null = null;
        if (cons && cons > 0) {
          days = Math.round(((stock / cons) * 30) * 10) / 10;
          days = Math.max(0, Math.min(days, 365));
        }

        if (fuelType === 'petrol') {
          point.petrolDays = days;
          if (days !== null) euTotals[period].petrol.push(days);
        }
        if (fuelType === 'diesel') {
          point.dieselDays = days;
          if (days !== null) euTotals[period].diesel.push(days);
        }
        if (fuelType === 'jet_fuel') {
          point.jetDays = days;
          if (days !== null) euTotals[period].jet.push(days);
        }
      }

      dataPoints.push(point);
    }

    // Only include if we have at least some data
    const hasData = dataPoints.some(p => p.petrolDays !== null || p.dieselDays !== null);
    if (hasData) {
      countries.push({
        countryCode,
        countryName: COUNTRIES[countryCode].name,
        data: dataPoints,
      });
      const latest = dataPoints.filter(p => p.petrolDays || p.dieselDays).pop();
      if (latest) {
        console.log(`  ${COUNTRIES[countryCode].flag} ${COUNTRIES[countryCode].name}: ${dataPoints.filter(p => p.petrolDays !== null).length} months`);
      }
    }
  }

  // Calculate EU averages
  const euAverage: HistoryPoint[] = periods.map(period => {
    const t = euTotals[period];
    const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
    return {
      period,
      petrolDays: avg(t.petrol),
      dieselDays: avg(t.diesel),
      jetDays: avg(t.jet),
    };
  });

  const dataset: HistoryDataset = {
    lastUpdated: new Date().toISOString(),
    periods,
    countries,
    euAverage,
  };

  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));

  console.log(`\n✅ History: ${countries.length} countries, ${periods.length} months`);
  console.log(`📂 Output: ${OUTPUT_FILE}`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
