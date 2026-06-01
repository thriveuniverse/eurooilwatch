'use client';

import { useMemo, useState } from 'react';

type FuelKey = 'gazole' | 'sp95' | 'sp98' | 'e10' | 'e85' | 'gplc';

interface FuelStats {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
}

interface AreaStats {
  name: string;
  regionCode?: string;
  provinceCount?: number;
  stationCount: number;
  fuels: Partial<Record<FuelKey, FuelStats>>;
}

export interface SpainData {
  asOf: string;
  source: string;
  sourceTimestamp?: string | null;
  totalStations: number;
  freshStations: number;
  national: { stationCount: number; fuels: Partial<Record<FuelKey, FuelStats>> };
  regions: Record<string, AreaStats>;
  provinces: Record<string, AreaStats>;
}

interface Props {
  data: SpainData;
}

const FUEL_LABEL: Record<FuelKey, string> = {
  gazole: 'Gasóleo A (B7 diesel)',
  sp95: 'Gasolina 95 E5',
  sp98: 'Gasolina 98 E5',
  e10: 'Gasolina 95 E10',
  e85: 'Bioetanol (E85)',
  gplc: 'GLP (LPG)',
};

const PRIMARY_FUELS: FuelKey[] = ['gazole', 'sp95', 'sp98'];
const SECONDARY_FUELS: FuelKey[] = ['e10', 'e85', 'gplc'];

function fmtPrice(v: number | undefined): string {
  return v === undefined ? '—' : `€${v.toFixed(3)}`;
}

function deltaVsNational(area: number | undefined, nat: number | undefined): {
  className: string;
  label: string;
} | null {
  if (area === undefined || nat === undefined) return null;
  const cents = Math.round((area - nat) * 1000) / 10;
  if (Math.abs(cents) < 0.5) return { className: 'text-gray-500', label: '≈ national' };
  if (cents > 0) return { className: 'text-red-300', label: `+${cents.toFixed(1)}¢ vs national` };
  return { className: 'text-emerald-300', label: `${cents.toFixed(1)}¢ vs national` };
}

export default function SpainRegionalView({ data }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<string>('ES');
  const [selectedProv, setSelectedProv] = useState<string>('');

  const nationalFuels = data.national.fuels;

  const regionList = useMemo(
    () =>
      Object.entries(data.regions)
        .map(([code, r]) => ({ code, ...r }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.regions]
  );

  const provsForSelectedRegion = useMemo(() => {
    if (selectedRegion === 'ES') return [];
    return Object.entries(data.provinces)
      .filter(([, p]) => p.regionCode === selectedRegion)
      .map(([code, p]) => ({ code, ...p }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.provinces, selectedRegion]);

  const view = useMemo(() => {
    if (selectedProv && data.provinces[selectedProv]) return data.provinces[selectedProv];
    if (selectedRegion !== 'ES' && data.regions[selectedRegion]) return data.regions[selectedRegion];
    return {
      name: 'All Spain',
      stationCount: data.national.stationCount,
      fuels: nationalFuels,
    } as AreaStats;
  }, [data, selectedRegion, selectedProv, nationalFuels]);

  const updatedDate = new Date(data.asOf).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <section aria-label="Live station prices — Spain" className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
          Live Station Prices — Spain
        </h2>
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
          {data.freshStations.toLocaleString('en-GB')} stations · Updated {updatedDate}
        </span>
      </div>

      <div className="px-5 py-3 border-b border-oil-800/40 bg-oil-950/40">
        <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">Comunidad autónoma</div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setSelectedRegion('ES');
              setSelectedProv('');
            }}
            className={`text-[11px] px-2.5 py-1 rounded transition ${
              selectedRegion === 'ES'
                ? 'bg-amber-700/60 text-white border border-amber-600'
                : 'bg-oil-900/60 text-gray-400 border border-oil-700 hover:border-oil-500 hover:text-gray-200'
            }`}
          >
            All Spain
          </button>
          {regionList.map((r) => (
            <button
              key={r.code}
              onClick={() => {
                setSelectedRegion(r.code);
                setSelectedProv('');
              }}
              className={`text-[11px] px-2.5 py-1 rounded transition ${
                selectedRegion === r.code
                  ? 'bg-amber-700/60 text-white border border-amber-600'
                  : 'bg-oil-900/60 text-gray-400 border border-oil-700 hover:border-oil-500 hover:text-gray-200'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>

        {selectedRegion !== 'ES' && provsForSelectedRegion.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">
              Provincia (within {data.regions[selectedRegion]?.name})
            </div>
            <select
              value={selectedProv}
              onChange={(e) => setSelectedProv(e.target.value)}
              className="bg-oil-900 border border-oil-700 text-gray-200 text-xs rounded px-3 py-1.5 focus:outline-none focus:border-oil-500"
            >
              <option value="">All of {data.regions[selectedRegion]?.name}</option>
              {provsForSelectedRegion.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
          <h3 className="text-base font-semibold text-white">{view.name}</h3>
          <span className="text-xs text-gray-500">
            {view.stationCount.toLocaleString('en-GB')} stations
            {view.provinceCount ? ` · ${view.provinceCount} provincias` : ''}
          </span>
        </div>

        {selectedProv && (
          <a
            href={`/country/es/prov/${selectedProv.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 mb-3 text-xs text-oil-300 hover:text-oil-200 underline underline-offset-2"
          >
            See every station in {data.provinces[selectedProv]?.name} →
          </a>
        )}

        <div className="grid sm:grid-cols-3 gap-3">
          {PRIMARY_FUELS.map((f) => {
            const stat = view.fuels[f];
            const nat = nationalFuels[f];
            const delta = deltaVsNational(stat?.mean, nat?.mean);
            return (
              <div key={f} className="rounded border border-oil-700 bg-oil-950/40 px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-gray-400">{FUEL_LABEL[f]}</span>
                  <span className="text-[10px] font-mono text-gray-600">n={stat?.count ?? 0}</span>
                </div>
                <div className="mt-1 text-2xl font-mono text-amber-200">{fmtPrice(stat?.mean)}</div>
                <div className="mt-0.5 text-[10px] text-gray-500 font-mono">
                  median {fmtPrice(stat?.median)} · min {fmtPrice(stat?.min)} · max {fmtPrice(stat?.max)}
                </div>
                {selectedRegion !== 'ES' && delta && (
                  <div className={`mt-1 text-[10px] font-mono ${delta.className}`}>{delta.label}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid sm:grid-cols-3 gap-3">
          {SECONDARY_FUELS.map((f) => {
            const stat = view.fuels[f];
            if (!stat) return null;
            return (
              <div key={f} className="rounded border border-oil-800 bg-oil-950/30 px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] text-gray-500">{FUEL_LABEL[f]}</span>
                  <span className="text-[10px] font-mono text-gray-600">n={stat.count}</span>
                </div>
                <div className="text-sm font-mono text-gray-300 mt-0.5">{fmtPrice(stat.mean)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-2 border-t border-oil-800/40 bg-oil-950/40">
        <p className="text-[10px] text-gray-500 leading-snug">
          Source:{' '}
          <a href={data.source} target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">
            Geoportal de Hidrocarburos
          </a>{' '}
          (Ministerio para la Transición Ecológica). Refreshed daily. Methodology:{' '}
          <a href="/methodology" className="text-oil-400 hover:underline">/methodology</a>.
        </p>
      </div>
    </section>
  );
}
