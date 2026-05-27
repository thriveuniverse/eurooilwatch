import type { Metadata } from 'next';
import FertilizerWatchPanel from '@/components/FertilizerWatchPanel';
import EmailCTA from '@/components/EmailCTA';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Fertilizer Watch — The Hormuz-to-Hunger Operational Tracker | EuroOilWatch',
  description:
    'Live editorial tracker of global urea, ammonia, DAP, potash and TTF natural gas prices. The operational layer beneath the From Hormuz to Hunger analysis. European angle.',
  alternates: { canonical: 'https://eurooilwatch.com/fertilizer' },
  openGraph: {
    title: 'Fertilizer Watch — The Hormuz-to-Hunger Operational Tracker',
    description: 'Live editorial tracker of global urea, ammonia, DAP, potash and TTF natural gas prices.',
    url: 'https://eurooilwatch.com/fertilizer',
    siteName: 'EuroOilWatch',
    type: 'article',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Fertilizer Watch' }],
  },
};

export default function FertilizerPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>

        <p className="mt-6 text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          Fertilizer Watch — Hormuz-to-Hunger operational tracker
        </p>

        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white leading-tight">
          The oil market sees the chokepoint. The fertilizer market is where it lands.
        </h1>
      </header>

      <article className="space-y-5 text-[15px] text-gray-300 leading-relaxed">
        <p>
          Hormuz, the Red Sea and the Black Sea aren&apos;t just oil chokepoints. They&apos;re
          <strong className="text-white"> fertilizer chokepoints</strong>. Five nations on the wrong side of these
          routes — Iran, Qatar, Saudi Arabia, the UAE and Russia — between them control disproportionate shares of
          global urea, ammonia and potash exports. When Hormuz tightens, the price of growing food in the rest of
          the world goes up before the price of driving across it does.
        </p>
        <p>
          This page tracks the operative numbers: <strong className="text-white">urea, ammonia, DAP, potash and TTF
          natural gas</strong>. The first four are the world&apos;s nitrogen and phosphate benchmarks. TTF is included
          because European ammonia capacity is gas-cost-bound — when TTF rises, European plants idle and the region
          becomes more Gulf-dependent. Together these readings are the operational layer beneath the editorial
          argument made in our{' '}
          <a href="/reports/from-hormuz-to-hunger" className="text-amber-300 hover:underline">From Hormuz to Hunger</a>{' '}
          analysis.
        </p>
      </article>

      <FertilizerWatchPanel />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Why it matters for Europe</h2>
        <p className="text-[15px] text-gray-300 leading-relaxed">
          Europe&apos;s fertilizer story runs through one chart: TTF natural gas. European ammonia plants —
          BASF Antwerp, Yara Sluiskil, OCI Geleen, BASF Ludwigshafen — are all gas-cost-bound. When TTF rises,
          the marginal cost of producing ammonia in Europe exceeds the cost of importing it. Plants idle. Production
          falls. Europe inhales more Gulf urea and ammonia at exactly the moment those Gulf flows are constrained
          by Hormuz.
        </p>
        <p className="text-[15px] text-gray-300 leading-relaxed">
          The 2022 gas crisis demonstrated this dynamic at speed: European nitrogen output fell roughly 70% at peak,
          and the continent absorbed the slack from Russian and Gulf imports. The Iran war reactivates the same
          loop with a much tighter physical supply ceiling on the other end. EU farmers face the same Q3 2026
          buying-window timing problem as their UK counterparts, with the additional risk that European producer
          prices remain hostage to TTF for the duration of the war.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">The chain</h2>
        <p className="text-sm text-gray-400">
          How a Hormuz chokepoint becomes a food-security event, in seven operational steps.
        </p>
        <ol className="space-y-3 text-[15px] text-gray-300 list-decimal pl-6">
          <li>
            Hormuz / Red Sea disruption throttles Gulf urea and ammonia exports — Iran, Qatar, Saudi Arabia, UAE,
            Bahrain, five producer nations on the wrong side of the chokepoint.
          </li>
          <li>
            Global benchmark prices spike. World Bank Pink Sheet, April 2026: nitrogen up ~70% across the board;
            US urea +52% since the strikes.
          </li>
          <li>
            European ammonia plants idle as TTF natural gas rises — production cost exceeds the cost of importing
            finished product.
          </li>
          <li>
            Import-dependent regions (South Asia, Sub-Saharan Africa, Brazil, the Sahel) face fertilizer scarcity
            and price shocks they cannot absorb at consumer level.
          </li>
          <li>
            Non-linear yield collapse on the next crop cycle: a 10% nitrogen reduction produces ~25% yield loss
            in well-fertilized agriculture — and 30–50% on the world&apos;s most marginal soils.
          </li>
          <li>
            Food prices rise in import-dependent countries. Sovereign-debt and export-ban doom loops accelerate.
          </li>
          <li>
            If the blockade extends past the August threshold identified in our Hormuz to Hunger model, the damage
            transitions from one missed crop cycle into compounding multi-cycle collapse.
          </li>
        </ol>
      </section>

      <section className="rounded-lg border border-amber-800/40 bg-amber-950/10 px-5 py-5 space-y-3">
        <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
          Read the full analysis
        </p>
        <h2 className="text-lg font-semibold text-white">From Hormuz to Hunger — Policy Brief + Technical Report (v4)</h2>
        <p className="text-sm text-gray-400">
          The systems analysis behind this page — nine causal chains, scenario-weighted estimates, historical
          calibration against nine famines, and policy recommendations. Free, no signup required.
        </p>
        <a
          href="/reports/from-hormuz-to-hunger"
          className="inline-block rounded-md bg-amber-700 hover:bg-amber-600 text-white text-sm px-4 py-2 transition font-medium"
        >
          Read the full analysis →
        </a>
      </section>

      <EmailCTA />

      <footer className="border-t border-oil-800/40 pt-6 mt-8 space-y-3 text-xs text-gray-500">
        <p>
          <strong className="text-gray-400">Also published on:</strong>{' '}
          <a href="https://ukoilwatch.com/fertilizer" className="text-oil-400 hover:underline">ukoilwatch.com</a>
          {' · '}
          <a href="https://americasoilwatch.com/fertilizer" className="text-oil-400 hover:underline">americasoilwatch.com</a>
        </p>
        <p>
          <strong className="text-gray-400">Sources:</strong> World Bank Pink Sheet, Argus, Reuters, Bloomberg,
          Green Markets, CRU, ICE, IFA, USDA Foreign Agricultural Service. Editorial reading is our market
          interpretation.
        </p>
      </footer>
    </div>
  );
}
