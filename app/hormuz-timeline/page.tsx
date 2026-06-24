import type { Metadata } from 'next';
import { getHormuzTimeline } from '@/lib/hormuz-timeline';
import HormuzTimeline from '@/components/HormuzTimeline';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Strait of Hormuz Crisis Timeline (2026) | EuroOilWatch',
  description:
    'A sourced, filterable chronology of the 2026 Strait of Hormuz crisis — military, diplomatic, shipping and market events from the outbreak of war through the fragile reopening. Every entry cited.',
  alternates: { canonical: 'https://eurooilwatch.com/hormuz-timeline' },
  openGraph: {
    title: 'Strait of Hormuz Crisis Timeline (2026) | EuroOilWatch',
    description:
      'Sourced, filterable chronology of the 2026 Strait of Hormuz crisis — outbreak to fragile reopening.',
    url: 'https://eurooilwatch.com/hormuz-timeline',
    siteName: 'EuroOilWatch',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EuroOilWatch Hormuz Timeline' }],
  },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export default function HormuzTimelinePage() {
  const { meta, events, counts, total } = getHormuzTimeline();

  const startMs = Date.parse(meta.crisisStart);
  const crisisDay = Number.isFinite(startMs)
    ? Math.max(1, Math.floor((Date.now() - startMs) / 86_400_000))
    : null;

  const glance: { label: string; value: string }[] = [
    ...(crisisDay ? [{ label: 'Crisis day', value: String(crisisDay) }] : []),
    { label: 'Began', value: fmtDate(meta.crisisStart) },
    { label: 'Logged events', value: String(total) },
    { label: 'Last updated', value: fmtDate(meta.lastUpdated) },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <a href="/supply" className="text-xs text-oil-400 hover:underline">
          ← Supply routes
        </a>
        <h1 className="mt-2 text-2xl font-bold text-white">Strait of Hormuz — Crisis Timeline</h1>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          A sourced, filterable chronology of the 2026 Strait of Hormuz crisis — from the outbreak of
          war on 28 February through the fragile reopening. Europe is more Gulf-dependent than the US,
          so the strait&apos;s swings land hard on European crude and product flows. Every entry links to
          its source; many link to our deeper analysis. Price and threat lead the story; the lagging
          transit data confirms it.
        </p>
        {meta.phase && (
          <p className="mt-2 text-xs font-mono uppercase tracking-wider text-amber-400/80">
            Current phase — {meta.phase}
          </p>
        )}
      </div>

      {/* Crisis at a glance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {glance.map((g) => (
          <div key={g.label} className="rounded-lg border border-oil-800 bg-oil-900/30 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">{g.label}</p>
            <p className="mt-1 text-lg font-bold text-white font-mono">{g.value}</p>
          </div>
        ))}
      </div>

      <HormuzTimeline events={events} counts={counts} total={total} />

      <p className="text-[10px] text-gray-600 leading-relaxed border-t border-oil-800/40 pt-4">
        Editorially maintained and independently verified against the cited sources. Source links are to
        outlet and date; the claim stands even if a link later expires. This is analysis, not financial advice.
        For live chokepoint transit data see the{' '}
        <a href="/supply" className="underline hover:text-gray-300">Chokepoint Transit Monitor</a>.
      </p>
    </div>
  );
}
