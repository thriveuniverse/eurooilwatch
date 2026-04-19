#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — CREA RSS Feed Fetcher
 * =====================================
 * Fetches the Centre for Research on Energy and Clean Air (CREA) RSS feed,
 * filters for articles relevant to EU fuel supply (Russian exports, Hormuz,
 * energy sanctions, fossil fuel market analysis), and saves to data/crea-feed.json.
 *
 * No API key required. Runs daily.
 * Source: https://energyandcleanair.org/feed/
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'crea-feed.json');
const FEED_URL = 'https://energyandcleanair.org/feed/';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; EuroOilWatch/1.0 fuel-security-monitor)',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

// Category terms that indicate relevance
const RELEVANT_CATEGORIES = [
  "financing putin's war",
  'monthly analysis',
  'russian fossil fuels',
  'hormuz strait',
  'hormuz',
  'europe',
  'g7',
  'nato',
  'fossil fuels',
  'sanctions',
  'lng',
  'energy crisis',
];

// Title keywords that indicate relevance (case-insensitive)
const RELEVANT_TITLE_KEYWORDS = [
  'russia', 'russian', 'hormuz', 'sanctions', 'fossil fuel',
  'crude', 'oil export', 'putin', 'ukraine', 'energy crisis',
  'lng', 'gas', 'europe', 'european',
];

function isRelevant(title: string, categories: string[]): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerCats = categories.map(c => c.toLowerCase());

  if (lowerCats.some(c => RELEVANT_CATEGORIES.some(r => c.includes(r)))) return true;
  if (RELEVANT_TITLE_KEYWORDS.some(k => lowerTitle.includes(k))) return true;
  return false;
}

function tagArticle(title: string, categories: string[]): string {
  const lowerTitle = title.toLowerCase();
  const lowerCats = categories.map(c => c.toLowerCase());

  if (lowerCats.some(c => c.includes('hormuz'))) return 'Hormuz';
  if (lowerCats.some(c => c.includes("financing putin") || c.includes('russian fossil') || c.includes('monthly analysis')))
    return 'Russian Exports';
  if (lowerTitle.includes('hormuz')) return 'Hormuz';
  if (lowerTitle.includes('sanction')) return 'Sanctions';
  if (lowerTitle.includes('russia') || lowerTitle.includes('putin')) return 'Russian Exports';
  if (lowerTitle.includes('lng')) return 'LNG';
  return 'Analysis';
}

function parseItems(xml: string): any[] {
  const items: any[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch;

  while ((itemMatch = itemRe.exec(xml)) !== null) {
    const block = itemMatch[1];

    const titleMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                       block.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch  = block.match(/<link>(https?:\/\/[^\s<]+)<\/link>/) ||
                       block.match(/<guid[^>]*>(https?:\/\/[^\s<]+)<\/guid>/);
    const dateMatch  = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    const catRe = /<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>|<category>([\s\S]*?)<\/category>/g;
    const categories: string[] = [];
    let catMatch;
    while ((catMatch = catRe.exec(block)) !== null) {
      categories.push((catMatch[1] || catMatch[2]).trim());
    }

    if (!titleMatch || !linkMatch) continue;

    const title = titleMatch[1].trim();
    const link  = linkMatch[1].trim();
    const date  = dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString();

    if (!isRelevant(title, categories)) continue;

    items.push({
      title,
      date,
      link,
      categories,
      tag: tagArticle(title, categories),
    });
  }

  return items;
}

async function main() {
  console.log('📡 EuroOilWatch — Fetching CREA RSS Feed');
  console.log('='.repeat(45));

  const res = await fetch(FEED_URL, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${FEED_URL}`);
  const xml = await res.text();

  const items = parseItems(xml);

  const output = {
    lastUpdated: new Date().toISOString(),
    source: 'Centre for Research on Energy and Clean Air (CREA) — energyandcleanair.org',
    count: items.length,
    articles: items,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n  Relevant articles: ${items.length}`);
  items.forEach(a => console.log(`  [${a.tag}] ${a.title.slice(0, 80)}`));
  console.log(`\n✅ Written to ${OUTPUT_FILE}`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
