#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Eurostat Oil Stocks Fetcher (v4 — per-country latest)
 * =====================================================================
 * Key fix: finds the latest available month PER COUNTRY, not one global month.
 * France may have Dec 2025 even if Jan 2026 isn't submitted yet.
 * This eliminates most 2024 annual fallbacks.
 *
 * Usage: npx tsx scripts/fetch-eurostat-stocks.ts
 * Output: data/stocks.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  EurostatResponse, FuelType, FuelStock, CountryStockData,
  StockDataset, ReserveStatus, ExtendedCountryCode, CountryCode,
} from '../lib/types';
import { COUNTRIES, EU27_CODES, FUEL_SIEC_CODES } from '../lib/countries';

const BASE_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'stocks.json');
const MANDATORY_MINIMUM_DAYS = 90;

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
      console.log(`  ✅ ${Object.keys(data.value || {}).length} values, updated: ${data.updated}`);
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

function getStatus(days: number): ReserveStatus {
  const ratio = days / MANDATORY_MINIMUM_DAYS;
  if (ratio >= 1.1) return 'safe';
  if (ratio >= 0.95) return 'watch';
  if (ratio >= 0.85) return 'warning';
  return 'critical';
}

/**
 * Find the latest month that has data for a given country + fuel.
 * Scans backwards from the most recent period.
 */
function findLatestValue(
  values: Map<string, number>,
  geo: string,
  siec: string,
  periods: string[]
): { value: number; period: string } | null {
  for (let i = periods.length - 1; i >= 0; i--) {
    const val = values.get(`${geo}|${siec}|${periods[i]}`);
    if (val !== undefined && val > 0) {
      return { value: val, period: periods[i] };
    }
  }
  return null;
}

