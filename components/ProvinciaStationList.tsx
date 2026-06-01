'use client';

import { useMemo, useState } from 'react';

type FuelKey = 'gazole' | 'sp95' | 'sp98' | 'e10' | 'e85' | 'gplc';

interface Station {
  id: string;
  cp: string;
  ville: string;
  adresse: string;
  brand?: string;
  lat: number | null;
  lng: number | null;
  fuels: Partial<Record<FuelKey, number>>;
}

interface Props {
  stations: Station[];
  provName: string;
  initialCity?: string;
}

const FUEL_LABEL: Record<FuelKey, string> = {
  gazole: 'Gasolio',
  sp95: 'Benzina',
  sp98: 'Benzina 98',
  e10: 'Benzina E10',
  e85: 'Bioetanolo',
  gplc: 'GPL',
};

const PRIMARY: FuelKey[] = ['gazole', 'sp95', 'sp98'];

function fmt(v: number | undefined): string {
  return v === undefined ? '—' : `€${v.toFixed(3)}`;
}

export default function ProvStationList({ stations, provName, initialCity = '' }: Props) {
  const [filter, setFilter] = useState(initialCity);

  const trimmed = filter.trim().toLowerCase();

  const filteredStations = useMemo(() => {
    if (!trimmed) return stations;
    return stations.filter(
      (s) =>
        s.ville.toLowerCase().includes(trimmed) ||
        s.adresse.toLowerCase().includes(trimmed) ||
        (s.brand ?? '').toLowerCase().includes(trimmed) ||
        s.cp.includes(trimmed)
    );
  }, [stations, trimmed]);

  const cheapestByFuel = useMemo(() => {
    const out: Partial<Record<FuelKey, Station[]>> = {};
    for (const f of PRIMARY) {
      const withPrice = filteredStations.filter((s) => typeof s.fuels[f] === 'number');
      withPrice.sort((a, b) => (a.fuels[f] as number) - (b.fuels[f] as number));
      out[f] = withPrice.slice(0, 5);
    }
    return out;
  }, [filteredStations]);

  const filterActive = trimmed.length > 0;
  const scopeLabel = filterActive ? `"${filter}" in ${provName}` : provName;

  return (
    <>
      <section className="rounded-lg border border-amber-700/40 bg-amber-950/10 px-5 py-4">
        <label htmlFor="prov-filter" className="block text-[10px] font-mono uppercase tracking-wider text-amber-400/80 mb-2">
          Filter by city, address, brand, or postal code
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="prov-filter"
            type="text"
            placeholder="e.g. Madrid, Repsol, 28012, Calle Goya"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-sm rounded-md bg-oil-950 border border-oil-700 text-white placeholder-gray-500 focus:outline-none focus:border-amber-600"
          />
          {filterActive && (
            <button
              type="button"
              onClick={() => setFilter('')}
              className="px-4 py-2.5 text-sm rounded-md border border-oil-700 text-gray-300 hover:border-amber-600 hover:text-white transition whitespace-nowrap"
            >
              Clear filter
            </button>
          )}
        </div>
        {filterActive && (
          <p className="mt-2 text-xs text-gray-400">
            Showing <strong className="text-white">{filteredStations.length.toLocaleString('en-GB')}</strong> of {stations.length.toLocaleString('en-GB')} stations matching <strong className="text-amber-200">{filter}</strong>.
          </p>
        )}
      </section>

      {filteredStations.length === 0 ? (
        <section className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-8 text-center text-sm text-gray-400">
          No stations match <strong className="text-white">{filter}</strong> in {provName}. Try a different spelling, or{' '}
          <button onClick={() => setFilter('')} className="text-oil-400 hover:underline">
            clear the filter
          </button>{' '}
          to see all stations.
        </section>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Cheapest stations {filterActive ? 'matching your search' : `in ${provName}`}
            </h2>
            <p className="text-sm text-gray-400">Top five stations by current price, per fuel — within {scopeLabel}.</p>
            <div className="grid md:grid-cols-3 gap-4">
              {PRIMARY.map((f) => {
                const list = cheapestByFuel[f] || [];
                if (list.length === 0) return null;
                return (
                  <div key={f} className="rounded-lg border border-oil-800 bg-oil-900/30">
                    <div className="px-5 py-3 border-b border-oil-800/60">
                      <h3 className="text-sm font-semibold text-white">{FUEL_LABEL[f]}</h3>
                    </div>
                    <ol className="divide-y divide-oil-800/40">
                      {list.map((s, i) => (
                        <li key={`${f}-${s.id || i}`} className="px-5 py-3 flex items-baseline justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm text-white truncate">{s.ville || '—'}</div>
                            <div className="text-[11px] text-gray-500 truncate">
                              {s.brand ? `${s.brand} · ` : ''}{s.adresse}
                            </div>
                          </div>
                          <div className="text-base font-mono text-amber-200 flex-shrink-0">{fmt(s.fuels[f])}</div>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">
              All stations {filterActive ? `matching "${filter}"` : `in ${provName}`}
            </h2>
            <p className="text-sm text-gray-400">
              {filteredStations.length.toLocaleString('en-GB')} stations, sorted by city. Prices in euros per litre, refreshed daily.
            </p>
            <div className="overflow-x-auto rounded-lg border border-oil-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-oil-900/50">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-400/80">City</th>
                    <th className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-400/80">Brand · Address</th>
                    <th className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-400/80 text-right">Gasolio</th>
                    <th className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-400/80 text-right">Benzina</th>
                    <th className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-400/80 text-right">Benzina 98</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStations.map((s, i) => (
                    <tr key={s.id || i} className="border-t border-oil-800/40 hover:bg-oil-900/20">
                      <td className="px-3 py-2 text-gray-200 whitespace-nowrap">{s.ville || '—'}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">
                        {s.brand ? <span className="text-gray-300">{s.brand}</span> : null}
                        {s.brand && s.adresse ? ' · ' : ''}
                        {s.adresse}
                      </td>
                      <td className="px-3 py-2 font-mono text-amber-200 text-right">{fmt(s.fuels.gazole)}</td>
                      <td className="px-3 py-2 font-mono text-amber-200 text-right">{fmt(s.fuels.sp95)}</td>
                      <td className="px-3 py-2 font-mono text-amber-200 text-right">{fmt(s.fuels.sp98)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
