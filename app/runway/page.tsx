import type { Metadata } from 'next';
import ToolFrame from '@/components/ToolFrame';

export const metadata: Metadata = {
  title: 'The Hormuz Inventory Runway — interactive depletion model',
  description:
    'How long the accessible oil cushion lasts under a sustained Hormuz draw — and how precautionary hoarding compresses it. A reasoning tool on the months-not-weeks footing, not a price forecast.',
  alternates: { canonical: 'https://eurooilwatch.com/runway' },
  openGraph: {
    title: 'The Hormuz Inventory Runway — OilWatch',
    description:
      'Interactive runway model: the accessible commercial buffer drains in months, and fear is the accelerant. Change the assumptions and argue with the result.',
    url: 'https://eurooilwatch.com/runway',
    type: 'website',
  },
};

const LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'The Hormuz Inventory Runway',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web browser',
  isAccessibleForFree: true,
  url: 'https://eurooilwatch.com/runway',
  description:
    'Interactive inventory-runway model for a sustained Strait of Hormuz disruption, with a hoarding-feedback scenario. The accessible commercial buffer drains in months; precautionary demand compresses the runway.',
  publisher: { '@type': 'Organization', name: 'EuroOilWatch', url: 'https://eurooilwatch.com' },
};

export default function RunwayPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />

      <header className="space-y-3">
        <div className="text-[11px] font-mono font-semibold tracking-[0.3em] text-oil-400 uppercase">
          OilWatch Intelligence · Compound-cascade · Hormuz
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">The Hormuz Inventory Runway</h1>
        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
          A softer Brent price has not refilled the world&rsquo;s tanks. This is a reasoning tool, not a forecast:
          it asks how long the <span className="text-gray-200">accessible</span> commercial cushion lasts under a
          sustained draw — and how much fear, once shortage becomes visible, compresses that runway. Drag the dial
          and watch the floor-breach date move under your own hand.
        </p>
      </header>

      <section className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase mb-2">
          Months, not weeks — and not years
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          The reassuring headline — ~8.2 billion barrels of global observed stock — is misleading: roughly half is
          OECD inventory, much of it strategic or obligation-bound; a quarter is oil on water; ~15% is opaque
          Chinese stock. <span className="text-gray-200">Accessible ≪ headline.</span> But the accessible buffer
          does not drain at the 6–8.5&nbsp;mb/d <em>total</em> draw either — that is met largely from the
          non-accessible buckets. It drains at the OECD-paced ~1.6&nbsp;mb/d implied by the EIA&rsquo;s own
          Jan→Dec path, which puts the runway in <span className="text-oil-300">months</span>, converging on the
          EIA&rsquo;s own projection of a two-decade stock low by year-end. The dial below shows the one thing that
          model can&rsquo;t source: how precautionary buying pulls that date forward.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Hoarding-feedback runway</h2>
        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
          Buffer = OECD commercial stock above the (estimated) systemic operating floor. Structural draw is the
          OECD-paced ~1.6&nbsp;mb/d; precautionary demand ramps with depletion once a realisation trigger fires.
          The linear baseline (draw holds) breaches around mid-2027; fear compresses it.
        </p>
        <ToolFrame src="/hoarding-runway.html" title="Hormuz Inventory Runway — hoarding feedback" minHeight={820} />
      </section>

      <section className="rounded-lg border border-oil-700/60 bg-oil-900/40 px-6 py-5 space-y-3">
        <h2 className="text-base font-bold text-white">Read this honestly</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          The draw rates and inventory levels are EIA/IEA-sourced; the operating-floor level and the panic
          parameters are <span className="text-gray-200">OilWatch estimates, flagged as such</span>. This is a
          behavioural scenario model, not a price forecast — and the runway is a range (toward the EIA&rsquo;s
          two-decade low by ~year-end; genuine operating stress into 2027), not a single breach date.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          The full argument:{' '}
          <a href="/analysis/hormuz-inventory-runway" className="text-oil-400 hover:text-white underline underline-offset-2">
            Europe&rsquo;s Borrowed Calm →
          </a>
          {'  ·  '}
          <a href="/methodology" className="text-oil-400 hover:text-white underline underline-offset-2">
            Methodology
          </a>
        </p>
      </section>
    </div>
  );
}
