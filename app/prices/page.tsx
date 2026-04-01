import { getDashboardData } from '@/lib/data';
import { COUNTRIES } from '@/lib/countries';
import type { Metadata } from 'next';
import PriceHeatmap from '@/components/PriceHeatmap';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'EU Fuel Prices — Heatmap & Comparison',
  description:
    'Compare petrol and diesel prices across all 27 EU countries. Interactive heatmap and sortable table with weekly data from the EC Oil Bulletin.',
  alternates: { canonical: 'https://eurooilwatch.com/prices' },
};

export const revalidate = 1800;

export default function PricesPage() {
  const { prices } = getDashboardData();

  return (
    <div className="space-y-6">
      <JsonLd type="prices" />
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">
          ← Back to dashboard
        </a>
        <h1 className="mt-2 text-2xl font-bold text-white">
          EU Fuel Prices
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Weekly consumer prices across 27 EU member states · Source:{' '}
          <a
            href="https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-300"
          >
            EC Weekly Oil Bulletin
          </a>{' '}
          ({prices.bulletinDate})
        </p>
      </div>

      <PriceHeatmap prices={prices} />

      {/* Sortable table */}
      <section className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-oil-800">
          <h2 className="text-sm font-semibold text-white">
            All EU27 Countries — Prices per litre (incl. taxes)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-oil-800">
                <th className="text-left px-5 py-3">Country</th>
                <th className="text-right px-5 py-3">Petrol (€/L)</th>
                <th className="text-right px-5 py-3">Diesel (€/L)</th>
                <th className="text-right px-5 py-3">Spread</th>
              </tr>
            </thead>
            <tbody>
              {[...prices.countries]
                .sort((a, b) => (b.dieselPrice || 0) - (a.dieselPrice || 0))
                .map((c) => {
                  const info =
                    COUNTRIES[c.countryCode as keyof typeof COUNTRIES];
                  const spread =
                    c.dieselPrice && c.petrolPrice
                      ? c.dieselPrice - c.petrolPrice
                      : null;
                  return (
                    <tr
                      key={c.countryCode}
                      className="border-b border-oil-800/50 hover:bg-oil-800/30"
                    >
                      <td className="px-5 py-2.5">
                        <a
                          href={`/country/${c.countryCode.toLowerCase()}`}
                          className="flex items-center gap-2 hover:text-oil-300"
                        >
                          <span>{info?.flag}</span>
                          <span className="text-gray-200">
                            {c.countryName}
                          </span>
                        </a>
                      </td>
                      <td className="text-right px-5 py-2.5 font-mono text-gray-300">
                        {c.petrolPrice
                          ? `€${c.petrolPrice.toFixed(3)}`
                          : '—'}
                      </td>
                      <td className="text-right px-5 py-2.5 font-mono text-gray-300">
                        {c.dieselPrice
                          ? `€${c.dieselPrice.toFixed(3)}`
                          : '—'}
                      </td>
                      <td
                        className={`text-right px-5 py-2.5 font-mono text-xs ${
                          spread && spread > 0
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}
                      >
                        {spread !== null
                          ? `${spread > 0 ? '+' : ''}€${spread.toFixed(3)}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 text-xs text-gray-500">
          EU avg: Petrol €{prices.euAverage.petrolPrice}/L · Diesel €
          {prices.euAverage.dieselPrice}/L · Bulletin: {prices.bulletinDate}
        </div>
      </section>
    </div>
  );
}
