import { getDashboardData, getCountryHistory } from '@/lib/data';
import { COUNTRIES, EU27_CODES } from '@/lib/countries';
import JsonLd from '@/components/JsonLd';
import StockChart from '@/components/StockChart';
import type { ExtendedCountryCode } from '@/lib/types';
import type { Metadata } from 'next';

interface PageProps {
  params: { code: string };
}

export function generateStaticParams() {
  return EU27_CODES.map((code) => ({ code: code.toLowerCase() }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const code = params.code.toUpperCase() as ExtendedCountryCode;
  const country = COUNTRIES[code];
  const name = country?.name ?? params.code;
  return {
    title: `${name} Fuel Reserves & Prices`,
    description: `${name} fuel reserve levels and pump prices. Track petrol, diesel, and jet fuel stock days against the EU 90-day mandatory minimum. Live data from Eurostat and the EC Oil Bulletin.`,
    alternates: { canonical: `https://eurooilwatch.com/country/${params.code.toLowerCase()}` },
    openGraph: {
      title: `${name} — Fuel Reserves & Prices | EuroOilWatch`,
      description: `Track ${name}'s fuel reserve levels and pump prices.`,
      url: `https://eurooilwatch.com/country/${params.code.toLowerCase()}`,
    },
  };
}

export default function CountryPage({ params }: PageProps) {
  const code = params.code.toUpperCase() as ExtendedCountryCode;
  const country = COUNTRIES[code];

  if (!country) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl text-gray-400">Country not found</h1>
        <a href="/" className="mt-4 inline-block text-oil-400 underline">Back to dashboard</a>
      </div>
    );
  }

  const { stocks, prices } = getDashboardData();
  const stockData = stocks.countries.find(c => c.countryCode === code);
  const priceData = prices.countries.find(c => c.countryCode === code);
  const history = getCountryHistory(code);

  return (
    <div className="space-y-6">
      <JsonLd type="country" countryName={country.name} countryCode={code} />

      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline" aria-label="Back to dashboard">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label={`${country.name} flag`}>{country.flag}</span>
          {country.name} — Fuel Reserves & Prices
        </h1>
        {!country.isEU && (
          <span className="mt-1 inline-block text-xs bg-oil-800 text-gray-400 px-2 py-0.5 rounded">Non-EU</span>
        )}
      </div>

      {/* Reserves bars */}
      <section aria-label={`${country.name} fuel reserves`} className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Current Reserves</h2>
        {stockData && stockData.fuels.length > 0 ? (
          <div className="space-y-3">
            {stockData.fuels.map(fuel => (
              <div key={fuel.fuelType} className="flex items-center gap-4">
                <span className="w-20 text-xs text-gray-400 capitalize">{fuel.fuelType.replace('_', ' ')}</span>
                <div className="flex-1 h-3 bg-oil-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={fuel.daysOfSupply} aria-valuemin={0} aria-valuemax={150} aria-label={`${fuel.fuelType}: ${fuel.daysOfSupply} days`}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min((fuel.daysOfSupply / 150) * 100, 100)}%`,
                    backgroundColor: fuel.status === 'safe' ? '#22c55e' : fuel.status === 'watch' ? '#f59e0b' : fuel.status === 'warning' ? '#f97316' : '#ef4444',
                  }} />
                </div>
                <span className="w-16 text-right text-sm font-mono text-white">{fuel.daysOfSupply}d</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  fuel.status === 'safe' ? 'bg-green-900/50 text-green-300' : fuel.status === 'watch' ? 'bg-yellow-900/50 text-yellow-300' : fuel.status === 'warning' ? 'bg-orange-900/50 text-orange-300' : 'bg-red-900/50 text-red-300'
                }`}>{fuel.status}</span>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-2">Data: {stockData.datePeriod} · Minimum: 90 days</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Reserve data not yet available.</p>
        )}
      </section>

      {/* Historical chart */}
      {history && history.length > 0 && (
        <section aria-label={`${country.name} reserve history`}>
          <StockChart
            data={history}
            title={`${country.name} — Reserve History (18 months)`}
          />
        </section>
      )}

      {/* Prices */}
      <section aria-label={`${country.name} fuel prices`} className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Fuel Prices</h2>
        {priceData ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded bg-oil-900/50 p-4">
              <p className="text-xs text-gray-500">Petrol (Euro-super 95)</p>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {priceData.petrolPrice ? `€${priceData.petrolPrice.toFixed(3)}` : '—'}
              </p>
              <p className="text-xs text-gray-500">per litre (incl. all taxes)</p>
            </div>
            <div className="rounded bg-oil-900/50 p-4">
              <p className="text-xs text-gray-500">Diesel</p>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {priceData.dieselPrice ? `€${priceData.dieselPrice.toFixed(3)}` : '—'}
              </p>
              <p className="text-xs text-gray-500">per litre (incl. all taxes)</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Price data not yet available.</p>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Source: <a href="https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">EC Weekly Oil Bulletin</a>
        </p>
      </section>
    </div>
  );
}
