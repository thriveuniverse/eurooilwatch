#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — MARAD Maritime Security Advisory Fetcher
 * ========================================================
 * Fetches the US Maritime Administration (MARAD) advisory and alert
 * listings, filters for regions relevant to EU fuel supply routes,
 * and saves to data/marad-advisories.json.
 *
 * Individual advisory pages require JavaScript so we extract all
 * usable data (ID, region, incident type, URL) from the listing page.
 *
 * Runs daily. No API key required.
 * Source: https://www.maritime.dot.gov/msci-advisories
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'marad-advisories.json');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; EuroOilWatch/1.0 fuel-security-monitor)',
  'Accept': 'text/html,application/xhtml+xml',
};

const SOURCES = [
  { url: 'https://www.maritime.dot.gov/msci-advisories', type: 'advisory' as const },
  { url: 'https://www.maritime.dot.gov/msci-alerts',     type: 'alert' as const },
];

// Regions relevant to EU fuel supply routes
const RELEVANT_REGIONS = [
  'red sea', 'bab el mandeb', 'gulf of aden', 'arabian sea',
  'gulf of oman', 'arabian gulf', 'persian gulf', 'hormuz',
  'indian ocean', 'somalia', 'somali basin', 'middle east', 'global',
];

// Severity inferred from incident keywords in title
const SEVERITY_MAP: { keywords: string[]; level: 'critical' | 'high' | 'elevated' | 'normal' }[] = [
  { keywords: ['attack', 'hijack', 'seized', 'fired upon', 'missile', 'drone'], level: 'critical' },
  { keywords: ['boarding', 'detention', 'kidnap', 'robbery', 'piracy'],         level: 'high' },
  { keywords: ['caution', 'advisory', 'military', 'combat'],                    level: 'elevated' },
  { keywords: ['updates', 'resources', 'contacts'],                             level: 'normal' },
];

function inferSeverity(title: string): 'critical' | 'high' | 'elevated' | 'normal' {
  const lower = title.toLowerCase();
  for (const { keywords, level } of SEVERITY_MAP) {
    if (keywords.some(k => lower.includes(k))) return level;
  }
  return 'elevated';
}

function extractRegion(title: string): string {
  // Title format: "YYYY-NNN-Region Name-Incident Type"
  // Strip the ID prefix and incident type suffix
  const withoutId = title.replace(/^\d{4}-\d{3,4}-/, '');
  // Split on last hyphen-separated incident type
  const parts = withoutId.split('-');
  // Region is everything before the last capitalised phrase
  // Heuristic: find first part that looks like incident type (verb phrase)
  const incidentStart = parts.findIndex(p =>
    /^(Houthi|Iranian|Piracy|Armed|Military|U\.S\.|Updates)/i.test(p.trim())
  );
  if (incidentStart > 0) return parts.slice(0, incidentStart).join('-').trim();
  return parts[0]?.trim() || withoutId;
}

function extractIncident(title: string): string {
  const withoutId = title.replace(/^\d{4}-\d{3,4}-/, '');
  const parts = withoutId.split('-');
  const incidentStart = parts.findIndex(p =>
    /^(Houthi|Iranian|Piracy|Armed|Military|U\.S\.|Updates)/i.test(p.trim())
  );
  if (incidentStart >= 0) return parts.slice(incidentStart).join(' — ').trim();
  return parts[parts.length - 1]?.trim() || '';
}

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return RELEVANT_REGIONS.some(r => lower.includes(r));
}

async function fetchAdvisories(url: string, type: 'advisory' | 'alert'): Promise<any[]> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const html = await res.text();

  const items: any[] = [];
  const re = /href="(\/msci\/(\d{4}-\d{3,4})-([^"]+))"[^>]*>([^<]{5,})</g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, path_, id, , rawTitle] = m;
    const title = rawTitle.trim();
    if (!isRelevant(title)) continue;

    const year = parseInt(id.slice(0, 4));
    const num  = parseInt(id.slice(5));

    items.push({
      id,
      type,
      title,
      region:   extractRegion(title),
      incident: extractIncident(title),
      severity: inferSeverity(title),
      year,
      num,
      url: 'https://www.maritime.dot.gov' + path_,
    });
  }
  return items;
}

async function main() {
  console.log('📡 EuroOilWatch — Fetching MARAD Maritime Advisories');
  console.log('='.repeat(52));

  const all: any[] = [];
  for (const source of SOURCES) {
    try {
      const items = await fetchAdvisories(source.url, source.type);
      console.log(`  ${source.type === 'advisory' ? 'Advisories' : 'Alerts'}: ${items.length} relevant`);
      all.push(...items);
    } catch (err: any) {
      console.warn(`  ⚠️  Failed to fetch ${source.type}s: ${err.message}`);
    }
  }

  // Deduplicate by ID, sort newest first (by year desc, num desc)
  const seen = new Set<string>();
  const unique = all
    .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.num - a.num);

  const output = {
    lastUpdated: new Date().toISOString(),
    source: 'US Maritime Administration (MARAD) — maritime.dot.gov',
    count: unique.length,
    advisories: unique,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n  Total relevant advisories: ${unique.length}`);
  unique.forEach(a => console.log(`  [${a.id}] ${a.severity.toUpperCase()} — ${a.region}: ${a.incident}`));
  console.log(`\n✅ Written to ${OUTPUT_FILE}`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