async function main() {
  console.log('🛢️  EuroOilWatch — Fetching Oil Stock Data (v4 per-country)');
  console.log('=============================================================\n');

  const geoCodes = EU27_CODES.map(c => COUNTRIES[c].eurostatCode);
  const fuelEntries = Object.entries(FUEL_SIEC_CODES) as [FuelType, string][];
  const siecCodes = fuelEntries.map(([, code]) => code);

  // ── Step 1: Monthly stocks (last 18 months for wider coverage) ──
  console.log('📦 Step 1: Monthly stocks (nrg_stk_oilm, last 18 months)...');
  let monthlyStocks = new Map<string, number>();
  let monthlyPeriods: string[] = [];
  try {
    const data = await fetchEurostat('nrg_stk_oilm', {
      siec: siecCodes, geo: geoCodes, stk_flow: 'STK_CL', unit: 'THS_T', lastTimePeriod: '18',
    });
    monthlyStocks = parseValues(data);
    monthlyPeriods = getTimePeriods(data);
    console.log(`  Periods available: ${monthlyPeriods.join(', ')}`);
  } catch (err: any) {
    console.log(`  ⚠️ Monthly stocks failed: ${err.message}`);
  }

  // Monthly consumption
  let monthlyConsumption = new Map<string, number>();
  let consumptionPeriods: string[] = [];
  try {
    const data = await fetchEurostat('nrg_cb_oilm', {
      siec: siecCodes, geo: geoCodes, nrg_bal: 'GID_OBS', unit: 'THS_T', lastTimePeriod: '18',
    });
    monthlyConsumption = parseValues(data);
    consumptionPeriods = getTimePeriods(data);
    console.log(`  Consumption periods: ${consumptionPeriods.join(', ')}`);
  } catch (err: any) {
    console.log(`  ⚠️ Monthly consumption failed: ${err.message}`);
  }

  // ── Step 2: Annual stocks (fallback for truly missing countries) ──
  console.log('\n📦 Step 2: Annual stocks fallback (nrg_stk_oil)...');
  let annualStocks = new Map<string, number>();
  let annualPeriod = '';
  try {
    const data = await fetchEurostat('nrg_stk_oil', {
      siec: siecCodes, geo: geoCodes, stk_flow: 'STKCL_NAT', lastTimePeriod: '3',
    });
    annualStocks = parseValues(data);
    const periods = getTimePeriods(data);
    annualPeriod = periods[periods.length - 1] || '';
    console.log(`  Annual period: ${annualPeriod} (${annualStocks.size} values)`);
  } catch (err: any) {
    console.log(`  ⚠️ Annual stocks failed: ${err.message}`);
  }

  let annualConsumption = new Map<string, number>();
  try {
    const data = await fetchEurostat('nrg_cb_oil', {
      siec: siecCodes, geo: geoCodes, nrg_bal: 'GID_OBS', lastTimePeriod: '3',
    });
    annualConsumption = parseValues(data);
    console.log(`  Annual consumption: ${annualConsumption.size} values`);
  } catch (err: any) {
    console.log(`  ⚠️ Annual consumption failed: ${err.message}`);
  }

  // ── Step 3: Build per-country data with latest available month ──
  console.log('\n🔧 Step 3: Building country datasets (per-country latest)...\n');

  const countries: CountryStockData[] = [];
  let totals = { petrol: 0, diesel: 0, jet: 0 };
  let counts = { petrol: 0, diesel: 0, jet: 0 };
  let sourceStats = { monthly: 0, annual: 0 };

  for (const countryCode of EU27_CODES) {
    const country = COUNTRIES[countryCode];
    const geo = country.eurostatCode;
    const fuels: FuelStock[] = [];
    let latestPeriodUsed = '';
    let usedMonthly = false;
    let usedAnnual = false;

    for (const [fuelType, siecCode] of fuelEntries) {
      let stockVal: number | undefined;
      let consumption = 0;
      let isMonthly = false;
      let periodUsed = '';

      // ── Try monthly: find latest available month for THIS country ──
      if (monthlyPeriods.length > 0) {
        const found = findLatestValue(monthlyStocks, geo, siecCode, monthlyPeriods);
        if (found) {
          stockVal = found.value;
          periodUsed = found.period;
          isMonthly = true;

          // Find consumption for same or nearby period
          const consPeriods = [found.period, ...getPreviousMonths(found.period, 3)];
          for (const p of consPeriods) {
            const c = monthlyConsumption.get(`${geo}|${siecCode}|${p}`);
            if (c && c > 0) { consumption = c; break; }
          }
        }
      }

      // ── Fall back to annual only if no monthly at all ──
      if ((!stockVal || stockVal === 0) && annualPeriod) {
        stockVal = annualStocks.get(`${geo}|${siecCode}|${annualPeriod}`);
        if (stockVal && stockVal > 0) {
          isMonthly = false;
          periodUsed = annualPeriod;
          const c = annualConsumption.get(`${geo}|${siecCode}|${annualPeriod}`);
          if (c && c > 0) consumption = c;
        }
      }

      if (!stockVal || stockVal === 0) continue;

      // Calculate days of supply
      let daysOfSupply: number;
      if (consumption > 0) {
        daysOfSupply = isMonthly
          ? (stockVal / consumption) * 30
          : (stockVal / consumption) * 365;
      } else {
        daysOfSupply = estimateDays(stockVal, fuelType, countryCode);
      }

      daysOfSupply = Math.max(0, Math.min(daysOfSupply, 365));
      daysOfSupply = Math.round(daysOfSupply * 10) / 10;

      fuels.push({
        fuelType,
        stockKilotonnes: stockVal,
        consumptionKilotonnes: consumption,
        daysOfSupply,
        mandatoryMinimumDays: MANDATORY_MINIMUM_DAYS,
        status: getStatus(daysOfSupply),
      });

      if (isMonthly) usedMonthly = true; else usedAnnual = true;
      if (!latestPeriodUsed || periodUsed > latestPeriodUsed) latestPeriodUsed = periodUsed;

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

      const dataPeriod = usedAnnual && !usedMonthly
        ? `${latestPeriodUsed} (annual)`
        : latestPeriodUsed;

      countries.push({
        countryCode, countryName: country.name, datePeriod: dataPeriod,
        fuels, averageDays: Math.round(avgDays * 10) / 10, overallStatus: worstStatus,
      });

      if (usedMonthly) sourceStats.monthly++; else sourceStats.annual++;

      const icon = usedAnnual && !usedMonthly ? '📆' : '📅';
      const tag = usedAnnual && !usedMonthly ? ' ⏳' : '';
      console.log(
        `  ${country.flag} ${country.name}${tag} [${dataPeriod}] — ` +
        fuels.map(f => `${f.fuelType}: ${f.daysOfSupply}d`).join(', ') +
        ` ${icon}`
      );
    } else {
      console.log(`  ${country.flag} ${country.name} — ❌ no data`);
    }
  }

  // EU averages
  const euPetrol = counts.petrol > 0 ? totals.petrol / counts.petrol : 0;
  const euDiesel = counts.diesel > 0 ? totals.diesel / counts.diesel : 0;
  const euJet = counts.jet > 0 ? totals.jet / counts.jet : 0;
  const euOverall = [euPetrol, euDiesel, euJet].filter(d => d > 0);
  const euAvgDays = euOverall.length > 0 ? euOverall.reduce((a, b) => a + b) / euOverall.length : 0;

  const dataset: StockDataset = {
    lastUpdated: new Date().toISOString(),
    dataPeriod: monthlyPeriods[monthlyPeriods.length - 1] || annualPeriod,
    dataSource: `Eurostat: ${sourceStats.monthly} monthly, ${sourceStats.annual} annual fallback`,
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

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Countries: ${countries.length}/27 (${sourceStats.monthly} monthly + ${sourceStats.annual} annual)`);
  console.log(`⛽ EU avg petrol: ${euPetrol.toFixed(1)}d`);
  console.log(`🛢  EU avg diesel: ${euDiesel.toFixed(1)}d`);
  console.log(`✈️  EU avg jet:    ${euJet.toFixed(1)}d`);
  console.log(`📂 Output: ${OUTPUT_FILE}`);
}

function getPreviousMonths(period: string, count: number): string[] {
  const result: string[] = [];
  const [y, m] = period.split('-').map(Number);
  for (let i = 1; i <= count; i++) {
    let month = m - i, year = y;
    while (month <= 0) { month += 12; year--; }
    result.push(`${year}-${String(month).padStart(2, '0')}`);
  }
  return result;
}

function estimateDays(stockKt: number, fuelType: FuelType, countryCode: string): number {
  const large = ['DE', 'FR', 'IT', 'ES', 'PL'];
  const medium = ['NL', 'BE', 'AT', 'SE', 'RO', 'CZ', 'GR', 'PT', 'HU', 'IE', 'DK', 'FI', 'BG'];
  const mult = large.includes(countryCode) ? 1.0 : medium.includes(countryCode) ? 0.3 : 0.1;
  const base: Record<FuelType, number> = { petrol: 800 * mult, diesel: 1500 * mult, jet_fuel: 400 * mult };
  return base[fuelType] > 0 ? (stockKt / base[fuelType]) * 30 : 90;
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
