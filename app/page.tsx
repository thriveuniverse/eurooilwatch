import { getDashboardData, getEUHistory, getCentcom, getRefineryOutages } from '@/lib/data';
import { getFIRMSDetections } from '@/lib/firms';
import RefineryHealthPanel from '@/components/RefineryHealthPanel';
import StatusBanner from '@/components/StatusBanner';
import ReserveGauge from '@/components/ReserveGauge';
import PriceTicker from '@/components/PriceTicker';
import PhysicalSpotPanel from '@/components/PhysicalSpotPanel';
import CountryGrid from '@/components/CountryGrid';
import AnalysisPanel from '@/components/AnalysisPanel';
import StockChart from '@/components/StockChart';
import EmailCTA from '@/components/EmailCTA';
import DisruptionBanner from '@/components/DisruptionBanner';
import FuelPriceSearch, { type CityTuple } from '@/components/FuelPriceSearch';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import type { GasData } from '@/components/GasTracker';

export const metadata: Metadata = {
  title: 'EuroOilWatch — EU Fuel Reserve & Price Intelligence',
  description:
    'Monitor fuel reserve levels and prices across 27 EU countries. Official Eurostat data, weekly price updates, AI analysis. Used by logistics operators, analysts, and journalists.',
  alternates: { canonical: 'https://eurooilwatch.com' },
};

export const revalidate = 1800;

