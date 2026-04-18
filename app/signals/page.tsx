import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signal Tracker — Phase 2 Validation',
  description: 'Forward-looking fuel security signal with timestamped predictions tracked against real Brent outcomes. Phase 2 validation of the OilWatch reserve-to-price correlation hypothesis.',
};

interface SignalComponent {
  direction: number;
  zScore?: number;
  currentDays?: number;
  meanDays?: number;
  momentumPct?: number;
  price4wAgo?: number;
  percentile?: number;
  w52Low?: number;
  w52High?: number;
  label: string;
}

interface SignalData {
  generatedAt: string;
  brentUsd: number;
  composite: {
    direction: number;
    directionLabel: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    score: number;
    confidence: number;
  };
  components: {
    reserve: SignalComponent;
    momentum: SignalComponent;
    range52w: SignalComponent;
  };
  stats: {
    total_predictions: number;
    scored: number;
    pending: number;
    hits: number;
    misses: number;
    inconclusive: number;
    hit_rate: number | null;
  };
  recentPredictions: Array<{
    id: string;
    createdAt: string;
    targetDate: string;
    brentAtPrediction: number;
    compositeDirection: number;
    compositeLabel: string;
    score: number;
    confidence: number;
    outcome: {
      result: string;
      brentAtTarget?: number;
      actualChangePct?: number;
    } | null;
  }>;
}

