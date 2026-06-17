import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Research — the Compound Cascade framework & Institutional Failure typology | EuroOilWatch',
  description:
    'The analytical backbone beneath EuroOilWatch: an original framework for how systemic crises propagate (Compound Cascade Systems Modelling), its companion typology of why institutions fail to see them coming (Institutional Failure Mode Typology), and the interactive instruments that put both to work.',
  alternates: { canonical: 'https://eurooilwatch.com/research' },
  openGraph: {
    title: 'Research — Compound Cascade framework & Institutional Failure typology',
    description:
      'The reasoning apparatus beneath the dashboards: how systemic crises propagate, why institutions fail to see them coming, and the interactive tools that operationalise both.',
    url: 'https://eurooilwatch.com/research',
    siteName: 'EuroOilWatch',
    type: 'website',
  },
};

const LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Research — EuroOilWatch',
  url: 'https://eurooilwatch.com/research',
  description:
    'Original research underlying EuroOilWatch: the Compound Cascade Systems Modelling framework and the Institutional Failure Mode Typology, with the interactive instruments that operationalise them.',
  author: { '@type': 'Person', name: 'Jonathan Kelly' },
  publisher: { '@type': 'Organization', name: 'EuroOilWatch', url: 'https://eurooilwatch.com' },
  hasPart: [
    {
      '@type': 'CreativeWork',
      name: 'Compound Cascade Systems Modelling Framework',
      url: 'https://eurooilwatch.com/methodology/compound-cascade',
      author: { '@type': 'Person', name: 'Jonathan Kelly' },
    },
    {
      '@type': 'CreativeWork',
      name: 'Institutional Failure Mode Typology',
      url: 'https://eurooilwatch.com/analysis/institutional-failure-typology',
      author: { '@type': 'Person', name: 'Jonathan Kelly' },
    },
  ],
};

