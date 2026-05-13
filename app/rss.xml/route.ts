/**
 * RSS 2.0 feed for the UKOilWatch changelog.
 * Subscribe at https://ukoilwatch.com/rss.xml
 */

import fs from 'fs';
import path from 'path';

export const revalidate = 3600;

const SITE_URL = 'https://eurooilwatch.com';
const SITE_TITLE = 'EuroOilWatch — EU-27 Fuel Reserve & Price Intelligence';
const SITE_DESC = 'Newsletters, analysis, reports and dashboard features from EuroOilWatch. Daily-refreshed EU fuel security data with full attribution.';

interface ChangelogEvent {
  hash: string;
  shortHash: string;
  date: string;
  category: string;
  title: string;
  url: string | null;
}

interface ChangelogFile {
  lastUpdated: string;
  events: ChangelogEvent[];
  siteBaseUrl: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const CATEGORY_LABEL: Record<string, string> = {
  newsletter: 'Newsletter',
  analysis:   'Analysis',
  insight:    'Insight',
  feature:    'Dashboard feature',
  report:     'Report',
};

export async function GET() {
  let data: ChangelogFile | null = null;
  try {
    const p = path.join(process.cwd(), 'data', 'changelog.json');
    if (fs.existsSync(p)) data = JSON.parse(fs.readFileSync(p, 'utf-8')) as ChangelogFile;
  } catch {}

  const events = data?.events ?? [];

  const items = events.map(e => {
    const link = e.url ? `${SITE_URL}${e.url}` : SITE_URL;
    const label = CATEGORY_LABEL[e.category] ?? e.category;
    const title = `${label}: ${e.title}`;
    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(e.hash)}</guid>
      <pubDate>${new Date(e.date).toUTCString()}</pubDate>
      <category>${escapeXml(label)}</category>
      <description>${escapeXml(`${label} published on EuroOilWatch. ${e.title}`)}</description>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en-GB</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
