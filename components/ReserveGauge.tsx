import type { ReserveStatus } from '@/lib/types';

const STATUS_COLORS: Record<ReserveStatus, string> = {
  safe: '#22c55e',
  watch: '#f59e0b',
  warning: '#f97316',
  critical: '#ef4444',
};

interface ReserveGaugeProps {
  label: string;
  daysOfSupply: number;
  minimumDays: number;
  maxDays?: number;
  status: ReserveStatus;
}

export default function ReserveGauge({
  label,
  daysOfSupply,
  minimumDays,
  maxDays = 150,
  status,
}: ReserveGaugeProps) {
  const color = STATUS_COLORS[status];
  const ratio = Math.min(daysOfSupply / maxDays, 1);

  // SVG arc calculation
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  // Show 270° arc (three-quarter circle)
  const arcLength = circumference * 0.75;
  const filledLength = arcLength * ratio;
  const emptyLength = arcLength - filledLength;

  // Minimum threshold line position
  const minRatio = minimumDays / maxDays;
  const minAngle = -225 + minRatio * 270; // degrees from top
  const minRad = (minAngle * Math.PI) / 180;
  const minX1 = 64 + (radius - 8) * Math.cos(minRad);
  const minY1 = 64 + (radius - 8) * Math.sin(minRad);
  const minX2 = 64 + (radius + 8) * Math.cos(minRad);
  const minY2 = 64 + (radius + 8) * Math.sin(minRad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 128 128" className="w-36 h-36">
        {/* Background arc */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#1a3a5c"
          strokeWidth="10"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={-circumference * 0.375}
          strokeLinecap="round"
          transform="rotate(0 64 64)"
        />

        {/* Filled arc */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${filledLength} ${circumference - filledLength}`}
          strokeDashoffset={-circumference * 0.375}
          strokeLinecap="round"
          className="gauge-ring"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />

        {/* Minimum threshold tick mark */}
        <line
          x1={minX1}
          y1={minY1}
          x2={minX2}
          y2={minY2}
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Center text */}
        <text
          x="64"
          y="58"
          textAnchor="middle"
          className="fill-white font-bold"
          style={{ fontSize: '22px' }}
        >
          {daysOfSupply > 0 ? Math.round(daysOfSupply) : '—'}
        </text>
        <text
          x="64"
          y="74"
          textAnchor="middle"
          className="fill-gray-400"
          style={{ fontSize: '10px' }}
        >
          days
        </text>
      </svg>

      <div className="mt-1 text-center">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-500">
          Min: {minimumDays}d
        </p>
      </div>
    </div>
  );
}