export default async function DashboardPage() {
  const { stocks, prices, brent, analysis } = getDashboardData();
  const centcom = getCentcom();
  const euHistory = getEUHistory();
  const refineries = getRefineryOutages();
  const firmsResult = await getFIRMSDetections();

  // Cross-fetch OPEC+ summary from AmericasOilWatch (canonical host)
  const opecSummary = await (async () => {
    try {
      const res = await fetch('https://americasoilwatch.com/api/v1/opec', { next: { revalidate: 3600 } });
      if (!res.ok) return null;
      const d = await res.json();
      if (!d?.totals) return null;
      const russia = d.members?.find((m: any) => m.code === 'RUS')?.latestKbpd ?? null;
      return {
        period: d.latestDataPeriod as string | null,
        opecMbpd: (d.totals.opecKbpd ?? 0) / 1000,
        russiaMbpd: russia != null ? russia / 1000 : null,
      };
    } catch { return null; }
  })();

  const refineryHighSeverity = refineries?.outages.filter(
    o => o.severity === 'critical' || o.severity === 'high'
  ).length ?? 0;

  const countriesBelowThreshold = stocks.countries.filter(c =>
    c.fuels.some(f => f.daysOfSupply < 90)
  ).length;
  const totalCountries = stocks.countries.length;

  const gas = ((): GasData | null => {
    const p = path.join(process.cwd(), 'data', 'gas.json');
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as GasData; } catch { return null; }
  })();

  // Merge French + Spanish city indexes into one tuple list for the homepage typeahead.
  // Each tuple: [ville, country, areaCode, stationCount]. Sorted by station count desc.
  const searchCities = ((): CityTuple[] => {
    const loadCountry = (file: string, country: 'FR' | 'ES' | 'IT' | 'PT'): CityTuple[] => {
      const p = path.join(process.cwd(), 'data', file);
      if (!fs.existsSync(p)) return [];
      try {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf-8')) as {
          cities?: [string, string, number][];
        };
        return (parsed.cities ?? []).map(
          ([ville, area, n]) => [ville, country, area, n] as CityTuple
        );
      } catch { return []; }
    };
    const fr = loadCountry('france-city-index.json', 'FR');
    const es = loadCountry('spain-city-index.json', 'ES');
    const it = loadCountry('italy-city-index.json', 'IT');
    const pt = loadCountry('portugal-city-index.json', 'PT');
    return [...fr, ...es, ...it, ...pt].sort((a, b) => b[3] - a[3]);
  })();

  return (
    <div className="space-y-6">
      <h1 className="sr-only">EuroOilWatch — EU Fuel Reserve & Price Intelligence</h1>

      {/* Disruption alert */}
      <DisruptionBanner
        tone="update"
        headline="Hormuz relief crushes crude — but the stress moves downstream"
        body="Oil flows through the Strait are running at their fastest since the war began — roughly 75% of pre-war levels — and Brent has fallen to about $72 (its lowest since February), WTI below $71, as the market prices returning supply. But it isn't resolution: a cargo ship was struck off Oman and the UN paused its evacuation of stranded vessels, so shipping risk and war-risk insurance remain. And the real pressure has rotated downstream — diesel is tight, refineries are damaged, and power grids are stressed. De-escalation, not all-clear."
        linkLabel="The crisis is moving downstream →"
        linkHref="/analysis/oil-crisis-moving-downstream"
      />

      {/* Research hub — flagship body of work */}
      <a
        href="/research"
        className="block rounded-lg border border-oil-700/60 bg-oil-900/40 px-4 py-3 hover:border-oil-500 hover:bg-oil-900/60 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-oil-400 uppercase">Research</span>
        <span className="block text-sm text-gray-300 mt-0.5">
          The analytical backbone — the <span className="text-white font-semibold">Compound Cascade framework</span> &amp; its companion{' '}
          <span className="text-white font-semibold">Institutional Failure Mode Typology</span>, plus the interactive instruments{' '}
          <span className="text-oil-300 group-hover:text-white">→</span>
        </span>
      </a>

      {/* Latest flagship — direct flag to the current centrepiece analysis */}
      <a
        href="/analysis/oil-crisis-moving-downstream"
        className="block text-xs text-oil-300 hover:text-white transition"
      >
        <span className="font-mono uppercase tracking-widest text-oil-500">Latest</span>{' '}
        The Oil Crisis Is Not Ending — It Is Moving Downstream →
      </a>

      {/* 1. Status Banner */}
      <section aria-label="EU fuel security status">
        <StatusBanner
          status={analysis.overallStatus}
          statusLine={analysis.statusLine}
          dataPeriod={stocks.dataPeriod}
          lastUpdated={stocks.lastUpdated}
        />
      </section>

      {/* Find cheapest fuel near you (France granular) */}
      <FuelPriceSearch cities={searchCities} />

      {/* 3. Reserve Gauges */}
      <section aria-label="EU average fuel reserves">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          EU Average Fuel Reserves (Days of Supply)
        </h2>
        {stocks.dataPeriod && (
          <p className="text-[11px] text-gray-500 mb-4 mt-0.5">
            As of {new Date(stocks.dataPeriod + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            {stocks.countriesReporting && stocks.countriesTotal && (
              <> · {stocks.countriesReporting}/{stocks.countriesTotal} countries reporting</>
            )}
            {' '}· Eurostat
          </p>
        )}
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

      {/* Weekly briefing sign-up — above the reserves trend (the email list is the asset) */}
      <div id="briefing">
        <EmailCTA prominent />
      </div>

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

      {/* Physical NWE crude — editorial spot estimate alongside Brent futures benchmark */}
      <PhysicalSpotPanel brentUsd={brent.priceUsd} />

      {/* European Gas Tracker — TTF / Henry Hub spread + AGSI storage headline */}
      {gas && (
        <section aria-label="European gas tracker">
          <a href="/gas" className="block rounded-lg border border-amber-700/40 bg-oil-900/20 hover:border-amber-600/60 hover:bg-oil-900/40 transition group overflow-hidden">
            <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase group-hover:text-gray-200">
                European Gas — TTF vs Henry Hub + AGSI Storage
              </h2>
              <span className="text-[10px] text-gray-500">Updated daily</span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-oil-800/40">
              <div className="bg-oil-900/30 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">TTF (front-month)</p>
                <p className="text-lg font-mono font-bold text-white">€{gas.ttf.priceEurMwh.toFixed(2)}<span className="text-xs text-gray-500 ml-0.5">/MWh</span></p>
                <p className={`text-[10px] mt-0.5 ${gas.ttf.changePct >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {gas.ttf.changePct >= 0 ? '▲' : '▼'} {Math.abs(gas.ttf.changePct).toFixed(2)}%
                </p>
              </div>
              <div className="bg-oil-900/30 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Henry Hub</p>
                <p className="text-lg font-mono font-bold text-white">${gas.hh.priceUsdMmbtu.toFixed(3)}<span className="text-xs text-gray-500 ml-0.5">/MMBtu</span></p>
                <p className={`text-[10px] mt-0.5 ${gas.hh.changePct >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {gas.hh.changePct >= 0 ? '▲' : '▼'} {Math.abs(gas.hh.changePct).toFixed(2)}%
                </p>
              </div>
              <div className="bg-oil-900/30 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Europe pays vs US</p>
                <p className={`text-lg font-mono font-bold ${gas.spread.ratio >= 5 ? 'text-red-400' : gas.spread.ratio >= 3 ? 'text-orange-400' : 'text-amber-400'}`}>
                  {gas.spread.ratio.toFixed(2)}×
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">+${gas.spread.spreadUsdMmbtu.toFixed(2)}/MMBtu</p>
              </div>
            </div>
            {gas.storage && (
              <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-950/30 flex items-center justify-between flex-wrap gap-2">
                <p className="text-[11px] text-gray-400">
                  <span className="text-gray-500">EU storage:</span>{' '}
                  <span className={`font-mono font-semibold ${gas.storage.eu.fullPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {gas.storage.eu.fullPct.toFixed(1)}% full
                  </span>
                  <span className="text-gray-500 ml-2">· gap to {gas.storage.target.fullPct}%: {(gas.storage.target.fullPct - gas.storage.eu.fullPct).toFixed(1)} pts</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  <span className="text-gray-500">Lowest:</span>{' '}
                  {[...gas.storage.countries].sort((a, b) => a.fullPct - b.fullPct).slice(0, 1).map(c => (
                    <span key={c.code}>
                      <span className="text-red-400 font-mono font-semibold">{c.name} {c.fullPct.toFixed(1)}%</span>
                    </span>
                  ))}
                </p>
              </div>
            )}
            <div className="px-5 py-3 border-t border-amber-700/30 bg-amber-950/20 flex items-center justify-between group-hover:bg-amber-950/30 transition">
              <p className="text-xs text-amber-200/90 font-medium">
                Open the full Gas Tracker — TTF vs Henry Hub history, EU storage by country, 90% refill target
              </p>
              <span className="text-amber-300 text-sm font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </a>
        </section>
      )}

      {/* European Jet Fuel Tracker — country days-of-cover + ARA hub headline */}
      {(() => {
        const jetRows = stocks.countries
          .map(c => {
            const j = c.fuels.find((f: any) => f.fuelType === 'jet_fuel');
            return j ? { name: c.countryName, days: j.daysOfSupply, status: j.status } : null;
          })
          .filter((x: any): x is NonNullable<typeof x> => !!x);
        const critical = jetRows.filter((r: any) => r.status === 'critical');
        const stressed = [...jetRows].sort((a: any, b: any) => a.days - b.days)[0];
        const araJet = (() => {
          try {
            const p = path.join(process.cwd(), 'data', 'ara-stocks.json');
            if (!fs.existsSync(p)) return null;
            const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
            return data.weeks?.[0]?.figures?.find((f: any) => f.product === 'jet') ?? null;
          } catch { return null; }
        })();
        return (
          <section aria-label="European jet fuel tracker">
            <a href="/jet" className="block rounded-lg border border-amber-700/40 bg-oil-900/20 hover:border-amber-600/60 hover:bg-oil-900/40 transition group overflow-hidden">
              <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase group-hover:text-gray-200">
                    European Jet Fuel — Country Days-of-Cover + ARA Hub
                  </h2>
                  <span className="text-[9px] font-mono font-bold tracking-wider text-amber-300 uppercase px-1.5 py-0.5 rounded border border-amber-600/40 bg-amber-950/30">New</span>
                </div>
                <span className="text-[10px] text-gray-500">Updated daily</span>
              </div>
              <div className="grid grid-cols-3 gap-px bg-oil-800/40">
                <div className="bg-oil-900/30 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">EU average</p>
                  <p className="text-lg font-mono font-bold text-white">
                    {stocks.euAverage.jetFuelDays.toFixed(1)}<span className="text-xs text-gray-500 ml-0.5">days</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">strategic + commercial</p>
                </div>
                <div className="bg-oil-900/30 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Most-stressed</p>
                  <p className="text-lg font-mono font-bold text-red-400">
                    {stressed ? stressed.days.toFixed(1) : '—'}<span className="text-xs text-gray-500 ml-0.5">days</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{stressed?.name} · {critical.length} of 27 critical</p>
                </div>
                <div className="bg-oil-900/30 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">ARA hub commercial</p>
                  {araJet?.tonnes ? (
                    <>
                      <p className={`text-lg font-mono font-bold ${(araJet.wowPercent ?? 0) < 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {(araJet.tonnes / 1000).toFixed(0)}<span className="text-xs text-gray-500 ml-0.5">kt</span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {araJet.wowPercent != null ? `${araJet.wowPercent >= 0 ? '+' : ''}${araJet.wowPercent}% WoW` : '—'}
                        {araJet.note?.toLowerCase().includes('low') ? ' · 6-yr low' : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-mono font-bold text-gray-500">—</p>
                  )}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-amber-700/30 bg-amber-950/20 flex items-center justify-between group-hover:bg-amber-950/30 transition">
                <p className="text-xs text-amber-200/90 font-medium">
                  Open the full Jet Fuel Tracker — 27-country breakdown, ARA hub trend, 18-month history, UK context
                </p>
                <span className="text-amber-300 text-sm font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </a>
          </section>
        );
      })()}

      {/* Active supply disruption — Hormuz / U.S.–Iran MoU primary; Druzhba secondary */}
      <section aria-label="Active supply disruption">
        <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-700/30 flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold tracking-widest text-amber-300 uppercase">
              Active Supply Disruption
            </h2>
            <span className="text-[10px] font-mono text-amber-400/70">Active since Feb 2026</span>
          </div>
          <div className="px-5 py-4 space-y-2">
            <p className="text-sm font-semibold text-white">
              Hormuz: crude relief, stress moving downstream
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              The crude panic is easing. Oil flows through the Strait are running at their fastest since the
              war began — about 75% of pre-war levels — and Brent has fallen to ~$72 (its lowest since
              February), WTI below $71, as the market prices returning supply after the U.S.–Iran framework.
              But it is de-escalation, not resolution: a cargo ship (the Ever Lovely) was struck off Oman on
              26 June and the UN paused its evacuation of stranded vessels, so war-risk insurance and
              shipping caution persist. And the real pressure has rotated downstream — U.S. distillate
              (diesel) stocks sit ~12M barrels below the five-year average with crack spreads at multi-week
              highs; Russian refineries are damaged by drone strikes; and Europe&apos;s heatwave is curbing
              nuclear output. The stress is now in the plumbing — refineries, products, ports and grids.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-oil-300 font-medium">EU angle:</span>{' '}
              Middle East jet-fuel arrivals into Europe fell from about 330,000 to 60,000 b/d between March
              and April (IEA), and the EU is coordinating on jet-fuel supply — diesel and jet are where the
              squeeze reaches European industry and aviation first.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-oil-300 font-medium">Also active:</span>{' '}
              Russia&apos;s halt of Kazakh crude via the Druzhba pipeline to Germany (since 1 May) continues
              to pressure North West European refining and diesel balances.
            </p>
          </div>
          <div className="px-5 py-2 border-t border-amber-700/20 bg-amber-950/10">
            <p className="text-[10px] text-gray-600">Sources: Reuters, S&amp;P Global, IEA, U.S. CENTCOM (June 2026).</p>
          </div>
        </div>
      </section>

      {/* Refinery Health Watch — NASA FIRMS thermal anomalies, compact homepage view */}
      <RefineryHealthPanel
        data={firmsResult}
        mode="compact"
        regionLabel="24 major EU and Gulf refineries / terminals"
      />

      {/* OPEC+ Production summary — cross-fetched from AmericasOilWatch (canonical host) */}
      {opecSummary && (
        <section aria-label="OPEC+ production cross-link">
          <a href="https://americasoilwatch.com/opec" target="_blank" rel="noopener" className="block rounded-lg border border-oil-800 bg-oil-900/20 hover:border-oil-700 hover:bg-oil-900/40 transition group overflow-hidden">
            <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
                OPEC+ Production — global supply context
              </h2>
              <span className="text-[10px] text-oil-400 group-hover:underline">Full tracker on AmericasOilWatch ↗</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-oil-800/40">
              <div className="bg-oil-900/30 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">OPEC core</p>
                <p className="text-lg font-mono font-bold text-white">
                  {opecSummary.opecMbpd.toFixed(2)}<span className="text-xs text-gray-500 ml-0.5">mbpd</span>
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">12 members · EIA, latest available</p>
              </div>
              <div className="bg-oil-900/30 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Russia</p>
                <p className="text-lg font-mono font-bold text-white">
                  {opecSummary.russiaMbpd != null ? opecSummary.russiaMbpd.toFixed(2) : '—'}<span className="text-xs text-gray-500 ml-0.5">mbpd</span>
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">non-OPEC anchor</p>
              </div>
            </div>
          </a>
        </section>
      )}

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
        <a
          href="/refineries"
          className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-oil-700 bg-oil-900/40 px-4 py-3 hover:border-oil-500 hover:bg-oil-900/60 transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🏭</span>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-oil-300 transition">
                Refinery Outages &amp; Turnarounds <span className="ml-1 text-[10px] font-mono text-amber-400 uppercase tracking-wider">New</span>
              </p>
              <p className="text-xs text-gray-500">
                {refineries && refineries.count > 0
                  ? `${refineries.count} headline${refineries.count === 1 ? '' : 's'} tracked${refineryHighSeverity > 0 ? ` · ${refineryHighSeverity} high-severity` : ''}`
                  : 'Refinery fires, shutdowns, strikes and turnarounds — trade-press tracker'}
              </p>
            </div>
          </div>
          <span className="text-oil-400 text-sm flex-shrink-0">→</span>
        </a>
        <a
          href="/reports/the-fall-of-the-uk"
          className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 hover:border-red-700 hover:bg-red-950/30 transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📘</span>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-red-200 transition">
                Special Report — The Fall of the UK? <span className="ml-1 text-[10px] font-mono text-amber-400 uppercase tracking-wider">New</span>
              </p>
              <p className="text-xs text-gray-500">
                18 structural decline vectors modelled as a single system · 40–70% probability of Accelerated Decline by 2035 · Free download
              </p>
            </div>
          </div>
          <span className="text-red-400 text-sm flex-shrink-0">→</span>
        </a>
        <a
          href="/reports/from-hormuz-to-hunger"
          className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 hover:border-red-700 hover:bg-red-950/30 transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📕</span>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-red-200 transition">
                Special Report — From Hormuz to Hunger
              </p>
              <p className="text-xs text-gray-500">
                Independent systems risk analysis · The fertilizer cascade nobody is modelling · Free download
              </p>
            </div>
          </div>
          <span className="text-red-400 text-sm flex-shrink-0">→</span>
        </a>
        <p className="mt-2 text-xs text-gray-500">
          This analysis is delivered to your inbox every Thursday.{' '}
          <a href="#briefing" className="text-oil-400 underline hover:text-oil-300">
            Subscribe to the weekly briefing →
          </a>
        </p>
      </section>

      {/* Country Grid */}
      <section aria-label="EU27 country fuel reserve overview">
        <CountryGrid stocks={stocks.countries} prices={prices.countries} />
        {totalCountries > 0 && countriesBelowThreshold > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            {countriesBelowThreshold} of {totalCountries} reporting countries are below the 90-day benchmark for at least one fuel type. Data is the latest available from Eurostat; reporting dates vary by country. Stock data is published monthly with an approximate 2-month lag.
          </p>
        )}
      </section>

      {/* Public API + cite-this-data */}
      <section aria-label="Public API" className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
        <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
            Cite this data — Public API
          </h2>
          <a href="/api" className="text-[10px] text-amber-300 hover:underline font-mono">Full docs →</a>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-400 leading-relaxed">
            Every number on this dashboard is available as JSON via a free, read-only API.
            CORS-enabled, no authentication, no key required. Built for journalists, analysts,
            researchers, and LLM agents who want to cite the source rather than scrape the page.
          </p>
          <pre className="bg-oil-950/60 border border-oil-800 rounded px-3 py-2 text-[11px] text-gray-300 overflow-x-auto"><code>{`curl https://eurooilwatch.com/api/v1/stocks    # EU-27 reserves
curl https://eurooilwatch.com/api/v1/gas       # TTF + Henry Hub + AGSI
curl https://eurooilwatch.com/api/v1           # endpoint index`}</code></pre>
          <p className="text-[10px] text-gray-600">
            Attribution: cite as &quot;EuroOilWatch — eurooilwatch.com&quot; alongside the underlying institutional source (Eurostat, EC, EIA, etc.) which is included in every payload.
          </p>
          <p className="text-[11px] text-gray-500">
            Also available: <a href="/rss.xml" className="text-amber-300 hover:underline">RSS feed</a> and a{' '}
            <a href="/changelog" className="text-amber-300 hover:underline">network activity page</a>{' '}
            tracking newsletters, new analysis, reports and dashboard updates across all three OilWatch sites.
          </p>
        </div>
      </section>

      {/* Data Sources */}
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
