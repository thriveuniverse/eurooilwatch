import type { Metadata } from 'next';
import FallOfUKReportDownloadForm from '@/components/FallOfUKReportDownloadForm';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'The Fall of the United Kingdom? — A Compound Cascade Risk Model | EuroOilWatch',
  description:
    'Independent systems risk analysis modelling 18 UK structural decline vectors as a single interacting system. Compound assessment: 40–70% probability of Accelerated Decline or worse by 2035, vs 10–20% under additive assessment.',
  alternates: { canonical: 'https://eurooilwatch.com/reports/the-fall-of-the-uk' },
  openGraph: {
    title: 'The Fall of the United Kingdom? — A Compound Cascade Risk Model',
    description:
      '18 structural decline vectors. 100 interactions. 9 self-reinforcing feedback loops. 40–70% probability of Accelerated Decline by 2035.',
    url: 'https://eurooilwatch.com/reports/the-fall-of-the-uk',
    siteName: 'EuroOilWatch',
    type: 'article',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'The Fall of the United Kingdom?' }],
  },
};

export default function FallOfUKReportPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>

        <p className="mt-6 text-[10px] font-mono font-semibold tracking-widest text-red-400 uppercase">
          Independent Systems Risk Analysis
        </p>

        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white leading-tight">
          The Fall of the United Kingdom?
        </h1>

        <p className="mt-3 text-lg text-gray-300 leading-snug">
          18 structural decline vectors. 100 interactions. 9 self-reinforcing feedback loops.
          A <strong className="text-white">40–70% probability</strong> of Accelerated Decline or worse by 2035 —
          versus 10–20% under additive assessment.
        </p>

        <p className="mt-4 text-sm text-gray-400">
          <strong className="text-gray-300">A Compound Cascade Risk Model for the United Kingdom, 2026–2035</strong>{' '}
          · By <strong className="text-gray-300">Jonathan Kelly</strong> · Published May 2026
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
          The United Kingdom is not experiencing a single crisis. It is experiencing the simultaneous interaction
          of <strong className="text-white">eighteen structural decline vectors</strong> that institutional analysis
          assesses separately but that operate as a single interconnected system. Each decline accelerates others.
          The question is not whether the UK is declining — that is measurable across every relevant metric. The
          question is whether the interaction between decline vectors produces a non-linear deterioration that
          exceeds the sum of individual trend lines.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">The Methodology Gap Is the Finding</h2>
        <p>
          This analysis uses the same data sources as institutional assessments — ONS, OBR, IFS, Bank of England,
          OECD. The divergence is not in the data. It is in the model structure. Institutional analyses assess
          each risk factor in isolation. This model assesses how they interact and compound through a quantified
          18×18 interaction matrix and nine self-reinforcing feedback loops.
        </p>
        <p>
          Every chain in the model is individually well-documented by a UK institution. The OBR models the
          fiscal trap. NHS England publishes the waiting list data. The ONS tracks productivity, demographics,
          and migration. But no UK institution is mandated to model the interactions between fiscal policy,
          healthcare, demographics, education, media, defence, climate, financial stability, and political
          governance as a single system. The data is not new. The methodology is.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">What This Report Is Not</h2>
        <p>
          This report is not a prediction that the UK will collapse. It is not an ideological argument for
          decline. It is not a claim that all resilience factors fail. It is a structured downside-risk
          assessment showing how individually documented pressures may interact under stress. Even if the reader
          rejects the upper-bound probability estimates, the minimum defensible claim remains: UK institutional
          risk is materially underestimated when fiscal, demographic, health, housing, energy, political and
          territorial pressures are assessed separately rather than as interacting components of a single system.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">The Eighteen Causal Chains</h2>
        <p>
          The model identifies eighteen structural decline vectors, each individually sourced and defensible,
          that interact through 100 significant connections (of 306 possible). The full chain list, with sources
          and quantification, is in the technical report:
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-400 list-decimal list-inside">
          <li>Productivity Collapse</li>
          <li>Energy Crisis</li>
          <li>Regional Inequality</li>
          <li>Food Vulnerability</li>
          <li>Fiscal Trap</li>
          <li>Cost of Living</li>
          <li>Devolution Pressure</li>
          <li>Brain Drain</li>
          <li>Infrastructure Decay</li>
          <li>Political Failure (the meta-chain)</li>
          <li>Social Cohesion</li>
          <li>NHS Collapse</li>
          <li>Mass Migration (Hormuz cascade)</li>
          <li>Defence Erosion</li>
          <li>Climate Vulnerability</li>
          <li>Education Decline</li>
          <li>Media Degradation</li>
          <li>Financial Services Dependency</li>
        </ol>

        <h2 className="mt-10 text-xl font-bold text-white">Key Compound Mechanisms</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">The Graduate Debt-Employment Cascade</p>
            <p className="mt-2 text-sm text-gray-400">
              The current generation of UK graduates is the first in British history to pay for higher education
              through debt (~£45,000 average). AI is simultaneously automating the entry-level graduate roles
              that were supposed to service that debt. Each step is individually documented; the compound
              cascade reveals them as a single interconnected system that makes emigration rational.
            </p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">The Demographic Fiscal Time Bomb</p>
            <p className="mt-2 text-sm text-gray-400">
              Fewer workers (birth rate 1.44, brain drain, AI displacement), each earning less in real terms,
              each paying more in student debt, are expected to fund an expanding retired population whose
              entitlements are protected by the triple lock. Pensioners vote at 75% turnout versus 50% for 18–24
              year olds, making reform electorally impossible under FPTP.
            </p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">The Energy Cost Crisis</p>
            <p className="mt-2 text-sm text-gray-400">
              UK electricity prices are among the highest in the world, driven by a specific policy choice to
              fund the green transition through bill levies rather than general taxation. Industrial electricity
              prices are approximately double France&apos;s. Combined with 2% gas storage versus Germany&apos;s 25%,
              any global energy disruption hits UK consumers within days rather than months.
            </p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">The Sovereign-Financial Doom Loop</p>
            <p className="mt-2 text-sm text-gray-400">
              The UK&apos;s financial sector is approximately 10x GDP, generating ~12% of tax receipts. The
              government depends on City tax revenue, which prevents regulatory reform, which concentrates
              systemic risk. The September 2022 mini-budget demonstrated the mechanism. This is the fastest
              identified pathway to systemic stress — measurable in weeks, not years.
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-bold text-white">Five Scenarios</h2>
        <p>
          The model spans the outcome range for 2026–2035 across five scenarios with explicit, falsifiable
          assumptions:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-4 py-3">
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Renewal</p>
            <p className="text-white font-semibold">10–20%</p>
            <p className="text-xs text-gray-400 mt-1">Crisis-catalysed institutional reform (1945/1979 precedent).</p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-4 py-3">
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Managed Decline</p>
            <p className="text-white font-semibold">25–35%</p>
            <p className="text-xs text-gray-400 mt-1">Slow erosion to mid-tier European levels by 2035. Italian trajectory.</p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-4 py-3">
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Accelerated Decline</p>
            <p className="text-white font-semibold">25–35%</p>
            <p className="text-xs text-gray-400 mt-1">Sharp fall toward Southern European levels by 2030; Scottish referendum triggered.</p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-4 py-3">
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Fragmentation</p>
            <p className="text-white font-semibold">10–20%</p>
            <p className="text-xs text-gray-400 mt-1">Scotland leaves; NI reunification process begins. UK ceases to exist as currently constituted.</p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-4 py-3 sm:col-span-2">
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Systemic Collapse</p>
            <p className="text-white font-semibold">5–15%</p>
            <p className="text-xs text-gray-400 mt-1">Sterling crisis; IMF involvement. Sovereign-financial doom loop activates. Comparable to Greece 2010–2015.</p>
          </div>
        </div>
        <p className="text-sm">
          Sum: <strong className="text-white">40–70% probability of Accelerated Decline or worse</strong>{' '}
          (compared to ~10–20% under additive assessment of the same chains).
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">The Domestic Cascade Stands Alone</h2>
        <p>
          A critical distinction: the domestic cascade exists without external shocks. Even removing the Hormuz
          mass-migration assumption (Chain 13), the financial-shock activation (Chain 18), and major climate
          events (Chain 15), the domestic structural model alone produces materially elevated risk above the
          additive assessment. External shocks worsen outcomes; they do not create them.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">The Reports</h2>
      </article>

      {/* Email-gated download form */}
      <FallOfUKReportDownloadForm siteName="EuroOilWatch" />

      {/* Update commitment */}
      <p className="text-xs text-gray-500 italic">
        This analysis will be updated as new data becomes available. Key watch points: OBR autumn forecast,
        Hormuz crisis trajectory, Bank of England financial-stability reports, Scottish independence polling,
        NHS waiting-list data.
      </p>

      {/* Footer */}
      <footer className="border-t border-oil-800/40 pt-6 mt-8 space-y-3 text-xs text-gray-500">
        <p>
          <strong className="text-gray-400">Methodology:</strong> This analysis uses the{' '}
          <a href="/methodology/compound-cascade" className="text-oil-400 hover:underline">
            Compound Cascade Systems Modelling Framework (v3.0)
          </a>
          {' '}— a reusable nine-step methodology for probabilistic risk models of systemic crises. Also published as{' '}
          <a
            href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6695618"
            className="text-oil-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kelly (2026) on SSRN
          </a>.
        </p>
        <p>
          <strong className="text-gray-400">Contact:</strong>{' '}
          <a href="mailto:jon@thethriveclan.com" className="text-oil-400 hover:underline">jon@thethriveclan.com</a>
        </p>
        <p>
          <strong className="text-gray-400">Also published on:</strong>{' '}
          <a href="https://ukoilwatch.com/reports/the-fall-of-the-uk" className="text-oil-400 hover:underline">ukoilwatch.com</a>
          {' · '}
          <a href="https://americasoilwatch.com/reports/the-fall-of-the-uk" className="text-oil-400 hover:underline">americasoilwatch.com</a>
        </p>
        <p>
          <strong className="text-gray-400">Sources:</strong> ONS, OBR, IFS, Bank of England, OECD, NHS England,
          DESNZ, DEFRA, Resolution Foundation, Health Foundation, eight historical state-decline calibration
          cases. Full reference list in the Technical Report.
        </p>
      </footer>
    </div>
  );
}
