#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Weekly Briefing Draft Generator
 * ================================================
 * Fetches live signal feeds + current data files, calls Claude to draft
 * a weekly briefing, and writes it to newsletters/outbox/ for review.
 *
 * Usage:
 *   npm run draft:newsletter
 *
 * Output:
 *   newsletters/outbox/YYYY-MM-DD-weekly-briefing.md
 *
 * IMPORTANT: Review the draft before pushing. Pushing any file to
 * newsletters/outbox/ triggers send-newsletter.yml and sends to all subscribers.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY  — for Claude draft generation
 *   FIRMS_MAP_KEY      — for FIRMS thermal anomaly data (optional)
 */

import fs   from 'fs';
import path from 'path';
import { getGDACSEvents }      from '../lib/gdacs';
import { getUSGSQuakes }       from '../lib/usgs';
import { getFIRMSDetections }  from '../lib/firms';
import { getReliefWebReports } from '../lib/reliefweb';

// ─── Env loading ─────────────────────────────────────────────────────────────

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
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
loadEnvFile();

// ─── Data loading ─────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data');

function readJSON<T>(filename: string): T | null {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

// ─── Context builder ──────────────────────────────────────────────────────────

function buildContext(
  gdacs:    Awaited<ReturnType<typeof getGDACSEvents>>,
  usgs:     Awaited<ReturnType<typeof getUSGSQuakes>>,
  firms:    Awaited<ReturnType<typeof getFIRMSDetections>>,
  rw:       Awaited<ReturnType<typeof getReliefWebReports>>,
  analysis: Record<string, unknown> | null,
  stocks:   Record<string, unknown> | null,
  prices:   Record<string, unknown> | null,
  brent:    Record<string, unknown> | null,
): string {
  const lines: string[] = [];

  // Current analysis
  if (analysis) {
    lines.push('## Current EU Fuel Security Status');
    lines.push(`Status: ${analysis.overallStatus}`);
    lines.push(`Summary: ${analysis.statusLine}`);
    if (Array.isArray(analysis.keyPoints)) {
      lines.push('Key points:');
      for (const pt of analysis.keyPoints) lines.push(`- ${pt}`);
    }
    lines.push('');
  }

  // Reserve data
  if (stocks) {
    const avg = (stocks as any).euAverage;
    if (avg) {
      lines.push('## EU Average Reserve Levels');
      lines.push(`Petrol: ${avg.petrolDays} days | Diesel: ${avg.dieselDays} days | Jet fuel: ${avg.jetFuelDays} days`);
      lines.push(`Data period: ${(stocks as any).dataPeriod}`);
      lines.push('');
    }
  }

  // Market prices
  if (brent || prices) {
    lines.push('## Market Prices');
    if (brent) lines.push(`Brent crude: $${(brent as any).priceUsd}/barrel (${(brent as any).changePct}% ${(brent as any).changeUsd >= 0 ? '↑' : '↓'})`);
    if (prices) {
      const avg = (prices as any).euAverage;
      if (avg) lines.push(`EU average: Petrol €${avg.petrolPrice}/L | Diesel €${avg.dieselPrice}/L`);
      lines.push(`Bulletin date: ${(prices as any).bulletinDate}`);
    }
    lines.push('');
  }

  // GDACS alerts
  const highGdacs = gdacs.filter(e => e.alertLevel === 'Red' || e.alertLevel === 'Orange');
  lines.push('## GDACS Live Alerts (past 24h)');
  if (highGdacs.length === 0) {
    lines.push('No Red or Orange alerts in the past 24 hours.');
  } else {
    for (const e of highGdacs) {
      lines.push(`- [${e.alertLevel}] ${e.eventType} — ${e.title}${e.country ? ` (${e.country})` : ''}`);
    }
  }
  lines.push('');

  // USGS
  const significantQuakes = usgs.filter(q => q.magnitude >= 5.5);
  lines.push('## USGS Seismic Signals (M5.5+, past 7 days, oil-relevant regions)');
  if (significantQuakes.length === 0) {
    lines.push('No M5.5+ earthquakes in oil-relevant regions.');
  } else {
    for (const q of significantQuakes.slice(0, 5)) {
      lines.push(`- M${q.magnitude.toFixed(1)} — ${q.place} (${q.region})`);
    }
  }
  lines.push('');

  // FIRMS
  lines.push('## NASA FIRMS Thermal Anomalies (past 24h)');
  if (firms.status !== 'ok' || firms.detections.length === 0) {
    lines.push('No thermal anomalies detected near major refineries.');
  } else {
    for (const d of firms.detections.slice(0, 5)) {
      lines.push(`- ${d.refinery}: ${d.frp.toFixed(0)} MW FRP (${d.confidence === 'h' ? 'high confidence' : 'nominal'})`);
    }
  }
  lines.push('');

  // ReliefWeb
  lines.push('## UN/OCHA Situation Reports (recent, energy-relevant)');
  if (rw.length === 0) {
    lines.push('No recent situation reports available.');
  } else {
    for (const r of rw.slice(0, 4)) {
      const date = r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
      lines.push(`- [${date}] ${r.title}${r.countries.length ? ` (${r.countries.join(', ')})` : ''}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

// ─── Claude API call ──────────────────────────────────────────────────────────

async function draftWithClaude(context: string, dateLabel: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set.');

  const systemPrompt = `You are a senior energy analyst writing EuroOilWatch's weekly fuel security briefing email. Your readers are logistics operators, energy traders, procurement teams, and policy analysts who need actionable intelligence about European fuel supply security.

Write in clear, direct professional English. Lead with what matters most this week. Be specific — cite numbers from the data. Keep the tone measured but do not understate genuine risks. Do not add marketing language or excessive enthusiasm.

Write clean markdown only. Use ## for section headers, **bold** for key numbers and named chokepoints, bullet lists where appropriate. Target 450–600 words. Do not include a footer, unsubscribe note, or subject line — those are handled separately.`;

  const userPrompt = `Draft this week's EuroOilWatch briefing email. Today is ${dateLabel}.

Here is the current data from our live feeds and data pipeline:

${context}

Structure the email exactly as follows — use these section headers:

## This Week
2–3 sentences on the single most important development for EU fuel security right now.

## Live Risk Signals
Summarise any notable GDACS alerts, significant earthquakes near oil infrastructure, or FIRMS thermal anomalies. If nothing significant, say so briefly. Name specific locations.

## EU Reserve Status
Current days of supply. Flag any categories below 90 days. Put it in plain English — what does this mean for operators?

## Market Prices
Brent price and direction. EU average diesel and petrol. One sentence of context.

## Further Reading
Two lines only:
- Full analysis and supply routes: https://eurooilwatch.com/supply
- Subscribe or share: https://eurooilwatch.com

## Watch Next Week
One sentence on the key signal or data release to monitor.

Output markdown only. Start directly with "## This Week".`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const json = await res.json() as { content: { text: string }[] };
  return json.content?.[0]?.text?.trim() ?? '';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📰 EuroOilWatch — Weekly Briefing Draft Generator');
  console.log('==================================================\n');

  const now       = new Date();
  const dateSlug  = now.toISOString().slice(0, 10);
  const dateLabel = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  console.log('⏳ Fetching live feeds in parallel...');
  const [gdacs, usgs, firms, rw] = await Promise.all([
    getGDACSEvents(),
    getUSGSQuakes(),
    getFIRMSDetections(),
    getReliefWebReports(),
  ]);
  console.log(`   GDACS: ${gdacs.length} events | USGS: ${usgs.length} quakes | FIRMS: ${firms.detections.length} detections | ReliefWeb: ${rw.length} reports`);

  console.log('📂 Reading data files...');
  const analysis = readJSON<Record<string, unknown>>('analysis.json');
  const stocks   = readJSON<Record<string, unknown>>('stocks.json');
  const prices   = readJSON<Record<string, unknown>>('prices.json');
  const brent    = readJSON<Record<string, unknown>>('brent.json');

  const context = buildContext(gdacs, usgs, firms, rw, analysis, stocks, prices, brent);

  console.log('🤖 Calling Claude to draft newsletter...');
  const body = await draftWithClaude(context, dateLabel);
  console.log(`   ✅ Draft generated (${body.length} chars)\n`);

  // Write to outbox
  const outboxDir = path.join(process.cwd(), 'newsletters', 'outbox');
  if (!fs.existsSync(outboxDir)) fs.mkdirSync(outboxDir, { recursive: true });

  const filename = `${dateSlug}-weekly-briefing.md`;
  const filepath = path.join(outboxDir, filename);

  const fileContent = [
    '---',
    `subject: EuroOilWatch — Fuel Security Briefing, ${dateLabel}`,
    '---',
    '',
    body,
  ].join('\n');

  fs.writeFileSync(filepath, fileContent, 'utf-8');

  console.log(`✅ Draft written to: newsletters/outbox/${filename}`);
  console.log('\n⚠️  REVIEW BEFORE PUSHING.');
  console.log('   Pushing this file triggers send-newsletter.yml and sends to all subscribers.');
  console.log(`\n   cat newsletters/outbox/${filename}`);
}

main().catch(err => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
