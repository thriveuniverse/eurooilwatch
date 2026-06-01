'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

export default function FuelPriceSearch() {
  const router = useRouter();
  const [postal, setPostal] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = postal.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setError('Enter a 5-digit French postal code (e.g. 75001).');
      return;
    }
    const dept = deptFromPostalCode(trimmed);
    if (!dept || !DEPARTMENTS[dept]) {
      setError('No département found for that postal code.');
      return;
    }
    router.push(`/country/fr/dept/${dept.toLowerCase()}`);
  }

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
            ~9,300 French stations, refreshed daily. Type your postal code or pick a département.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:flex-shrink-0">
          <label className="sr-only" htmlFor="fp-postal">French postal code</label>
          <input
            id="fp-postal"
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            placeholder="Postal code (e.g. 75001)"
            value={postal}
            onChange={(e) => setPostal(e.target.value.replace(/[^\d]/g, ''))}
            className="w-full sm:w-52 px-3.5 py-2.5 text-sm rounded-md bg-oil-950 border border-oil-700 text-white placeholder-gray-500 focus:outline-none focus:border-amber-600"
            aria-describedby={error ? 'fp-error' : undefined}
            aria-invalid={!!error}
          />
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold rounded-md bg-amber-700 hover:bg-amber-600 text-white transition whitespace-nowrap"
          >
            Find stations →
          </button>
        </form>
      </div>

      {error && (
        <p id="fp-error" className="mt-3 text-xs text-red-300" role="alert">
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
