// Chokepoint Transit Monitor — daily tanker tonnage (DWT) vs 2023 baseline,
// topped with an Oil Route Stress Score and AIS-confidence flags on conflict lanes.
// Data: IMF PortWatch via scripts/fetch-portwatch.ts.

interface SeriesPt { d: string; t: number; k: number; c: number }
interface Chokepoint {
  key: string;
  name: string;
  latestDate: string;
  latest: { total: number; tanker: number };
  avg7: { total: number | null; tanker: number | null };
  tankerTonnage7: number | null;
  baseline2023: { total: number | null; tanker: number | null; captanker: number | null };
  pctTotal: number | null;
  pctTanker: number | null;
  pctTankerTonnage: number | null;
  series: SeriesPt[];
}
export interface PortwatchData {
  asOf: string;
  source: string;
  sourceUrl: string;
  note: string;
  baselineYear: number;
  chokepoints: Chokepoint[];
}

// Lanes whose STRESS shows up as elevation (ships rerouting), not restriction.
const DIVERSION = new Set(['cape']);
// Conflict-zone lanes where AIS is degraded (spoofing / jamming / dark vessels).
const CONFLICT = new Set(['hormuz', 'bab-el-mandeb']);

function laneStress(c: Chokepoint): number {
  const p = c.pctTankerTonnage;
  if (p == null) return 0;
  if (DIVERSION.has(c.key)) return Math.max(0, Math.min(1, (p - 120) / 120)); // 0 at ≤120%, 1 at 240%
  return Math.max(0, Math.min(1, (85 - p) / 85)); // 0 at ≥85% of normal, 1 at 0%
}

// severity by how far below (or above) the 2023 baseline
function sev(pct: number | null) {
  if (pct == null) return { txt: 'text-gray-400', bar: '#6b7280', label: 'no baseline' };
  if (pct < 25) return { txt: 'text-red-400', bar: '#f87171', label: 'severely restricted' };
  if (pct < 60) return { txt: 'text-orange-300', bar: '#fdba74', label: 'depressed' };
  if (pct <= 120) return { txt: 'text-emerald-300', bar: '#6ee7b7', label: 'near normal' };
  return { txt: 'text-sky-300', bar: '#7dd3fc', label: 'elevated (diversion)' };
}

