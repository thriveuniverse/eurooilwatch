#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — ARA Independent Stocks Fetcher
 * ===============================================
 * Source: Argus Media's free syndication of Insights Global's weekly
 * ARA (Amsterdam-Rotterdam-Antwerp) Independent Storage Report.
 * Insights Global publishes Thursdays at 16:15 CET; Argus typically
 * follows within hours.
 *
 * Pipeline:
 *   1. Fetch Argus's news-sitemap1.xml (most recent articles)
 *   2. Filter for URLs whose slug contains an ARA-related keyword
 *      and whose <lastmod> is within the last 7 days
 *   3. Fetch each candidate article and extract its <p> paragraphs
 *   4. Send the concatenated paragraphs to Claude (sonnet-4-6) with a
 *      strict JSON schema to extract per-product figures
 *   5. Merge across articles (latest figure per product wins) and
 *      append to data/ara-stocks.json with rolling weekly history
 *
 * Why Claude for extraction: Argus article bodies are prose
 * ("down by 7.6pc to around 600,000t"), not tables. A regex parser
 * would be brittle across wording changes. One LLM call per week
 * costs ~$0.05 and is robust.
 *
 * Usage: ANTHROPIC_API_KEY=sk-ant-xxx npx tsx scripts/fetch-ara-stocks.ts
 * Output: data/ara-stocks.json
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local for local dev (matches other scripts' pattern)
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

const SITEMAP_URL = 'https://www.argusmedia.com/news-sitemap1.xml';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'ara-stocks.json');
const UA = 'EuroOilWatch/0.1 (+https://eurooilwatch.com)';
const LOOKBACK_DAYS = parseInt(process.env.ARA_LOOKBACK_DAYS ?? '7', 10);
const MAX_HISTORY_WEEKS = 52;

// Slug substrings worth fetching — anything Argus publishes about ARA
// independent stocks. We prefer the broader summary articles (e.g.
// "ara-oil-product-stocks") but accept per-product pieces too.
const ARA_KEYWORDS = [
  'ara-oil-product-stocks',
  'ara-stocks',
  'ara-jet-fuel',
  'ara-jet-stocks',
  'ara-gasoline',
  'ara-gasoil',
  'ara-diesel',
  'ara-naphtha',
  'ara-fuel-oil',
  'ara-distillate',
];

interface ProductFigure {
  product: 'gasoil' | 'gasoline' | 'naphtha' | 'jet' | 'fuel_oil' | 'total';
  tonnes: number | null;            // absolute stock level in tonnes
  wowPercent: number | null;        // week-on-week percent change
  direction: 'up' | 'down' | 'flat' | null;
  note: string | null;              // any qualifier ("lowest since 2020", etc.)
}

interface WeeklySnapshot {
  weekEnding: string;               // ISO date (Wednesday, the Insights Global cutoff)
  publishedAt: string;              // first article datePublished we saw
  sourceUrls: string[];             // Argus URLs we extracted from
  figures: ProductFigure[];
}

interface AraStocksFile {
  lastUpdated: string;
  source: string;
  weeks: WeeklySnapshot[];          // newest first
}

interface SitemapEntry { url: string; lastmod: string; }

async function fetchSitemap(): Promise<SitemapEntry[]> {
  console.log(`📡 Fetching ${SITEMAP_URL}…`);
  const res = await fetch(SITEMAP_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const entries: SitemapEntry[] = [];
  const re = /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    entries.push({ url: m[1], lastmod: m[2] });
  }
  console.log(`   parsed ${entries.length} entries`);
  return entries;
}

function isAraCandidate(entry: SitemapEntry): boolean {
  const u = entry.url.toLowerCase();
  if (!u.includes('/en/news-and-insights/latest-market-news/')) return false;
  return ARA_KEYWORDS.some(k => u.includes(k));
}

function withinLookback(entry: SitemapEntry): boolean {
  const t = new Date(entry.lastmod).getTime();
  if (isNaN(t)) return false;
  return t >= Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
}

interface ArticleContent {
  url: string;
  title: string;
  publishedAt: string | null;
  paragraphs: string[];
}

async function fetchArticle(url: string): Promise<ArticleContent | null> {
  console.log(`   ↳ ${url.split('/').pop()}`);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    console.log(`     ⚠️ ${res.status}, skipping`);
    return null;
  }
  const html = await res.text();

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*Latest Market News.*$/, '').trim() : '';

  // datePublished appears in JSON-LD; first occurrence is the article itself
  const dateMatch = html.match(/"datePublished":"([^"]+)"/);
  const publishedAt = dateMatch ? dateMatch[1] : null;

  // Extract <p> tags. Skip the boilerplate "Register and we will customize" intro
  // and the trailing related-news / breakout-promo blocks.
  const paraRe = /<p(?:\s[^>]*)?>([^<][\s\S]*?)<\/p>/g;
  const paragraphs: string[] = [];
  let p: RegExpExecArray | null;
  while ((p = paraRe.exec(html)) !== null) {
    const raw = p[1].trim();
    if (!raw || raw.length < 30) continue;
    if (raw.includes('Register and we will customize')) continue;
    if (raw.includes('qa-relatednews')) continue;
    if (raw.includes('qa-breakoutpromo')) continue;
    if (raw.includes('Argus illuminates the markets')) continue;
    if (raw.includes('Get concise, trustworthy and unbiased')) continue;
    // Strip nested HTML tags
    const text = raw.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
    if (text.length < 30) continue;
    paragraphs.push(text);
  }

  return { url, title, publishedAt, paragraphs };
}

