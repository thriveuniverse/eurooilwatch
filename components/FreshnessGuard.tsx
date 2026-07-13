import { daysSince } from '@/lib/freshness';

/**
 * Shows a visible "may be stale" badge when an editorially-maintained surface has
 * aged past maxAgeDays; renders nothing when fresh. A backstop so hand-written
 * editorial (Where-We-Stand, supply note, timeline, fertilizer / spot panels) can no
 * longer silently go stale — generalises the auto-hiding dated caveat first used in
 * the Hormuz throughput panel. Server-rendered; age refreshes on ISR / rebuild.
 */
export default function FreshnessGuard({
  lastUpdated,
  maxAgeDays = 4,
  label = 'This section',
  className = '',
}: {
  lastUpdated: string;
  maxAgeDays?: number;
  label?: string;
  className?: string;
}) {
  const age = daysSince(lastUpdated);
  if (Number.isNaN(age) || age <= maxAgeDays) return null;
  const severe = age > maxAgeDays * 2;
  const tone = severe
    ? 'border-red-700/50 bg-red-950/30 text-red-300'
    : 'border-amber-700/50 bg-amber-950/30 text-amber-300';
  return (
    <div
      role="status"
      className={`rounded border px-2.5 py-1 text-[10px] font-mono leading-relaxed ${tone} ${className}`}
    >
      &#9888; {label} was last updated {age} days ago and may be behind the current situation.
    </div>
  );
}
