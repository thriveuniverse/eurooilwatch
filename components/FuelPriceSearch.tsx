'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEPARTMENTS, deptFromPostalCode } from '@/lib/france-geo';
import { PROVINCES as ES_PROVINCES, provFromPostalCode } from '@/lib/spain-geo';
import { PROVINCES as IT_PROVINCES } from '@/lib/italy-geo';

type Country = 'FR' | 'ES' | 'IT';

const POPULAR = [
  { country: 'FR' as Country, code: '75', ville: 'Paris',    flag: '🇫🇷', filterCity: '' },
  { country: 'IT' as Country, code: 'RM', ville: 'Roma',     flag: '🇮🇹', filterCity: 'Roma' },
  { country: 'ES' as Country, code: '28', ville: 'Madrid',   flag: '🇪🇸', filterCity: 'Madrid' },
  { country: 'IT' as Country, code: 'MI', ville: 'Milano',   flag: '🇮🇹', filterCity: 'Milano' },
  { country: 'ES' as Country, code: '08', ville: 'Barcelona', flag: '🇪🇸', filterCity: 'Barcelona' },
  { country: 'FR' as Country, code: '13', ville: 'Marseille', flag: '🇫🇷', filterCity: 'Marseille' },
  { country: 'IT' as Country, code: 'NA', ville: 'Napoli',   flag: '🇮🇹', filterCity: 'Napoli' },
  { country: 'FR' as Country, code: '69', ville: 'Lyon',     flag: '🇫🇷', filterCity: 'Lyon' },
];

// City tuple shipped to the client: [ville, country, areaCode, stationCount]
export type CityTuple = [string, Country, string, number];

interface Props {
  cities: CityTuple[];
}

interface Suggestion {
  ville: string;
  country: Country;
  area: string;
  stations: number;
  url: string;
}

const MAX_SUGGESTIONS = 8;

function makeSuggestionUrl(country: Country, area: string, ville: string): string {
  if (country === 'FR') return `/country/fr/dept/${area.toLowerCase()}?ville=${encodeURIComponent(ville)}`;
  if (country === 'IT') return `/country/it/prov/${area.toLowerCase()}?ville=${encodeURIComponent(ville)}`;
  return `/country/es/prov/${area.toLowerCase()}?ville=${encodeURIComponent(ville)}`;
}

function popularUrl(country: Country, code: string, filterCity: string): string {
  let base: string;
  if (country === 'FR') base = `/country/fr/dept/${code.toLowerCase()}`;
  else if (country === 'IT') base = `/country/it/prov/${code.toLowerCase()}`;
  else base = `/country/es/prov/${code.toLowerCase()}`;
  return filterCity ? `${base}?ville=${encodeURIComponent(filterCity)}` : base;
}

const COUNTRY_FLAG: Record<Country, string> = { FR: '🇫🇷', ES: '🇪🇸', IT: '🇮🇹' };

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
    for (const [ville, country, area, n] of cities) {
      if (ville.toLowerCase().includes(q)) {
        matches.push({ ville, country, area, stations: n, url: makeSuggestionUrl(country, area, ville) });
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
      // For French/Spanish overlap (01–95) we prefer France; Italian CAPs
      // don't reliably map to province via postal code, so we don't try.
      // Italian users should use the city-name typeahead.
      const dept = deptFromPostalCode(trimmed);
      const prov = provFromPostalCode(trimmed);
      if (dept && DEPARTMENTS[dept]) {
        router.push(`/country/fr/dept/${dept.toLowerCase()}`);
        return;
      }
      if (prov && ES_PROVINCES[prov]) {
        router.push(`/country/es/prov/${prov.toLowerCase()}`);
        return;
      }
      setError('No matching département or provincia found. For Italy, try typing a city name.');
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
            Live station prices · <strong className="text-white">🇫🇷 France</strong> + <strong className="text-white">🇮🇹 Italy</strong> + <strong className="text-white">🇪🇸 Spain</strong>
          </p>
          <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-white leading-tight">
            Find the cheapest fuel in your area
          </h2>
          <p className="mt-1.5 text-sm text-gray-300 leading-relaxed">
            Over 40,000 stations across <strong className="text-white">🇫🇷 France</strong>, <strong className="text-white">🇮🇹 Italy</strong>, and <strong className="text-white">🇪🇸 Spain</strong>, refreshed daily. Type a city or postal code.
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
                    key={`${s.country}|${s.area}|${s.ville}`}
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
                    <span className="text-sm text-white truncate flex items-center gap-1.5">
                      <span aria-hidden="true">{COUNTRY_FLAG[s.country]}</span>
                      {s.ville}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                      {s.area} · {s.stations} station{s.stations === 1 ? '' : 's'}
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
          {POPULAR.map((d) => (
            <a
              key={`${d.country}-${d.code}`}
              href={popularUrl(d.country, d.code, d.filterCity)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-oil-900/70 border border-oil-700 text-gray-300 hover:border-amber-600 hover:text-white transition flex items-center gap-1"
            >
              <span aria-hidden="true">{d.flag}</span>
              <span className="font-mono text-gray-500">{d.code}</span> {d.ville}
            </a>
          ))}
          <a href="/country/fr" className="text-[11px] px-2.5 py-1 rounded-full border border-oil-700 text-oil-300 hover:border-amber-600 hover:text-white transition">
            🇫🇷 All départements →
          </a>
          <a href="/country/it" className="text-[11px] px-2.5 py-1 rounded-full border border-oil-700 text-oil-300 hover:border-amber-600 hover:text-white transition">
            🇮🇹 All province →
          </a>
          <a href="/country/es" className="text-[11px] px-2.5 py-1 rounded-full border border-oil-700 text-oil-300 hover:border-amber-600 hover:text-white transition">
            🇪🇸 All provincias →
          </a>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-gray-500 leading-snug">
        Granular live coverage: 🇫🇷 France, 🇮🇹 Italy, 🇪🇸 Spain. Germany planned. Sources:{' '}
        <a href="https://www.prix-carburants.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">prix-carburants.gouv.fr</a>,{' '}
        <a href="https://www.mimit.gov.it/" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">mimit.gov.it</a>,{' '}
        <a href="https://geoportalgasolineras.es/" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">geoportalgasolineras.es</a>.
      </p>
    </section>
  );
}
