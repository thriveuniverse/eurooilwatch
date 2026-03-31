#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — API Validation Script
 * =====================================
 * RUN THIS FIRST to confirm all data sources are accessible.
 *
 * Usage: npx tsx scripts/test-eurostat-api.ts
 *
 * Tests:
 * 1. Eurostat Statistics API (oil stocks)
 * 2. Eurostat Statistics API (oil supply/consumption)
 * 3. EC Weekly Oil Bulletin (fuel prices)
 * 4. Free Brent crude price endpoint
 */

const TESTS = {
  // Monthly oil stock levels — the core dataset
  eurostatStocks: {
    name: 'Eurostat Oil Stocks (nrg_stk_oilm)',
    url: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_stk_oilm?format=JSON&lang=en&siec=O4652&geo=FR&geo=DE&sinceTimePeriod=2025-01&lastTimePeriod=3',
    expect: 'JSON with dimension/value structure',
  },

  // Monthly oil supply & transformation — needed to calculate consumption/day
  eurostatSupply: {
    name: 'Eurostat Oil Supply (nrg_cb_oilm)',
    url: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_cb_oilm?format=JSON&lang=en&siec=O4652&nrg_bal=GIC&geo=FR&sinceTimePeriod=2025-01&lastTimePeriod=3',
    expect: 'JSON with gross inland consumption data',
  },

  // Annual stock levels (fallback if monthly is sparse)
  eurostatStocksAnnual: {
    name: 'Eurostat Oil Stocks Annual (nrg_stk_oil)',
    url: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_stk_oil?format=JSON&lang=en&siec=O4652&geo=FR&geo=DE&sinceTimePeriod=2022',
    expect: 'JSON with annual stock data',
  },

  // EC Oil Bulletin — weekly fuel prices
  // This URL may need updating; the bulletin page links to downloadable data
  oilBulletin: {
    name: 'EC Weekly Oil Bulletin page',
    url: 'https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en',
    expect: 'HTML page with links to CSV/XLS data',
  },

  // Free Brent crude price (from exchangerate.host or similar)
  brentPrice: {
    name: 'Brent Crude (Yahoo Finance chart API)',
    url: 'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=5d',
    expect: 'JSON with Brent futures price',
  },
};

async function testEndpoint(key: string, test: typeof TESTS[keyof typeof TESTS]) {
  const divider = '─'.repeat(60);
  console.log(`\n${divider}`);
  console.log(`📡 Testing: ${test.name}`);
  console.log(`   URL: ${test.url.substring(0, 100)}...`);
  console.log(`   Expected: ${test.expect}`);

  try {
    const start = Date.now();
    const response = await fetch(test.url, {
      headers: { 'User-Agent': 'EuroOilWatch/0.1 (data-pipeline)' },
    });
    const elapsed = Date.now() - start;

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Time: ${elapsed}ms`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    const text = await response.text();
    console.log(`   Response size: ${(text.length / 1024).toFixed(1)} KB`);

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);

      // If it's a Eurostat response, show the structure
      if (json.dimension) {
        console.log(`   ✅ Valid Eurostat JSON response`);
        console.log(`   Dimensions: ${json.id?.join(', ')}`);
        console.log(`   Values count: ${Object.keys(json.value || {}).length}`);
        console.log(`   Updated: ${json.updated}`);

        // Show a sample of the data
        const geoLabels = json.dimension?.geo?.category?.label;
        if (geoLabels) {
          console.log(`   Countries: ${Object.values(geoLabels).join(', ')}`);
        }
        const timeLabels = json.dimension?.time?.category?.label;
        if (timeLabels) {
          const times = Object.keys(timeLabels);
          console.log(`   Time periods: ${times.join(', ')}`);
        }

        // Show first few values
        const values = json.value;
        if (values) {
          const entries = Object.entries(values).slice(0, 5);
          console.log(`   Sample values: ${entries.map(([k, v]) => `[${k}]=${v}`).join(', ')}`);
        }
      }
      // Yahoo Finance response
      else if (json.chart?.result) {
        const result = json.chart.result[0];
        const lastClose = result.indicators?.quote?.[0]?.close?.slice(-1)?.[0];
        console.log(`   ✅ Valid Yahoo Finance response`);
        console.log(`   Symbol: ${result.meta?.symbol}`);
        console.log(`   Currency: ${result.meta?.currency}`);
        console.log(`   Latest close: $${lastClose?.toFixed(2)}`);
      }
      else {
        console.log(`   ✅ Valid JSON response`);
        console.log(`   Top-level keys: ${Object.keys(json).slice(0, 10).join(', ')}`);
      }
    } catch {
      // Not JSON — probably HTML
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        console.log(`   ✅ HTML response (expected for bulletin page)`);
        // Look for data download links
        const csvLinks = text.match(/href="[^"]*\.csv[^"]*"/g);
        const xlsLinks = text.match(/href="[^"]*\.xls[^"]*"/g);
        if (csvLinks) console.log(`   CSV links found: ${csvLinks.length}`);
        if (xlsLinks) console.log(`   XLS links found: ${xlsLinks.length}`);
      } else {
        console.log(`   ⚠️  Response is neither JSON nor HTML`);
        console.log(`   First 200 chars: ${text.substring(0, 200)}`);
      }
    }

    return response.status === 200;
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message}`);
    if (error.cause) console.log(`   Cause: ${JSON.stringify(error.cause)}`);
    return false;
  }
}

async function main() {
  console.log('🔍 EuroOilWatch — Data Source Validation');
  console.log('========================================');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Node: ${process.version}`);

  const results: Record<string, boolean> = {};

  for (const [key, test] of Object.entries(TESTS)) {
    results[key] = await testEndpoint(key, test);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('═'.repeat(60));

  let allPassed = true;
  for (const [key, passed] of Object.entries(results)) {
    const icon = passed ? '✅' : '❌';
    const test = TESTS[key as keyof typeof TESTS];
    console.log(`${icon} ${test.name}`);
    if (!passed) allPassed = false;
  }

  console.log('');
  if (allPassed) {
    console.log('🎉 All data sources accessible! You can proceed with the build.');
  } else {
    console.log('⚠️  Some sources failed. Check the errors above.');
    console.log('   Common issues:');
    console.log('   - Eurostat API may be slow or rate-limited (retry)');
    console.log('   - EC Oil Bulletin might need a direct CSV URL');
    console.log('   - Yahoo Finance may need different headers');
    console.log('');
    console.log('   Even if some fail, you can still proceed with the ones that work.');
    console.log('   The fetcher scripts have fallbacks built in.');
  }
}

main().catch(console.error);
