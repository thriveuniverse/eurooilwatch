/**
 * Brent 3-2-1 Crack Spread panel (Europe / UK).
 *
 * The 3-2-1 crack is the cleanest single proxy for refining margin: what a
 * refiner earns turning 3 barrels of crude into 2 of gasoline and 1 of
 * distillate. It answers the question a falling crude price cannot — do refiners
 * have any incentive to keep running, and will pump/diesel prices follow crude
 * down, or stay stubbornly high?
 *
 * Crude leg is Brent (Europe's benchmark). Product legs use NY Harbor spot as an
 * Atlantic-Basin proxy — EIA publishes no free NWE/Rotterdam product spot, and
 * light-product cracks arbitrage across the Atlantic. The panel labels this.
 *
 * Server component — receives data read from data/crack.json by the page.
 */

export interface CrackData {
  lastUpdated: string;
  latestDate: string;
  crackUsd: number;
  crackChangeUsd: number;
  crackVsYearAgoUsd: number;
  components: { brentUsd: number; gasolineUsdGal: number; ulsdUsdGal: number };
  history: { date: string; crackUsd: number }[];
  formula: string;
  legs: { crude: string; gasoline: string; distillate: string };
  basis: string;
  dataSource: string;
}

function Sparkline({ points }: { points: { date: string; crackUsd: number }[] }) {
  if (points.length < 2) return null;
  const W = 320, H = 56, PAD = 3;
  const vals = points.map(p => p.crackUsd);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - min) / range) * (H - 2 * PAD);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.crackUsd).toFixed(1)}`).join(' ');
  const area = `${PAD},${H - PAD} ${line} ${(W - PAD).toFixed(1)},${H - PAD}`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none" role="img"
         aria-label={`Brent 3-2-1 crack spread trend, latest $${last.crackUsd.toFixed(2)} per barrel`}>
      <polygon points={area} fill="rgb(245 158 11 / 0.10)" />
      <polyline points={line} fill="none" stroke="rgb(245 158 11)" strokeWidth="1.5"
                strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.crackUsd)} r="2.5" fill="rgb(245 158 11)" />
    </svg>
  );
}

export default function CrackSpreadPanel({ data }: { data: CrackData }) {
  const { crackUsd, crackChangeUsd, crackVsYearAgoUsd, components: c, history } = data;
  // Higher margin = product tightness / more consumer pain — matches the site's
  // red-for-up, green-for-down convention on the crude benchmark tiles.
  const up = crackChangeUsd >= 0;
  const first = history[0];
  const last = history[history.length - 1];

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          Brent 3-2-1 Crack Spread
        </h2>
        <span className="text-[10px] font-mono text-gray-600">Refining margin proxy</span>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-mono font-bold text-white leading-none">
              ${crackUsd.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">/bbl</span>
            </p>
            <p className={`mt-1.5 text-xs font-mono ${up ? 'text-red-400' : 'text-emerald-400'}`}>
              {up ? '▲' : '▼'} ${Math.abs(crackChangeUsd).toFixed(2)} d/d
              <span className="text-gray-600 ml-2">
                {crackVsYearAgoUsd >= 0 ? '+' : '−'}${Math.abs(crackVsYearAgoUsd).toFixed(2)} vs yr ago
              </span>
            </p>
          </div>
          <div className="flex-1 max-w-[220px]">
            <Sparkline points={history} />
            <div className="flex justify-between text-[9px] font-mono text-gray-600 -mt-0.5">
              <span>{first?.date}</span>
              <span>{last?.date}</span>
            </div>
          </div>
        </div>

        {/* Component legs */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Brent</p>
            <p className="text-sm font-mono font-semibold text-white">${c.brentUsd.toFixed(2)}</p>
            <p className="text-[9px] text-gray-600">/bbl</p>
          </div>
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Gasoline*</p>
            <p className="text-sm font-mono font-semibold text-white">${c.gasolineUsdGal.toFixed(3)}</p>
            <p className="text-[9px] text-gray-600">/gal · NYH</p>
          </div>
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">ULSD*</p>
            <p className="text-sm font-mono font-semibold text-white">${c.ulsdUsdGal.toFixed(3)}</p>
            <p className="text-[9px] text-gray-600">/gal · NYH</p>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
          The 3-2-1 crack is what a refiner earns turning 3 barrels of crude into 2 of gasoline and
          1 of distillate. A <span className="text-gray-400">wide</span> crack means products are
          holding their value even as crude falls — so pump and diesel prices need not follow crude
          down. It is the bridge between the barrel and the bill.
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-gray-600">
          <span className="text-gray-500">*</span> Brent crude vs NY Harbor products as an
          Atlantic-Basin proxy — EIA publishes no free NWE/Rotterdam product spot, and light-product
          cracks arbitrage across the Atlantic (NY Harbor tracks NWE within a few $/bbl). Indicative
          of European refining economics, not a traded NWE quote.
        </p>
        <p className="mt-2 text-[10px] font-mono text-gray-600">
          {data.dataSource} · spot basis · latest {data.latestDate}
        </p>
      </div>
    </div>
  );
}
