#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Refinery Outage Tracker
 * ======================================
 * Aggregates refinery outage / turnaround / fire / shutdown headlines
 * from free trade-press RSS feeds. Keyword-filtered, region-tagged,
 * severity-inferred.
 *
 * No paid feeds. No API keys. Each entry cites the original article URL
 * so the data is defensible the same way our MARAD/CENTCOM pipelines are.
 *
 * Sources (round 1 — trade press only):
 *   gCaptain, Splash247, Maritime Executive, Hellenic Shipping News, OilPrice
 *
 * Future extensions (not in this round):
 *   - Operator press release RSS (Shell / BP / Total / Phillips 66 / Marathon)
 *   - EIA weekly refinery utilization
 *   - EPA / TCEQ / LDEQ emission event reports
 *
 * Output: data/refinery-outages.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'refinery-outages.json');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; EuroOilWatch/1.0 refinery-outage-monitor)',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

// ─── Feeds ──────────────────────────────────────────────────────────────────

interface Feed {
  name: string;
  url: string;
}

const FEEDS: Feed[] = [
  // Maritime & oil trade press
  { name: 'gCaptain',                url: 'https://gcaptain.com/feed/' },
  { name: 'Splash247',               url: 'https://splash247.com/feed/' },
  { name: 'Maritime Executive',      url: 'https://maritime-executive.com/articles.rss' },
  { name: 'Hellenic Shipping News',  url: 'https://www.hellenicshippingnews.com/feed/' },
  { name: 'OilPrice',                url: 'https://oilprice.com/rss/main' },
  { name: 'World Oil',               url: 'https://www.worldoil.com/rss/' },

  // Press-release aggregators — collect operator releases (Shell/BP/Total/Marathon/Valero/etc)
  // under one RSS instead of guessing each company's individual feed URL.
  { name: 'PR Newswire — Energy',    url: 'https://www.prnewswire.com/rss/energy-latest-news/energy-latest-news-list.rss' },
  { name: 'PR Newswire — Oil & Gas', url: 'https://www.prnewswire.com/rss/energy-latest-news/oil-energy-list.rss' },
];

// ─── Filtering ──────────────────────────────────────────────────────────────

// Title or description must contain a refinery indicator AND at least one
// disruption keyword. Refinery indicator = the words refinery/refining/refiner,
// OR a known refinery name (e.g. "Pernis", "Galveston Bay") so we catch
// stories that drop the noun, OR a refinery-relevant unit name.
const REFINERY_NOUNS = ['refinery', 'refineries', 'refining', 'refiner', 'refiners'];

const REFINERY_UNITS = [
  'fcc unit', 'crude unit', 'cdu', 'coker', 'hydrocracker', 'reformer',
  'alkylation unit', 'vacuum unit', 'desulfuriser', 'desulfurizer',
];

// Major refinery proper nouns. Kept narrow on purpose — only names where a
// hit + disruption keyword in trade-press context almost always means a
// refinery story. Excludes ambiguous city names (Philadelphia, Mumbai, Lima,
// Ulsan, Wilmington) that would generate too many false positives.
const REFINERY_NAMES = [
  // UK
  'fawley', 'stanlow', 'pembroke', 'lindsey', 'humber', 'grangemouth', 'killingholme',
  // Europe
  'pernis', 'rotterdam', 'antwerp', 'gonfreville', 'donges', 'leuna', 'schwedt',
  'karlsruhe', 'gelsenkirchen', 'sannazzaro', 'priolo', 'cartagena', 'sines',
  'plock', 'mazeikiai', 'burgas', 'mongstad',
  // Americas
  'galveston bay', 'baytown', 'beaumont', 'port arthur', 'corpus christi', 'whiting',
  'wood river', 'pascagoula', 'garyville', 'st. charles', 'lake charles',
  'cherry point', 'martinez', 'torrance', 'el segundo', 'carson',
  'bayway', 'marcus hook', 'toledo', 'catlettsburg',
  'come by chance', 'sarnia', 'edmonton',
  // Middle East
  'jubail', 'yanbu', 'ras tanura', 'rabigh', 'fujairah', 'ruwais', 'sitra',
  'abadan', 'isfahan', 'arak', 'bandar abbas', 'tupras', 'aliaga',
  // Asia
  'jamnagar', 'paradip', 'kochi', 'mangalore', 'vadinar',
  'jurong', 'pulau bukom', 'tuas', 'mailiao', 'kaohsiung', 'yeosu', 'daesan',
  // Africa
  'dangote', 'sapref', 'natref', 'skikda', 'arzew',
];

