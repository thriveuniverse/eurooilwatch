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
import { GlobalDisruptionStatusCompact } from '@/components/GlobalDisruptionStatus';
import FreshnessGuard from '@/components/FreshnessGuard';
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
  const whereWeStandAsOf = '2026-08-06'; // single source of truth: the Updated label + the FreshnessGuard below
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
      <GlobalDisruptionStatusCompact site="euro" lastUpdated="2026-08-06" />

      {/* Cross-site analysis — The War Is Spending Its Buffers */}
      <a
        href="/analysis/the-war-is-spending-its-buffers"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New &middot; Cross-Site Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          The War Is Spending Its Buffers. All of Them at Once.{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Reuters reports the US has used &lsquo;virtually all&rsquo; of its long-range ATACMS and PrSM missiles in five months of war, with ~65% of Patriot and &ge;38% of THAAD interceptors expended. The arsenal is the latest entry in the ledger this war has been writing since February &mdash; safe detours, fuel stocks, river depth, and now the shield over Gulf oil itself. Every buffer is a stockpile, and they are all being spent at once.
        </span>
      </a>

      {/* Analysis — France Is Spending €10 Billion to Escape Diesel */}
      <a
        href="/analysis/france-canal-seine-nord-diesel-bet"
        className="block rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-4 py-3.5 hover:border-emerald-500 hover:bg-emerald-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-emerald-400 uppercase">
          New &middot; Infrastructure Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          France Is Spending &euro;10 Billion to Escape Diesel. The Route May Not Be Ready When the Canal Opens.{' '}
          <span className="text-emerald-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          The Canal Seine-Nord Europe could remove a million lorry journeys a year &mdash; a permanent demand-side reserve of diesel that no longer has to be burned. But the canal is due in 2032, its large-barge connection to the Seine may not arrive until 2035, and the bill has risen from &euro;5.1bn to as much as &euro;10.5bn with finance. The real gamble is synchronisation.
        </span>
      </a>

      {/* Cross-site analysis — Running Out of Safe Detours */}
      <a
        href="/analysis/running-out-of-safe-detours"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New &middot; Flagship Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Hormuz, Bab el-Mandeb, Suez: The Oil Market Is Running Out of Safe Detours{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          No single event has closed the oil map. Each escape route has inherited the load &mdash; then the threat &mdash; of the one before it: Hormuz to Yanbu to Bab el-Mandeb to Suez/SUMED, where Sidi Kerir loadings have surged and a drone just struck Damietta. The convexity problem: every workaround used up makes the next disruption cost more.
        </span>
      </a>

      {/* Analysis — As Hormuz Falters, Iraq's Pipeline to the Mediterranean Matters Again */}
      <a
        href="/analysis/iraq-pipeline-mediterranean-matters-again"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New &middot; Supply-Route Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          As Hormuz Falters, Iraq&rsquo;s Pipeline to the Mediterranean Matters Again{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Turkey and Iraq have extended the Kirkuk&ndash;Ceyhan operating deal for a year, reserving capacity of up to 750,000 b/d against ~170&ndash;180,000 flowing &mdash; the first commitment of the crisis to expand use of a corridor that bypasses the war&rsquo;s maritime bottlenecks. Its risks are political and commercial, not maritime &mdash; and in a crisis of correlated chokepoints, a route whose risks are different is the scarce asset.
        </span>
      </a>

      {/* Framework analysis — The Danube Falls. Half of Hungary's Electricity Goes With It. */}
      <a
        href="/analysis/danube-falls-hungary-electricity"
        className="block rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-4 py-3.5 hover:border-emerald-500 hover:bg-emerald-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-emerald-400 uppercase">
          New &middot; The Framework, Illustrated
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          The Danube Falls. Half of Hungary&rsquo;s Electricity Goes With It.{' '}
          <span className="text-emerald-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Hungary is shutting down the entire Paks nuclear plant &mdash; nearly half its electricity, the first complete shutdown in 44 years &mdash; because the river that cools it is too low. Not war, not sanctions: a shared input failing across nuclear, coal, hydro, barges and grain at once. Europe&rsquo;s drought has crossed from making energy expensive to switching it off.
        </span>
      </a>

      {/* Analysis — Russia Has Oil. It Is Now Importing Petrol From Morocco. */}
      <a
        href="/analysis/russia-importing-petrol-from-morocco"
        className="block rounded-lg border border-sky-600/50 bg-sky-950/20 px-4 py-3.5 hover:border-sky-500 hover:bg-sky-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-sky-400 uppercase">
          New &middot; Russia&ndash;Ukraine Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Russia Has Oil. It Is Now Importing Petrol From Morocco.{' '}
          <span className="text-sky-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          ~30,000t of AI-92, loaded at Tangier, discharged at Murmansk &mdash; reported supplier: Lukoil. Morocco has no operating refinery, which sharpens the signal: Russia&rsquo;s fourth emergency supply route now runs through a third-country transshipment hub, for petrol of undisclosed origin, carried from Gibraltar to the Arctic.
        </span>
      </a>

      {/* Flagship analysis — Europe Has Crude. What It Is Running Short Of Is Diesel. */}
      <a
        href="/analysis/europe-has-crude-short-of-diesel"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New &middot; Flagship Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Europe Has Crude. What It Is Running Short Of Is Diesel.{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Brent is easing while European diesel cracks set an all-time record ($74.66/bbl), diesel inventories sit at their thinnest since 2022 and total ARA product stocks at a 2014 low. The scarcity is no longer the barrel &mdash; it is the machine that turns the barrel into fuel, just as Europe enters its winter stock-building season.
        </span>
      </a>

      {/* Country focus — France: strong reserve, tight fuel system */}
      <a
        href="/analysis/france-strong-reserve-tight-fuel-system"
        className="block rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-4 py-3.5 hover:border-emerald-500 hover:bg-emerald-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-emerald-400 uppercase">
          New &middot; Country Focus &mdash; France
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          France Has One of Europe&rsquo;s Stronger Oil Reserves &mdash; but Its Fuel System Is More Vulnerable Than It Looks{' '}
          <span className="text-emerald-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          SAGESS holds ~16 million m&sup3; across ~80 sites, deliberately weighted toward finished fuels. But France imports more than half its diesel, jet demand is at a record and Europe&rsquo;s commercial jet buffer is under a month &mdash; a strong strategic reserve sitting on top of a tight everyday product system.
        </span>
      </a>

      {/* Flagship analysis — The Chokepoints Are Becoming Tollbooths */}
      <a
        href="/analysis/chokepoints-becoming-tollbooths"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New &middot; Flagship Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          The Chokepoints Are Becoming Tollbooths{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          In one month three actors &mdash; Washington, an Omani framework and the Houthis &mdash; proposed charging ships for passage through the same two waterways. The tell isn&rsquo;t the fee, it&rsquo;s the exemption: a toll needs a rule about who doesn&rsquo;t pay, and that makes it a claim to jurisdiction rather than a raid.
        </span>
      </a>

      {/* Russia–Ukraine analysis — Russia Is Importing Fuel While Exporting Crude */}
      <a
        href="/analysis/russia-importing-fuel-exporting-crude"
        className="block rounded-lg border border-sky-600/50 bg-sky-950/20 px-4 py-3.5 hover:border-sky-500 hover:bg-sky-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-sky-400 uppercase">
          New &middot; Russia&ndash;Ukraine Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Russia Is Importing Fuel While Exporting Crude{' '}
          <span className="text-sky-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          One of the world&rsquo;s largest crude producers has begun importing gasoline. The paradox is the clearest measure of Ukraine&rsquo;s refinery campaign: producing crude and converting it into fuel are different capabilities &mdash; and attacks on the concentrated refining and logistics system have forced shortages, export bans and imports, tightening global diesel.
        </span>
      </a>

      {/* Flagship analysis — Oil Is Pricing a Pause. Shipping Is Waiting for Proof. */}
      <a
        href="/analysis/oil-is-pricing-a-pause"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New &middot; Flagship Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Oil Is Pricing a Pause. Shipping Is Waiting for Proof.{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Brent fell almost 6% on hope of a US&ndash;Iran pause &mdash; but Hormuz still ran fewer than ten ships a day and Red Sea traffic hit a multi-month low. The market is pricing manageability, not peace; the earliest real test is whether empty tankers start returning to the Gulf.
        </span>
      </a>

      {/* Flagship analysis — Europe's Summer Gas Refill Is Being Repriced by the Iran War */}
      <a
        href="/analysis/europes-summer-gas-refill-repriced"
        className="block rounded-lg border border-sky-600/50 bg-sky-950/20 px-4 py-3.5 hover:border-sky-500 hover:bg-sky-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-sky-400 uppercase">
          New &middot; Gas &amp; Power
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Europe&rsquo;s Summer Gas Refill Is Being Repriced by the Iran War{' '}
          <span className="text-sky-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          One of the war&rsquo;s most direct lines into European and British homes this summer isn&rsquo;t crude &mdash; it&rsquo;s gas. TTF is up more than half in a month to four-month highs, just as Europe must rebuild an unusually low winter buffer (~54% on 22 Jul). Not a shortage: a shared LNG market repricing the cost of winter security.
        </span>
      </a>

      {/* Flagship analysis — The War Reaches the Route Built to Bypass Hormuz */}
      <a
        href="/analysis/the-route-built-to-bypass-hormuz"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New &middot; Flagship Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          The War Reaches the Route Built to Bypass Hormuz{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Saudi Arabia spent decades building a way to move oil without Hormuz &mdash; the pipeline west to Yanbu on the Red Sea. This weekend Houthi strikes on Jizan and Yanbu brought the war to that route. Two corridors meant to be independent are now exposed to the same conflict &mdash; correlated-corridor risk, where the independence a backup depends on is the thing breaking down.
        </span>
      </a>

      {/* Framework analysis — Europe's Reliability Debt */}
      <a
        href="/analysis/europes-reliability-debt"
        className="block rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-4 py-3.5 hover:border-emerald-500 hover:bg-emerald-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-emerald-400 uppercase">
          New &middot; The Framework, Illustrated
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Europe&rsquo;s Reliability Debt{' '}
          <span className="text-emerald-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Brussels asked refiners to defer maintenance to get Europe through the Hormuz shock. Nobody has published what that borrowing cost &mdash; so we built a bounded estimate, assumptions exposed: a real but mid-sized exposure that falls due in the autumn turnaround season.
        </span>
      </a>

      {/* Framework analysis — The Chokepoints Inside Europe */}
      <a
        href="/analysis/the-chokepoints-inside-europe"
        className="block rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-4 py-3.5 hover:border-emerald-500 hover:bg-emerald-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-emerald-400 uppercase">
          New &middot; The Framework, Illustrated
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          The Chokepoints Inside Europe{' '}
          <span className="text-emerald-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Europe is watching Hormuz &mdash; but the Rhine and Danube are losing carrying capacity at home. A river need not close to become a chokepoint; it only has to grow too shallow to carry what Europe expects of it. Landing energy at a port is not the same as delivering it inland.
        </span>
      </a>

      {/* Accountability audit — The Strategic Reserve Nobody Can Measure */}
      <a
        href="/analysis/the-strategic-reserve-nobody-can-measure"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New &middot; Accountability Audit
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          The Strategic Reserve Nobody Can Measure{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          European law makes grid operators rehearse restoring the network &mdash; and imposes secrecy on the plans they rehearse. Spain&rsquo;s national blackout produced an 800-page post-mortem in which nobody asked whether the spare equipment was sufficient. We audited eight jurisdictions: not one publishes an adequacy standard, and not one publishes how long a destroyed transformer takes to replace.
        </span>
      </a>

      {/* Flagship analysis — From Hormuz to the Checkout */}
      <a
        href="/analysis/from-hormuz-to-the-checkout"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New &middot; Flagship Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          From Hormuz to the Checkout &mdash; the Fertiliser Shock Hiding Inside the Energy Crisis{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Sulphur trapped behind Hormuz, a Russian diesel ban and Chinese export controls are moving upstream into fertiliser — just as France's maize fails and Europe leans on imports for the very inputs under threat. The crisis migrates from the oil price to the checkout.
        </span>
      </a>

      {/* Commentary — Europe Is About to Sanction Itself */}
      <a
        href="/analysis/europe-is-about-to-sanction-itself"
        className="block rounded-lg border border-sky-600/50 bg-sky-950/20 px-4 py-3.5 hover:border-sky-500 hover:bg-sky-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-sky-400 uppercase">
          New &middot; Commentary
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Europe Is About to Sanction Itself{' '}
          <span className="text-sky-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Brussels wants to cripple Russia&rsquo;s Arctic LNG fleet before Europe has secured the gas to replace it &mdash; disabling part of the delivery system before working out how to replace what it delivers. Sanctions theatre at the expense of European industry, consumers and food production.
        </span>
      </a>

      {/* Framework illustration — Bypassing a Chokepoint 135 Barrels at a Time */}
      <a
        href="/analysis/bypassing-a-chokepoint-135-barrels-at-a-time"
        className="block rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-4 py-3.5 hover:border-emerald-500 hover:bg-emerald-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-emerald-400 uppercase">
          New &middot; The Framework, Illustrated
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Bypassing a Chokepoint 135 Barrels at a Time{' '}
          <span className="text-emerald-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          It takes nearly 15,000 tanker trucks to equal one supertanker, and 111,000 journeys a day to replace Hormuz&rsquo;s crude. Iraq&rsquo;s convoys are keeping oil moving &mdash; and proving why the infrastructure of cheap energy cannot be improvised once a crisis has begun.
        </span>
      </a>

      {/* Financial frame — Pressure Cooker + Yen carry-trade pair */}
      <a
        href="/analysis/the-world-is-a-pressure-cooker"
        className="block rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-4 py-3.5 hover:border-emerald-500 hover:bg-emerald-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-emerald-400 uppercase">
          New &middot; The Financial Frame
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          The World Is a Pressure Cooker &mdash; and Energy Is the Flame Beneath It{' '}
          <span className="text-emerald-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          Energy is the flame, sovereign debt the weakened vessel, hidden leverage the pressure &mdash; and collateral the likeliest point of fracture. With its companion piece on how an energy shock could detonate the yen carry trade: the financial mechanism most likely to transmit it.
        </span>
      </a>

      {/* Flagship analysis — bold feature banner */}
      <a
        href="/analysis/hormuz-controlled-corridor-diesel-shock"
        className="block rounded-lg border border-amber-600/50 bg-amber-950/20 px-4 py-3.5 hover:border-amber-500 hover:bg-amber-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          New · Flagship Analysis
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Hormuz Is Not Reopened &mdash; a Controlled Corridor as a Diesel Shock Emerges{' '}
          <span className="text-amber-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          The market is fighting two wars at once &mdash; renewed Hormuz risk and Russia&apos;s diesel export ban. European diesel margins have hit a record, and the squeeze is surfacing downstream first, in the fuels that move trucks, ships and food &mdash; a product-market stress that crude prices alone don&apos;t capture. Part II to The Second Shock.
        </span>
      </a>

      {/* EuroOilWatch flagship — Europe's self-inflicted exposure (third in the series) */}
      <a
        href="/analysis/europes-self-inflicted-exposure"
        className="block rounded-lg border border-sky-600/50 bg-sky-950/20 px-4 py-3.5 hover:border-sky-500 hover:bg-sky-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-sky-400 uppercase">
          EuroOilWatch Analysis · New
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Europe&apos;s Self-Inflicted Exposure &mdash; Record Russian LNG, Stalled Electrification, and a Gulf Oil Shock{' '}
          <span className="text-sky-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          In one week Europe bought record Russian LNG, a Gulf war reinserted an oil premium, and the IEA&apos;s own chief called the continent&apos;s failure to electrify a &ldquo;major mistake.&rdquo; The exposure now being stress-tested at Hormuz is, to a substantial degree, self-inflicted. Third in a connected series.
        </span>
      </a>

      {/* Framework keystone — Why Cheap Energy Isn't Always Cheap */}
      <a
        href="/analysis/why-cheap-energy-isnt-always-cheap"
        className="block rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-4 py-3.5 hover:border-emerald-500 hover:bg-emerald-950/30 transition group"
      >
        <span className="text-[10px] font-mono font-semibold tracking-widest text-emerald-400 uppercase">
          New · The Framework
        </span>
        <span className="mt-0.5 block text-base font-bold text-white leading-snug">
          Why Cheap Energy Isn&rsquo;t Always Cheap{' '}
          <span className="text-emerald-300 group-hover:text-white">&rarr;</span>
        </span>
        <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
          The theory beneath the headlines &mdash; Ricardo&rsquo;s comparative advantage and rent, the electricity merit order, Jevons and chokepoint rent. Why a cheap unit of energy is not a cheap energy system, and why the scarcity prices that should fund resilience are the ones policy keeps switching off.
        </span>
      </a>

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
        href="/analysis/the-second-shock-is-not-the-first"
        className="block text-xs text-oil-300 hover:text-white transition"
      >
        <span className="font-mono uppercase tracking-widest text-oil-500">Latest</span>{' '}
        The Second Shock Is Not the First →
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
              Global Oil — Where We Stand
            </h2>
            <span className="text-[10px] font-mono text-amber-400/70">Updated {new Date(whereWeStandAsOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <FreshnessGuard lastUpdated={whereWeStandAsOf} maxAgeDays={4} label="This summary" className="mx-5 mt-3" />
          <div className="px-5 py-4 space-y-2">
            {/* Update — Thu 6 Aug: the escape corridor reaches 81 degrees north; the rains will miss the rivers */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Thu 6 Aug 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">The escape corridor has reached 81 degrees north.</strong> Nearly twenty sanctioned Russian tankers are being routed north of the Severnaya Zemlya archipelago &mdash; within about 500 nautical miles of the North Pole, on one of the most northerly commercial passages ever attempted &mdash; because ice has blocked the traditional Vilkitsky Strait gateway (gCaptain). Only four vessels on earth are operating farther north, all icebreakers or research ships. Roughly the whole of last season&rsquo;s 13.1-million-barrel eastbound Arctic crude volume has already departed in this season&rsquo;s opening weeks &mdash; and the risks are keeping pace: one tanker has already reversed course on heavy ice, and three nuclear icebreakers are escorting the traffic. When the safest remaining detour runs within sight of the Pole, the detour ladder is close to fully extended. Meanwhile Europe&rsquo;s rivers will get little help: this week&rsquo;s rains will be sporadic and largely miss the drought regions (&lsquo;still not enough to make much impact on the low river flows&rsquo; &mdash; MetDesk), Vienna hit <strong className="text-gray-200">40.8C, a national record for Austria</strong>, and ECMWF models point to a possible fifth major heatwave building by early next week. The Rhine sits at its 1880 record low, Paks remains down, and the restrictions on barges and riverside power generation extend into the deepest weeks of the dry season.
              </p>
            </div>
            {/* Update — Wed 5 Aug: the blockade is visibly working — which is why a deal is being drafted */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Wed 5 Aug 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">The blockade is visibly working &mdash; which is exactly why a deal is being drafted.</strong> Some <strong className="text-gray-200">50 laden Iranian tankers</strong> are idling along Iran&rsquo;s coast &mdash; up from 36 when the US blockade was renewed on 14 July &mdash; and advocacy group UANI says it has tracked <strong className="text-gray-200">no laden Iranian crude tanker successfully exiting the Gulf of Oman</strong> since then (transponder-off departures possible). Iranian crude in floating storage is up 14% in a month to <strong className="text-gray-200">135 million barrels</strong> (Vortexa), Iranian Light discounts have narrowed to ~$4 under Brent as sellers hold cargoes, and the Shandong refiners who buy most of it are running at ~48% of capacity. Set that against Monday&rsquo;s reporting that the US has spent &lsquo;virtually all&rsquo; of its long-range ATACMS/PrSM missiles, and the shape of the week is clear: <strong className="text-gray-200">both sides are visibly depleting</strong> &mdash; Iran&rsquo;s export revenue and floating-storage pool, America&rsquo;s deep-strike and interceptor stockpiles &mdash; and that mutual depletion is what has put a drafted interim proposal on the table. Qatar says a text to free up Hormuz shipping exists; Bloomberg reports both US and Iranian officials sounding optimistic. Oil has priced much of it already: WTI below $75, Brent below $79, down more than 11&ndash;12% on the week. A drafted proposal is not a signed one &mdash; and the physical strait remains blockaded, thin and abnormal until it is.
              </p>
            </div>
            {/* Update — Tue 4 Aug: the war runs down its missiles; the rivers run down their water */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Tue 4 Aug 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">The war is running down its missiles, and the rivers are running down their water.</strong> Reuters reports, citing three people familiar with internal data, that the US Army has used <strong className="text-gray-200">&lsquo;virtually all&rsquo; of its long-range ATACMS and Precision Strike Missiles</strong> in five months of war with Iran &mdash; with roughly <strong className="text-gray-200">65% of Patriot interceptors</strong> and at least <strong className="text-gray-200">38% of THAAD interceptors</strong> expended (CSIS estimates said to match internal figures) and a little under half the global Tomahawk supply used (one source; unverified by Reuters). The White House and Pentagon dispute any readiness gap, and CENTCOM has reloaded from stocks elsewhere. This is the material constraint beneath the diplomacy: it pushes Washington toward the negotiated pause the market is already pricing &mdash; but it also thins the interceptor shield that Gulf oil infrastructure has sheltered behind. Meanwhile the <strong className="text-gray-200">Rhine hit its lowest level since records began in 1880</strong> &mdash; 21cm at Kaub, forecast 17cm by Saturday, with the seasonal bottom still ahead. Diesel barge freight from Rotterdam to Karlsruhe is the costliest since Bloomberg&rsquo;s data began in 2009; Shell is moving Rhineland deliveries to rail and truck; and Romania&rsquo;s military <strong className="text-gray-200">detonated a rock formation in the Danube</strong> to push water toward the Cernavod&#259; nuclear plant. Two depletions, one pattern: the buffers &mdash; munitions stockpiles and river depth alike &mdash; are being spent faster than they are being replaced.
              </p>
            </div>
            {/* Update — Mon 3 Aug: oil falls on talks that Iran says are not happening */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Mon 3 Aug 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">Oil is falling on talks that Iran says are not happening.</strong> Brent dropped about $4.65 to <strong className="text-gray-200">$83.28</strong> and WTI roughly $5.20 to <strong className="text-gray-200">$79.47</strong> on Monday morning after President Trump said negotiations with Iran would take place that day &mdash; but <strong className="text-gray-200">Iran&rsquo;s Foreign Ministry says no US&ndash;Iran negotiations are under way</strong>. Tehran confirms only discussions with Oman over temporary safe passage through Hormuz, and insists the strait cannot return to normal while US military action continues. The fall is expectations, not restored exports: Hormuz remains thin (two laden VLCCs out late last week), two Saudi tankers crossed Bab el-Mandeb as the week opened, and neither route is at reliable pre-war capacity. OPEC+ formally approved its ~188,000 b/d September increase &mdash; completing the 1.65 mb/d voluntary-cut rollback, with ~2 mb/d of older cuts running to end-2026 &mdash; largely theoretical while producers sit below quota for want of safe export routes. And the infrastructure wars did not pause for the diplomacy: Ukraine says its weekend wave targeted the Saratov refinery, Engels airbase and a Kaluga oil depot (no confirmed refinery shutdown), and at least eight deaths were reported. <strong className="text-gray-200">A market de-escalation, not yet a physical one</strong> &mdash; and it could reverse quickly if Monday produces no concrete framework or measurable increase in tanker traffic.
              </p>
            </div>
            {/* Update — Sun 2 Aug: negotiating pause at Hormuz; Paks shuts; Kirkuk–Ceyhan extended */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Sun 2 Aug 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">A negotiating pause, not a ceasefire.</strong> President Trump says he has cancelled or postponed the planned strikes on Iranian energy targets while Middle Eastern governments try to complete a deal covering Iran&rsquo;s nuclear programme and the &ldquo;immediate, complete and total&rdquo; reopening of Hormuz. Israel is said to have joined; <strong className="text-gray-200">Iran has not publicly accepted</strong> &mdash; and nothing verified shows normal commercial traffic resuming. The water stayed dangerous regardless: after Saturday&rsquo;s disabled tanker, the master of a second vessel reported <strong className="text-gray-200">an explosion close alongside ~21nm north-west of Khasab</strong> (no damage; attacker unidentified). Iranian drones reached Kuwait, damaging facilities whose nature is undisclosed. The biggest European development is on the Danube: <strong className="text-gray-200">Hungary is shutting the entire Paks nuclear plant &mdash; nearly half its electricity, the first complete shutdown in 44 years</strong> &mdash; for lack of cooling water, possibly for weeks, with demand curbs prepared and imports costed in the hundreds of millions. One durable positive: Turkey and Iraq extended the <strong className="text-gray-200">Kirkuk&ndash;Ceyhan pipeline deal</strong> by a year with reserved capacity up to 750,000 b/d against ~170&ndash;180,000 flowing &mdash; a Hormuz bypass secured, on conditions. OPEC+ has an in-principle September increase of ~188,000 b/d, then a Q4 pause &mdash; targets, not delivered barrels. Markets closed; Friday&rsquo;s $90.12 Brent stands.
              </p>
            </div>
            {/* Update — Sat 1 Aug: tanker disabled at Hormuz entrance; US-Israel strikes reportedly weighed */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Sat 1 Aug 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">A tanker was disabled by an unknown projectile near the entrance to the Strait of Hormuz early Saturday</strong> &mdash; about 11 nautical miles north-east of Limah, Oman: engine room damaged, the vessel &ldquo;not under command&rdquo;, no casualties or pollution initially reported (UKMTO). Its identity, cargo and the party responsible are undisclosed, and we do not attribute the attack. Separately, Reuters &mdash; citing CBS News &mdash; reported late Friday that the US and Israel are <strong className="text-gray-200">planning a possible bombing campaign against energy-related targets inside Iran</strong>, potentially this weekend; President Trump had <strong className="text-gray-200">not given final approval</strong> when the report was published, and no target set is specified. That is reported planning, not an operation &mdash; and no new Iranian fixed energy facility has been verified hit. The strait remains in its strange in-between state: the IRGC claims two tankers hit and four turned back (unconfirmed), while tracking showed two laden VLCCs transiting &mdash; <strong className="text-gray-200">Hormuz is permitting, or failing to prevent, individual passages; it has not returned to normal navigation.</strong> July closed with Brent at <strong className="text-gray-200">$90.12</strong> and WTI $84.67 &mdash; monthly gains of 24% and 21%. And the conversion story deepened: <strong className="text-gray-200">Russia has begun importing petrol from Morocco</strong> (~30,000t of AI-92, unloading at Murmansk), its fourth fuel-supply country, with output near 65% of summer consumption.
              </p>
            </div>
            {/* Update — Fri 31 Jul: not an oil-supply problem — a conversion-and-delivery problem */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Fri 31 Jul 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">The crisis has moved downstream.</strong> Brent eased to about <strong className="text-gray-200">$87.59</strong> (WTI ~$82, both still up roughly 20% on the month) &mdash; but the product market set records: European diesel cracks at an all-time <strong className="text-gray-200">$74.66/bbl</strong>, US diesel cracks at <strong className="text-gray-200">$93.44</strong>, jet above $80, and European diesel inventories at their <strong className="text-gray-200">thinnest since 2022</strong>, with total ARA product stocks at a 2014 low (corrected 1 Aug). The refining losses explain it: Saudi Arabia&rsquo;s <strong className="text-gray-200">~400 kb/d Jizan refinery has been shut since 27 July</strong> (last week&rsquo;s &ldquo;no confirmed outage&rdquo; has resolved the wrong way), part of Kuwait&rsquo;s Al-Zour is down, Russia&rsquo;s <strong className="text-gray-200">Ryazan has halted processing</strong> (~2 weeks, Reuters sources) and Perm lost a unit carrying ~34% of its capacity &mdash; and Moscow has extended fuel-export restrictions to <strong className="text-gray-200">31 January 2027</strong>. Hormuz ran <strong className="text-gray-200">two vessels Thursday, both ballast, both inbound</strong> &mdash; the directional signal we flagged, at a scale that is a flicker, not a recovery; Bab el-Mandeb improved to 25 crossings, with AIS-dark transits keeping every count a minimum. And the strain is reaching the last detour: a drone hit two gas vessels at Egypt&rsquo;s <strong className="text-gray-200">Damietta</strong> port as SUMED loadings surge. The world does not simply have an oil-supply problem; it has an <strong className="text-gray-200">oil-conversion-and-delivery problem</strong> &mdash; crude exists, and the system that turns it into fuel in the right place is what is being degraded.
              </p>
            </div>
            {/* Update — Wed 29 Jul: the pause breaks; physical converges; the US buffer thins */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Wed 29 Jul 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">The pause was a lull, not a settlement.</strong> Saudi Arabia said its armed forces, coordinating with US Central Command, carried out <strong className="text-gray-200">joint strikes on Iran-backed groups in eastern Iraq</strong> after drones launched from Iraqi territory targeted oil facilities in the kingdom&rsquo;s Eastern Province &mdash; <strong className="text-gray-200">Saudi air defences intercepted those drones and no damage to the facilities has been reported</strong> (a separate event from the Houthi strikes near Jizan on 24&ndash;25 July). CENTCOM said the groups were behind more than 30 drone attacks in 72 hours; Iraq&rsquo;s Popular Mobilisation Forces said several headquarters were struck, reporting casualties. Iran denied involvement; Iraq ordered an investigation (Reuters). Oil retraced its fall &mdash; Brent back to about <strong className="text-gray-200">$86.79</strong>, WTI <strong className="text-gray-200">$81.91</strong> &mdash; and Hormuz thinned again to just <strong className="text-gray-200">five commodity vessels on Tuesday</strong>. The physical premium, meanwhile, has <strong className="text-gray-200">collapsed rather than persisted</strong>: Argus North Sea Dated has fallen from about $103 on 24 July to roughly $86 on 28 July, back in line with the screen. The durable story is the shrinking margin for error &mdash; the <strong className="text-gray-200">US Strategic Petroleum Reserve is down to about 307.7 million barrels, its lowest since March 1983</strong>, while US commercial stocks stay below seasonal norms, refineries run at 96.1% of operable capacity and US diesel sits above <strong className="text-gray-200">$5.31/gal</strong>. Not a shortage &mdash; a system with less room to absorb the next shock.
              </p>
            </div>
            {/* Update — Mon 27 Jul: markets price a truce, the tankers do not */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Mon 27 Jul 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">The shooting has paused; the shipping crisis has not.</strong> Brent fell more than <strong className="text-gray-200">6% on Monday to about $90.58</strong> (WTI ~$83.51) after the US and Iran held fire for a second consecutive day and Oman pressed to restore a ceasefire framework &mdash; roughly $11 of war premium out since Brent hit about $102 on 23 July, lifting equities and bonds. But the physical system has barely moved: Hormuz ran in <strong className="text-gray-200">single digits</strong> over the weekend (about 7 vessels Friday, 3 Saturday all dark, 7 Sunday; Kpler), and Bab el-Mandeb fell to just <strong className="text-gray-200">11 crossings on Sunday</strong>, the lowest in months, after the Jizan/Yanbu attacks. Physical crude hit two-month highs last week and traders reckon ~10 mb/d of Middle Eastern barrels is still displaced &mdash; oil is falling because the market thinks the disruption can be <em>managed</em>, not because the barrels have returned. This is <strong className="text-gray-200">market de-escalation without physical normalisation</strong>: the nuclear dispute is unresolved, the US naval blockade still operates, and Hormuz has not reopened. Europe&rsquo;s winter-fuel deficit is untouched &mdash; gas storage about 55% (lowest since 2021), diesel stocks the lowest since 2022, European diesel margins near a record ~$65/bbl.
              </p>
            </div>
            {/* Update — Sun 26 Jul: Saudi Red Sea bypass under direct attack + US strikes pause */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Sun 26 Jul 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">The war has begun attacking the infrastructure built to bypass the war.</strong> On Saturday the Houthis fired at Aramco installations at <strong className="text-gray-200">Jizan and Yanbu</strong> &mdash; Saudi Arabia&rsquo;s Red Sea outlet for crude routed west to avoid Hormuz. Reuters-verified footage showed a column of smoke from the direction of the ~400 kb/d Jizan refinery and trading sources reported possible damage to fuel and oil storage there; <strong className="text-gray-200">Aramco has confirmed no outage or production loss</strong>, and the Yanbu-bound missiles were reportedly intercepted with no confirmed damage. The Houthis have declared a blockade of Saudi Arabia and warned all its oil facilities could be targeted. Counter-signal: the US <strong className="text-gray-200">paused its strikes on Iran after a 13-night run</strong>, with no Gulf-state retaliation over the weekend &mdash; the naval blockade stays in force and Washington is reportedly holding back while a China-initiated diplomatic push continues. That is a political opening, not a reopened chokepoint: Hormuz still ran only about <strong className="text-gray-200">three transits a day</strong> on 22&ndash;24 July (Kpler), though one laden VLCC with ~2m bbl of Basrah crude did exit. Ukraine&rsquo;s drone campaign widened to Russia&rsquo;s Caspian (Lukoil&rsquo;s Filanovsky platform) and Siberia (a Tyumen refinery fire), and Moscow is extending its gasoline-export ban to end-2026. European gas is repricing too &mdash; TTF near &euro;63/MWh and UK gas above 150p/therm, about four-month highs, lifting the cost of the winter storage refill. Markets were closed Saturday; Brent settled Friday at <strong className="text-gray-200">$96.78</strong> (&minus;3.9% on a China-talks report, ~+10% on the week) &mdash; a close struck <em>before</em> the weekend attacks, so any Monday rebuild of the risk premium is an inference, not a confirmed move.
              </p>
            </div>
            {/* Update — Tue 21 Jul: ceasefire collapse #2 + Houthi Saudi-port embargo */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Tue 21 Jul 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                The interim <strong className="text-gray-200">17 June truce has broken down</strong> and US strikes have run a <strong className="text-gray-200">tenth consecutive night</strong>. The Red Sea threat has turned concrete: Yemen&rsquo;s Houthis emailed shipowners declaring an <strong className="text-gray-200">embargo on all ships calling at Saudi ports</strong> (Bloomberg), directly threatening <strong className="text-gray-200">Yanbu</strong> &mdash; the bypass Saudi Arabia has used while Hormuz runs at a near-halt (about four commodity crossings Monday, most dark). Brent touched <strong className="text-gray-200">$91.42</strong> Monday, its highest since 11 June, before easing to about <strong className="text-gray-200">$89</strong> on hopes of a fresh ceasefire &mdash; a retreat on diplomacy, not restored supply. European low-sulphur gasoil hit a <strong className="text-gray-200">record premium near $60/bbl</strong> over Brent.
              </p>
            </div>
            {/* Update — Thu 16 Jul: two-front escalation (Tehran strikes + tanker; Russian refining ~40% offline) */}
            <div className="rounded border border-red-700/40 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400/80 uppercase">
                Update &mdash; Thu 16 Jul 2026
              </p>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
                The war has widened on two fronts. US strikes reached{' '}
                <strong className="text-gray-200">Tehran for the first time</strong> in this round overnight
                &mdash; alongside Bandar Abbas and coastal missile sites &mdash; and US forces{' '}
                <strong className="text-gray-200">disabled a blockade-running oil tanker</strong> (the
                Cura&ccedil;ao-flagged <em>Belma</em>) in Hormuz as it tried to reach Kharg Island, the first
                vessel stopped by force since the full Iran-only blockade resumed. Iran retaliated against
                US-allied <strong className="text-gray-200">Bahrain, Kuwait and Jordan</strong>. No Iranian
                oilfield, refinery or the Kharg terminal has been confirmed hit &mdash; strikes have stayed on
                military and maritime targets, which is why Brent sits around $85 ($84.95 settle, 15 Jul) rather
                than back above $100. Separately, Reuters reports roughly{' '}
                <strong className="text-gray-200">40% of Russian refining capacity is now offline</strong>{' '}
                (repairs and outages, not destroyed) after Ukraine&rsquo;s sustained drone campaign &mdash; the
                clearest verified physical loss in the system right now.
              </p>
            </div>
            {/* In his own words — Trump's 20% Hormuz toll declaration (13 Jul) */}
            <div className="rounded border border-amber-700/40 bg-oil-950/50 px-4 py-3">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
                In his own words — Trump, Truth Social, 13 July 2026
              </p>
              <div className="mt-2 space-y-1.5 border-l-2 border-amber-600/40 pl-3 text-xs italic text-gray-300 leading-relaxed">
                <p>&ldquo;The Strait of Hormuz is OPEN, and will remain OPEN, with or without Iran.&rdquo;</p>
                <p>&ldquo;We are reinstating THE IRANIAN BLOCKADE&hellip; All other countries will have fair and open use of the Strait.&rdquo;</p>
                <p>&ldquo;The U.S.A. will be, from this point forward, known as &lsquo;THE GUARDIAN OF THE HORMUZ STRAIT,&rsquo; but as such&hellip; will be reimbursed, at the rate of 20% on all cargo shipped&hellip; The process and formation will begin immediately.&rdquo;</p>
              </div>
              <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                A 20% levy on a strait carrying roughly a fifth of global oil consumption would be an unprecedented assertion of control, and oil rose on the announcement. There is <strong className="text-gray-400">no executive order, legal framework or collection mechanism</strong> &mdash; and the IMO Council has ruled that transit through international straits may not be tolled. Iran&rsquo;s Persian Gulf Strait Authority called passage &ldquo;currently unfeasible&rdquo; and suspended permits. <strong className="text-gray-400">Update &mdash; Tue 14 Jul:</strong> after shipper backlash and the IMO ruling, Trump dropped the 20% fee, replacing it with a push for Gulf trade and investment deals while keeping the Iran-only blockade.
              </p>
            </div>
            <p className="text-sm font-semibold text-white">
              Brent holds above $85 as Trump drops the 20% Hormuz toll but tightens a full Iran-only blockade — Iran strikes two UAE tankers in the &lsquo;safe&rsquo; southern lane, threatens a second chokepoint at Bab el-Mandeb, and $100 is in view if the strait&apos;s last buffer is hit
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              The escalation hardened into Tuesday: Brent has jumped above $85 — a four-week high, after a near-10% single-session surge, its biggest daily gain since 2020 — with WTI around $80, after President Trump floated — then, a day later, dropped — a 20% US &lsquo;reimbursement fee&rsquo; on all Hormuz cargo, replacing it with a push for Gulf trade and investment deals while tightening a full blockade on Iran-linked shipping. The strait&apos;s status is openly contested: both Washington and Tehran have claimed the right to police it, and the IMO Council has ruled that transit may not be tolled. What actually moved tells the story: tanker traffic has fallen to a two-month low — transits down to just 4–13 a day against a ~138 norm (JMIC), with LNG carriers absent and more ships crossing dark. The violence is now hitting commercial tonnage directly — Iran struck two UAE tankers, al-Bahiya and Mombasa, with cruise missiles in Omani waters, killing one crew member and wounding eight. And a second front has opened: Yemen&apos;s Houthis fired on Saudi Arabia&apos;s Abha airport (intercepted), breaking the March 2022 truce — no Saudi oil was hit, but Saudi spare capacity is the buffer holding the price, and it is now in play alongside the strait. If energy infrastructure is targeted more broadly, $100 oil is back in view (Saul Kavonic, MST Marquee); the IEA has warned the flare-up risks derailing the rebuild of depleted global inventories — the same thin buffers this site has tracked all along.
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
            <p className="text-[10px] text-gray-600">Sources: Reuters, Bloomberg, FT, CENTCOM, Kpler, JMIC, IEA, AP, WaPo (16 July 2026).</p>
          </div>
        </div>
      </section>

      {/* Big overlooked story — Russia's fuel crunch reaches agriculture */}
      <section aria-label="Russia fuel shortage" className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
        <p className="text-[10px] font-mono font-semibold tracking-widest text-gray-500 uppercase">Big overlooked story</p>
        <p className="mt-1 text-sm font-semibold text-white">Russia&apos;s fuel problem reaches agriculture and domestic supply</p>
        <p className="mt-1 text-xs text-gray-400 leading-relaxed">
          President Putin has publicly acknowledged fuel shortages in Russian regions, tying them to Ukrainian drone
          strikes on oil infrastructure and stressing the need to protect supply for agriculture ahead of the harvest.
          Refinery capacity is sharply reduced — Reuters reported on 16 July that roughly 40% is offline (plants under repair and outages of varying severity, not destroyed; Ukrainian sources say ~43%), several regions are rationing, and the
          squeeze is reaching logistics and food systems — the same downstream cascade seen elsewhere: refinery hits →
          diesel scarcity → agriculture and supply-chain risk.{' '}
          <a href="/analysis/russia-fuel-shortage-food-logistics" className="text-oil-300 hover:text-white underline underline-offset-2">Read our analysis →</a>
        </p>
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
