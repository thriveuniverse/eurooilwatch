// Port Oil-Flow Monitor — daily tanker import/export volume at major hubs vs 2023.
// Data: IMF PortWatch Daily_Ports_Data (AIS estimates) via scripts/fetch-port-flows.ts.
// Server component — renders from data/port-flows.json passed as prop.

interface SeriesPt { d: string; v: number }
interface Port {
  key: string; name: string; cc: string; portid: string; latestDate: string;
  imp7: number | null; exp7: number | null; total7: number | null;
  baseline2023Total: number | null; pctTotal: number | null;
  dir: 'import' | 'export' | 'balanced' | null; series: SeriesPt[];
}
export interface PortFlowData {
  asOf: string; source: string; sourceUrl: string; units: string; note: string;
  baselineYear: number; ports: Port[];
}

const FLAG: Record<string, string> = { NL: '🇳🇱', BE: '🇧🇪', US: '🇺🇸', RU: '🇷🇺', AE: '🇦🇪', BR: '🇧🇷' };
const kt = (t: number | null) => (t == null ? '—' : Math.round(t / 1000).toLocaleString());

function sev(pct: number | null) {
  if (pct == null) return { txt: 'text-gray-400', bar: '#6b7280', label: 'no baseline' };
  if (pct < 50) return { txt: 'text-red-400', bar: '#f87171', label: 'well below 2023' };
  if (pct < 90) return { txt: 'text-orange-300', bar: '#fdba74', label: 'below 2023' };
  if (pct <= 120) return { txt: 'text-emerald-300', bar: '#6ee7b7', label: 'near 2023' };
  return { txt: 'text-sky-300', bar: '#7dd3fc', label: 'above 2023' };
}

function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return null;
  const w = 96, h = 24, max = Math.max(...pts, 1), min = Math.min(...pts), rng = max - min || 1;
  const path = pts
    .map((v, i) => `${((i / (pts.length - 1)) * w).toFixed(1)},${(h - ((v - min) / rng) * (h - 3) - 1.5).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      <polyline points={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function PortFlowPanel({ data }: { data: PortFlowData }) {
  if (!data?.ports?.length) return null;
  const rows = [...data.ports].sort((a, b) => (b.total7 ?? 0) - (a.total7 ?? 0));
  const latest = rows.map((r) => r.latestDate).sort().at(-1);

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">Port Oil-Flow Monitor</h2>
        <span className="text-[11px] text-gray-500">Tanker import/export vs 2023 baseline · IMF PortWatch (AIS estimates)</span>
      </div>
      <p className="mt-1 text-xs text-gray-400 max-w-2xl">
        Crude and product moving through major hubs — daily tanker tonnage in (↓) and out (↑), with how it
        compares to the 2023 average. Where the barrels are actually going.
      </p>

      <div className="mt-4 divide-y divide-oil-800/70">
        {rows.map((p) => {
          const s = sev(p.pctTotal);
          const dirTag =
            p.dir === 'export' ? <span className="text-orange-300">net export</span>
            : p.dir === 'import' ? <span className="text-sky-300">net import</span>
            : <span className="text-gray-400">balanced</span>;
          return (
            <div key={p.key} className="flex items-center gap-3 py-2.5">
              <span className="text-base shrink-0">{FLAG[p.cc] || '🚢'}</span>
              <div className="min-w-[150px] flex-1">
                <div className="text-sm text-white">{p.name}</div>
                <div className="text-[11px] text-gray-500">
                  ↓ {kt(p.imp7)} in · ↑ {kt(p.exp7)} out kt/d · {dirTag}
                </div>
              </div>
              <Spark pts={p.series.map((x) => x.v)} color={s.bar} />
              <div className="text-right min-w-[88px]">
                <div className={`text-lg font-bold ${s.txt}`}>{p.pctTotal != null ? `${p.pctTotal}%` : '—'}</div>
                <div className="text-[10px] text-gray-500 leading-tight">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        Latest data {latest}. Volumes in thousand tonnes/day (kt/d), trailing 7-day average vs {data.baselineYear}.
        Source:{' '}
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">
          IMF PortWatch
        </a>{' '}
        — tanker tonnage estimated from satellite AIS, not customs data; some terminals (e.g. Gulf export ports)
        are under-covered and read low.
      </p>
    </div>
  );
}
