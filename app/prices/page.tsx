import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EU Fuel Prices | EuroOilWatch',
  description: 'Compare petrol and diesel prices across all 27 EU countries. Weekly data from the EC Oil Bulletin.',
};

export default function PricesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">EU Fuel Prices</h1>
        <p className="mt-1 text-sm text-gray-400">
          Weekly consumer prices across 27 EU member states
        </p>
      </div>

      {/* Placeholder for price heatmap and comparison table */}
      <section className="rounded-lg border border-dashed border-oil-700 bg-oil-900/20 p-12 text-center">
        <p className="text-lg text-gray-400">🗺️ Price Heatmap</p>
        <p className="mt-2 text-sm text-gray-500">
          Interactive choropleth map of EU fuel prices — coming in Phase 2
        </p>
        <p className="mt-4 text-xs text-gray-600">
          Will include: sortable country comparison table, weekly price
          trends, cheapest/most expensive rankings
        </p>
      </section>
    </div>
  );
}
