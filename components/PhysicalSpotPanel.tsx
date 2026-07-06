import fs from 'fs';
import path from 'path';

interface SpotPhysical {
  priceEur: number;
  priceUsd: number;
  asOf: string;
  basis: string;
  source: string;
  note?: string;
}

function readSpot(): SpotPhysical | null {
  const p = path.join(process.cwd(), 'data', 'spot-physical.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

// Single source of truth for EUR/USD: the live rate written by the daily
// fetchers. gas.json (fetch-gas) and brent.json (fetch-brent) both pull the
// same Yahoo EURUSD=X, so every EUR figure on the site reconciles to one rate.
// Falls back to the stored editorial priceEur only if neither file has it.
function liveEurUsd(): number | null {
  for (const f of ['gas.json', 'brent.json']) {
    try {
      const p = path.join(process.cwd(), 'data', f);
      if (!fs.existsSync(p)) continue;
      const rate = JSON.parse(fs.readFileSync(p, 'utf-8'))?.eurUsd;
      if (typeof rate === 'number' && rate > 0.5 && rate < 2) return rate;
    } catch { /* try next */ }
  }
  return null;
}

interface Props {
  brentUsd?: number;
}

export default function PhysicalSpotPanel({ brentUsd }: Props) {
  const spot = readSpot();
  if (!spot) return null;
  // Convert the USD editorial estimate at the live rate so €/$ never disagree.
  const eurUsd = liveEurUsd();
  const priceEur = eurUsd ? Math.round(spot.priceUsd / eurUsd) : spot.priceEur;
  const premiumPct = brentUsd && brentUsd > 0
    ? ((spot.priceUsd - brentUsd) / brentUsd) * 100
    : null;

  return (
    <section aria-label="Physical crude spot estimate" className="rounded-lg border border-amber-800/40 bg-amber-950/10 px-5 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
            Physical NWE Crude — Editorial Estimate
          </p>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-white font-mono">€{priceEur}</span>
            <span className="text-sm text-gray-400">/bbl</span>
            <span className="text-sm text-gray-500 font-mono">· ${spot.priceUsd}</span>
          </div>
          {premiumPct !== null && premiumPct > 0 && (
            <p className="mt-1 text-xs font-mono text-amber-300">
              +{premiumPct.toFixed(0)}% above Brent futures benchmark
            </p>
          )}
        </div>
        <div className="text-right max-w-sm min-w-0">
          <p className="text-[11px] text-gray-400">{spot.basis}</p>
          <p className="mt-1 text-[10px] text-gray-500 font-mono">
            As of {new Date(spot.asOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {spot.source}
          </p>
        </div>
      </div>
      {spot.note && (
        <p className="mt-2 pt-2 border-t border-amber-800/30 text-[11px] text-gray-400 italic">
          {spot.note}
        </p>
      )}
    </section>
  );
}
