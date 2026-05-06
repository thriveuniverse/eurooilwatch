import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import GasTracker, { type GasData } from '@/components/GasTracker';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'European Gas Tracker — TTF vs Henry Hub | EuroOilWatch',
  description:
    'Live Dutch TTF and US Henry Hub natural gas prices, with the transatlantic spread. The headline number for European industrial competitiveness and US LNG export economics.',
  alternates: { canonical: 'https://eurooilwatch.com/gas' },
};

function loadGas(): GasData | null {
  const p = path.join(process.cwd(), 'data', 'gas.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as GasData; } catch { return null; }
}

export default function GasPage() {
  const gas = loadGas();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">European Gas Tracker</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Dutch TTF is the European gas benchmark; Henry Hub is the US benchmark. The
          transatlantic spread is the most consequential single number for European
          industrial competitiveness and for US LNG export economics. We track both,
          normalised to USD/MMBtu so the comparison is direct.
        </p>
      </div>

      {gas ? (
        <GasTracker data={gas} />
      ) : (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-8 text-center">
          <p className="text-sm text-gray-400">Gas data not yet populated.</p>
          <p className="text-xs text-gray-600 mt-1">Run <code>npm run fetch:gas</code> to populate.</p>
        </div>
      )}

      {/* Why this matters */}
      <section className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 space-y-3">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          Why the TTF–Henry Hub spread matters
        </h2>
        <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
          <p>
            <span className="text-gray-300 font-medium">European industrial competitiveness.</span>{' '}
            Energy-intensive sectors — chemicals, fertiliser, steel, ceramics, glass — spend a
            material share of variable cost on natural gas. When TTF runs at 4–6× Henry Hub,
            European production is structurally uncompetitive against North American equivalents.
            Sustained spreads of this scale drive permanent capacity loss, not just temporary
            margin compression.
          </p>
          <p>
            <span className="text-gray-300 font-medium">US LNG export economics.</span>{' '}
            The TTF–HH spread minus shipping and liquefaction (~$3/MMBtu landed cost)
            determines the netback to US Gulf Coast LNG exporters. Wider spreads pull more
            cargoes to Europe; narrower spreads see them re-routed to Asia or held back.
          </p>
          <p>
            <span className="text-gray-300 font-medium">Pre-Ukraine baseline.</span>{' '}
            The historic TTF/HH ratio sat around 1.5× through the 2010s. Russia&apos;s 2022
            invasion took it briefly above 10×. Since REPowerEU, the structural ratio appears
            to have settled in the 2–4× band — meaningfully above the pre-war norm and a
            permanent feature of the post-Russia European gas market.
          </p>
          <p>
            <span className="text-gray-300 font-medium">What we don&apos;t yet show.</span>{' '}
            US LNG export-cargo counts are a planned v2 addition that will piggyback on the
            existing tanker AIS infrastructure. Storage levels (AGSI/GIE) are now live above.
          </p>
        </div>
      </section>
    </div>
  );
}