const EXTRACTION_SCHEMA = `Return a JSON object with exactly this shape:
{
  "weekEnding": "YYYY-MM-DD",  // the date the article references as the end of the reporting week (e.g. "the week to 15 April" -> "2026-04-15"). If unclear, use the article's published date minus 1 day.
  "figures": [
    {
      "product": "gasoil" | "gasoline" | "naphtha" | "jet" | "fuel_oil" | "total",
      "tonnes": number | null,        // ABSOLUTE stock level in tonnes (e.g. "600,000t" -> 600000, "1.04mn t" -> 1040000, "1.95mn t" -> 1950000). Null if not stated.
      "wowPercent": number | null,    // week-on-week % change as signed decimal (e.g. "rose by 2.5pc" -> 2.5, "fell by 7.6pc" -> -7.6, "down by 11pc in the past two weeks" -> null because not 1-week). Null if unstated or ambiguous.
      "direction": "up" | "down" | "flat" | null,
      "note": string | null           // optional qualifier like "lowest since April 2020", null otherwise
    }
  ]
}

Rules:
- Only include products that the article EXPLICITLY discusses with numbers. Do NOT infer or invent figures.
- "diesel" maps to "gasoil" (Argus uses gasoil as the umbrella term including road diesel).
- "kerosene" or "jet kerosine" map to "jet".
- If the article gives a multi-week change (e.g. "fallen 11pc in the past two weeks"), set wowPercent to null but record the direction and note.
- Output ONLY the JSON object, no prose, no code fences.`;

async function extractWithClaude(articles: ArticleContent[]): Promise<{ weekEnding: string; figures: ProductFigure[] } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('   ❌ ANTHROPIC_API_KEY not set; cannot extract structured figures');
    return null;
  }
  const articleBlocks = articles.map((a, i) =>
    `=== Article ${i + 1} ===\nTitle: ${a.title}\nPublished: ${a.publishedAt}\nURL: ${a.url}\n\n${a.paragraphs.join('\n\n')}`
  ).join('\n\n');

  const userPrompt = `You are extracting structured data from Argus Media articles syndicating the weekly Insights Global ARA (Amsterdam-Rotterdam-Antwerp) Independent Storage Report.

Below are ${articles.length} article(s) published in the last week. Some may overlap (e.g. a jet fuel piece and a separate gasoline piece). Merge them into a single weekly snapshot — for each product, take the most specific figure available.

${articleBlocks}

${EXTRACTION_SCHEMA}`;

  console.log(`   🤖 Calling Claude (${articles.length} article(s), ${userPrompt.length} chars)…`);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) {
    console.error(`   ❌ Claude API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const result = await res.json();
  const text = (result.content?.[0]?.text || '').trim();
  const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.weekEnding || !Array.isArray(parsed.figures)) throw new Error('Invalid shape');
    return parsed;
  } catch (e) {
    console.error(`   ❌ Failed to parse Claude response: ${(e as Error).message}\n   Got: ${text.slice(0, 400)}`);
    return null;
  }
}

function loadExisting(): AraStocksFile {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return { lastUpdated: new Date(0).toISOString(), source: 'Argus Media (syndicating Insights Global)', weeks: [] };
  }
  return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
}

async function main() {
  const sitemap = await fetchSitemap();
  const candidates = sitemap.filter(isAraCandidate).filter(withinLookback);

  if (candidates.length === 0) {
    console.log('ℹ️  No ARA articles in the last 7 days; nothing to do.');
    return;
  }

  console.log(`🎯 Found ${candidates.length} ARA candidate(s) in last ${LOOKBACK_DAYS} days:`);
  for (const c of candidates) console.log(`   ${c.lastmod}  ${c.url.split('/').pop()}`);

  const articles: ArticleContent[] = [];
  for (const c of candidates) {
    const a = await fetchArticle(c.url);
    if (a && a.paragraphs.length >= 1) articles.push(a);
  }

  if (articles.length === 0) {
    console.log('⚠️  No fetchable article bodies; aborting.');
    return;
  }

  const extracted = await extractWithClaude(articles);
  if (!extracted) {
    console.log('⚠️  Extraction failed; not updating data file.');
    process.exit(1);
  }

  const snapshot: WeeklySnapshot = {
    weekEnding: extracted.weekEnding,
    publishedAt: articles[0].publishedAt ?? new Date().toISOString(),
    sourceUrls: articles.map(a => a.url),
    figures: extracted.figures,
  };

  console.log('📊 Extracted snapshot:');
  console.log(`   week ending ${snapshot.weekEnding}`);
  for (const f of snapshot.figures) {
    const t = f.tonnes !== null ? `${(f.tonnes / 1_000_000).toFixed(2)} Mt` : '—';
    const w = f.wowPercent !== null ? `${f.wowPercent > 0 ? '+' : ''}${f.wowPercent.toFixed(1)}%` : '—';
    console.log(`   ${f.product.padEnd(10)} ${t.padStart(8)}  WoW ${w.padStart(7)}  ${f.note ?? ''}`);
  }

  const file = loadExisting();
  // Replace if same week already exists, else prepend
  file.weeks = file.weeks.filter(w => w.weekEnding !== snapshot.weekEnding);
  file.weeks.unshift(snapshot);
  file.weeks = file.weeks.slice(0, MAX_HISTORY_WEEKS);
  file.lastUpdated = new Date().toISOString();

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(file, null, 2));
  console.log(`✅ Wrote ${path.relative(process.cwd(), OUTPUT_FILE)} (${file.weeks.length} week(s) of history)`);
}

main().catch(err => {
  console.error('❌ Fetcher failed:', err);
  process.exit(1);
});