// Solo 'cut' / 'reduce' removed — too broad (matches "production cut",
// "cost cut", "rate cut" etc). Keep only the refinery-specific phrases.
const DISRUPTION_KEYWORDS = [
  'fire', 'fires', 'explosion', 'explosions', 'blast', 'blasts',
  'shutdown', 'shutdowns', 'shut', 'shuts',
  'outage', 'outages', 'unplanned',
  'disrupt', 'disrupts', 'disrupted', 'disruption', 'disruptions',
  'turnaround', 'turnarounds', 'maintenance',
  'strike', 'strikes', 'walkout', 'walkouts',
  'force majeure',
  'closure', 'closures', 'closed', 'closes',
  'halt', 'halts', 'halted',
  'leak', 'leaks', 'leaked', 'spill', 'spills', 'spilled',
  'restart', 'restarts', 'restarted', 'restarting',
  'run cuts', 'run reduction', 'run reductions',
  'unit down', 'unit trip', 'unit upset',
];

// Word-boundary match. Substring .includes() matches "cut" inside "executive",
// "fire" inside "satisfire" etc — too noisy. Build one regex per keyword list.
function makeWordRegex(keywords: string[]): RegExp {
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'i');
}

const REFINERY_NOUN_RE       = makeWordRegex(REFINERY_NOUNS);
const REFINERY_UNIT_RE       = makeWordRegex(REFINERY_UNITS);
const REFINERY_NAME_RE       = makeWordRegex(REFINERY_NAMES);
const DISRUPTION_RE          = makeWordRegex(DISRUPTION_KEYWORDS);

function passesFilter(title: string, description: string): boolean {
  const text = title + ' ' + description;
  const hasRefineryIndicator =
    REFINERY_NOUN_RE.test(text) ||
    REFINERY_UNIT_RE.test(text) ||
    REFINERY_NAME_RE.test(text);
  if (!hasRefineryIndicator) return false;
  return DISRUPTION_RE.test(text);
}

// ─── Severity inference ─────────────────────────────────────────────────────

type Severity = 'critical' | 'high' | 'elevated' | 'normal';

const SEVERITY_RULES: { keywords: string[]; level: Severity }[] = [
  { keywords: ['explosion', 'blast', 'fire', 'fatal', 'killed'],                  level: 'critical' },
  { keywords: ['force majeure', 'shutdown', 'shut down', 'halts', 'halted',
               'strike', 'walkout', 'closure', 'closed'],                          level: 'high'     },
  { keywords: ['outage', 'unplanned', 'unit down', 'unit trip', 'leak',
               'cut', 'run cuts', 'reducing run', 'disrupt'],                      level: 'elevated' },
  { keywords: ['turnaround', 'maintenance', 'restart', 'restarting'],              level: 'normal'   },
];

function inferSeverity(title: string, description: string): Severity {
  const text = title + ' ' + description;
  for (const { keywords, level } of SEVERITY_RULES) {
    if (makeWordRegex(keywords).test(text)) return level;
  }
  return 'elevated';
}

// ─── Region inference ───────────────────────────────────────────────────────

type Region = 'europe' | 'uk' | 'americas' | 'asia' | 'middle-east' | 'africa' | 'other';

