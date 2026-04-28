import type { Metadata } from 'next';
import {
  getRefineryOutages,
  type RefineryOutage,
  type RefineryOutageSeverity,
  type RefineryRegion,
} from '@/lib/data';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Refinery Outages & Turnarounds | EuroOilWatch',
  description:
    'Live tracker of refinery outages, fires, shutdowns, strikes and turnarounds aggregated from trade-press feeds. Region-tagged, severity-inferred, source-linked.',
  alternates: { canonical: 'https://eurooilwatch.com/refineries' },
  openGraph: {
    title: 'Refinery Outages & Turnarounds | EuroOilWatch',
    description: 'Live tracker of refinery outages and disruptions across Europe, the UK, Americas and beyond.',
    url: 'https://eurooilwatch.com/refineries',
    siteName: 'EuroOilWatch',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EuroOilWatch Refinery Outages' }],
  },
};

const SEVERITY_COLOR: Record<RefineryOutageSeverity, string> = {
  critical: 'text-red-400 border-red-900/50 bg-red-950/30',
  high:     'text-orange-400 border-orange-900/50 bg-orange-950/30',
  elevated: 'text-yellow-400 border-yellow-900/50 bg-yellow-950/30',
  normal:   'text-green-400 border-green-900/50 bg-green-950/30',
};

const REGION_LABEL: Record<RefineryRegion, string> = {
  europe:        'Europe',
  uk:            'UK',
  americas:      'Americas',
  asia:          'Asia',
  'middle-east': 'Middle East',
  africa:        'Africa',
  other:         'Other',
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RefineriesPage() {
  const data = getRefineryOutages();
  const outages = data?.outages ?? [];

  const byRegion = outages.reduce<Record<RefineryRegion, RefineryOutage[]>>((acc, o) => {
    (acc[o.region] ??= []).push(o);
    return acc;
  }, {} as Record<RefineryRegion, RefineryOutage[]>);

  const REGION_ORDER: RefineryRegion[] = ['europe', 'uk', 'americas', 'middle-east', 'africa', 'asia', 'other'];

  const counts = {
    critical: outages.filter(o => o.severity === 'critical').length,
    high:     outages.filter(o => o.severity === 'high').length,
    elevated: outages.filter(o => o.severity === 'elevated').length,
    normal:   outages.filter(o => o.severity === 'normal').length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Refinery Outages &amp; Turnarounds</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Aggregated headlines on refinery fires, unplanned shutdowns, strikes, force-majeure events and planned
          turnarounds — sourced from free trade-press RSS feeds, keyword-filtered and region-tagged. Click through to
          read the original article. Severity is heuristic; treat as a triage feed, not verified intelligence.
        </p>
      </header>

      {/* Summary card */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">
          Current Window
        </h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="text-red-400">Critical: <strong>{counts.critical}</strong></span>
          <span className="text-orange-400">High: <strong>{counts.high}</strong></span>
          <span className="text-yellow-400">Elevated: <strong>{counts.elevated}</strong></span>
          <span className="text-green-400">Normal: <strong>{counts.normal}</strong></span>
          <span className="text-gray-500 ml-auto">Total: {outages.length}</span>
        </div>
        <p className="mt-3 text-[11px] text-gray-600">
          Last updated: {data?.lastUpdated ? formatDate(data.lastUpdated) : '—'} ·
          Feeds: {data?.feeds.join(' · ') ?? '—'}
        </p>
      </div>

      {/* No data fallback */}
      {outages.length === 0 && (
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-8 text-center">
          <p className="text-sm text-gray-400">
            No refinery outage headlines in the current window. This is normal on quiet news days —
            the tracker scans trade-press feeds and only surfaces stories matching refinery+disruption keywords.
          </p>
        </div>
      )}

      {/* By region */}
      {REGION_ORDER.filter(r => byRegion[r]?.length).map(region => (
        <section key={region} className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
          <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase">
              {REGION_LABEL[region]}
            </h2>
            <span className="text-[10px] text-gray-600">{byRegion[region].length} item(s)</span>
          </div>
          <ul className="divide-y divide-oil-800/40">
            {byRegion[region].map(o => (
              <li key={o.id} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded border text-[10px] font-mono uppercase tracking-wider ${SEVERITY_COLOR[o.severity]}`}>
                    {o.severity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:text-oil-400 transition">
                      {o.headline}
                    </a>
                    <p className="mt-1 text-xs text-gray-500">
                      <span className="uppercase tracking-wider">{o.outageType}</span>
                      {' · '}
                      <span>{o.source}</span>
                      {' · '}
                      <span>{formatDate(o.publishedAt)}</span>
                    </p>
                    {o.summary && (
                      <p className="mt-1.5 text-xs text-gray-400 line-clamp-3">{o.summary}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Methodology footer */}
      <div className="text-[11px] text-gray-600 border-t border-oil-800/40 pt-4">
        <p>
          <strong className="text-gray-500">Methodology:</strong> RSS feeds from gCaptain, Splash247,
          Maritime Executive, Hellenic Shipping News and OilPrice are scanned for headlines containing both a
          refinery indicator (the words refinery/refining/refiner, a known refinery name, or a refinery unit)
          and a disruption keyword (fire, shutdown, strike, force majeure, turnaround, leak, etc.). Severity,
          region and outage type are inferred heuristically from headline and excerpt. Always click through to
          the original source for full context.
        </p>
      </div>
    </div>
  );
}
