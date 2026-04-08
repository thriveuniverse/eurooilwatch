'use client';

import { useState, useMemo } from 'react';
import type { NewsItem, NewsCategory } from '@/lib/news';

const CATEGORY_STYLES: Record<NewsCategory, string> = {
  'Geopolitics':     'border-red-800/60 text-red-400 bg-red-950/30',
  'Policy':          'border-blue-800/60 text-blue-400 bg-blue-950/30',
  'Crude Prices':    'border-oil-700 text-oil-400 bg-oil-950/30',
  'Diesel & Reserves': 'border-amber-800/60 text-amber-400 bg-amber-950/30',
  'Refinery':        'border-purple-800/60 text-purple-400 bg-purple-950/30',
  'General':         'border-gray-700 text-gray-400 bg-gray-900/30',
};

interface Props {
  items: NewsItem[];
}

export default function NewsFeed({ items }: Props) {
  const [timeFilter, setTimeFilter] = useState<'all' | '7d'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return items.filter(item => {
      if (timeFilter === '7d' && new Date(item.date) < sevenDaysAgo) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !item.snippet.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [items, timeFilter, search]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-shrink-0">
          {(['all', '7d'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                timeFilter === f
                  ? 'border-oil-500 bg-oil-900/60 text-white'
                  : 'border-oil-800 text-gray-500 hover:border-oil-700 hover:text-gray-400'
              }`}
            >
              {f === 'all' ? 'All' : 'Last 7 days'}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search headlines..."
          className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-oil-950 border border-oil-700 text-white placeholder-gray-500 focus:outline-none focus:border-oil-500"
        />
      </div>

      {(timeFilter !== 'all' || search) && (
        <p className="text-xs text-gray-500">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-10 text-center">
          <p className="text-sm text-gray-500">No articles match your filters.</p>
          <button
            onClick={() => { setTimeFilter('all'); setSearch(''); }}
            className="mt-3 text-xs text-oil-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const tagStyle = CATEGORY_STYLES[item.category];
  const formattedDate = new Date(item.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-4 hover:border-oil-600 hover:bg-oil-900/50 transition">
      <div className="flex gap-4">
        {item.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt=""
            className="hidden sm:block w-20 h-16 object-cover rounded flex-shrink-0 bg-oil-900"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded border ${tagStyle}`}>
              {item.category}
            </span>
            <span className="text-xs text-gray-500">
              {item.source} · {formattedDate}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug mb-1">
            {item.title}
          </h3>
          {item.snippet && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
              {item.snippet}
            </p>
          )}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-oil-400 hover:text-oil-300 hover:underline"
          >
            Read full article →
          </a>
        </div>
      </div>
    </div>
  );
}
