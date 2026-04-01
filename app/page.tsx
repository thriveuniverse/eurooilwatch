import { getDashboardData, getEUHistory } from '@/lib/data';
import StatusBanner from '@/components/StatusBanner';
import ReserveGauge from '@/components/ReserveGauge';
import PriceTicker from '@/components/PriceTicker';
import CountryGrid from '@/components/CountryGrid';
import AnalysisPanel from '@/components/AnalysisPanel';
import StockChart from '@/components/StockChart';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EuroOilWatch — European Fuel Reserve Monitor | Live EU Dashboard',
  description:
    'Live EU fuel reserve tracking across 27 countries. Monitor petrol, diesel, and jet fuel stock levels against the 90-day EU mandatory minimum. Weekly prices from the EC Oil Bulletin. AI-powered analysis.',
  alternates: { canonical: 'https://eurooilwatch.com' },
};

export const revalidate = 1800;

export default function DashboardPage() {
  const { stocks, prices, brent, analysis } = getDashboardData();
  const euHistory = getEUHistory();

  return (
    <div className="space-y-6">
      <h1 className="sr-only">EuroOilWatch — European Fuel Reserve Monitor: Live Dashboard</h1>

      <section aria-label="EU fuel security status">
        <StatusBanner
          status={analysis.overallStatus}
          statusLine={analysis.statusLine}
          dataPeriod={stocks.dataPeriod}
          lastUpdated={stocks.lastUpdated}
        />
      </section>

      <section aria-label="EU average fuel reserves">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-4">
          EU Average Fuel Reserves (Days of Supply)
        </h2>
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
          <ReserveGauge label="Petrol" daysOfSupply={stocks.euAverage.petrolDays} minimumDays={90}
            status={stocks.euAverage.petrolDays >= 99 ? 'safe' : stocks.euAverage.petrolDays >= 85 ? 'watch' : stocks.euAverage.petrolDays >= 76 ? 'warning' : 'critical'} />
          <ReserveGauge label="Diesel" daysOfSupply={stocks.euAverage.dieselDays} minimumDays={90}
            status={stocks.euAverage.dieselDays >= 99 ? 'safe' : stocks.euAverage.dieselDays >= 85 ? 'watch' : stocks.euAverage.dieselDays >= 76 ? 'warning' : 'critical'} />
          <ReserveGauge label="Jet Fuel" daysOfSupply={stocks.euAverage.jetFuelDays} minimumDays={90}
            status={stocks.euAverage.jetFuelDays >= 99 ? 'safe' : stocks.euAverage.jetFuelDays >= 85 ? 'watch' : stocks.euAverage.jetFuelDays >= 76 ? 'warning' : 'critical'} />
        </div>
        <p className="mt-3 text-center text-xs text-gray-500">
          EU mandatory minimum: 90 days of net imports (Directive 2009/119/EC)
        </p>
      </section>

      {/* EU Trend Chart */}
      {euHistory && euHistory.length > 0 && (
        <section aria-label="EU reserve trend">
          <StockChart
            data={euHistory}
            title="EU Average Reserves — 18-Month Trend"
          />
        </section>
      )}

      <section aria-label="Market prices">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-4">Market Prices</h2>
        <PriceTicker brent={brent} prices={prices} />
      </section>

      <section aria-label="AI-powered fuel security analysis">
        <AnalysisPanel analysis={analysis} />
      </section>

      <section aria-label="EU27 country fuel reserve overview">
        <CountryGrid stocks={stocks.countries} prices={prices.countries} />
      </section>

      <section aria-label="Data sources" className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">Data Sources</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-gray-500">
          <div>
            <p className="font-medium text-gray-400">Oil Stocks</p>
            <p><a href="https://ec.europa.eu/eurostat/databrowser/view/NRG_STK_OILM" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">Eurostat (nrg_stk_oilm)</a> — monthly</p>
            <p>Period: {stocks.dataPeriod || 'pending'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-400">Fuel Prices</p>
            <p><a href="https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">EC Weekly Oil Bulletin</a></p>
            <p>Date: {prices.bulletinDate || 'pending'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-400">Crude Oil</p>
            <p>{brent.dataSource}</p>
            <p>Updated: {brent.lastUpdated ? new Date(brent.lastUpdated).toLocaleDateString('en-GB') : 'pending'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
