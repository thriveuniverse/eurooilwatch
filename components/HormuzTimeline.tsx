'use client';

import { useState } from 'react';
import type { TimelineCategory, TimelineEvent } from '@/lib/hormuz-timeline-shared';
import { CATEGORY_ORDER } from '@/lib/hormuz-timeline-shared';

interface Props {
  events: TimelineEvent[];
  counts: Record<TimelineCategory, number>;
  total: number;
}

const CATEGORY_STYLE: Record<TimelineCategory, { label: string; chip: string; dot: string; tag: string }> = {
  military:     { label: 'Military',     chip: 'border-red-800/70 text-red-300',     dot: 'bg-red-500',     tag: 'bg-red-950/50 text-red-300 border-red-800/60' },
  diplomatic:   { label: 'Diplomatic',   chip: 'border-sky-800/70 text-sky-300',     dot: 'bg-sky-500',     tag: 'bg-sky-950/50 text-sky-300 border-sky-800/60' },
  shipping:     { label: 'Shipping',     chip: 'border-emerald-800/70 text-emerald-300', dot: 'bg-emerald-500', tag: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' },
  market:       { label: 'Market',       chip: 'border-amber-700/70 text-amber-300', dot: 'bg-amber-500',   tag: 'bg-amber-950/50 text-amber-300 border-amber-700/60' },
  humanitarian: { label: 'Humanitarian', chip: 'border-violet-800/70 text-violet-300', dot: 'bg-violet-500', tag: 'bg-violet-950/50 text-violet-300 border-violet-800/60' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Deterministic date formatting from a YYYY-MM-DD string — avoids locale/timezone
// hydration mismatches between server and client render.
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export default function HormuzTimeline({ events, counts, total }: Props) {
  const [filter, setFilter] = useState<TimelineCategory | 'all'>('all');

  const shown = filter === 'all' ? events : events.filter((e) => e.category === filter);

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter timeline by category">
        <button
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          className={`rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider transition ${
            filter === 'all' ? 'border-white/70 text-white' : 'border-oil-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          All <span className="text-gray-500">{total}</span>
        </button>
        {CATEGORY_ORDER.map((cat) => {
          const c = CATEGORY_STYLE[cat];
          const active = filter === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider transition ${
                active ? c.chip + ' bg-oil-900/60' : 'border-oil-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              {c.label} <span className="text-gray-500">{counts[cat] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <ol className="mt-8 relative border-l border-oil-800 ml-2">
        {shown.map((e) => {
          const c = CATEGORY_STYLE[e.category];
          return (
            <li key={e.id} id={e.id} className="mb-8 ml-6 scroll-mt-24">
              <span className={`absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-oil-950 ${c.dot}`} aria-hidden="true" />
              <div className="flex items-center gap-2 flex-wrap">
                <time dateTime={e.date} className="text-xs font-mono text-gray-500">{fmtDate(e.date)}</time>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${c.tag}`}>
                  {c.label}
                </span>
              </div>
              <h3 className="mt-1.5 text-base font-semibold text-white">{e.headline}</h3>
              <p className="mt-1 text-sm text-gray-400 leading-relaxed">{e.summary}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                {e.analysisHref && (
                  <a href={e.analysisHref} className="text-oil-300 hover:text-white underline underline-offset-2">
                    Read our analysis →
                  </a>
                )}
                <span className="text-gray-600">
                  Source{e.sources.length > 1 ? 's' : ''}:{' '}
                  {e.sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 && ', '}
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 underline underline-offset-2">
                        {s.label}
                      </a>
                    </span>
                  ))}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {shown.length === 0 && (
        <p className="mt-8 text-sm text-gray-500">No events in this category.</p>
      )}
    </div>
  );
}
