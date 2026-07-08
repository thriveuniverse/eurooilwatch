/**
 * Dow–Nasdaq Market-Leadership Divergence panel.
 *
 * A breadth / risk-off gauge on an oil dashboard: when the blue-chip Dow holds
 * while the tech-heavy Nasdaq Composite sells off, breadth is narrowing — a
 * late-cycle warning that has historically preceded equity bear phases, which
 * in turn drag on oil demand. Δ7 = Dow 7-session %return − Nasdaq 7-session
 * %return; a large positive spread is the warning direction.
 *
 * Server component — receives data read from data/divergence.json by the page.
 */

export interface DivergenceData {
  lastUpdated: string;
  latestDate: string;
  windowSessions: number;
  spread: number;
  dowRet7: number;
  nasRet7: number;
  dowClose: number;
  nasClose: number;
  threshold: number;
  triggered: boolean;
  history: { date: string; spread: number }[];
  dataSource: string;
}

const pp = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
const pct = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}%`;

function status(spread: number, threshold: number) {
  if (spread >= threshold) return { label: 'Signal active', cls: 'text-red-400', dot: 'bg-red-400' };
  if (spread >= threshold * 0.55) return { label: 'Elevated', cls: 'text-amber-300', dot: 'bg-amber-300' };
  return { label: 'Normal', cls: 'text-emerald-300', dot: 'bg-emerald-300' };
}

function Spark({ history, threshold }: { history: { date: string; spread: number }[]; threshold: number }) {
  if (history.length < 2) return null;
  const W = 320, H = 60, PAD = 3;
  const vals = history.map(h => h.spread);
  const min = Math.min(0, ...vals);
  const max = Math.max(threshold, ...vals);
  const range = max - min || 1;
  const x = (i: number) => PAD + (i / (history.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - min) / range) * (H - 2 * PAD);
  const line = history.map((h, i) => `${x(i).toFixed(1)},${y(h.spread).toFixed(1)}`).join(' ');
  const last = history[history.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none" role="img"
         aria-label={`Dow minus Nasdaq 7-session spread, latest ${pp(last.spread)} points`}>
      {/* threshold line at +5.5 */}
      <line x1={PAD} x2={W - PAD} y1={y(threshold)} y2={y(threshold)} stroke="rgb(248 113 113 / 0.55)" strokeWidth="1" strokeDasharray="4 3" />
      {/* zero baseline */}
      <line x1={PAD} x2={W - PAD} y1={y(0)} y2={y(0)} stroke="currentColor" strokeWidth="1" className="text-oil-700" />
      <polyline points={line} fill="none" stroke="rgb(224 138 74)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(history.length - 1)} cy={y(last.spread)} r="2.5" fill="rgb(224 138 74)" />
    </svg>
  );
}

export default function DivergencePanel({ data }: { data: DivergenceData }) {
  const s = status(data.spread, data.threshold);
  const first = data.history[0];
  const last = data.history[data.history.length - 1];
  const peak = data.history.reduce((m, h) => (h.spread > m.spread ? h : m), data.history[0]);

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          Dow–Nasdaq Divergence
        </h2>
        <span className="text-[10px] font-mono text-gray-600">market-leadership · risk-off gauge</span>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={`text-3xl font-mono font-bold leading-none ${s.cls}`}>
              {pp(data.spread)}
              <span className="text-sm font-normal text-gray-500 ml-1">pp</span>
            </p>
            <p className="mt-1.5 text-xs font-mono flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot}`} />
              <span className={s.cls}>{s.label}</span>
              <span className="text-gray-600">· {data.windowSessions}-session Dow − Nasdaq</span>
            </p>
          </div>
          <div className="flex-1 max-w-[240px] text-oil-700">
            <Spark history={data.history} threshold={data.threshold} />
            <div className="flex justify-between text-[9px] font-mono text-gray-600 -mt-0.5">
              <span>{first?.date}</span>
              <span className="text-red-400/60">- - trigger +{data.threshold}pp</span>
              <span>{last?.date}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Dow 7-sess</p>
            <p className="text-sm font-mono font-semibold text-white">{pct(data.dowRet7)}</p>
          </div>
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Nasdaq 7-sess</p>
            <p className="text-sm font-mono font-semibold text-white">{pct(data.nasRet7)}</p>
          </div>
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">120-day peak</p>
            <p className="text-sm font-mono font-semibold text-white">{pp(peak.spread)}</p>
            <p className="text-[9px] text-gray-600">{peak.date}</p>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
          When the blue-chip Dow holds while the tech-heavy Nasdaq breaks, breadth is narrowing — a late-cycle
          warning, and a risk-off read that tends to pull on oil demand. A spread above{' '}
          <span className="text-gray-400">+{data.threshold}pp</span> is the rare trigger level.
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-amber-500/70">
          A ≈{data.threshold}pp+ spread over 7 sessions occurred on ~1% of days since 1971; 66.9% of those were in a
          bear phase within three months, vs a 24.8% baseline (MarketWatch / Ned Davis Research). A warning indicator,
          not a forecast — and a Dow-vs-Nasdaq split can be sector rotation rather than a market top.
        </p>
        <p className="mt-2 text-[10px] font-mono text-gray-600">
          Source: {data.dataSource} · latest {data.latestDate}
        </p>
      </div>
    </div>
  );
}
