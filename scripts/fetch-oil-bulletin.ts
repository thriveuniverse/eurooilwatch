#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Fuel Price Fetcher (v5 — working XLSX parser)
 * ==============================================================
 * Now we know the exact XLSX format:
 *   Sheet: "Sheet1"
 *   Row 0: ["in EUR", "Euro-super 95 (I)", "Gas oil automobile A", ...]
 *   Row 1: ["46104", "1000 l", "1000 l", ...] (units row)
 *   Row 2+: ["Austria", "1841", "2109", ...] (EUR per 1000 litres)
 *
 * Column 1 = Petrol (Euro-super 95), Column 2 = Diesel (Gas oil automobile)
 *
 * Usage: npx tsx scripts/fetch-oil-bulletin.ts
 * Output: data/prices.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CountryPriceData, PriceDataset, CountryCode } from '../lib/types';
import { COUNTRIES, EU27_CODES } from '../lib/countries';

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'prices.json');

const PRICES_WITH_TAXES_URL =
  'https://energy.ec.europa.eu/document/download/264c2d0f-f161-4ea3-a777-78faae59bea0_en?filename=Weekly%20Oil%20Bulletin%20Weekly%20prices%20with%20Taxes%20-%202024-02-19.xlsx';

const NAME_MAP: Record<string, CountryCode> = {
  'Austria': 'AT', 'Belgium': 'BE', 'Bulgaria': 'BG', 'Croatia': 'HR',
  'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'Denmark': 'DK', 'Estonia': 'EE', 'Finland': 'FI', 'France': 'FR',
  'Germany': 'DE', 'Greece': 'GR', 'Hungary': 'HU', 'Ireland': 'IE',
  'Italy': 'IT', 'Latvia': 'LV', 'Lithuania': 'LT', 'Luxembourg': 'LU',
  'Malta': 'MT', 'Netherlands': 'NL', 'Poland': 'PL', 'Portugal': 'PT',
  'Romania': 'RO', 'Slovakia': 'SK', 'Slovenia': 'SI', 'Spain': 'ES',
  'Sweden': 'SE',
};

async function ensureXlsx(): Promise<any> {
  try {
    return await import('xlsx');
  } catch {
    console.log('  Installing xlsx package...');
    const { execSync } = await import('child_process');
    execSync('npm install xlsx --no-save', { stdio: 'inherit' });
    return await import('xlsx');
  }
}

async function fetchLivePrices(): Promise<PriceDataset | null> {
  console.log('📰 Downloading EC Oil Bulletin (prices with taxes)...');

  const XLSX = await ensureXlsx();

  try {
    const res = await fetch(PRICES_WITH_TAXES_URL, {
      headers: { 'User-Agent': 'EuroOilWatch/0.1' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`  ✅ Downloaded ${(buf.length / 1024).toFixed(1)} KB`);

    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`  Rows: ${rows.length}`);

    // Row 0 = headers, Row 1 = units, Row 2+ = data
    // Column 1 = Euro-super 95 (petrol) in EUR/1000L
    // Column 2 = Gas oil automobile (diesel) in EUR/1000L

    // Try to extract date from row 1, col 0 (Excel serial number)
    let bulletinDate = new Date().toISOString().split('T')[0];
    const dateCell = rows[1]?.[0];
    if (typeof dateCell === 'number' && dateCell > 40000 && dateCell < 50000) {
      // Excel date serial → JS date
      const excelEpoch = new Date(1899, 11, 30);
      const jsDate = new Date(excelEpoch.getTime() + dateCell * 86400000);
      bulletinDate = jsDate.toISOString().split('T')[0];
      console.log(`  Bulletin date: ${bulletinDate} (from Excel serial ${dateCell})`);
    }

    const petrolPrices = new Map<CountryCode, number>();
    const dieselPrices = new Map<CountryCode, number>();

    // Parse country rows (start from row 2)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const name = String(row[0] || '').trim();
      const code = NAME_MAP[name];
      if (!code) continue;

      // Column 1 = petrol (EUR/1000L)
      const petrolRaw = parseFloat(row[1]);
      if (!isNaN(petrolRaw) && petrolRaw > 0) {
        const petrol = petrolRaw / 1000; // Convert to EUR/litre
        petrolPrices.set(code, Math.round(petrol * 1000) / 1000);
      }

      // Column 2 = diesel (EUR/1000L)
      const dieselRaw = parseFloat(row[2]);
      if (!isNaN(dieselRaw) && dieselRaw > 0) {
        const diesel = dieselRaw / 1000; // Convert to EUR/litre
        dieselPrices.set(code, Math.round(diesel * 1000) / 1000);
      }

      console.log(`  ${name}: petrol €${(petrolRaw/1000).toFixed(3)}/L, diesel €${(dieselRaw/1000).toFixed(3)}/L`);
    }

    if (petrolPrices.size < 10) {
      console.log(`\n  ⚠️ Only ${petrolPrices.size} countries found — too few, using seed`);
      return null;
    }

    // Build output
    const countries: CountryPriceData[] = EU27_CODES.map(code => ({
      countryCode: code,
      countryName: COUNTRIES[code].name,
      petrolPrice: petrolPrices.get(code) ?? null,
      dieselPrice: dieselPrices.get(code) ?? null,
      petrolChangePct: null,
      dieselChangePct: null,
    }));

    const withP = countries.filter(c => c.petrolPrice != null);
    const withD = countries.filter(c => c.dieselPrice != null);
    const avgP = withP.reduce((s, c) => s + c.petrolPrice!, 0) / withP.length;
    const avgD = withD.reduce((s, c) => s + c.dieselPrice!, 0) / withD.length;

    console.log(`\n  📊 Live data: ${withP.length} petrol, ${withD.length} diesel`);
    console.log(`  EU avg petrol: €${avgP.toFixed(3)}/L`);
    console.log(`  EU avg diesel: €${avgD.toFixed(3)}/L`);

    return {
      lastUpdated: new Date().toISOString(),
      bulletinDate,
      dataSource: `EC Weekly Oil Bulletin (${bulletinDate})`,
      countries,
      euAverage: {
        petrolPrice: Math.round(avgP * 1000) / 1000,
        dieselPrice: Math.round(avgD * 1000) / 1000,
      },
    };
  } catch (err: any) {
    console.log(`  ❌ XLSX parsing failed: ${err.message}`);
    return null;
  }
}