function loadSignals(): SignalData | null {
  const filePath = path.join(process.cwd(), 'data', 'signals.json');
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function DirectionBadge({ direction, label, large }: { direction: number; label?: string; large?: boolean }) {
  const configs = {
    1:  { text: label || 'BULLISH', bg: 'bg-emerald-900/60', border: 'border-emerald-700/60', color: 'text-emerald-300', arrow: '▲' },
    [-1]: { text: label || 'BEARISH', bg: 'bg-red-900/60',     border: 'border-red-700/60',     color: 'text-red-300',     arrow: '▼' },
    0:  { text: label || 'NEUTRAL', bg: 'bg-gray-800/60',     border: 'border-gray-600/60',    color: 'text-gray-300',    arrow: '◆' },
  } as const;
  const cfg = configs[direction as 1 | -1 | 0] ?? configs[0];
  const size = large ? 'text-2xl px-5 py-2 font-bold tracking-widest' : 'text-xs px-2.5 py-1 font-semibold tracking-wider';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} ${size}`}>
      <span>{cfg.arrow}</span>
      <span>{cfg.text}</span>
    </span>
  );
}

function SubSignalRow({ label, direction, detail }: { label: string; direction: number; detail: string }) {
  const colors = { 1: 'text-emerald-400', [-1]: 'text-red-400', 0: 'text-gray-400' } as const;
  const arrows = { 1: '▲', [-1]: '▼', 0: '◆' } as const;
  const color = colors[direction as 1 | -1 | 0] ?? colors[0];
  const arrow = arrows[direction as 1 | -1 | 0] ?? arrows[0];
  return (
    <div className="flex items-center justify-between py-3 border-b border-oil-800/60 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
      </div>
      <span className={`text-sm font-semibold ${color} flex items-center gap-1`}>
        <span>{arrow}</span>
        <span>{direction === 1 ? 'Bullish' : direction === -1 ? 'Bearish' : 'Neutral'}</span>
      </span>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: SignalData['recentPredictions'][0]['outcome'] }) {
  if (!outcome) return <span className="text-xs text-gray-500">pending</span>;
  const { result, actualChangePct } = outcome;
  const pct = actualChangePct !== undefined ? `${actualChangePct >= 0 ? '+' : ''}${actualChangePct.toFixed(1)}%` : '';
  if (result === 'hit')          return <span className="text-xs font-semibold text-emerald-400">✓ HIT {pct}</span>;
  if (result === 'miss')         return <span className="text-xs font-semibold text-red-400">✗ MISS {pct}</span>;
  if (result === 'inconclusive') return <span className="text-xs text-amber-400">~ inconclusive {pct}</span>;
  if (result === 'skipped')      return <span className="text-xs text-gray-500">— neutral</span>;
  return <span className="text-xs text-gray-500">{result}</span>;
}

export default function SignalsPage() {
  const data = loadSignals();

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-4xl mb-4">📡</p>
        <h1 className="text-2xl font-bold text-white mb-2">Signal Tracker</h1>
        <p className="text-gray-400">
          Signals data not yet generated. Run{' '}
          <code className="bg-oil-800 px-1.5 py-0.5 rounded text-sm text-amber-300">python3 run.py</code>
          {' '}from the <code className="bg-oil-800 px-1.5 py-0.5 rounded text-sm text-amber-300">oilwatch-signals/</code> directory.
        </p>
      </div>
    );
  }

  const { composite, components, stats, recentPredictions, brentUsd, generatedAt } = data;
  const updatedDate = new Date(generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const scoreBarWidth = Math.round(Math.abs(composite.score) * 100);
  const scoreBarColor = composite.direction === 1 ? 'bg-emerald-500' : composite.direction === -1 ? 'bg-red-500' : 'bg-gray-500';

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">Signal Tracker</h1>
          <span className="text-xs text-gray-500 bg-oil-800 border border-oil-700 px-2 py-0.5 rounded-full">Phase 2 — Live Validation</span>
        </div>
        <p className="text-sm text-gray-400">
          Forward-looking fuel security signal based on EU reserve levels, Brent momentum, and 52-week range.
          Each weekly run logs a 4-week prediction. Outcomes are scored automatically when the target date arrives.
        </p>
      </div>

      {/* Current Signal */}
      <div className="rounded-xl border border-oil-700 bg-oil-900/40 p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Composite Signal</p>
            <DirectionBadge direction={composite.direction} label={composite.directionLabel} large />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Brent</p>
            <p className="text-lg font-bold text-white">${brentUsd}/bbl</p>
            <p className="text-xs text-gray-500 mt-1">Updated {updatedDate}</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Signal strength</span>
            <span className="text-xs text-gray-300 font-mono">{composite.score >= 0 ? '+' : ''}{composite.score.toFixed(3)}</span>
          </div>
          <div className="h-2 bg-oil-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${scoreBarColor}`}
              style={{ width: `${scoreBarWidth}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-600">
            <span>Weak</span><span>Strong</span>
          </div>
        </div>

        {/* Sub-signals */}
        <div className="border-t border-oil-800/60 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Sub-signals</p>
          <SubSignalRow
            label="EU Reserve Z-Score"
            direction={components.reserve.direction}
            detail={
              components.reserve.currentDays !== undefined
                ? `EU diesel ${components.reserve.currentDays}d vs ${components.reserve.meanDays}d avg · z = ${components.reserve.zScore?.toFixed(2)}`
                : 'Data unavailable'
            }
          />
          <SubSignalRow
            label="Brent 4-Week Momentum"
            direction={components.momentum.direction}
            detail={
              components.momentum.momentumPct !== undefined
                ? `${components.momentum.momentumPct >= 0 ? '+' : ''}${components.momentum.momentumPct.toFixed(1)}% change from $${components.momentum.price4wAgo}/bbl 4 weeks ago`
                : 'Data unavailable'
            }
          />
          <SubSignalRow
            label="Brent 52-Week Range Position"
            direction={components.range52w.direction}
            detail={
              components.range52w.percentile !== undefined
                ? `${Math.round(components.range52w.percentile * 100)}th percentile · range $${components.range52w.w52Low}–$${components.range52w.w52High}`
                : 'Data unavailable'
            }
          />
        </div>

        {/* Weights note */}
        <p className="mt-4 text-[11px] text-gray-600">
          Weights: Momentum 45% · Reserve z-score 30% · 52w range 25%.
          Signal fires at ±0.20 threshold. Neutral = no directional claim.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Predictions', value: stats.total_predictions },
          { label: 'Pending', value: stats.pending },
          { label: 'Scored', value: stats.scored },
          {
            label: 'Hit Rate',
            value: stats.hit_rate !== null ? `${stats.hit_rate}%` : '—',
            note: stats.scored < 10 ? 'need 10+ to interpret' : undefined,
          },
        ].map(({ label, value, note }) => (
          <div key={label} className="rounded-lg border border-oil-700 bg-oil-900/40 p-4 text-center">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            {note && <p className="text-[10px] text-gray-600 mt-1">{note}</p>}
          </div>
        ))}
      </div>

      {/* Prediction log */}
      <div className="rounded-xl border border-oil-700 bg-oil-900/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-oil-800">
          <h2 className="text-sm font-semibold text-white">Prediction Log</h2>
          <p className="text-xs text-gray-500 mt-0.5">One entry per week. Scored automatically after 4-week target date.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-oil-800 text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-2.5 font-medium">Date</th>
                <th className="text-left px-3 py-2.5 font-medium">Signal</th>
                <th className="text-right px-3 py-2.5 font-medium">Brent</th>
                <th className="text-left px-3 py-2.5 font-medium">Target</th>
                <th className="text-left px-5 py-2.5 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {recentPredictions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">No predictions logged yet.</td>
                </tr>
              ) : (
                recentPredictions.map((p) => (
                  <tr key={p.id} className="border-b border-oil-800/40 hover:bg-oil-800/20 transition">
                    <td className="px-5 py-3 text-gray-400 font-mono">{p.createdAt.slice(0, 10)}</td>
                    <td className="px-3 py-3">
                      <DirectionBadge direction={p.compositeDirection} label={p.compositeLabel} />
                    </td>
                    <td className="px-3 py-3 text-right text-gray-300 font-mono">${p.brentAtPrediction}</td>
                    <td className="px-3 py-3 text-gray-500 font-mono">{p.targetDate}</td>
                    <td className="px-5 py-3">
                      <OutcomeBadge outcome={p.outcome} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology */}
      <div className="rounded-xl border border-oil-700/50 bg-oil-900/20 p-5 text-xs text-gray-500 space-y-2">
        <p className="font-semibold text-gray-400">Methodology &amp; Limitations</p>
        <p>
          This is a <strong className="text-gray-300">Phase 2 validation</strong> exercise. The hypothesis — that EU fuel reserve
          levels correlate with Brent crude price direction — is unproven. The prior backtests used modelled data. This tracker
          uses real, timestamped forward predictions to test whether the signal has genuine predictive edge.
        </p>
        <p>
          A prediction is scored a <strong className="text-gray-300">HIT</strong> if Brent moves ≥2% in the predicted direction
          over 4 weeks. <strong className="text-gray-300">Neutral</strong> signals are not scored — no directional claim is made.
          Statistical significance requires at least 20–30 scored predictions (approx. 5–7 months of weekly runs).
        </p>
        <p>
          Reserve data has a ~2-month publication lag. Nothing here constitutes financial advice.
        </p>
      </div>
    </div>
  );
}
