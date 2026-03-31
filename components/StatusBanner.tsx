import type { ReserveStatus } from '@/lib/types';

const STATUS_CONFIG: Record<
  ReserveStatus,
  { bg: string; border: string; dot: string; label: string }
> = {
  safe: {
    bg: 'bg-green-950/40',
    border: 'border-green-800/60',
    dot: 'bg-status-safe status-dot-safe',
    label: 'ADEQUATE',
  },
  watch: {
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-800/60',
    dot: 'bg-status-watch',
    label: 'WATCH',
  },
  warning: {
    bg: 'bg-orange-950/40',
    border: 'border-orange-800/60',
    dot: 'bg-status-warning status-dot-warning',
    label: 'WARNING',
  },
  critical: {
    bg: 'bg-red-950/40',
    border: 'border-red-800/60',
    dot: 'bg-status-critical status-dot-critical',
    label: 'CRITICAL',
  },
};

interface StatusBannerProps {
  status: ReserveStatus;
  statusLine: string;
  dataPeriod: string;
  lastUpdated: string;
}

export default function StatusBanner({
  status,
  statusLine,
  dataPeriod,
  lastUpdated,
}: StatusBannerProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div
      className={`rounded-lg border ${cfg.border} ${cfg.bg} px-5 py-4 flex items-start gap-4`}
    >
      {/* Pulsing dot */}
      <div className="pt-1">
        <div className={`h-3 w-3 rounded-full ${cfg.dot}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-mono font-semibold tracking-widest text-gray-400">
            EU FUEL SECURITY STATUS
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              status === 'safe'
                ? 'bg-green-900/60 text-green-300'
                : status === 'watch'
                ? 'bg-yellow-900/60 text-yellow-300'
                : status === 'warning'
                ? 'bg-orange-900/60 text-orange-300'
                : 'bg-red-900/60 text-red-300'
            }`}
          >
            {cfg.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-300 leading-relaxed">
          {statusLine}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Data period: {dataPeriod} · Updated{' '}
          {new Date(lastUpdated).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
