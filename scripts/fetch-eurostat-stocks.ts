#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Eurostat Oil Stocks Fetcher (v3 — hybrid)
 * =========================================================
 * Monthly data (nrg_stk_oilm) for countries that have reported.
 * Annual data (nrg_stk_oil) as fallback for the rest.
 * All 27 EU countries should appear.
 *
 * Usage: npx tsx scripts/fetch-eurostat-stocks.ts
 * Output: data/stocks.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  EurostatResponse,
  FuelType,
  FuelStock,
  CountryStockData,
  StockDataset,
  ReserveStatus,
  ExtendedCountryCode,
  CountryCode,
} from '../lib/types';
import {
  COUNTRIES,
  EU27_CODES,
  FUEL_SIEC_CODES,
} from '../lib/countries';

const BASE_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'stocks.json');
const MANDATORY_MINIMUM_DAYS = 90;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchEurostat(dataset: string, params: Record<string, string | string[]>): Promise<EurostatResponse> {
  const url = new URL(`${BASE_URL}/${dataset}`);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('lang', 'en');
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, value);
    }
  }

  console.log(`  Fetching: ${dataset} ...`);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'EuroOilWatch/0.1' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json() as EurostatResponse;
      const valCount = Object.keys(data.value || {}).length;
      console.log(`  ✅ ${valCount} values, updated: ${data.updated}`);
      return data;
    } catch (err: any) {
      console.log(`  ⚠️ Attempt ${attempt}: ${err.message}`);
      if (attempt < 3) await sleep(5000);
      else throw err;
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

function getStatus(days: number): ReserveStatus {
  const ratio = days / MANDATORY_MINIMUM_DAYS;
  if (ratio >= 1.1) return 'safe';
  if (ratio >= 0.95) return 'watch';
  if (ratio >= 0.85) return 'warning';
  return 'critical';
}

function getPreviousMonths(period: string, count: number): string[] {
  const result: string[] = [];
  const [y, m] = period.split('-').map(Number);
  for (let i = 1; i <= count; i++) {
    let month = m - i;
    let year = y;
    while (month <= 0) { month += 12; year--; }
    result.push(`${year}-${String(month).padStart(2, '0')}`);
  }
  return result;
}

async function main() {
  console.log('🛢️  EuroOilWatch — Fetching Oil Stock Data (v3 hybrid)');
  console.log('=======================================================\n');

  const geoCodes = EU27_CODES.map(c => COUNTRIES[c].eurostatCode);
  const fuelEntries = Object.entries(FUEL_SIEC_CODES) as [FuelType, string][];
  const siecCodes = fuelEntries.map(([, code]) => code);

  // ═══════════════════════════════════════════════════════
  // STEP 1: Fetch monthly stocks (last 12 months)
  // ═══════════════════════════════════════════════════════
  console.log('📦 Step 1: Monthly stocks (nrg_stk_oilm)...');

  let monthlyStocks = new Map<string, number>();
  let monthlyConsumption = new Map<string, number>();
  let monthlyPeriod = '';

  try {
    const monthlyData = await fetchEurostat('nrg_stk_oilm', {
      siec: siecCodes,
      geo: geoCodes,
      stk_flow: 'STK_CL',
      unit: 'THS_T',
      lastTimePeriod: '12',
    });
    monthlyStocks = parseValues(monthlyData);
    const periods = getTimePeriods(monthlyData);

    // Find latest period with meaningful data
    for (let i = periods.length - 1; i >= 0; i--) {
      let count = 0;
      for (const geo of geoCodes) {
        if (monthlyStocks.has(`${geo}|O4652|${periods[i]}`)) count++;
      }
      if (count >= 3) { monthlyPeriod = periods[i]; break; }
    }
    if (!monthlyPeriod && periods.length > 0) monthlyPeriod = periods[periods.length - 1];
    console.log(`  Monthly period: ${monthlyPeriod} (${monthlyStocks.size} values)`);
  } catch (err: any) {
    console.log(`  ⚠️ Monthly stocks failed: ${err.message}`);
  }

  // Consumption for monthly
  try {
    const consData = await fetchEurostat('nrg_cb_oilm', {
      siec: siecCodes,
      geo: geoCodes,
      nrg_bal: 'GID_OBS',
      unit: 'THS_T',
      lastTimePeriod: '12',
    });
    monthlyConsumption = parseValues(consData);
    console.log(`  Monthly consumption: ${monthlyConsumption.size} values`);
  } catch (err: any) {
    console.log(`  ⚠️ Monthly consumption failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════
  // STEP 2: Fetch annual stocks (fallback)
  // ═══════════════════════════════════════════════════════
  console.log('\n📦 Step 2: Annual stocks fallback (nrg_stk_oil)...');

  let annualStocks = new Map<string, number>();
  let annualPeriod = '';

  try {
    const annualData = await fetchEurostat('nrg_stk_oil', {
      siec: siecCodes,
      geo: geoCodes,
      stk_flow: 'STKCL_NAT',
      lastTimePeriod: '3',
    });
    annualStocks = parseValues(annualData);
    const periods = getTimePeriods(annualData);
    annualPeriod = periods[periods.length - 1] || '';
    console.log(`  Annual period: ${annualPeriod} (${annualStocks.size} values)`);
  } catch (err: any) {
    console.log(`  ⚠️ Annual stocks failed: ${err.message}`);
  }

  // Annual consumption
  let annualConsumption = new Map<string, number>();
  try {
    const annConsData = await fetchEurostat('nrg_cb_oil', {
      siec: siecCodes,
      geo: geoCodes,
      nrg_bal: 'GID_OBS',
      lastTimePeriod: '3',
    });
    annualConsumption = parseValues(annConsData);
    console.log(`  Annual consumption: ${annualConsumption.size} values`);
  } catch (err: any) {
    console.log(`  ⚠️ Annual consumption failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════
  // STEP 3: Build country data — monthly first, annual fallback
  // ═══════════════════════════════════════════════════════
  console.log('\n🔧 Step 3: Building country datasets (hybrid)...\n');

  const countries: CountryStockData[] = [];
  let totals = { petrol: 0, diesel: 0, jet: 0 };
  let counts = { petrol: 0, diesel: 0, jet: 0 };
  let monthlyCount = 0;
  let annualCount = 0;

  for (const countryCode of EU27_CODES) {
    const country = COUNTRIES[countryCode];
    const geo = country.eurostatCode;
    const fuels: FuelStock[] = [];
    let usedMonthly = false;
    let usedAnnual = false;

    for (const [fuelType, siecCode] of fuelEntries) {
      let stockVal: number | undefined;
      let consumption = 0;
      let isMonthly = false;

      // ── Try monthly first ──
      if (monthlyPeriod) {
        stockVal = monthlyStocks.get(`${geo}|${siecCode}|${monthlyPeriod}`);
        if (stockVal !== undefined && stockVal > 0) {
          isMonthly = true;
          // Find consumption — try same period and previous months
          const tryPeriods = [monthlyPeriod, ...getPreviousMonths(monthlyPeriod, 3)];
          for (const p of tryPeriods) {
            const c = monthlyConsumption.get(`${geo}|${siecCode}|${p}`);
            if (c && c > 0) { consumption = c; break; }
          }
        }
      }

      // ── Fall back to annual if monthly missing ──
      if ((!stockVal || stockVal === 0) && annualPeriod) {
        stockVal = annualStocks.get(`${geo}|${siecCode}|${annualPeriod}`);
        if (stockVal !== undefined && stockVal > 0) {
          isMonthly = false;
          // Annual consumption
          const c = annualConsumption.get(`${geo}|${siecCode}|${annualPeriod}`);
          if (c && c > 0) consumption = c;
        }
      }

      if (!stockVal || stockVal === 0) continue;

      // ── Calculate days of supply ──
      let daysOfSupply: number;
      if (consumption > 0) {
        if (isMonthly) {
          daysOfSupply = (stockVal / consumption) * 30;
        } else {
          // Annual: stock is end-of-year snapshot, consumption is yearly total
          daysOfSupply = (stockVal / consumption) * 365;
        }
      } else {
        daysOfSupply = estimateDays(stockVal, fuelType, countryCode);
      }

      daysOfSupply = Math.max(0, Math.min(daysOfSupply, 365));
      daysOfSupply = Math.round(daysOfSupply * 10) / 10;

      const status = getStatus(daysOfSupply);
      fuels.push({
        fuelType,
        stockKilotonnes: stockVal,
        consumptionKilotonnes: consumption,
        daysOfSupply,
        mandatoryMinimumDays: MANDATORY_MINIMUM_DAYS,
        status,
      });

      if (isMonthly) usedMonthly = true; else usedAnnual = true;

      if (fuelType === 'petrol') { totals.petrol += daysOfSupply; counts.petrol++; }
      if (fuelType === 'diesel') { totals.diesel += daysOfSupply; counts.diesel++; }
      if (fuelType === 'jet_fuel') { totals.jet += daysOfSupply; counts.jet++; }
    }

    if (fuels.length > 0) {
      const avgDays = fuels.reduce((s, f) => s + f.daysOfSupply, 0) / fuels.length;
      const statusOrder: ReserveStatus[] = ['critical', 'warning', 'watch', 'safe'];
      const worstStatus = fuels.reduce<ReserveStatus>((worst, f) =>
        statusOrder.indexOf(f.status) < statusOrder.indexOf(worst) ? f.status : worst
      , 'safe');

      const dataPeriod = usedMonthly ? monthlyPeriod : `${annualPeriod} (annual)`;
      const source = usedMonthly && usedAnnual ? 'mixed' : usedMonthly ? 'monthly' : 'annual';
      const tag = source === 'monthly' ? '' : source === 'annual' ? ' ⏳' : ' ⚡';

      countries.push({
        countryCode,
        countryName: country.name,
        datePeriod: dataPeriod,
        fuels,
        averageDays: Math.round(avgDays * 10) / 10,
        overallStatus: worstStatus,
      });

      if (usedMonthly) monthlyCount++; else annualCount++;

      const icon = usedMonthly ? '📅' : '📆';
      console.log(
        `  ${country.flag} ${country.name}${tag} — ` +
        fuels.map(f => `${f.fuelType}: ${f.daysOfSupply}d [${f.status}]`).join(', ') +
        ` ${icon}`
      );
    } else {
      console.log(`  ${country.flag} ${country.name} — ❌ no data in either source`);
    }
  }

  // ── EU averages ──
  const euPetrol = counts.petrol > 0 ? totals.petrol / counts.petrol : 0;
  const euDiesel = counts.diesel > 0 ? totals.diesel / counts.diesel : 0;
  const euJet = counts.jet > 0 ? totals.jet / counts.jet : 0;
  const euOverall = [euPetrol, euDiesel, euJet].filter(d => d > 0);
  const euAvgDays = euOverall.length > 0 ? euOverall.reduce((a, b) => a + b) / euOverall.length : 0;

  const dataset: StockDataset = {
    lastUpdated: new Date().toISOString(),
    dataPeriod: monthlyPeriod || annualPeriod,
    dataSource: `Eurostat hybrid: ${monthlyCount} monthly (${monthlyPeriod}), ${annualCount} annual (${annualPeriod})`,
    countries: countries.sort((a, b) => a.averageDays - b.averageDays),
    euAverage: {
      petrolDays: Math.round(euPetrol * 10) / 10,
      dieselDays: Math.round(euDiesel * 10) / 10,
      jetFuelDays: Math.round(euJet * 10) / 10,
      overallStatus: getStatus(euAvgDays),
    },
  };

  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));

  console.log('\n' + '═'.repeat(55));
  console.log(`📊 Countries: ${countries.length}/27 (${monthlyCount} monthly + ${annualCount} annual)`);
  console.log(`📅 Monthly period: ${monthlyPeriod}`);
  console.log(`📆 Annual fallback: ${annualPeriod}`);
  console.log(`⛽ EU avg petrol: ${euPetrol.toFixed(1)}d`);
  console.log(`🛢  EU avg diesel: ${euDiesel.toFixed(1)}d`);
  console.log(`✈️  EU avg jet:    ${euJet.toFixed(1)}d`);
  console.log(`📂 Output: ${OUTPUT_FILE}`);
}

function estimateDays(stockKt: number, fuelType: FuelType, countryCode: string): number {
  const large = ['DE', 'FR', 'IT', 'ES', 'PL'];
  const medium = ['NL', 'BE', 'AT', 'SE', 'RO', 'CZ', 'GR', 'PT', 'HU', 'IE', 'DK', 'FI', 'BG'];
  const sizeMultiplier = large.includes(countryCode) ? 1.0 : medium.includes(countryCode) ? 0.3 : 0.1;

  const baseMonthly: Record<FuelType, number> = {
    petrol: 800 * sizeMultiplier,
    diesel: 1500 * sizeMultiplier,
    jet_fuel: 400 * sizeMultiplier,
  };

  const cons = baseMonthly[fuelType];
  if (cons <= 0) return 90;
  return (stockKt / cons) * 30;
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