// Keyword → region mapping. Order matters: more specific first.
// Major refinery names included so region tagging works even when the country
// isn't named in the headline.
const REGION_MAP: { keywords: string[]; region: Region }[] = [
  { region: 'uk', keywords: [
      'uk ', 'britain', 'british', 'england', 'scotland', 'wales',
      'fawley', 'stanlow', 'pembroke', 'lindsey', 'humber', 'grangemouth', 'killingholme',
  ]},
  { region: 'europe', keywords: [
      'germany', 'german', 'france', 'french', 'netherlands', 'dutch', 'belgium', 'belgian',
      'italy', 'italian', 'spain', 'spanish', 'portugal', 'portuguese', 'poland', 'polish',
      'austria', 'austrian', 'romania', 'romanian', 'greece', 'greek', 'finland', 'sweden',
      'czech', 'hungary', 'hungarian', 'bulgaria', 'bulgarian', 'lithuania', 'denmark',
      'pernis', 'rotterdam', 'antwerp', 'gonfreville', 'donges', 'leuna', 'schwedt',
      'karlsruhe', 'gelsenkirchen', 'sannazzaro', 'priolo', 'cartagena', 'sines',
      'plock', 'mazeikiai', 'burgas', 'mongstad',
  ]},
  { region: 'americas', keywords: [
      'us ', 'u.s.', 'united states', 'texas', 'louisiana', 'california', 'new jersey',
      'illinois', 'oklahoma', 'kansas', 'mississippi', 'pennsylvania', 'ohio',
      'canada', 'canadian', 'alberta', 'ontario', 'quebec',
      'mexico', 'mexican', 'pemex',
      'brazil', 'brazilian', 'petrobras', 'venezuela', 'venezuelan',
      'galveston', 'baytown', 'beaumont', 'port arthur', 'corpus christi', 'whiting',
      'wood river', 'pascagoula', 'garyville', 'st. charles', 'lake charles',
      'cherry point', 'martinez', 'wilmington', 'torrance', 'el segundo', 'carson',
      'bayway', 'philadelphia', 'marcus hook', 'toledo', 'lima', 'catlettsburg',
      'come by chance', 'sarnia', 'edmonton',
  ]},
  { region: 'middle-east', keywords: [
      'saudi', 'aramco', 'iran', 'iranian', 'iraq', 'iraqi', 'kuwait', 'qatar', 'uae',
      'oman', 'bahrain', 'jordan', 'turkey', 'turkish',
      'jubail', 'yanbu', 'ras tanura', 'rabigh', 'fujairah', 'ruwais', 'sitra',
      'abadan', 'isfahan', 'arak', 'bandar abbas', 'tupras', 'izmir', 'aliaga',
  ]},
  { region: 'asia', keywords: [
      'china', 'chinese', 'india', 'indian', 'japan', 'japanese', 'korea', 'korean',
      'singapore', 'malaysia', 'malaysian', 'indonesia', 'indonesian', 'thailand', 'thai',
      'vietnam', 'taiwan', 'philippines', 'australia', 'australian',
      'jamnagar', 'reliance', 'paradip', 'mumbai', 'kochi', 'mangalore', 'vadinar',
      'sinopec', 'cnpc', 'petrochina', 'jurong', 'pulau bukom', 'tuas',
      'mailiao', 'kaohsiung', 'ulsan', 'yeosu', 'daesan',
  ]},
  { region: 'africa', keywords: [
      'nigeria', 'nigerian', 'south africa', 'algeria', 'algerian', 'egypt', 'egyptian',
      'libya', 'libyan', 'morocco', 'moroccan', 'angola', 'angolan',
      'dangote', 'sapref', 'natref', 'skikda', 'arzew',
  ]},
];