function seedPrices(): PriceDataset {
  console.log('🌱 Using March 2026 seed data as fallback...');
  const seed: Record<CountryCode, [number, number]> = {
    AT: [1.742, 1.907], BE: [1.858, 1.982], BG: [1.331, 1.437], HR: [1.538, 1.623],
    CY: [1.424, 1.589], CZ: [1.579, 1.818], DK: [2.062, 2.208], EE: [1.612, 1.856],
    FI: [1.958, 2.108], FR: [1.819, 1.963], DE: [1.882, 2.146], GR: [1.770, 1.831],
    HU: [1.513, 1.632], IE: [1.756, 1.980], IT: [1.819, 2.033], LV: [1.588, 1.782],
    LT: [1.543, 1.729], LU: [1.572, 1.686], MT: [1.340, 1.210], NL: [2.347, 2.475],
    PL: [1.532, 1.714], PT: [1.769, 1.875], RO: [1.492, 1.648], SK: [1.524, 1.528],
    SI: [1.443, 1.484], ES: [1.628, 1.832], SE: [1.961, 2.162],
  };
  const countries: CountryPriceData[] = EU27_CODES.map(code => ({
    countryCode: code, countryName: COUNTRIES[code].name,
    petrolPrice: seed[code]?.[0] ?? null, dieselPrice: seed[code]?.[1] ?? null,
    petrolChangePct: null, dieselChangePct: null,
  }));
  const avgP = countries.reduce((s, c) => s + (c.petrolPrice || 0), 0) / countries.length;
  const avgD = countries.reduce((s, c) => s + (c.dieselPrice || 0), 0) / countries.length;
  return {
    lastUpdated: new Date().toISOString(), bulletinDate: '2026-03-23',
    dataSource: 'EC Weekly Oil Bulletin (seed — 23 Mar 2026)',
    countries,
    euAverage: { petrolPrice: Math.round(avgP * 1000) / 1000, dieselPrice: Math.round(avgD * 1000) / 1000 },
  };
}

async function main() {
  console.log('⛽ EuroOilWatch — Fetching Fuel Prices (v5 — live XLSX)');
  console.log('========================================================\n');

  let dataset = await fetchLivePrices();

  if (dataset) {
    const avg = dataset.euAverage.petrolPrice;
    if (avg < 0.8 || avg > 3.5) {
      console.log(`\n  ⚠️ EU avg €${avg} out of range — using seed`);
      dataset = null;
    }
  }

  if (!dataset) dataset = seedPrices();

  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));

  console.log(`\n✅ Output: ${OUTPUT_FILE}`);
  console.log(`   Countries: ${dataset.countries.length}`);
  console.log(`   EU avg petrol: €${dataset.euAverage.petrolPrice}/L`);
  console.log(`   EU avg diesel: €${dataset.euAverage.dieselPrice}/L`);
  console.log(`   Source: ${dataset.dataSource}`);
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
