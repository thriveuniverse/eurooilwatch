import { frpSeverity, type FIRMSDetection, type FIRMSStatus } from '@/lib/firms';

const SEVERITY_STYLES: Record<string, { badge: string; rank: number }> = {
  red:    { badge: 'bg-red-900/30 text-red-300 border-red-800/60',          rank: 3 },
  orange: { badge: 'bg-orange-900/30 text-orange-300 border-orange-800/60', rank: 2 },
  yellow: { badge: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/60', rank: 1 },
  gray:   { badge: 'bg-oil-800/40 text-gray-400 border-oil-700/60',         rank: 0 },
};

interface FirmsResult {
  status: FIRMSStatus;
  detections: FIRMSDetection[];
}

interface Props {
  data: FirmsResult;
  mode?: 'compact' | 'full';
  /** Anchor id used by /supply page link from the homepage compact panel */
  anchorId?: string;
  /** Override default 3-row compact limit */
  compactLimit?: number;
  /** Footer-note region label, e.g. "EU & Gulf" or "Americas & Gulf" */
  regionLabel?: string;
  /** Path to the supply page that hosts the full panel (for the compact "All →" link) */
  supplyPath?: string;
}

function formatTime(d: FIRMSDetection): string {
  const h = d.acqTime.slice(0, 2);
  const m = d.acqTime.slice(2);
  return `${d.acqDate} ${h}:${m} UTC`;
}

function DetectionRow({ d }: { d: FIRMSDetection }) {
  const sev = frpSeverity(d.frp);
  const style = SEVERITY_STYLES[sev];
  return (
    <a
      href={`https://firms.modaps.eosdis.nasa.gov/map/#d:${d.acqDate};@${d.longitude},${d.latitude},10z`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-5 py-3 hover:bg-oil-800/20 transition group"
    >
      <span className={`flex-shrink-0 mt-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${style.badge}`}>
        {d.frp.toFixed(0)} MW
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="text-[11px] text-gray-300">{d.refinery}</span>
          <span className="text-[10px] text-gray-600">
            · {d.confidence === 'h' ? 'high confidence' : 'nominal'}
            · {d.daynight === 'D' ? 'daytime' : 'night'}
            · {formatTime(d)}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 group-hover:text-gray-300 transition">
          {d.latitude.toFixed(3)}°, {d.longitude.toFixed(3)}°
        </p>
      </div>
      <span className="text-gray-600 text-xs flex-shrink-0 group-hover:text-oil-400 transition">→</span>
    </a>
  );
}

export default function RefineryHealthPanel({
  data,
  mode = 'full',
  anchorId,
  compactLimit = 3,
  regionLabel = 'major refineries and terminals',
  supplyPath = '/supply',
}: Props) {
  const isCompact = mode === 'compact';

  const sortedByFrp = [...data.detections].sort((a, b) => b.frp - a.frp);
  const highSev = sortedByFrp.filter(d => {
    const s = frpSeverity(d.frp);
    return s === 'red' || s === 'orange';
  });
  const visible = isCompact
    ? (highSev.length ? highSev.slice(0, compactLimit) : sortedByFrp.slice(0, compactLimit))
    : sortedByFrp;

  return (
    <section
      id={anchorId}
      aria-label="Refinery thermal anomaly watch"
      className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">🔥</span>
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase truncate">
            {isCompact ? 'Refinery Health Watch' : 'Thermal Anomalies — Major Refineries & Terminals'}
          </h2>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isCompact && data.status === 'ok' && data.detections.length > 0 && (
            <span className="text-[10px] font-mono text-amber-400">
              {data.detections.length} in 24h
              {highSev.length > 0 && <span className="text-red-400"> · {highSev.length} high-severity</span>}
            </span>
          )}
          <a
            href="https://firms.modaps.eosdis.nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-600 hover:text-gray-400 transition"
          >
            NASA FIRMS →
          </a>
        </div>
      </div>

      {data.status === 'no_key' ? (
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs text-gray-500">FIRMS API key not configured.</p>
          <p className="text-[10px] text-gray-600">
            Register free at{' '}
            <a
              href="https://firms.modaps.eosdis.nasa.gov/api/area/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-oil-400 hover:underline"
            >
              firms.modaps.eosdis.nasa.gov/api/area
            </a>
            {' '}— set <span className="font-mono">FIRMS_MAP_KEY</span> in <span className="font-mono">.env.local</span> and in Netlify environment variables.
          </p>
        </div>
      ) : data.status === 'error' ? (
        <div className="px-5 py-4 text-xs text-gray-600">Feed temporarily unavailable.</div>
      ) : data.detections.length === 0 ? (
        <div className="px-5 py-4 text-xs text-gray-500">
          <span className="text-emerald-400">●</span>{' '}
          No thermal anomalies detected near tracked {regionLabel} in the past 24 hours.
        </div>
      ) : (
        <div className="divide-y divide-oil-800/40">
          {visible.map(d => <DetectionRow key={d.id} d={d} />)}
          {isCompact && data.detections.length > visible.length && (
            <a
              href={`${supplyPath}#refinery-health`}
              className="flex items-center justify-between px-5 py-2.5 text-[11px] text-oil-400 hover:bg-oil-800/20 transition"
            >
              <span>{data.detections.length - visible.length} more detection{data.detections.length - visible.length === 1 ? '' : 's'} on supply page</span>
              <span>→</span>
            </a>
          )}
        </div>
      )}

      <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-950/30">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          NASA FIRMS VIIRS satellite detections within ~15 km of {regionLabel}. Past 24 h.
          High Fire Radiative Power near a facility may indicate flaring, fire, or process incident — not all detections indicate incidents.
        </p>
      </div>
    </section>
  );
}
