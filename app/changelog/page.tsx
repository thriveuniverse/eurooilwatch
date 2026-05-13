import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'What Changed — EuroOilWatch',
  description:
    'Recent activity across the OilWatch network: newsletters sent, new analysis, reports, and dashboard features. Plus an RSS feed for journalists who want updates from all three sites.',
  alternates: { canonical: 'https://eurooilwatch.com/changelog' },
};

interface ChangelogEvent {
  hash: string;
  shortHash: string;
  date: string;
  category: 'newsletter' | 'analysis' | 'insight' | 'feature' | 'report';
  title: string;
  url: string | null;
}

interface ChangelogFile {
  lastUpdated: string;
  events: ChangelogEvent[];
  siteBaseUrl: string;
}

interface NetworkFeed {
  site: 'UKOilWatch' | 'EuroOilWatch' | 'AmericasOilWatch';
  baseUrl: string;
  rssUrl: string;
  events: ChangelogEvent[];
  fetchedAt: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  newsletter: 'Newsletter',
  analysis:   'Analysis',
  insight:    'Insight',
  feature:    'Dashboard',
  report:     'Report',
};

const CATEGORY_BADGE: Record<string, string> = {
  newsletter: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  analysis:   'bg-blue-900/40 text-blue-300 border-blue-700/50',
  insight:    'bg-blue-900/40 text-blue-300 border-blue-700/50',
  feature:    'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  report:     'bg-red-900/40 text-red-300 border-red-700/50',
};

function loadLocal(): ChangelogFile | null {
  const p = path.join(process.cwd(), 'data', 'changelog.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as ChangelogFile; } catch { return null; }
}

async function loadRemote(name: NetworkFeed['site'], baseUrl: string): Promise<NetworkFeed> {
  const rssUrl = `${baseUrl}/rss.xml`;
  try {
    const res = await fetch(`${baseUrl}/api/v1/changelog`, { next: { revalidate: 3600 } });
    if (!res.ok) return { site: name, baseUrl, rssUrl, events: [], fetchedAt: null };
    const data = await res.json() as ChangelogFile;
    return { site: name, baseUrl, rssUrl, events: data.events ?? [], fetchedAt: data.lastUpdated };
  } catch {
    return { site: name, baseUrl, rssUrl, events: [], fetchedAt: null };
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function FeedColumn({ feed, ownSite }: { feed: NetworkFeed; ownSite: boolean }) {
  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">{feed.site}</h2>
          <a href={feed.baseUrl} target={ownSite ? undefined : '_blank'} rel={ownSite ? undefined : 'noopener'} className="text-[10px] font-mono text-gray-500 hover:underline">
            {feed.baseUrl.replace(/^https?:\/\//, '')}{ownSite ? '' : ' ↗'}
          </a>
        </div>
        <a href={feed.rssUrl} className="text-[10px] font-mono text-amber-300 hover:underline">RSS →</a>
      </div>
      <div className="divide-y divide-oil-800/40">
        {feed.events.length === 0 ? (
          <div className="px-5 py-4 text-xs text-gray-500">No recent events.</div>
        ) : feed.events.slice(0, 20).map(e => {
          const link = e.url ? `${feed.baseUrl}${e.url}` : feed.baseUrl;
          return (
            <a key={e.hash} href={link} target={ownSite && e.url ? undefined : '_blank'} rel={ownSite && e.url ? undefined : 'noopener'}
              className="block px-5 py-3 hover:bg-oil-800/20 transition group">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${CATEGORY_BADGE[e.category] ?? 'bg-oil-800/40 text-gray-400 border-oil-700'}`}>
                  {CATEGORY_LABEL[e.category] ?? e.category}
                </span>
                <span className="text-[10px] font-mono text-gray-600">{formatDate(e.date)}</span>
              </div>
              <p className="text-xs text-gray-200 group-hover:text-white transition leading-snug">{e.title}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default async function ChangelogPage() {
  const local = loadLocal();

  const [uk, americas] = await Promise.all([
    loadRemote('UKOilWatch',       'https://ukoilwatch.com'),
    loadRemote('AmericasOilWatch', 'https://americasoilwatch.com'),
  ]);

  const euroFeed: NetworkFeed = {
    site: 'EuroOilWatch',
    baseUrl: 'https://eurooilwatch.com',
    rssUrl:  'https://eurooilwatch.com/rss.xml',
    events:  local?.events ?? [],
    fetchedAt: local?.lastUpdated ?? null,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">What Changed — Across the OilWatch Network</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Recent activity across UKOilWatch, EuroOilWatch and AmericasOilWatch — newsletters sent,
          new analysis and insights, reports refreshed, and dashboard features added. Each site has
          its own RSS feed (linked in the corner of each column) for subscription.
        </p>
      </div>

      {/* RSS / API helper */}
      <section className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">
          Subscribe or fetch programmatically
        </h2>
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {[uk, euroFeed, americas].map(f => (
            <div key={f.site} className="rounded border border-oil-800 bg-oil-950/40 px-3 py-2">
              <p className="text-gray-300 font-medium">{f.site}</p>
              <p className="font-mono text-[11px] text-amber-300 break-all">
                <a href={f.rssUrl} className="hover:underline">{f.rssUrl.replace(/^https?:\/\//, '')}</a>
              </p>
              <p className="font-mono text-[10px] text-gray-500 break-all mt-1">
                <a href={`${f.baseUrl}/api/v1/changelog`} className="hover:underline">{f.baseUrl.replace(/^https?:\/\//, '')}/api/v1/changelog</a>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Three-column network view */}
      <div className="grid lg:grid-cols-3 gap-4">
        <FeedColumn feed={uk}        ownSite={false} />
        <FeedColumn feed={euroFeed}  ownSite />
        <FeedColumn feed={americas}  ownSite={false} />
      </div>

      <p className="text-[11px] text-gray-600 text-center">
        Auto-refreshes hourly. Network feeds fetched from each site&apos;s public API.
      </p>
    </div>
  );
}
