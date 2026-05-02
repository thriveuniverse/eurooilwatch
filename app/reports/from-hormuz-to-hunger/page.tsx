import type { Metadata } from 'next';
import HormuzReportDownloadForm from '@/components/HormuzReportDownloadForm';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'From Hormuz to Hunger — The Compound Cascade That Institutional Models Miss | EuroOilWatch',
  description:
    'Independent systems risk analysis of the global fertilizer disruption following the Strait of Hormuz blockade. Probability-weighted central estimate: 118–225M excess deaths across nine interacting causal chains.',
  alternates: { canonical: 'https://eurooilwatch.com/reports/from-hormuz-to-hunger' },
  openGraph: {
    title: 'From Hormuz to Hunger — The Compound Cascade That Institutional Models Miss',
    description:
      'Independent systems risk analysis of the global fertilizer disruption following the Strait of Hormuz blockade.',
    url: 'https://eurooilwatch.com/reports/from-hormuz-to-hunger',
    siteName: 'EuroOilWatch',
    type: 'article',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'From Hormuz to Hunger' }],
  },
};

export default function HormuzReportPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>

        <p className="mt-6 text-[10px] font-mono font-semibold tracking-widest text-red-400 uppercase">
          Independent Systems Risk Analysis
        </p>

        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white leading-tight">
          The Other Hormuz Crisis: Why Europe&apos;s Fertilizer Dependency Is a Bigger Threat Than the Energy Shock
        </h1>

        <p className="mt-4 text-sm text-gray-400">
          <strong className="text-gray-300">From Hormuz to Hunger</strong> — Policy Brief v3.0 ·
          By <strong className="text-gray-300">Jonathan Kelly</strong> · Published 30 April 2026
        </p>
      </header>

      {/* Distribution note */}
      <aside className="rounded-lg border border-oil-800 bg-oil-900/40 px-5 py-4 text-xs text-gray-400 leading-relaxed">
        <p className="font-mono uppercase tracking-widest text-[10px] text-gray-500 mb-2">Distribution note</p>
        <p>
          This report is an independent technical analysis intended to inform public understanding. It presents
          scenario-based risk estimates derived from stated assumptions and cited sources; it is not a forecast,
          and figures are ranges subject to uncertainty. Readers are encouraged to reference the assumptions,
          confidence levels, and sensitivity analysis when citing conclusions.
        </p>
      </aside>

      {/* Body */}
      <article className="space-y-6 text-[15px] text-gray-300 leading-relaxed">
        <p>
          Europe has spent two months focused on what the Hormuz blockade means for oil and gas prices.
          That is the wrong crisis.
        </p>

        <p>
          The Strait of Hormuz carries approximately <strong className="text-white">30% of internationally traded fertilizer</strong> —
          including 67% of Gulf urea exports. Since the February 28 strikes on Iran and the subsequent closure of
          the strait, that supply has effectively stopped. Unlike oil, where the IEA coordinated the largest
          strategic reserve release in history (400 million barrels), there is no equivalent mechanism for
          fertilizer. <strong className="text-white">No strategic fertilizer reserves exist anywhere in the world.</strong> The FAO
          confirmed this in March 2026.
        </p>

        <p>Europe is uniquely exposed to this crisis, and European policy choices over the past decade have made it worse.</p>

        <h2 className="mt-10 text-xl font-bold text-white">What Europe Did to Itself</h2>
        <p>
          European nitrogen fertilizer production has been in structural decline for years. Energy costs driven by
          the post-2022 gas price environment, the phase-out of free ETS allowances, and the Carbon Border
          Adjustment Mechanism (CBAM) have made European ammonia and urea production uneconomic. Plants have
          closed across Germany, the Netherlands, Poland, and the UK. The continent that once produced a
          significant share of its own nitrogen now imports it — much of it from the Gulf, transiting Hormuz.
        </p>
        <p>
          Fertilizers Europe has documented these closures and warned repeatedly about supply chain vulnerability.
          Those warnings were not acted upon.
        </p>
        <p>
          The result: when Hormuz closed on February 28, Europe had no domestic buffer, no strategic reserves,
          and no coordination mechanism to secure alternative supply. The World Bank&apos;s April 2026 Commodity
          Markets Outlook projects fertilizer prices up 31% in 2026, driven by a 60% urea price surge. European
          farmers are facing input costs that make planting decisions for the 2026–27 season economically
          irrational — and the planting window is closing.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">The Compound Cascade</h2>
        <p>This is where the analysis goes beyond what any European institution is currently modelling.</p>
        <p>
          A fertilizer shortage does not simply mean lower yields. It triggers a compound cascade of nine
          interacting causal chains:
        </p>
        <ol className="list-decimal pl-6 space-y-3 marker:text-oil-400">
          <li>
            <strong className="text-white">Direct yield collapse</strong> — a 10% fertilizer reduction produces approximately 25%
            harvest loss (the relationship is non-linear and varies by crop: 15–20% for well-fertilized commercial
            agriculture, 30–50% for subsistence farming in the Global South where baseline application is lowest)
          </li>
          <li>
            <strong className="text-white">Supply chain lock-in</strong> — even if Hormuz reopens tomorrow, the five-stage supply
            chain lag means restored fertilizer delivery takes 8–14 months
          </li>
          <li>
            <strong className="text-white">Sovereign debt doom loops</strong> — food-importing nations borrow at crisis rates,
            currencies collapse, food becomes unaffordable
          </li>
          <li>
            <strong className="text-white">Fertilizer export cascade</strong> — producing countries restrict exports to protect
            domestic supply (as Russia and China did in 2021–22 under less severe conditions)
          </li>
          <li>
            <strong className="text-white">El Niño convergence</strong> — 40–55% probability of compounding drought across South
            Asia and East Africa
          </li>
          <li>
            <strong className="text-white">Autarkic market fragmentation</strong> — export bans destroy the functioning of global
            food markets entirely
          </li>
          <li>
            <strong className="text-white">Humanitarian access denial</strong> — 60–120 million people in conflict zones cannot
            be reached by aid
          </li>
          <li>
            <strong className="text-white">Logistics ceiling</strong> — WFP can assist ~110 million people; the crisis population
            exceeds 300 million
          </li>
          <li>
            <strong className="text-white">Disease multiplication</strong> — historically, famine-associated disease kills 2–3x
            more than direct starvation
          </li>
        </ol>
        <p>
          No European institution — and no EU body — currently models the interaction between these nine chains.
          They assess them individually and add the results. The historical record of every major famine shows
          that compound interactions produce mortality 3–10x above what additive models project.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">The Numbers</h2>
        <p>
          The full analysis, integrating 18 primary sources (FAO, WFP, UNCTAD, World Bank CMO April 2026, GRFC 2026,
          Fertilizers Europe, and nine historical famine case studies), produces a probability-weighted central
          estimate of <strong className="text-white">118–225 million excess starvation deaths over 2026–2030</strong>.
        </p>
        <p>
          This is an expected-value calculation across all scenarios — not a prediction that this specific number
          will occur. The single most likely scenario (base case, 30–40% probability) produces 95–200 million
          excess deaths. Even the best case — Hormuz reopens by August, El Niño absent, full G20 coordination —
          still produces 32–55 million excess deaths from damage already incurred.
        </p>
        <p>The methodology, sensitivity analysis, and historical calibration are fully documented in the attached reports.</p>

        <h2 className="mt-10 text-xl font-bold text-white">What Europe Can Do</h2>
        <p>The analysis identifies three immediate European policy levers:</p>

        <div className="space-y-4">
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">1. Lead the establishment of a G20 Emergency Fertilizer Facility.</p>
            <p className="mt-2 text-sm text-gray-400">
              Europe created the IEA for oil coordination after the 1973 crisis. No equivalent exists for
              fertilizer. The EU has the institutional architecture and diplomatic weight to build one.
              Estimated impact: 10–25 million lives.
            </p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">2. Restart mothballed European nitrogen plants.</p>
            <p className="mt-2 text-sm text-gray-400">
              Emergency energy subsidies to reactivate closed ammonia and urea capacity would partially offset
              the Hormuz shortfall. This requires suspending or adjusting CBAM and ETS provisions for fertilizer
              production on an emergency basis.
            </p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">3. Diplomatic pressure for Hormuz reopening.</p>
            <p className="mt-2 text-sm text-gray-400">
              Every week the blockade continues past August 2026, the crisis transitions from a one-cycle
              disruption (containable) to multi-cycle compounding (self-sustaining). The EU&apos;s diplomatic
              weight in ceasefire negotiations directly affects the mortality outcome.
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-bold text-white">The Reports</h2>
        <p>
          This analysis has been produced independently using publicly available institutional data. It has been
          reviewed by multiple analytical systems and found to be structurally sound, with appropriate caveats on
          uncertainty ranges.
        </p>
      </article>

      {/* Email-gated download form */}
      <HormuzReportDownloadForm siteName="EuroOilWatch" />

      {/* Update commitment */}
      <p className="text-xs text-gray-500 italic">
        This analysis will be updated as new data becomes available. Key watch points: NOAA May 2026 El Niño
        update, Q3 2026 harvest data, Hormuz shipping restoration metrics.
      </p>

      {/* Footer */}
      <footer className="border-t border-oil-800/40 pt-6 mt-8 space-y-3 text-xs text-gray-500">
        <p>
          <strong className="text-gray-400">Contact:</strong>{' '}
          <a href="mailto:jon@thethriveclan.com" className="text-oil-400 hover:underline">jon@thethriveclan.com</a>
        </p>
        <p>
          <strong className="text-gray-400">Also published on:</strong>{' '}
          <a href="https://ukoilwatch.com/reports/from-hormuz-to-hunger" className="text-oil-400 hover:underline">ukoilwatch.com</a>
          {' · '}
          <a href="https://americasoilwatch.com/reports/from-hormuz-to-hunger" className="text-oil-400 hover:underline">americasoilwatch.com</a>
        </p>
        <p>
          <strong className="text-gray-400">Sources:</strong> FAO, WFP, UNCTAD, World Bank CMO April 2026, GRFC 2026,
          Fertilizers Europe, UNU, USDA FAS, NOAA, nine historical famine case studies. Full reference list in
          the Technical Report.
        </p>
      </footer>
    </div>
  );
}
