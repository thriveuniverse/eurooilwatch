import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | EuroOilWatch',
  description: 'About EuroOilWatch — an independent European fuel reserve and price transparency dashboard.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">About EuroOilWatch</h1>
      </div>

      <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <p>
          EuroOilWatch is an independent transparency dashboard that tracks fuel
          reserves, pump prices, and crude oil market data across the European
          Union&apos;s 27 member states.
        </p>

        <p>
          The project was inspired by{' '}
          <a href="https://nzoilwatch.com" className="text-oil-400 underline" target="_blank" rel="noopener noreferrer">
            NZOilWatch
          </a>
          , which brought fuel security transparency to New Zealand and
          Australia. Europe has abundant official data — Eurostat, the EC Weekly
          Oil Bulletin, national regulators — but no single place that presents
          it clearly for the public. EuroOilWatch fills that gap.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">Why This Matters</h2>
        <p>
          EU countries are required to maintain emergency oil stocks equivalent
          to at least 90 days of net imports. During supply disruptions — such
          as the 2022 energy crisis and the 2026 Middle East conflict — these
          reserves are a critical safety buffer. Public visibility into reserve
          levels helps citizens, journalists, and policymakers make informed
          decisions.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">How It Works</h2>
        <p>
          An automated pipeline fetches data from official EU sources (Eurostat,
          DG Energy), normalises it into a common format, and presents it on
          this dashboard. An AI model (Claude by Anthropic) generates
          plain-English analysis of the latest data. See the{' '}
          <a href="/methodology" className="text-oil-400 underline">
            Methodology
          </a>{' '}
          page for full details.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">Contact</h2>
        <p>
          Questions, corrections, or partnership inquiries:{' '}
          <a href="mailto:admin@eurooilwatch.com" className="text-oil-400 underline">
            admin@eurooilwatch.com
          </a>
        </p>
      </div>
    </div>
  );
}
