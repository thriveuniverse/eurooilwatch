#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — AI Analysis Generator
 * ======================================
 * Reads the latest stock + price data and generates a plain-English
 * fuel security analysis using Claude Sonnet.
 *
 * Usage: ANTHROPIC_API_KEY=sk-ant-xxx npx tsx scripts/generate-analysis.ts
 * Output: data/analysis.json
 *
 * Note: Requires ANTHROPIC_API_KEY environment variable.
 * In production, this runs as a Netlify scheduled function or GitHub Action.
 */

import * as fs from 'fs';
import * as path from 'path';
import { StockDataset, PriceDataset, BrentData, AIAnalysis, ReserveStatus } from '../lib/types';

// Load .env.local so the script works without manually exporting env vars
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'analysis.json');

function loadJSON<T>(filename: string): T | null {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠️ ${filename} not found`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function buildPrompt(
  stocks: StockDataset | null,
  prices: PriceDataset | null,
  brent: BrentData | null
): string {
  let dataContext = '';

  if (stocks) {
    dataContext += `\n## Oil Stock Levels (${stocks.dataPeriod})\n`;
    dataContext += `EU Average: Petrol ${stocks.euAverage.petrolDays} days, `;
    dataContext += `Diesel ${stocks.euAverage.dieselDays} days, `;
    dataContext += `Jet fuel ${stocks.euAverage.jetFuelDays} days\n`;
    dataContext += `Overall status: ${stocks.euAverage.overallStatus}\n`;
    dataContext += `Mandatory minimum: 90 days of net imports\n`;
    dataContext += `Total countries in dataset: ${stocks.countries.length}\n\n`;
    dataContext += `Countries (all ${stocks.countries.length}, sorted by lowest reserves first):\n`;
    for (const c of stocks.countries) {
      const fuels = c.fuels.map(f => `${f.fuelType}: ${f.daysOfSupply}d [${f.status}]`).join(', ');
      dataContext += `- ${c.countryName}: ${fuels}\n`;
    }
  }

  if (prices) {
    dataContext += `\n## Fuel Prices (${prices.bulletinDate})\n`;
    dataContext += `EU Average: Petrol €${prices.euAverage.petrolPrice}/L, `;
    dataContext += `Diesel €${prices.euAverage.dieselPrice}/L\n`;
    const mostExpensive = [...prices.countries]
      .sort((a, b) => (b.petrolPrice || 0) - (a.petrolPrice || 0))
      .slice(0, 5);
    const cheapest = [...prices.countries]
      .sort((a, b) => (a.petrolPrice || 0) - (b.petrolPrice || 0))
      .slice(0, 5);
    dataContext += `Most expensive (petrol): ${mostExpensive.map(c => `${c.countryName} €${c.petrolPrice}`).join(', ')}\n`;
    dataContext += `Cheapest (petrol): ${cheapest.map(c => `${c.countryName} €${c.petrolPrice}`).join(', ')}\n`;
  }

  if (brent) {
    dataContext += `\n## Brent Crude Oil\n`;
    dataContext += `Price: $${brent.priceUsd}/barrel (€${brent.priceEur})\n`;
    dataContext += `Change: ${brent.changeUsd >= 0 ? '+' : ''}$${brent.changeUsd} (${brent.changePct}%)\n`;
  }

  return dataContext;
}

