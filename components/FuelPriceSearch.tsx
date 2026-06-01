'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEPARTMENTS, deptFromPostalCode } from '@/lib/france-geo';

const POPULAR_DEPTS = [
  // Paris dept = Paris city, so no city filter needed
  { code: '75', label: 'Paris',          ville: 'Paris', filterCity: '' },
  { code: '13', label: 'Bouches-du-Rhône', ville: 'Marseille', filterCity: 'Marseille' },
  { code: '69', label: 'Rhône',           ville: 'Lyon', filterCity: 'Lyon' },
  { code: '31', label: 'Haute-Garonne',   ville: 'Toulouse', filterCity: 'Toulouse' },
  { code: '06', label: 'Alpes-Maritimes', ville: 'Nice', filterCity: 'Nice' },
  { code: '44', label: 'Loire-Atlantique', ville: 'Nantes', filterCity: 'Nantes' },
];

// City tuple from data/france-city-index.json: [ville, dept, stationCount]
export type CityTuple = [string, string, number];

interface Props {
  cities: CityTuple[];
}

interface Suggestion {
  ville: string;
  dept: string;
  stations: number;
  url: string;
}

const MAX_SUGGESTIONS = 8;

function makeSuggestionUrl(ville: string, dept: string): string {
  return `/country/fr/dept/${dept.toLowerCase()}?ville=${encodeURIComponent(ville)}`;
}

export default function FuelPriceSearch({ cities }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const trimmed = query.trim();
  const isPostalCode = /^\d{5}$/.test(trimmed);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!trimmed || isPostalCode) return [];
    const q = trimmed.toLowerCase();
    const matches: Suggestion[] = [];
    for (const [ville, dept, n] of cities) {
      if (ville.toLowerCase().includes(q)) {
        matches.push({ ville, dept, stations: n, url: makeSuggestionUrl(ville, dept) });
        if (matches.length >= MAX_SUGGESTIONS) break;
      }
    }
    return matches;
  }, [trimmed, isPostalCode, cities]);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  function go(target: Suggestion) {
    setOpen(false);
    router.push(target.url);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!trimmed) return;

    if (isPostalCode) {
      const dept = deptFromPostalCode(trimmed);
      if (!dept || !DEPARTMENTS[dept]) {
        setError('No département found for that postal code.');
        return;
      }
      router.push(`/country/fr/dept/${dept.toLowerCase()}`);
      return;
    }

    if (suggestions.length === 0) {
      setError(`No matching city found for "${trimmed}". Try a different spelling, or use a 5-digit postal code.`);
      return;
    }

    go(suggestions[highlightIndex >= 0 ? highlightIndex : 0]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        inputRef.current && !inputRef.current.contains(target) &&
        listRef.current && !listRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const showSuggestions = open && suggestions.length > 0;

  return (
    <section
      aria-label="Find cheapest fuel near you in France"
      className="rounded-lg border-2 border-amber-700/50 bg-gradient-to-br from-amber-950/40 via-oil-900/40 to-oil-900/40 px-6 py-5 sm:px-7 sm:py-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400/90 uppercase">
            New · live station prices · France
          </p>
          <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-white leading-tight">
            Find the cheapest fuel in your area
          </h2>
          <p className="mt-1.5 text-sm text-gray-300 leading-relaxed">
            ~9,300 French stations across {cities.length.toLocaleString('en-GB')} towns, refreshed daily. Type a city or postal code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:flex-shrink-0 relative">
          <div className="relative w-full sm:w-72">
            <label className="sr-only" htmlFor="fp-q">City or postal code</label>
            <input
              id="fp-q"
              ref={inputRef}
              type="text"
              placeholder="e.g. Toulouse, Paris, 75001"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setError(null);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full px-3.5 py-2.5 text-sm rounded-md bg-oil-950 border border-oil-700 text-white placeholder-gray-500 focus:outline-none focus:border-amber-600"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="fp-listbox"
              aria-activedescendant={highlightIndex >= 0 ? `fp-opt-${highlightIndex}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
            />

            {showSuggestions && (
              <ul
                id="fp-listbox"
                ref={listRef}
                role="listbox"
                className="absolute z-30 top-full left-0 right-0 mt-1 rounded-md border border-oil-700 bg-oil-950 shadow-xl overflow-hidden"
              >
                {suggestions.map((s, i) => (
                  <li
                    key={`${s.dept}|${s.ville}`}
                    id={`fp-opt-${i}`}
                    role="option"
                    aria-selected={i === highlightIndex}
                    onMouseEnter={() => setHighlightIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(s);
                    }}
                    className={`px-3.5 py-2 cursor-pointer flex items-baseline justify-between gap-3 ${
                      i === highlightIndex ? 'bg-amber-900/40' : 'hover:bg-oil-900/60'
                    }`}
                  >
                    <span className="text-sm text-white truncate">{s.ville}</span>
                    <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                      {s.dept} · {s.stations} station{s.stations === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold rounded-md bg-amber-700 hover:bg-amber-600 text-white transition whitespace-nowrap"
          >
            Find stations →
          </button>
        </form>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-amber-800/30">
        <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">Or jump to</p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_DEPTS.map((d) => (
            <a
              key={d.code}
              href={
                d.filterCity
                  ? `/country/fr/dept/${d.code.toLowerCase()}?ville=${encodeURIComponent(d.filterCity)}`
                  : `/country/fr/dept/${d.code.toLowerCase()}`
              }
              className="text-[11px] px-2.5 py-1 rounded-full bg-oil-900/70 border border-oil-700 text-gray-300 hover:border-amber-600 hover:text-white transition"
            >
              <span className="font-mono text-gray-500">{d.code}</span> {d.ville}
            </a>
          ))}
          <a
            href="/country/fr"
            className="text-[11px] px-2.5 py-1 rounded-full border border-oil-700 text-oil-300 hover:border-amber-600 hover:text-white transition"
          >
            Browse all 96 départements →
          </a>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-gray-500 leading-snug">
        Granular live coverage: France today. Spain, Italy, and Germany planned. Source:{' '}
        <a
          href="https://www.prix-carburants.gouv.fr/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-oil-400 hover:underline"
        >
          prix-carburants.gouv.fr
        </a>
        .
      </p>
    </section>
  );
}
