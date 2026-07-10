/**
 * Strait of Hormuz — Tanker Throughput vs 2023 baseline.
 *
 * A dedicated recovery view of the site's central chokepoint, from data we
 * already ingest — IMF PortWatch chokepoint transits (satellite-AIS derived).
 * The all-lanes ChokepointTransitPanel shows Hormuz as one row; this foregrounds
 * the recovery arc, a derived mb/d, and the collapse-to-rebound story.
 *
 * What this IS: aggregate strait transit throughput (all tankers, all origins)
 *   as % of the 2023 baseline. What it is NOT (and can't be from free data):
 *   by-origin loadings, or the ballast (empty) tanker leading indicator — both
 *   need paid vessel intelligence (Kpler). Cross-check: avg7 ≈ 14 transits/day
 *   matches BRS's "98 crossings, 22–28 Jun".
 *
 * Takes the same portwatch-chokepoints.json object the ChokepointTransitPanel does.
 */

import { type PortwatchData } from './ChokepointTransitPanel';

const BBL_PER_TONNE = 7.33; // documented crude-equivalent factor (same as the crude Sankey)

function rolling7Pct(series: { d: string; c: number }[], baseTonnage: number) {
  return series.map((_, i) => {
    const w = series.slice(Math.max(0, i - 6), i + 1);
    const mean = w.reduce((a, p) => a + p.c, 0) / w.length;
    return { date: series[i].d, pct: (mean / baseTonnage) * 100 };
  });
}

function Area({ points }: { points: { date: string; pct: number }[] }) {
  if (points.length < 2) return null;
  const W = 340, H = 64, PAD = 3;
  const max = Math.max(10, ...points.map(p => p.pct)); // headroom; data sits 0–~30%
  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - v / max) * (H - 2 * PAD);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(' ');
  const area = `${PAD},${H - PAD} ${line} ${(W - PAD).toFixed(1)},${H - PAD}`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none" role="img"
         aria-label={`Hormuz tanker throughput, latest ${last.pct.toFixed(0)}% of 2023 baseline`}>
      <polygon points={area} fill="rgb(56 189 248 / 0.12)" />
      <polyline points={line} fill="none" stroke="rgb(56 189 248)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(last.pct)} r="2.5" fill="rgb(56 189 248)" />
    </svg>
  );
}

export default function HormuzThroughputPanel({ data }: { data: PortwatchData }) {
  const hz = data.chokepoints.find(c => c.key === 'hormuz');
  const base = hz?.baseline2023.captanker;
  const pct = hz?.pctTankerTonnage;
  // Needs the full series + a baseline to compute the recovery arc; otherwise defer
  // to the all-lanes ChokepointTransitPanel, which handles missing baselines.
  if (!hz || !hz.series?.length || base == null || pct == null) return null;

  const roll = rolling7Pct(hz.series, base);
  const latest = roll[roll.length - 1];
  const first = roll[0];
  const trough = roll.reduce((m, p) => (p.pct < m.pct ? p : m), roll[0]);
  const mbd = hz.tankerTonnage7 != null ? (hz.tankerTonnage7 * BBL_PER_TONNE) / 1e6 : null;
  const transits = hz.avg7.tanker;

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          Strait of Hormuz — Tanker Throughput
        </h2>
        <span className="text-[10px] font-mono text-gray-600">vs 2023 baseline</span>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-mono font-bold text-white leading-none">
              {pct}%
              <span className="text-sm font-normal text-gray-500 ml-1">of normal</span>
            </p>
            <p className="mt-1.5 text-xs font-mono text-sky-300">
              ▲ rebounded from ~{trough.pct.toFixed(0)}% trough ({trough.date})
            </p>
          </div>
          <div className="flex-1 max-w-[240px]">
            <Area points={roll} />
            <div className="flex justify-between text-[9px] font-mono text-gray-600 -mt-0.5">
              <span>{first.date}</span><span>{latest.date}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Transits</p>
            <p className="text-sm font-mono font-semibold text-white">{transits != null ? `${transits.toFixed(0)}/day` : '—'}</p>
            <p className="text-[9px] text-gray-600">{hz.pctTanker != null ? `${hz.pctTanker}% of 2023` : ''}</p>
          </div>
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Cargo</p>
            <p className="text-sm font-mono font-semibold text-white">{mbd != null ? `~${mbd.toFixed(1)} mb/d` : '—'}</p>
            <p className="text-[9px] text-gray-600">derived ×7.33</p>
          </div>
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">vs normal</p>
            <p className="text-sm font-mono font-semibold text-white">{pct}%</p>
            <p className="text-[9px] text-gray-600">by tonnage</p>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
          Tanker throughput through Hormuz collapsed to near-zero at the height of the conflict and had
          rebounded to about {pct}% of its 2023 norm through {hz.latestDate} — a real recovery, but still far
          below normal.
          {transits != null && ` The 7-day transit rate (~${transits.toFixed(0)}/day) matches independent shipbroker counts.`}
        </p>
        {hz.latestDate && hz.latestDate < '2026-07-08' && (
          <p className="mt-2 text-[11px] leading-relaxed text-red-400/80">
            Note: this series runs only to {hz.latestDate} — before the 8 July collapse of the U.S.–Iran
            ceasefire and the return of U.S. strikes. Independent trackers (Lloyd&apos;s List) report Hormuz
            transits falling back toward a near standstill since, so current movement is likely well below the{' '}
            {pct}% shown here.
          </p>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-amber-500/70">
          Read it as a floor. This is an AIS-based count, and a meaningful share of post-conflict Hormuz
          traffic runs with transponders off (dark transit) or via evasive routing — so true movement is
          likely higher than the figure shown.
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-gray-600">
          Aggregate strait transits (all tankers, all origins) — <span className="text-gray-500">not</span> by-country
          loadings or empty-tanker inflows, which require paid vessel intelligence. mb/d derived from cargo tonnage
          at 7.33 bbl/tonne.
        </p>
        <p className="mt-2 text-[10px] font-mono text-gray-600">
          Source: {data.source} · satellite-AIS chokepoint transits · latest {hz.latestDate}
        </p>
      </div>
    </div>
  );
}
