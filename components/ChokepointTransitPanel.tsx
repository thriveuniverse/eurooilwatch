// Chokepoint Transit Monitor — live daily ship transits vs 2023 baseline.
// Data: IMF PortWatch (satellite-AIS estimates) via scripts/fetch-portwatch.ts.
// Server component — renders from data/portwatch-chokepoints.json passed as prop.

interface SeriesPt { d: string; t: number; k: number }
interface Chokepoint {
  key: string;
  name: string;
  latestDate: string;
  latest: { total: number; tanker: number };
  avg7: { total: number | null; tanker: number | null };
  avg30: { total: number | null; tanker: number | null };
  baseline2023: { total: number | null; tanker: number | null };
  pctTotal: number | null;
  pctTanker: number | null;
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

// severity by how far below (or above) the 2023 baseline
function sev(pct: number | null) {
  if (pct == null) return { txt: 'text-gray-400', bar: '#6b7280', label: 'no baseline' };
  if (pct < 25) return { txt: 'text-red-400', bar: '#f87171', label: 'severely restricted' };
  if (pct < 60) return { txt: 'text-orange-300', bar: '#fdba74', label: 'depressed' };
  if (pct <= 120) return { txt: 'text-emerald-300', bar: '#6ee7b7', label: 'near normal' };
  return { txt: 'text-sky-300', bar: '#7dd3fc', label: 'elevated (diversion)' };
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
  const rows = [...data.chokepoints].sort((a, b) => (a.pctTotal ?? 999) - (b.pctTotal ?? 999));
  const latest = rows.map((r) => r.latestDate).sort().at(-1);

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">Chokepoint Transit Monitor</h2>
        <span className="text-[11px] text-gray-500">Daily transits vs 2023 baseline · IMF PortWatch (AIS estimates)</span>
      </div>
      <p className="mt-1 text-xs text-gray-400 max-w-2xl">
        Ships actually moving through each chokepoint — the data behind &ldquo;open on paper, restricted in
        practice.&rdquo; Tanker counts proxy crude and product flow.
      </p>

      <div className="mt-4 divide-y divide-oil-800/70">
        {rows.map((c) => {
          const s = sev(c.pctTotal);
          return (
            <div key={c.key} className="flex items-center gap-3 py-2.5">
              <div className="min-w-[150px] flex-1">
                <div className="text-sm text-white">{c.name}</div>
                <div className="text-[11px] text-gray-500">
                  {c.avg7.total ?? '—'}/day · {c.avg7.tanker ?? '—'} tankers
                </div>
              </div>
              <Spark pts={c.series.map((p) => p.t)} color={s.bar} />
              <div className="text-right min-w-[92px]">
                <div className={`text-lg font-bold ${s.txt}`}>{c.pctTotal != null ? `${c.pctTotal}%` : '—'}</div>
                <div className="text-[10px] text-gray-500 leading-tight">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        Latest data {latest}. Current = trailing 7-day average; baseline = {data.baselineYear} daily average. Tanker
        share of the % badge varies by route. Source:{' '}
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">
          IMF PortWatch
        </a>{' '}
        — transit counts estimated from satellite AIS, not customs data.
      </p>
    </div>
  );
}
