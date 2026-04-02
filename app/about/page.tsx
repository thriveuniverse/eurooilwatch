import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | EuroOilWatch',
  description: 'About EuroOilWatch — an independent European fuel reserve and price transparency dashboard built with public EU data.',
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
          EuroOilWatch is an independent transparency dashboard that presents
          official EU fuel reserve and price data in a clear, accessible format
          for policymakers, journalists, researchers, logistics professionals,
          and the public.
        </p>

        <p>
          The project was inspired by{' '}
          <a href="https://nzoilwatch.com" className="text-oil-400 underline" target="_blank" rel="noopener noreferrer">
            NZOilWatch
          </a>
          , which brought fuel security transparency to New Zealand and
          Australia. Europe has abundant official data — Eurostat, the EC Weekly
          Oil Bulletin, national regulators — but no single place that
          presents it clearly. EuroOilWatch fills that gap.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">What This Dashboard Shows</h2>
        <p>
          EuroOilWatch aggregates the latest available official data from
          EU institutions — not real-time tank levels. Oil stock data comes
          from Eurostat and is published monthly with an approximate 2-month
          lag. Fuel prices come from the EC Weekly Oil Bulletin, updated every
          Thursday. The dashboard refreshes daily to capture new submissions
          as they become available.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">Why This Matters</h2>
        <p>
          Under the Oil Stocks Directive (2009/119/EC), EU countries must
          maintain emergency oil stocks equivalent to at least 90 days of net
          imports or 61 days of consumption, whichever is higher. During
          supply disruptions — such as the 2022 energy crisis and the 2026
          Middle East conflict — these reserves are a critical safety buffer.
          Public visibility into reserve levels helps citizens, journalists,
          and policymakers make informed decisions.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">How It Works</h2>
        <p>
          An automated pipeline fetches data daily from Eurostat and the EC
          Oil Bulletin, normalises it into a common format, and presents it
          on this dashboard. An AI model (Claude by Anthropic) generates
          plain-English analysis of the latest data. See the{' '}
          <a href="/methodology" className="text-oil-400 underline">
            Methodology
          </a>{' '}
          page for full details on sources, calculations, and limitations.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">Who Built This</h2>
        <p>
          EuroOilWatch was built by Jon, an independent developer based in
          Europe, as a public-interest transparency project. The site is not
          affiliated with any government, energy company, or political
          organisation.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">For Journalists & Analysts</h2>
        <p>
          If you are covering European energy, fuel security, or the current
          supply situation and would like to discuss the data, methodology,
          or findings, please get in touch. I&apos;m happy to provide
          additional context, data exports, or commentary.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">Contact</h2>
        <p>
          Questions, corrections, media enquiries, or partnership proposals:{' '}
          <a href="mailto:jon@eurooilwatch.com" className="text-oil-400 underline">
            jon@eurooilwatch.com
          </a>
        </p>
      </div>
    </div>
  );
}
