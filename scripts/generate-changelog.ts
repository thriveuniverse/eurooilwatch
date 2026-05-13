/**
 * Reads `git log` and emits a categorised changelog as data/changelog.json.
 *
 * Runs as part of `prebuild` so the file is always fresh on each Netlify
 * deploy. The file is then served by /api/v1/changelog and rendered on the
 * /changelog page and /rss.xml feed.
 *
 * Filters: includes newsletters, new analysis, new insights, new reports,
 * and `feat:` commits. Skips data-update churn, fixes, UI tweaks, docs.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ChangelogEvent {
  hash: string;
  shortHash: string;
  date: string;          // ISO 8601
  category: 'newsletter' | 'analysis' | 'insight' | 'feature' | 'report';
  title: string;         // commit subject (with prefix stripped where useful)
  rawSubject: string;
  url: string | null;    // best-effort link to the relevant page (relative)
}

const SITE_BASE_URL =
  process.env.SITE_BASE_URL ??
  (() => {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
      const name = pkg.name as string;
      if (name === 'ukoilwatch')        return 'https://ukoilwatch.com';
      if (name === 'eurooilwatch')      return 'https://eurooilwatch.com';
      if (name === 'americasoilwatch')  return 'https://americasoilwatch.com';
    } catch {}
    return '';
  })();

function categorise(subject: string): ChangelogEvent['category'] | null {
  if (/^newsletter:/i.test(subject))                 return 'newsletter';
  if (/^chore: newsletter sent/i.test(subject))      return 'newsletter';
  if (/^analysis:/i.test(subject))                   return 'analysis';
  if (/^insights?:/i.test(subject))                  return 'insight';
  if (/^chore\(reports\):/i.test(subject))           return 'report';
  if (/^feat(\(.+\))?:/i.test(subject))              return 'feature';
  return null;
}

function deriveUrl(category: string, subject: string): string | null {
  if (category === 'newsletter') return '/briefings';
  if (category === 'analysis')   return '/analysis';
  if (category === 'insight')    return '/insights';
  if (category === 'report')     return '/reports';
  if (category === 'feature') {
    const m = subject.match(/^feat\(([^)]+)\):/i);
    if (m) {
      const section = m[1].toLowerCase();
      const sectionMap: Record<string, string> = {
        jet: '/jet',
        gas: '/gas',
        supply: '/supply',
        prices: '/prices',
        api: '/api',
        og: '/',
        home: '/',
        homepage: '/',
        data: '/api',
        methodology: '/methodology',
      };
      return sectionMap[section] ?? '/';
    }
    return '/';
  }
  return null;
}

function cleanTitle(category: string, subject: string): string {
  // Strip the conventional-commits prefix for display
  let title = subject;
  if (category === 'newsletter') {
    title = title.replace(/^newsletter:\s*/i, '');
    title = title.replace(/^chore: newsletter sent\s*/i, '');
  } else if (category === 'analysis') {
    title = title.replace(/^analysis:\s*/i, '');
  } else if (category === 'insight') {
    title = title.replace(/^insights?:\s*/i, '');
  } else if (category === 'report') {
    title = title.replace(/^chore\(reports\):\s*/i, '');
  } else if (category === 'feature') {
    title = title.replace(/^feat(\([^)]+\))?:\s*/i, '');
  }
  // First-letter cap
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function generate(maxAgeDays = 90, limit = 60): { lastUpdated: string; events: ChangelogEvent[] } {
  let stdout = '';
  try {
    stdout = execSync(
      `git log --since="${maxAgeDays} days ago" --pretty=format:"%H|%ai|%s" --no-merges`,
      { encoding: 'utf-8', cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (e: any) {
    console.error('git log failed:', e.message);
    return { lastUpdated: new Date().toISOString(), events: [] };
  }

  const events: ChangelogEvent[] = [];
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;
    const [hash, isoDate, ...subjectParts] = line.split('|');
    const subject = subjectParts.join('|');
    const category = categorise(subject);
    if (!category) continue;
    events.push({
      hash,
      shortHash: hash.slice(0, 7),
      date: new Date(isoDate).toISOString(),
      category,
      title: cleanTitle(category, subject),
      rawSubject: subject,
      url: deriveUrl(category, subject),
    });
    if (events.length >= limit) break;
  }

  return { lastUpdated: new Date().toISOString(), events };
}

const out = generate();
const outPath = path.join(process.cwd(), 'data', 'changelog.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({
  ...out,
  siteBaseUrl: SITE_BASE_URL,
}, null, 2));

console.log(`Wrote ${out.events.length} events to ${outPath}`);
for (const e of out.events.slice(0, 10)) {
  console.log(`  [${e.category.padEnd(10)}] ${e.date.slice(0, 10)}  ${e.title}`);
}
if (out.events.length > 10) console.log(`  ... and ${out.events.length - 10} more`);
