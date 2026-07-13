/**
 * Age helper for FreshnessGuard. Server-computed at render time; pages use
 * revalidate=3600 + a daily CI rebuild, so the age refreshes at least daily.
 */
export function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return NaN;
  return Math.floor((Date.now() - then) / 86_400_000);
}
