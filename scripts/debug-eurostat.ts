#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Eurostat API Diagnostic
 * ========================================
 * The monthly datasets returned 400. This script tests different
 * parameter combinations to find what works.
 *
 * Usage: npx tsx scripts/debug-eurostat.ts
 */

const BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

async function tryQuery(label: string, dataset: string, params: Record<string, string>) {
  const url = new URL(`${BASE}/${dataset}`);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('lang', 'en');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'EuroOilWatch/0.1' },
    });
    const text = await res.text();
    const size = text.length;

    if (res.ok) {
      const json = JSON.parse(text);
      const dims = json.id?.join(', ') || 'none';
      const vals = Object.keys(json.value || {}).length;
      const times = json.dimension?.time?.category?.label
        ? Object.keys(json.dimension.time.category.label).join(', ')
        : 'none';
      console.log(`✅ ${label}`);
      console.log(`   Dims: ${dims}`);
      console.log(`   Values: ${vals}, Times: ${times}`);
      // Show available SIEC codes if present
      const siecLabels = json.dimension?.siec?.category?.label;
      if (siecLabels) {
        console.log(`   SIEC codes available:`);
        for (const [code, lbl] of Object.entries(siecLabels)) {
          console.log(`     ${code} = ${lbl}`);
        }
      }
      // Show available stk_flow or nrg_bal codes
      const stkLabels = json.dimension?.stk_flow?.category?.label;
      if (stkLabels) {
        console.log(`   stk_flow codes:`);
        for (const [code, lbl] of Object.entries(stkLabels)) {
          console.log(`     ${code} = ${lbl}`);
        }
      }
      const nrgLabels = json.dimension?.nrg_bal?.category?.label;
      if (nrgLabels) {
        console.log(`   nrg_bal codes:`);
        for (const [code, lbl] of Object.entries(nrgLabels)) {
          console.log(`     ${code} = ${lbl}`);
        }
      }
      const geoLabels = json.dimension?.geo?.category?.label;
      if (geoLabels) {
        console.log(`   Countries: ${Object.values(geoLabels).join(', ')}`);
      }
    } else {
      const json = JSON.parse(text);
      console.log(`❌ ${label} — ${res.status}`);
      console.log(`   Error: ${JSON.stringify(json.error || json)}`);
    }
  } catch (err: any) {
    console.log(`❌ ${label} — ${err.message}`);
  }
  console.log('');
}

async function main() {
  console.log('🔧 Eurostat API Parameter Diagnostic');
  console.log('=====================================\n');

  // ── Test 1: Monthly stocks - minimal query (just one country, no SIEC filter)
  await tryQuery(
    'Monthly stocks — minimal (FR only, no filters)',
    'nrg_stk_oilm',
    { geo: 'FR', lastTimePeriod: '1' }
  );

  // ── Test 2: Monthly stocks - with unit
  await tryQuery(
    'Monthly stocks — with unit THS_T',
    'nrg_stk_oilm',
    { geo: 'FR', unit: 'THS_T', lastTimePeriod: '1' }
  );

  // ── Test 3: Annual stocks — explore what SIEC codes exist
  await tryQuery(
    'Annual stocks — all SIEC for FR (last year)',
    'nrg_stk_oil',
    { geo: 'FR', lastTimePeriod: '1' }
  );

  // ── Test 4: Monthly supply — minimal
  await tryQuery(
    'Monthly supply — minimal (FR only)',
    'nrg_cb_oilm',
    { geo: 'FR', lastTimePeriod: '1' }
  );

  // ── Test 5: Monthly supply — with nrg_bal as IC_OBS (inland consumption observed)
  await tryQuery(
    'Monthly supply — nrg_bal=IC_OBS, FR',
    'nrg_cb_oilm',
    { geo: 'FR', nrg_bal: 'IC_OBS', lastTimePeriod: '1' }
  );

  // ── Test 6: Try the emergency stocks dataset
  await tryQuery(
    'Emergency oil stocks (nrg_stk_oiles)',
    'nrg_stk_oiles',
    { geo: 'FR', lastTimePeriod: '1' }
  );

  // ── Test 7: Oil Bulletin prices dataset
  await tryQuery(
    'Oil product prices (nrg_pc_204)',
    'nrg_pc_204',
    { geo: 'FR', lastTimePeriod: '1' }
  );

  // ── Test 8: Consumer oil prices weekly
  await tryQuery(
    'Oil product prices half-yearly (nrg_pc_204_h)',
    'nrg_pc_204_h',
    { geo: 'FR', lastTimePeriod: '1' }
  );

  // ── Now let's grab the Oil Bulletin XLS links
  console.log('═══════════════════════════════════════');
  console.log('📰 EC Oil Bulletin — Finding data files');
  console.log('═══════════════════════════════════════\n');

  try {
    const res = await fetch(
      'https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en',
      { headers: { 'User-Agent': 'EuroOilWatch/0.1' } }
    );
    const html = await res.text();

    // Find all href links to data files
    const linkRegex = /href="([^"]*\.(csv|xls|xlsx)[^"]*)"/gi;
    let match;
    const links: string[] = [];
    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1]);
    }

    if (links.length > 0) {
      console.log(`Found ${links.length} data file links:\n`);
      links.forEach((link, i) => {
        const fullUrl = link.startsWith('http') ? link : `https://energy.ec.europa.eu${link}`;
        console.log(`  [${i + 1}] ${fullUrl}`);
      });

      // Try downloading the first one to see the format
      console.log('\n📥 Testing first data file...');
      const firstUrl = links[0].startsWith('http')
        ? links[0]
        : `https://energy.ec.europa.eu${links[0]}`;
      const dataRes = await fetch(firstUrl, {
        headers: { 'User-Agent': 'EuroOilWatch/0.1' },
      });
      console.log(`  Status: ${dataRes.status}`);
      console.log(`  Content-Type: ${dataRes.headers.get('content-type')}`);
      console.log(`  Content-Length: ${dataRes.headers.get('content-length')} bytes`);
    } else {
      console.log('No CSV/XLS links found on the page');
      // Look for any download-related links
      const downloadLinks = html.match(/href="[^"]*download[^"]*"/gi);
      if (downloadLinks) {
        console.log('Download links found:');
        downloadLinks.forEach(l => console.log(`  ${l}`));
      }
    }
  } catch (err: any) {
    console.log(`❌ Oil Bulletin fetch failed: ${err.message}`);
  }
}

main().catch(console.error);