function inferRegion(title: string, description: string): Region {
  // Count matches per region and pick the one with most. Title matches count
  // double — the headline is the strongest editorial signal. This avoids the
  // first-match-wins bug where (say) a passing Saudi mention beat the actual
  // China/Sinopec subject of the article.
  const counts: Partial<Record<Region, number>> = {};
  for (const { keywords, region } of REGION_MAP) {
    const re = new RegExp(`\\b(?:${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    const titleHits = (title.match(re)?.length ?? 0);
    const descHits  = (description.match(re)?.length ?? 0);
    const score = titleHits * 2 + descHits;
    if (score > 0) counts[region] = (counts[region] ?? 0) + score;
  }
  let best: Region = 'other';
  let bestScore = 0;
  for (const [region, score] of Object.entries(counts) as [Region, number][]) {
    if (score > bestScore) { best = region; bestScore = score; }
  }
  return best;
}

// ─── Outage type inference ──────────────────────────────────────────────────

type OutageType = 'fire' | 'explosion' | 'unplanned' | 'turnaround' | 'strike'
                | 'shutdown' | 'restart' | 'leak' | 'run-cuts' | 'unknown';

const OUTAGE_TYPE_RULES: { keywords: string[]; type: OutageType }[] = [
  { keywords: ['explosion', 'blast'],                       type: 'explosion'  },
  { keywords: ['fire'],                                     type: 'fire'       },
  { keywords: ['leak', 'spill'],                            type: 'leak'       },
  { keywords: ['strike', 'walkout', 'industrial action'],   type: 'strike'     },
  { keywords: ['turnaround', 'maintenance'],                type: 'turnaround' },
  { keywords: ['restart', 'restarting'],                    type: 'restart'    },
  { keywords: ['cut', 'run cuts', 'reducing run'],          type: 'run-cuts'   },
  { keywords: ['unplanned', 'outage', 'unit down', 'unit trip'], type: 'unplanned' },
  { keywords: ['shutdown', 'shut down', 'halts', 'halted',
               'closure', 'closed', 'force majeure'],       type: 'shutdown'   },
];

function inferOutageType(title: string, description: string): OutageType {
  const text = title + ' ' + description;
  for (const { keywords, type } of OUTAGE_TYPE_RULES) {
    if (makeWordRegex(keywords).test(text)) return type;
  }
  return 'unknown';
}

// ─── RSS parsing (regex-based; same approach as fetch-marad.ts) ─────────────

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')   // strip residual HTML in description
    .replace(/\s+/g, ' ')
    .trim();
}

function tagContent(itemXml: string, tag: string): string {
  // Match <tag>...</tag> or <tag ...>...</tag>, including CDATA.
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = itemXml.match(re);
  return m ? decodeEntities(m[1]) : '';
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  // Both RSS <item> and Atom <entry> are common; handle both.
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>|<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const inner = m[1] || m[2];
    const title       = tagContent(inner, 'title');
    let link          = tagContent(inner, 'link');
    if (!link) {
      // Atom feeds: <link href="..."/>
      const lm = inner.match(/<link\b[^>]*href="([^"]+)"/i);
      if (lm) link = lm[1];
    }
    const description = tagContent(inner, 'description') || tagContent(inner, 'summary') || tagContent(inner, 'content');
    const pubDate     = tagContent(inner, 'pubDate') || tagContent(inner, 'published') || tagContent(inner, 'updated');
    if (title && link) items.push({ title, link, description, pubDate });
  }
  return items;
}

// ─── Per-feed fetch ─────────────────────────────────────────────────────────

interface RawHit {
  feed: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

async function fetchFeed(feed: Feed): Promise<RawHit[]> {
  const res = await fetch(feed.url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const items = parseRss(xml);
  return items
    .filter(it => passesFilter(it.title, it.description))
    .map(it => ({
      feed: feed.name,
      title: it.title,
      link: it.link,
      description: it.description.slice(0, 600),
      pubDate: it.pubDate,
    }));
}

// ─── Output shape ───────────────────────────────────────────────────────────

interface RefineryOutage {
  id: string;                  // stable hash of URL
  headline: string;
  url: string;
  source: string;              // feed name
  publishedAt: string;         // ISO date if parseable, else original string
  region: Region;
  outageType: OutageType;
  severity: Severity;
  summary: string;             // truncated description
}

function stableId(url: string): string {
  return crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
}

function toIsoDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toISOString();
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🛢  EuroOilWatch — Refinery Outage Tracker');
  console.log('='.repeat(50));

  const allHits: RawHit[] = [];
  for (const feed of FEEDS) {
    try {
      const hits = await fetchFeed(feed);
      console.log(`  ${feed.name.padEnd(28)} ${hits.length} hit(s)`);
      allHits.push(...hits);
    } catch (err: any) {
      console.warn(`  ${feed.name.padEnd(28)} ⚠ ${err.message}`);
    }
  }

  // Build outages, dedupe by URL hash.
  const seen = new Set<string>();
  const outages: RefineryOutage[] = [];
  for (const h of allHits) {
    const id = stableId(h.link);
    if (seen.has(id)) continue;
    seen.add(id);
    outages.push({
      id,
      headline:    h.title,
      url:         h.link,
      source:      h.feed,
      publishedAt: toIsoDate(h.pubDate),
      region:      inferRegion(h.title, h.description),
      outageType:  inferOutageType(h.title, h.description),
      severity:    inferSeverity(h.title, h.description),
      summary:     h.description,
    });
  }

  // Sort newest first; entries without parseable dates fall to the bottom.
  outages.sort((a, b) => {
    const ta = Date.parse(a.publishedAt) || 0;
    const tb = Date.parse(b.publishedAt) || 0;
    return tb - ta;
  });

  const output = {
    lastUpdated: new Date().toISOString(),
    source: 'Aggregated from trade-press RSS (gCaptain, Splash247, Maritime Executive, Hellenic Shipping News, OilPrice)',
    feeds: FEEDS.map(f => f.name),
    count: outages.length,
    outages,
  };

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n  Total outage headlines: ${outages.length}`);
  outages.slice(0, 10).forEach(o =>
    console.log(`  [${o.severity.toUpperCase().padEnd(8)}] ${o.region.padEnd(11)} ${o.outageType.padEnd(10)} — ${o.headline.slice(0, 80)}`)
  );
  console.log(`\n✅ Written to ${OUTPUT_FILE}`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
