import fs from 'fs';
import path from 'path';
import FreshnessGuard from '@/components/FreshnessGuard';

interface Reading {
  product: string;
  benchmark: string;
  level: string;
  wow: string;
  source: string;
}

interface FertilizerData {
  asOf: string;
  lastUpdated: string;
  readings: Reading[];
  editorialReading: string;
  watchNext: string;
  methodologyNote: string;
}

function readFertilizer(): FertilizerData | null {
  const p = path.join(process.cwd(), 'data', 'fertilizer-watch.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function wowColor(wow: string): string {
  const w = wow.toLowerCase();
  if (w.includes('rising') || w.includes('spiked') || w.includes('up')) return 'text-red-300';
  if (w.includes('easing') || w.includes('falling') || w.includes('down')) return 'text-emerald-300';
  return 'text-gray-400';
}

export default function FertilizerWatchPanel() {
  const data = readFertilizer();
  if (!data) return null;

  return (
    <section aria-label="Fertilizer watch" className="rounded-lg border border-amber-800/40 bg-amber-950/10 overflow-hidden">
      <div className="px-5 py-3 border-b border-amber-800/40 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
          Fertilizer Watch
        </h2>
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
          Editorial · updated weekly
        </span>
      </div>

      <FreshnessGuard lastUpdated={data.asOf} maxAgeDays={9} label="This fertilizer read" className="mx-5 mt-3" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-amber-800/30">
        {data.readings.map((r, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{r.product}</span>
              <span className={`text-[10px] font-mono uppercase tracking-wider ${wowColor(r.wow)}`}>
                {r.wow}
              </span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-gray-500">{r.benchmark}</div>
            <div className="mt-2 text-base text-amber-200 font-mono">{r.level}</div>
            <div className="mt-1 text-[10px] text-gray-600">{r.source}</div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-amber-800/30 bg-oil-950/30">
        <p className="text-[12px] text-gray-300 leading-relaxed">
          <span className="text-amber-400/80 font-semibold">Current reading: </span>
          {data.editorialReading}
        </p>
        <p className="mt-2 text-[12px] text-gray-400 leading-relaxed">
          <span className="text-gray-500 font-semibold">Watch next: </span>
          {data.watchNext}
        </p>
      </div>

      <div className="px-5 py-2 border-t border-amber-800/30 bg-oil-900/40">
        <p className="text-[10px] text-gray-500 leading-snug">
          {data.methodologyNote} Updated {new Date(data.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
        </p>
      </div>
    </section>
  );
}
