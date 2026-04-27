import { getDashboardData, getEUHistory, getCentcom } from '@/lib/data';
import StatusBanner from '@/components/StatusBanner';
import ReserveGauge from '@/components/ReserveGauge';
import PriceTicker from '@/components/PriceTicker';
import CountryGrid from '@/components/CountryGrid';
import AnalysisPanel from '@/components/AnalysisPanel';
import StockChart from '@/components/StockChart';
import WhatWeTrack from '@/components/WhatWeTrack';
import WhoUsesThis from '@/components/WhoUsesThis';
import EmailCTA from '@/components/EmailCTA';
import ProTeaser from '@/components/ProTeaser';
import DisruptionBanner from '@/components/DisruptionBanner';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EuroOilWatch — EU Fuel Reserve & Price Intelligence',
  description:
    'Monitor fuel reserve levels and prices across 27 EU countries. Official Eurostat data, weekly price updates, AI analysis. Used by logistics operators, analysts, and journalists.',
  alternates: { canonical: 'https://eurooilwatch.com' },
};

export const revalidate = 1800;

export default function DashboardPage() {
  const { stocks, prices, brent, analysis } = getDashboardData();
  const centcom = getCentcom();
  const euHistory = getEUHistory();

  const countriesBelowThreshold = stocks.countries.filter(c =>
    c.fuels.some(f => f.daysOfSupply < 90)
  ).length;
  const totalCountries = stocks.countries.length;

  return (
    <div className="space-y-6">
      <h1 className="sr-only">EuroOilWatch — EU Fuel Reserve & Price Intelligence</h1>

      {/* Disruption alert */}
      <DisruptionBanner
        headline="Hormuz reclosed — compound supply crisis active"
        body="Iran shut the Strait of Hormuz again on 18 April citing the US maintaining a naval blockade on Iranian ports. Both primary Gulf export corridors are now simultaneously disrupted."
        linkLabel="Supply Routes →"
        linkHref="/supply"
      />

      {/* 1. Status Banner */}
      <section aria-label="EU fuel security status">
        <StatusBanner
          status={analysis.overallStatus}
          statusLine={analysis.statusLine}
          dataPeriod={stocks.dataPeriod}
          lastUpdated={stocks.lastUpdated}
        />
      </section>

      {/* 2. What this tracks */}
      <WhatWeTrack />

      {/* 3. Reserve Gauges */}
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
          EU benchmark: 90 days of net imports or 61 days of consumption, whichever is higher (Directive 2009/119/EC)
        </p>
        <p className="mt-2 text-center text-xs text-gray-500 max-w-2xl mx-auto">
          Days of supply shown here are calculated from total EU consumption, not net imports. They indicate domestic buffer capacity and are not directly comparable to formal IEA compliance figures.{' '}
          <a href="/methodology" className="text-oil-400 hover:underline">See Methodology for details.</a>
        </p>
      </section>

      {/* 4. EU Trend Chart */}
      {euHistory && euHistory.length > 0 && (
        <section aria-label="EU reserve trend">
          <StockChart data={euHistory} title="EU Average Reserves — 18-Month Trend" />
        </section>
      )}

      {/* 5. Market Prices */}
      <section aria-label="Market prices">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-4">Market Prices</h2>
        <PriceTicker brent={brent} prices={prices} />
      </section>

      {/* Upcoming supply event — Druzhba halt 1 May 2026 */}
      <section aria-label="Upcoming supply event">
        <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-700/30 flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold tracking-widest text-amber-300 uppercase">
              Upcoming Supply Event
            </h2>
            <span className="text-[10px] font-mono text-amber-400/70">1 May 2026</span>
          </div>
          <div className="px-5 py-4 space-y-2">
            <p className="text-sm font-semibold text-white">
              Russia halts Kazakh crude supply via Druzhba pipeline to Germany
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              PCK Schwedt refinery (supplies most of Berlin&apos;s fuel) loses ~17% of its crude from 1 May.
              Germany says petroleum-product security is not in jeopardy because alternative routes exist,
              but its regulator warned of regional pricing effects.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-oil-300 font-medium">EU angle:</span>{' '}
              Another layer of regional supply friction at a time when Brent is back above $100 and
              Hormuz shipping remains heavily disrupted.
            </p>
          </div>
          <div className="px-5 py-2 border-t border-amber-700/20 bg-amber-950/10">
            <p className="text-[10px] text-gray-600">Source: Reuters.</p>
          </div>
        </div>
      </section>

      {/* CENTCOM Advisory Snapshot */}
      {centcom && centcom.advisories.length > 0 && (
        <section aria-label="CENTCOM advisories">
          <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
            <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
                CENTCOM Advisory Snapshot
              </h2>
              <span className="text-[10px] text-gray-600">Middle East maritime</span>
            </div>
            <div className="divide-y divide-oil-800/30">
              {centcom.advisories.slice(0, 4).map(a => {
                const dot = { critical: 'bg-red-500', high: 'bg-orange-500', elevated: 'bg-amber-500', normal: 'bg-gray-500' }[a.severity] ?? 'bg-gray-500';
                return (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-oil-800/30 transition group">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="text-xs text-gray-300 group-hover:text-white transition flex-1 truncate">
                      {a.region}: {a.incident}
                    </span>
                    <span className="text-[10px] text-gray-600 flex-shrink-0">
                      {new Date(a.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </a>
                );
              })}
            </div>
            <div className="px-5 py-2 border-t border-oil-800/40 bg-oil-900/20">
              <p className="text-[10px] text-gray-600">Source: U.S. Central Command via DVIDS.</p>
            </div>
          </div>
        </section>
      )}

      {/* 6. AI Analysis */}
      <section aria-label="AI-powered fuel security analysis">
        <AnalysisPanel analysis={analysis} />
        <a
          href="/supply"
          className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-oil-700 bg-oil-900/40 px-4 py-3 hover:border-oil-500 hover:bg-oil-900/60 transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🗺️</span>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-oil-300 transition">
                Global Supply Routes — Chokepoint Status
              </p>
              <p className="text-xs text-gray-500">
                Hormuz, Suez, Bab-el-Mandeb, ARA hub — current risk levels
              </p>
            </div>
          </div>
          <span className="text-oil-400 text-sm flex-shrink-0">→</span>
        </a>
        <a
          href="/news"
          className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-oil-700 bg-oil-900/40 px-4 py-3 hover:border-oil-500 hover:bg-oil-900/60 transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📰</span>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-oil-300 transition">
                News Feed — What&apos;s Driving These Numbers?
              </p>
              <p className="text-xs text-gray-500">
                Latest oil &amp; fuel supply news from leading energy sources
              </p>
            </div>
          </div>
          <span className="text-oil-400 text-sm flex-shrink-0">→</span>
        </a>
        <p className="mt-2 text-xs text-gray-500">
          This analysis is delivered to your inbox every Thursday.{' '}
          <a href="#briefing" className="text-oil-400 underline hover:text-oil-300">
            Subscribe to the weekly briefing →
          </a>
        </p>
      </section>

      {/* 7. Email CTA (moved up — before country grid) */}
      <div id="briefing">
        <EmailCTA />
      </div>

      {/* 8. Who uses this */}
      <WhoUsesThis />

      {/* 9. Country Grid */}
      <section aria-label="EU27 country fuel reserve overview">
        <CountryGrid stocks={stocks.countries} prices={prices.countries} />
        {totalCountries > 0 && countriesBelowThreshold > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            {countriesBelowThreshold} of {totalCountries} reporting countries are below the 90-day benchmark for at least one fuel type. Data is the latest available from Eurostat; reporting dates vary by country. Stock data is published monthly with an approximate 2-month lag.
          </p>
        )}
      </section>

      {/* 10. Pro Teaser */}
      <ProTeaser />

      {/* 11. Data Sources */}
      <section aria-label="Data sources" className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">Data Sources</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-gray-500">
          <div>
            <p className="font-medium text-gray-400">Oil Stocks</p>
            <p><a href="https://ec.europa.eu/eurostat/databrowser/view/NRG_STK_OILM" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">Eurostat (nrg_stk_oilm)</a> — monthly, ~2-month lag</p>
            <p>Latest period: {stocks.dataPeriod || 'pending'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-400">Fuel Prices</p>
            <p><a href="https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">EC Weekly Oil Bulletin</a> — weekly</p>
            <p>Bulletin date: {prices.bulletinDate || 'pending'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-400">Crude Oil</p>
            <p>{brent.dataSource}</p>
            <p>Updated: {brent.lastUpdated ? new Date(brent.lastUpdated).toLocaleDateString('en-GB') : 'pending'}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Reserve data reflects the latest available Eurostat submissions per country, not real-time tank levels. Prices are national averages including all taxes. This dashboard refreshes daily to capture new submissions.
        </p>
      </section>
    </div>
  );
}