const STRESS_STYLE: Record<string, { txt: string; chip: string; border: string }> = {
  Severe: { txt: 'text-red-400', chip: 'bg-red-500/15 text-red-300 border-red-500/40', border: 'border-red-500/60' },
  High: { txt: 'text-orange-300', chip: 'bg-orange-500/15 text-orange-300 border-orange-500/40', border: 'border-orange-500/50' },
  Moderate: { txt: 'text-amber-300', chip: 'bg-amber-500/15 text-amber-200 border-amber-500/40', border: 'border-amber-500/40' },
  Normal: { txt: 'text-emerald-300', chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', border: 'border-emerald-600/40' },
};

function routeStress(chokepoints: Chokepoint[]) {
  const peak = Math.max(0, ...chokepoints.map(laneStress));
  const label = peak >= 0.75 ? 'Severe' : peak >= 0.5 ? 'High' : peak >= 0.25 ? 'Moderate' : 'Normal';
  const restriction = chokepoints
    .filter((c) => !DIVERSION.has(c.key) && c.pctTankerTonnage != null)
    .sort((a, b) => (a.pctTankerTonnage as number) - (b.pctTankerTonnage as number));
  const worst = restriction[0];
  const cape = chokepoints.find((c) => c.key === 'cape');
  let why = 'all monitored oil-shipping lanes are near their 2023 norms.';
  if (worst && worst.pctTankerTonnage != null && worst.pctTankerTonnage < 85) {
    why = `${worst.name} tanker tonnage is at ${worst.pctTankerTonnage}% of normal`;
    const others = restriction.filter((c) => c.key !== worst.key && (c.pctTankerTonnage as number) < 70);
    if (others.length) why += `, with ${others.map((c) => c.name).join(' and ')} also restricted`;
    if (cape?.pctTankerTonnage != null && cape.pctTankerTonnage > 130) why += `; traffic is rerouting via the Cape of Good Hope (${cape.pctTankerTonnage}% of baseline)`;
    why += '.';
  } else if (cape?.pctTankerTonnage != null && cape.pctTankerTonnage > 130) {
    why = `Cape of Good Hope traffic is at ${cape.pctTankerTonnage}% of baseline as ships reroute around disrupted lanes.`;
  }
  return { label, why };
}

function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return null;
  const w = 104, h = 26, max = Math.max(...pts, 1), min = Math.min(...pts);
  const rng = max - min || 1;
  const path = pts
    .map((v, i) => `${((i / (pts.length - 1)) * w).toFixed(1)},${(h - ((v - min) / rng) * (h - 3) - 1.5).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      <polyline points={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function ChokepointTransitPanel({ data }: { data: PortwatchData }) {
  if (!data?.chokepoints?.length) return null;
  const rows = [...data.chokepoints].sort((a, b) => (a.pctTankerTonnage ?? 999) - (b.pctTankerTonnage ?? 999));
  const latest = rows.map((r) => r.latestDate).sort().at(-1);
  const stress = routeStress(data.chokepoints);
  const ss = STRESS_STYLE[stress.label];

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">Chokepoint Transit Monitor</h2>
        <span className="text-[11px] text-gray-500">Tanker tonnage (DWT) vs 2023 baseline · IMF PortWatch (AIS estimates)</span>
      </div>

      {/* Oil Route Stress Score */}
      <div className={`mt-3 rounded-md border-l-4 ${ss.border} border-y border-r border-oil-800 bg-oil-950/40 px-4 py-3`}>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-semibold tracking-[0.2em] text-gray-400 uppercase">Oil Route Stress</span>
          <span className={`text-xl font-bold ${ss.txt}`}>{stress.label}</span>
        </div>
        <p className="mt-1 text-xs text-gray-300 leading-relaxed">{stress.why}</p>
      </div>

      <p className="mt-3 text-xs text-gray-400 max-w-2xl">
        Crude- and product-carrying capacity actually moving through each chokepoint — weighted by tanker size
        (a VLCC isn&rsquo;t a coastal product tanker).
      </p>

      <div className="mt-3 divide-y divide-oil-800/70">
        {rows.map((c) => {
          const s = sev(c.pctTankerTonnage);
          return (
            <div key={c.key} className="flex items-center gap-3 py-2.5">
              <div className="min-w-[150px] flex-1">
                <div className="text-sm text-white flex items-center gap-2">
                  {c.name}
                  {CONFLICT.has(c.key) && (
                    <span
                      title="Conflict zone — AIS may undercount actual movement (spoofing, jamming, vessels going dark)."
                      className="text-[8.5px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300/90"
                    >
                      AIS low
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500">
                  {c.avg7.tanker ?? '—'}/day tankers · {c.avg7.total ?? '—'}/day all vessels
                </div>
              </div>
              <Spark pts={c.series.map((p) => p.c)} color={s.bar} />
              <div className="text-right min-w-[92px]">
                <div className={`text-lg font-bold ${s.txt}`}>{c.pctTankerTonnage != null ? `${c.pctTankerTonnage}%` : '—'}</div>
                <div className="text-[10px] text-gray-500 leading-tight">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        Latest data {latest}. The % is <span className="text-gray-400">tanker capacity (DWT)</span> vs the {data.baselineYear}
        {' '}daily average (trailing 7-day); ship counts shown for context. Lanes marked{' '}
        <span className="text-amber-300/90">AIS low</span> are conflict zones where spoofing, jamming or vessels going dark
        can make figures undercount actual movement. Source:{' '}
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">
          IMF PortWatch
        </a>{' '}
        — estimated from satellite AIS, not customs data. PortWatch does not tell us the exact barrel, grade or buyer —
        only whether the ships needed to move the oil economy are actually moving.
      </p>
    </div>
  );
}
