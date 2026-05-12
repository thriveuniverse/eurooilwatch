import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import JetFuelTracker from '@/components/JetFuelTracker';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'European Jet Fuel Tracker | EuroOilWatch',
  description:
    'Live jet fuel days-of-cover across all 27 EU countries plus the ARA hub commercial-stocks signal. Why strategic reserves can look healthy while airlines feel tightness — and what to watch as summer demand peaks.',
  alternates: { canonical: 'https://eurooilwatch.com/jet' },
};

function loadLocalJson<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

async function loadUkJet(): Promise<{ daysOfSupply: number; lastUpdated: string; status: string } | null> {
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/thriveuniverse/ukoilwatch/main/data/stocks.json',
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      lastUpdated: string;
      fuels: { fuelType: string; daysOfSupply: number; status: string }[];
    };
    const jet = data.fuels?.find(f => f.fuelType === 'jet_fuel');
    if (!jet) return null;
    return {
      daysOfSupply: jet.daysOfSupply,
      lastUpdated: data.lastUpdated,
      status: jet.status,
    };
  } catch {
    return null;
  }
}

export default async function JetPage() {
  const stocks  = loadLocalJson<any>('stocks.json');
  const history = loadLocalJson<any>('history.json');
  const ara     = loadLocalJson<any>('ara-stocks.json');
  const ukJet   = await loadUkJet();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">European Jet Fuel Tracker</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Days-of-cover by country (Eurostat), commercial hub stocks (ARA), and the gap between them.
          Jet is the sharp end of European fuel security right now: airlines run on commercial inventory
          that turns over weekly, while strategic reserves cushion shocks on a longer timescale. Headline
          national figures can look comfortable when the operational hub is tightening.
        </p>
      </div>

      {stocks ? (
        <JetFuelTracker stocks={stocks} history={history} ara={ara} ukJet={ukJet} />
      ) : (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-8 text-center">
          <p className="text-sm text-gray-400">Jet fuel data not yet populated.</p>
          <p className="text-xs text-gray-600 mt-1">The page will refresh once <code>npm run fetch:stocks</code> next runs.</p>
        </div>
      )}

      {/* Why this matters */}
      <section className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 space-y-3">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          Why European jet fuel is the most exposed corner of the supply system
        </h2>
        <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
          <p>
            <span className="text-gray-300 font-medium">Inelastic demand.</span>{' '}
            Aviation demand barely flexes in response to price. A €5/MWh move in TTF gas changes industrial
            behaviour within weeks; a €100/tonne move in jet fuel changes nothing until airlines start
            cancelling flights. That makes jet the canary for stress in the wider product complex.
          </p>
          <p>
            <span className="text-gray-300 font-medium">Refining-yield mismatch.</span>{' '}
            European refineries are configured for Middle Eastern medium/sour grades that yield roughly
            13–15% jet. When operators run alternative crudes — US light tight oil, Brazilian, West African —
            jet yields fall toward 9–11%. That means even a fully-supplied crude market can leave the European
            jet barrel short, which is exactly what the current arbitrage pattern looks like.
          </p>
          <p>
            <span className="text-gray-300 font-medium">Strategic vs commercial split.</span>{' '}
            The 90-day stockholding obligation (Directive 2009/119/EC) keeps national-level cover high in
            aggregate. But airlines don&apos;t draw on strategic stocks day-to-day; they draw on commercial
            inventory at the ARA hub and at airport bunkers. The two numbers move on different clocks.
          </p>
          <p>
            <span className="text-gray-300 font-medium">No backstop for the UK.</span>{' '}
            The UK sits outside the EU stockholding framework and holds no dedicated strategic jet reserve.
            Heathrow alone accounts for a large share of national jet demand, and the entire UK system is
            heavily exposed to NW European refining and import flows.
          </p>
          <p>
            <span className="text-gray-300 font-medium">What we don&apos;t yet show.</span>{' '}
            Airport-level bunker days (Heathrow, CDG, Schiphol, Frankfurt) and the
            US-to-Europe transatlantic jet arbitrage spread are planned additions. Both require data
            sources we don&apos;t currently pull.
          </p>
        </div>
      </section>
    </div>
  );
}
