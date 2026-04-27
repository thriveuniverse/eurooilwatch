#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — US CENTCOM Advisory Fetcher
 * ===============================================
 * Pulls the DVIDS RSS feed for U.S. Central Command (covers Middle East AOR
 * including Strait of Hormuz, Red Sea, Bab el-Mandeb), filters for items
 * relevant to oil-supply/maritime security, and saves to
 * data/centcom-advisories.json.
 *
 * No API key required. Runs daily.
 * Source: https://www.dvidshub.net/rss/unit/USCENTCOM
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR    = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'centcom-advisories.json');
const FEED_URL    = 'https://www.dvidshub.net/rss/unit/USCENTCOM';
const MAX_ITEMS   = 12;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; EuroOilWatch/1.0 fuel-security-monitor)',
  'Accept': 'application/rss+xml,application/xml,text/xml',
};

// Item is relevant only if it mentions a Middle East maritime chokepoint
// or a specific energy-supply-relevant actor. Pure incident keywords like
// "missile" or "vessel" are too broad on their own (Space Force missiles,
// training vessels, etc.) so we anchor on geography/actor.
const PRIMARY_KEYWORDS = [
  'hormuz',
  'bab el-mandeb', 'bab el mandeb', 'mandeb',
  'red sea',
  'gulf of aden',
  'persian gulf', 'arabian gulf',
  'gulf of oman',
  'arabian sea', 'somali basin',
  'yemen', 'houthi',
  'iran-flagged', 'iranian-flagged', 'iranian vessel', 'iranian tanker',
  'oil tanker', 'crude tanker',
  'commercial vessel', 'merchant vessel',
  'maritime interdiction', 'tanker seized', 'tanker boarding',
  'sanctions evasion', 'illicit shipping',
];

// Hard-exclusion: contexts that aren't energy/supply relevant even if a
// primary keyword incidentally appears.
const EXCLUDE_KEYWORDS = [
  'airshow', 'air show',
  'memorial', 'ceremony',
  'marksmanship training', 'physical training', 'aeromedical',
  'space force', 'space based',
  'typhoon', 'hurricane',
  'air base', 'airbase',
];

const SEVERITY_RULES: { keywords: string[]; level: 'critical' | 'high' | 'elevated' | 'normal' }[] = [
  { keywords: ['attack', 'struck', 'fired upon', 'missile', 'drone strike', 'killed'], level: 'critical' },
  { keywords: ['seized', 'boarding', 'intercept', 'interdiction', 'detained'],          level: 'high' },
  { keywords: ['advisory', 'caution', 'monitoring', 'patrol'],                          level: 'elevated' },
];

interface Item {
  id: string;
  title: string;
  region: string;
  incident: string;
  severity: 'critical' | 'high' | 'elevated' | 'normal';
  url: string;
  publishedAt: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function pluck(itemXml: string, tag: string): string {
  const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decodeEntities(m[1]).trim() : '';
}

function isRelevant(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  if (EXCLUDE_KEYWORDS.some(k => text.includes(k))) return false;
  return PRIMARY_KEYWORDS.some(k => text.includes(k));
}

function inferSeverity(text: string): Item['severity'] {
  const lower = text.toLowerCase();
  for (const { keywords, level } of SEVERITY_RULES) {
    if (keywords.some(k => lower.includes(k))) return level;
  }
  return 'normal';
}

function inferRegion(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('hormuz')) return 'Strait of Hormuz';
  if (lower.includes('mandeb')) return 'Bab el-Mandeb';
  if (lower.includes('red sea')) return 'Red Sea';
  if (lower.includes('gulf of aden') || lower.includes(' aden')) return 'Gulf of Aden';
  if (lower.includes('persian gulf') || lower.includes('arabian gulf')) return 'Persian Gulf';
  if (lower.includes('gulf of oman')) return 'Gulf of Oman';
  if (lower.includes('arabian sea')) return 'Arabian Sea';
  if (lower.includes('yemen')) return 'Yemen';
  if (lower.includes('iran')) return 'Iran';
  return 'CENTCOM AOR';
}

function summariseIncident(title: string): string {
  // Trim ranks/units/photo-credit boilerplate; keep the actionable phrase
  return title
    .replace(/\(.*?photo.*?\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

async function main() {
  console.log('🛰️  EuroOilWatch — Fetching CENTCOM advisories');
  console.log('='.repeat(50));

  const res = await fetch(FEED_URL, { headers: HEADERS });
  if (!res.ok) {
    console.error(`❌ DVIDS RSS returned ${res.status}`);
    process.exit(1);
  }
  const xml = await res.text();

  const itemBlocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) ?? [];
  console.log(`  Parsed ${itemBlocks.length} feed items`);

  const seenTitles = new Set<string>();
  const advisories: Item[] = [];

  for (const block of itemBlocks) {
    const rawTitle = pluck(block, 'title');
    const description = pluck(block, 'description');
    if (!rawTitle) continue;

    if (!isRelevant(rawTitle, description)) continue;

    // Dedupe — DVIDS posts multiple photo items for the same event/title
    const titleKey = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);

    const link    = pluck(block, 'link');
    const guid    = pluck(block, 'guid') || link;
    const pubDate = pluck(block, 'pubDate');
    const combined = `${rawTitle} ${description}`;

    advisories.push({
      id:          guid,
      title:       rawTitle,
      region:      inferRegion(combined),
      incident:    summariseIncident(rawTitle),
      severity:    inferSeverity(combined),
      url:         link,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });

    if (advisories.length >= MAX_ITEMS) break;
  }

  console.log(`  Filtered to ${advisories.length} energy/maritime-relevant items`);

  const out = {
    lastUpdated: new Date().toISOString(),
    source:      'US Central Command via DVIDS',
    sourceUrl:   FEED_URL,
    count:       advisories.length,
    advisories,
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2));
  console.log(`\n✅ Written to ${OUTPUT_FILE}`);
  if (advisories.length > 0) {
    console.log('  Top items:');
    advisories.slice(0, 3).forEach(a => console.log(`    [${a.severity.toUpperCase()}] ${a.region}: ${a.incident.slice(0, 80)}`));
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