export default function ResearchPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />

      <header className="space-y-3">
        <div className="text-[11px] font-mono font-semibold tracking-[0.3em] text-oil-400 uppercase">
          OilWatch Intelligence · Research
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Research</h1>
        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
          The analytical backbone beneath the coverage. An original framework for how systemic crises
          propagate, its companion typology of why institutions fail to see them coming, and the interactive
          instruments that put both to work. The dashboards and briefings <em>apply</em> this apparatus; here it
          is set out in full. Original research by{' '}
          <strong className="text-gray-300">Jonathan Kelly</strong>.
        </p>
      </header>

      {/* The two papers */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase">
          The framework and its companion
        </h2>

        <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-6 py-5 space-y-2">
          <h3 className="text-lg font-bold text-white">Compound Cascade Systems Modelling</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            A reusable framework for how a shock in one system propagates into others through coupling
            dynamics — and how that propagation can be modelled, bounded, and interrupted. The methodology
            underlying the <em>From Hormuz to Hunger</em> and <em>The Fall of the UK</em> analyses.
          </p>
          <p className="text-sm">
            <a href="/methodology/compound-cascade" className="text-oil-400 hover:text-white underline underline-offset-2">
              Read the framework →
            </a>
            {'   ·   '}
            <a
              href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6695618"
              target="_blank"
              rel="noopener noreferrer"
              className="text-oil-400 hover:text-white underline underline-offset-2"
            >
              On SSRN ↗
            </a>
          </p>
        </div>

        <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-6 py-5 space-y-2">
          <h3 className="text-lg font-bold text-white">Institutional Failure Mode Typology</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            The perceptual-side companion: five recurring structural mechanisms by which institutions fail to
            perceive compound cascade risk — mandate-bounded blindness, model selection bias, sunk-cost
            epistemology, audience-induced distortion, and coordination failure — calibrated against Iran 1979,
            Challenger, the 2008 financial crisis, Iraq WMD, and the 2023 regional-banking failures. The
            framework asks <em>how cascades propagate</em>; the typology asks <em>why institutions fail to see
            them coming</em>.
          </p>
          <p className="text-sm">
            <a href="/analysis/institutional-failure-typology" className="text-oil-400 hover:text-white underline underline-offset-2">
              Read the typology →
            </a>
          </p>
        </div>
      </section>

      {/* Strategic reports & applied analysis */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase">
          Strategic reports &amp; applied analysis
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
          The framework applied to live and historical shocks — how a disruption propagates through real
          infrastructure, markets and institutions.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <a href="/analysis/the-missing-barrel-energy-infrastructure-blind-spot" className="block rounded-lg border border-oil-800 bg-oil-900/30 px-6 py-5 space-y-2 hover:border-oil-600 transition">
            <h3 className="text-base font-bold text-white">The Missing Barrel</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Why energy <em>infrastructure</em> — not the barrel count — is the blind spot in the oil shock. The
              capstone, infrastructure-level statement of the framework.
            </p>
          </a>
          <a href="/analysis/russia-fuel-shortage-food-logistics" className="block rounded-lg border border-oil-800 bg-oil-900/30 px-6 py-5 space-y-2 hover:border-oil-600 transition">
            <h3 className="text-base font-bold text-white">Russia's Fuel Shortage: a Food-Logistics Warning</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              A live compound-cascade case: drone-driven refining strain turning fuel into the bottleneck through
              which food, logistics and public confidence must pass.
            </p>
          </a>
          <a href="/reports/from-hormuz-to-hunger" className="block rounded-lg border border-oil-800 bg-oil-900/30 px-6 py-5 space-y-2 hover:border-oil-600 transition">
            <h3 className="text-base font-bold text-white">From Hormuz to Hunger</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              The fuel-to-food cascade set off by a Gulf chokepoint shock — the original application of the framework.
            </p>
          </a>
          <a href="/reports/the-fall-of-the-uk" className="block rounded-lg border border-oil-800 bg-oil-900/30 px-6 py-5 space-y-2 hover:border-oil-600 transition">
            <h3 className="text-base font-bold text-white">The Fall of the UK?</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              What a shrinking domestic refining base and deep import-dependence mean for national fuel security.
            </p>
          </a>
        </div>
      </section>

      {/* The interactive instruments */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase">
          The interactive instruments
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
          The framework is not only argued — it is built. These are reasoning tools, not forecasts: every
          probability, edge, and buffer figure is an input you can change and watch propagate.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-6 py-5 space-y-2">
            <h3 className="text-base font-bold text-white">The Doom Loop Engine</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              A fragility risk register, a buffer-coupled Monte-Carlo cascade simulator, and a country
              vulnerability-tiering model — three instruments that answer different questions and can
              legitimately disagree.
            </p>
            <p className="text-sm">
              <a href="/doom-loop" className="text-oil-400 hover:text-white underline underline-offset-2">
                Open the tools →
              </a>
            </p>
          </div>

          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-6 py-5 space-y-2">
            <h3 className="text-base font-bold text-white">The Hormuz Inventory Runway</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              An interactive depletion model on the months-not-weeks footing: how long the accessible oil
              cushion lasts under a sustained Hormuz draw, and how precautionary hoarding compresses it.
            </p>
            <p className="text-sm">
              <a href="/runway" className="text-oil-400 hover:text-white underline underline-offset-2">
                Open the model →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Book section — add when ready (title, status, link/pre-order) */}

      <section className="rounded-lg border border-oil-700/60 bg-oil-900/40 px-6 py-5 space-y-2">
        <h2 className="text-base font-bold text-white">Independent research</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          These are working papers and reasoning tools, not financial advice. They are offered as analytical
          scaffolds: every assumption is stated and contestable, and the framework's value is that a sceptic can
          change the inputs and watch the conclusion build or dissolve under their own hand. See also the{' '}
          <a href="/methodology" className="text-oil-400 hover:text-white underline underline-offset-2">
            methodology index
          </a>.
        </p>
      </section>
    </div>
  );
}
