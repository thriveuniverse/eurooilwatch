import fs from 'fs';
import path from 'path';
import type {
  Timeline,
  TimelineCategory,
  TimelineEvent,
  TimelineMeta,
} from './hormuz-timeline-shared';

// Re-export the client-safe types/constants so existing import sites keep working.
export * from './hormuz-timeline-shared';

/**
 * Loads the editorially-maintained Hormuz crisis timeline, sorted newest-first.
 * Server-only (uses fs) — do NOT import this module from a client component;
 * import shared types/constants from ./hormuz-timeline-shared instead.
 *
 * Same-date events keep their JSON order (stable sort), so author them in the
 * desired display order within a day.
 */
export function getHormuzTimeline(): Timeline {
  const p = path.join(process.cwd(), 'data', 'hormuz-timeline.json');
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8')) as {
    meta: TimelineMeta;
    events: TimelineEvent[];
  };

  const events = [...raw.events].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  );

  const counts: Record<TimelineCategory, number> = {
    military: 0,
    diplomatic: 0,
    shipping: 0,
    market: 0,
    humanitarian: 0,
  };
  for (const e of events) counts[e.category] = (counts[e.category] ?? 0) + 1;

  return { meta: raw.meta, events, counts, total: events.length };
}
