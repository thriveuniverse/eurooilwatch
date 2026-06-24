// Client-safe types and constants for the Hormuz crisis timeline.
// NO server-only imports (fs/path) here — this module is imported by the
// client component, so anything Node-only must stay in hormuz-timeline.ts.

export type TimelineCategory = 'military' | 'diplomatic' | 'shipping' | 'market' | 'humanitarian';

export interface TimelineSource {
  label: string;
  url: string;
}

export interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  category: TimelineCategory;
  headline: string;
  summary: string;
  sources: TimelineSource[];
  analysisHref?: string;
}

export interface TimelineMeta {
  crisisStart: string;
  lastUpdated: string;
  phase?: string;
}

export interface Timeline {
  meta: TimelineMeta;
  events: TimelineEvent[];
  counts: Record<TimelineCategory, number>;
  total: number;
}

export const CATEGORY_ORDER: TimelineCategory[] = [
  'military',
  'diplomatic',
  'shipping',
  'market',
  'humanitarian',
];
