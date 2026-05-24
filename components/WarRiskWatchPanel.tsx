import fs from 'fs';
import path from 'path';

interface PremiumReading {
  route: string;
  level: string;
  wow: string;
  source: string;
}

interface WarRiskData {
  asOf: string;
  lastUpdated: string;
  jwcListedAreas: {
    lastChange: string;
    latestUpdate: string;
    currentRiskAreas: string[];
  };
  premiumReadings: PremiumReading[];
  editorialReading: string;
  watchNext: string;
  methodologyNote: string;
}

function readWarRisk(): WarRiskData | null {
  const p = path.join(process.cwd(), 'data', 'war-risk-watch.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

export default function WarRiskWatchPanel() {
  const data = readWarRisk();
  if (!data) return null;

  return (
    <section aria-label="War-risk insurance watch" className="rounded-lg border border-amber-800/40 bg-amber-950/10 overflow-hidden">
      <div className="px-5 py-3 border-b border-amber-800/40 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
          War-Risk Watch
        </h2>
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
          Editorial · updated weekly
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-amber-800/30">
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-mono">
            JWC Listed Areas — high risk
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.jwcListedAreas.currentRiskAreas.map(area => (
              <span key={area} className="text-[11px] text-amber-200 border border-amber-800/60 bg-amber-950/40 rounded px-2 py-0.5">
                {area}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">
            <span className="text-gray-500">Latest list change ({data.jwcListedAreas.lastChange}):</span> {data.jwcListedAreas.latestUpdate}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-mono">
            Premium readings (publicly cited)
          </p>
          <ul className="space-y-2.5">
            {data.premiumReadings.map((p, i) => (
              <li key={i} className="text-xs text-gray-300">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-white font-mono">{p.route}</span>
                  <span className="text-[10px] text-gray-500 font-mono">w/w {p.wow}</span>
                </div>
                <div className="text-[11px] text-amber-200/90 mt-0.5">{p.level}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{p.source}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-amber-800/30 bg-oil-950/30">
        <p className="text-[11px] text-gray-300 leading-relaxed">
          <span className="text-amber-400/80 font-semibold">Current reading: </span>
          {data.editorialReading}
        </p>
        <p className="mt-2 text-[11px] text-gray-400 leading-relaxed">
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
