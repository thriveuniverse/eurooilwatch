import fs from 'fs';
import path from 'path';

interface ZoneData {
  name: string;
  latestSnapshotCount: number;
  latestSnapshotAt: string;
  unique24h: number;
  unique7d: number;
  trailing28dDailyAvg: number;
  weekOverWeekDelta: number | null;
}

interface TankerTraffic {
  generatedAt: string;
  zones: Record<string, ZoneData>;
}

function readTraffic(): TankerTraffic | null {
  const p = path.join(process.cwd(), 'data', 'tanker-traffic.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

const ZONE_CONTEXT: Record<string, { label: string; pre: string; significance: string }> = {
  hormuz: {
    label: 'Strait of Hormuz',
    pre: 'Pre-crisis: ~138 transits/day',
    significance: 'Persian Gulf crude exit — closure-depth signal',
  },
  ara: {
    label: 'ARA Approaches',
    pre: 'Rotterdam · Antwerp · Amsterdam',
    significance: "Europe's main refined-product corridor — Loop 3 leading indicator",
  },
  suez: {
    label: 'Suez / Bab-el-Mandeb',
    pre: 'Pre-Houthi: ~80 transits/day combined',
    significance: 'Red Sea corridor — Cape rerouting pressure',
  },
};

const ZONE_ORDER = ['ara', 'hormuz', 'suez'] as const;

export default function TankerActivity() {
  const data = readTraffic();
  if (!data) return null;

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          Tanker Activity at Key Chokepoints
        </h2>
        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80">
          Preliminary · baseline building
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-oil-800/40">
        {ZONE_ORDER.map(zid => {
          const z = data.zones[zid];
          const ctx = ZONE_CONTEXT[zid];
          if (!z || !ctx) return null;
          return (
            <div key={zid} className="px-5 py-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">{ctx.label}</p>
              <p className="mt-2 text-2xl font-bold text-white font-mono">
                {z.unique24h}
                <span className="text-xs text-gray-500 ml-1">tankers</span>
              </p>
              <p className="text-[10px] text-gray-600 font-mono">
                unique transits, last 24h
              </p>
              <p className="text-[10px] text-gray-500 mt-3 leading-snug">
                {ctx.pre}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 leading-snug italic">
                {ctx.significance}
              </p>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-2 border-t border-oil-800/40 bg-oil-900/30">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Live AIS tanker tracking via aisstream.io, captured every 4 hours and aggregated into rolling 24-hour, 7-day, and 28-day counts.
          {' '}<strong className="text-gray-400">Baseline accumulating since 20 May 2026</strong> — week-on-week and 28-day comparisons populate by ~17 June 2026.
          {' '}Updated {new Date(data.generatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.
        </p>
      </div>
    </div>
  );
}
