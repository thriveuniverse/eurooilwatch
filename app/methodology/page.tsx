import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology | EuroOilWatch',
  description:
    'How EuroOilWatch collects, processes, and presents EU fuel reserve and price data.',
};

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">
          ← Back to dashboard
        </a>
        <h1 className="mt-2 text-2xl font-bold text-white">Methodology</h1>
        <p className="mt-2 text-sm text-gray-400">
          How we collect, process, and present European fuel data.
        </p>
      </div>

      <section className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <h2 className="text-lg font-semibold text-white">Data Sources</h2>

        <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-white">
              Oil Stock Levels — Eurostat
            </h3>
            <p className="mt-1 text-gray-400">
              We pull monthly oil stock data from Eurostat&apos;s{' '}
              <code className="bg-oil-800 px-1 rounded text-xs">
                nrg_stk_oilm
              </code>{' '}
              dataset, which reports closing stock levels on national territory
              in thousand tonnes. This data is published monthly with an
              approximate 2-month lag.
            </p>
            <p className="mt-2 text-gray-400">
              Consumption data comes from{' '}
              <code className="bg-oil-800 px-1 rounded text-xs">
                nrg_cb_oilm
              </code>{' '}
              (Gross Inland Consumption). We track three fuel categories: motor
              gasoline (petrol), gas/diesel oil, and kerosene-type jet fuel.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white">
              Fuel Prices — EC Weekly Oil Bulletin
            </h3>
            <p className="mt-1 text-gray-400">
              Consumer fuel prices are sourced from the European
              Commission&apos;s DG Energy Weekly Oil Bulletin, which collects
              national average prices (including all taxes) from official
              authorities in each EU member state every Wednesday and publishes
              on Thursdays.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white">
              Crude Oil Price — Market Data
            </h3>
            <p className="mt-1 text-gray-400">
              Brent crude futures prices are fetched from public financial data
              APIs. EUR conversion uses the current EUR/USD exchange rate.
            </p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white pt-4">
          Days of Supply Calculation
        </h2>
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
          <p className="text-gray-400">
            &ldquo;Days of supply&rdquo; is calculated as:
          </p>
          <div className="my-3 p-3 bg-oil-950 rounded font-mono text-sm text-oil-300">
            Days = (Stock in kt / Monthly Consumption in kt) × 30
          </div>
          <p className="text-gray-400">
            This is an estimate. The EU&apos;s Oil Stocks Directive
            (2009/119/EC) requires member states to maintain emergency stocks
            equal to at least <strong>90 days of net imports</strong> or{' '}
            <strong>61 days of consumption</strong>, whichever is higher. We use
            90 days as the reference threshold since most EU countries are
            significant net importers.
          </p>
        </div>

        <h2 className="text-lg font-semibold text-white pt-4">
          Status Classification
        </h2>
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
          <div className="space-y-2 text-gray-400">
            <p>
              <span className="inline-block w-3 h-3 rounded-full bg-status-safe mr-2" />
              <strong className="text-green-300">Safe</strong> — Reserves exceed
              110% of the 90-day mandatory minimum
            </p>
            <p>
              <span className="inline-block w-3 h-3 rounded-full bg-status-watch mr-2" />
              <strong className="text-yellow-300">Watch</strong> — Reserves at
              95–110% of minimum (adequate but thinning)
            </p>
            <p>
              <span className="inline-block w-3 h-3 rounded-full bg-status-warning mr-2" />
              <strong className="text-orange-300">Warning</strong> — Reserves at
              85–95% of minimum (approaching threshold)
            </p>
            <p>
              <span className="inline-block w-3 h-3 rounded-full bg-status-critical mr-2" />
              <strong className="text-red-300">Critical</strong> — Reserves
              below 85% of minimum
            </p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white pt-4">
          AI Analysis
        </h2>
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
          <p className="text-gray-400">
            The AI analysis is generated by Claude (Anthropic) using the latest
            stock, price, and crude oil data. It provides a plain-English
            interpretation of the numbers and highlights notable trends or risks.
            The analysis is regenerated whenever the underlying data updates.
          </p>
          <p className="mt-2 text-gray-500 text-xs italic">
            AI analysis may contain errors and should not be relied upon for
            financial or safety decisions. Always verify with official sources.
          </p>
        </div>

        <h2 className="text-lg font-semibold text-white pt-4">Limitations</h2>
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5 space-y-2 text-gray-400">
          <p>
            <strong>Data lag:</strong> Eurostat oil stock data is published with
            an approximate 2-month delay. The dashboard shows the most recent
            available period, not real-time stock levels.
          </p>
          <p>
            <strong>Estimation:</strong> Days-of-supply is a calculated
            estimate, not a direct measurement. Actual reserve adequacy depends
            on import flows, refinery output, and demand patterns that vary
            day-to-day.
          </p>
          <p>
            <strong>Coverage:</strong> Not all countries report all fuel
            categories. Some data points may be missing or delayed for specific
            countries.
          </p>
          <p>
            <strong>Not affiliated with any government:</strong> EuroOilWatch is
            an independent transparency project using publicly available EU data.
          </p>
        </div>
      </section>
    </div>
  );
}