async function generateAnalysis(
  stocks: StockDataset | null,
  prices: PriceDataset | null,
  brent: BrentData | null
): Promise<AIAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('  ⚠️ No ANTHROPIC_API_KEY — generating placeholder analysis');
    return {
      generatedAt: new Date().toISOString(),
      statusLine: 'EU fuel reserves data loading — analysis pending',
      overallStatus: 'watch',
      fullAnalysis: 'Analysis will be generated once the ANTHROPIC_API_KEY environment variable is set. The data pipeline is working and collecting information from Eurostat and the EC Oil Bulletin.',
      keyPoints: [
        'Data pipeline active — stocks and prices being collected',
        'AI analysis requires ANTHROPIC_API_KEY to generate',
        'Set the env var and re-run: ANTHROPIC_API_KEY=sk-ant-xxx npm run analyze',
      ],
      dataPeriod: stocks?.dataPeriod || 'pending',
      model: 'placeholder',
    };
  }

  const dataContext = buildPrompt(stocks, prices, brent);

  const systemPrompt = `You are a senior energy analyst writing for EuroOilWatch, a European fuel security transparency dashboard. Your audience includes policymakers, journalists, and concerned citizens.

Write a clear, factual analysis based on the data provided. Be specific — cite numbers. Do not speculate beyond what the data shows, but do highlight risks and notable trends.

Use measured language. Prefer 'under strain', 'under pressure', 'tight' over 'critical' as headline framing. Only use 'critical' for individual country-level status, not headline summaries. Frame country counts as 'X of Y countries' not just 'X countries'.

Your output must be valid JSON with this exact structure:
{
  "statusLine": "One sentence: the overall EU fuel security status right now",
  "overallStatus": "safe|watch|warning|critical",
  "fullAnalysis": "2-4 paragraphs of analysis. Use plain English. Separate paragraphs with \\n\\n.",
  "keyPoints": ["3-5 bullet points highlighting the most important findings"]
}

Do NOT include any text outside the JSON. No markdown backticks. Just the JSON object.`;

  const userPrompt = `Here is the latest European fuel data. Write your analysis.

${dataContext}

Important context:
- EU countries must maintain 90 days of net imports as emergency oil stocks
- Several EU countries have recently released strategic reserves due to Middle East supply disruptions
- Brent crude has risen ~27% since the start of the current Middle East conflict
- Date: ${new Date().toISOString().split('T')[0]}`;

  console.log('  Calling Claude API...');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        { role: 'user', content: userPrompt },
      ],
      system: systemPrompt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text || '';
  console.log(`  ✅ Got analysis (${text.length} chars)`);

  // Parse the JSON response
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    generatedAt: new Date().toISOString(),
    statusLine: parsed.statusLine,
    overallStatus: parsed.overallStatus as ReserveStatus,
    fullAnalysis: parsed.fullAnalysis,
    keyPoints: parsed.keyPoints,
    dataPeriod: stocks?.dataPeriod || 'unknown',
    model: 'claude-sonnet-4-20250514',
  };
}

function validateAnalysis(analysis: AIAnalysis, stocks: StockDataset | null): string[] {
  if (!stocks) return [];
  const warnings: string[] = [];
  const expectedTotal = stocks.countries.length;
  const allText = [analysis.statusLine, analysis.fullAnalysis, ...analysis.keyPoints].join(' ');
  // Find all "X of Y" patterns and check the Y value matches actual country count
  const ofPattern = /\bof\s+(\d+)\s+(?:EU\s+)?countr/gi;
  let match: RegExpExecArray | null;
  while ((match = ofPattern.exec(allText)) !== null) {
    const cited = parseInt(match[1], 10);
    if (cited !== expectedTotal) {
      warnings.push(`Analysis says "of ${cited} countries" but dataset has ${expectedTotal}`);
    }
  }
  return warnings;
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log('🤖 EuroOilWatch — Generating AI Analysis');
  console.log('=========================================');

  const stocks = loadJSON<StockDataset>('stocks.json');
  const prices = loadJSON<PriceDataset>('prices.json');
  const brent = loadJSON<BrentData>('brent.json');

  if (!stocks && !prices && !brent) {
    console.log('\n⚠️  No data files found. Run the fetchers first:');
    console.log('   npm run fetch:all');
    process.exit(1);
  }

  const analysis = await generateAnalysis(stocks, prices, brent);

  const warnings = validateAnalysis(analysis, stocks);
  if (warnings.length > 0) {
    console.warn('\n⚠️  Validation warnings — review before publishing:');
    warnings.forEach(w => console.warn(`   - ${w}`));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(analysis, null, 2));

  console.log(`\n✅ Analysis written to ${OUTPUT_FILE}`);
  console.log(`   Status: ${analysis.statusLine}`);
  console.log(`   Rating: ${analysis.overallStatus}`);
  console.log(`   Key points: ${analysis.keyPoints.length}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
