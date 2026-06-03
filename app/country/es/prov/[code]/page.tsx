import * as fs from 'fs';
import * as path from 'path';
import type { Metadata } from 'next';
import { PROVINCES, REGIONS } from '@/lib/spain-geo';
import { notFound } from 'next/navigation';
import ProvStationList from '@/components/ProvStationList';
import JsonLd from '@/components/JsonLd';

type FuelKey = 'gazole' | 'sp95' | 'sp98' | 'e10' | 'e85' | 'gplc';

interface FuelStats {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
}

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

interface ProvData {
  code: string;
  name: string;
  regionCode: string;
  regionName: string;
  asOf: string;
  source: string;
  stationCount: number;
  fuels: Partial<Record<FuelKey, FuelStats>>;
  stations: Station[];
}

const FUEL_LABEL: Record<FuelKey, string> = {
  gazole: 'Gasóleo A',
  sp95: 'Gasolina 95',
  sp98: 'Gasolina 98',
  e10: 'E10',
  e85: 'Bioetanol',
  gplc: 'GLP',
};

const PRIMARY: FuelKey[] = ['gazole', 'sp95', 'sp98'];

function loadProv(code: string): ProvData | null {
  try {
    const p = path.join(process.cwd(), 'data', 'spain-prov', `${code}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as ProvData;
  } catch {
    return null;
  }
}

function fmt(v: number | undefined): string {
  return v === undefined ? '—' : `€${v.toFixed(3)}`;
}

export function generateStaticParams() {
  return Object.keys(PROVINCES).map((code) => ({ code: code.toLowerCase() }));
}

export function generateMetadata({ params }: { params: { code: string } }): Metadata {
  const code = params.code.padStart(2, '0');
  const prov = PROVINCES[code];
  if (!prov) return { title: 'Provincia not found' };
  const region = REGIONS[prov.regionCode]?.name ?? '';
  return {
    title: `Precios carburantes ${prov.name} (${code}) — gasóleo, gasolina 95, gasolina 98`,
    description: `Live fuel prices for every station in ${prov.name} (provincia ${code}, ${region}). Gasóleo A, Gasolina 95 E5, Gasolina 98 E5 — updated daily from the Ministerio para la Transición Ecológica.`,
    alternates: { canonical: `https://eurooilwatch.com/country/es/prov/${params.code.toLowerCase()}` },
    openGraph: {
      title: `Precios carburantes ${prov.name} — EuroOilWatch`,
      description: `Live fuel prices for every station in ${prov.name}, updated daily.`,
      url: `https://eurooilwatch.com/country/es/prov/${params.code.toLowerCase()}`,
      siteName: 'EuroOilWatch',
      type: 'article',
    },
  };
}

export default function ProvPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { ville?: string };
}) {
  const code = params.code.padStart(2, '0');
  const prov = PROVINCES[code];
  if (!prov) notFound();

  const data = loadProv(code);
  const region = REGIONS[prov.regionCode];
  const initialCity = typeof searchParams?.ville === 'string' ? searchParams.ville : '';

  const sisters = Object.values(PROVINCES)
    .filter((p) => p.regionCode === prov.regionCode && p.code !== code)
    .sort((a, b) => a.name.localeCompare(b.name));

  const updatedDate = data
    ? new Date(data.asOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <JsonLd
        type="area"
        countryName="Spain"
        countryCode="ES"
        areaName={prov.name}
        areaKind="provincia"
        areaPath={`/country/es/prov/${params.code.toLowerCase()}`}
        regionName={region?.name}
        fuels="gasóleo A, gasolina 95, gasolina 98"
        sourceName="Ministerio para la Transición Ecológica"
        sourceUrl="https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/"
      />
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <a href="/" className="text-oil-400 hover:underline">EuroOilWatch</a>
        <span>›</span>
        <a href="/country/es" className="text-oil-400 hover:underline">España</a>
        <span>›</span>
        <span className="text-gray-400">{region?.name}</span>
        <span>›</span>
        <span className="text-gray-300">{prov.name} ({code})</span>
      </div>

      <header className="space-y-3">
        <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          Provincia {code} · {region?.name}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">{prov.name} — Precios de carburantes</h1>
        {data ? (
          <p className="text-base text-gray-300 leading-relaxed">
            Live fuel prices for{' '}
            <strong className="text-white">{data.stationCount.toLocaleString('en-GB')} stations</strong>{' '}
            across {prov.name}. Refreshed daily from the{' '}
            <a
              href="https://geoportalgasolineras.es/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-oil-400 hover:underline"
            >
              Geoportal de Hidrocarburos
            </a>{' '}
            (Ministerio para la Transición Ecológica).
          </p>
        ) : (
          <p className="text-sm text-gray-400">Live station data is not yet available for this provincia.</p>
        )}
      </header>

      {data && (
        <>
          <section className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
                Average across {prov.name}
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Updated {updatedDate}</span>
            </div>
            <div className="px-5 py-4 grid sm:grid-cols-3 gap-3">
              {PRIMARY.map((f) => {
                const stat = data.fuels[f];
                if (!stat) {
                  return (
                    <div key={f} className="rounded border border-oil-800 bg-oil-950/40 px-4 py-3">
                      <div className="text-xs text-gray-500">{FUEL_LABEL[f]}</div>
                      <div className="mt-1 text-xl font-mono text-gray-600">—</div>
                    </div>
                  );
                }
                return (
                  <div key={f} className="rounded border border-oil-700 bg-oil-950/40 px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-gray-400">{FUEL_LABEL[f]}</span>
                      <span className="text-[10px] font-mono text-gray-600">n={stat.count}</span>
                    </div>
                    <div className="mt-1 text-2xl font-mono text-amber-200">{fmt(stat.mean)}</div>
                    <div className="mt-0.5 text-[10px] text-gray-500 font-mono">
                      median {fmt(stat.median)} · min {fmt(stat.min)} · max {fmt(stat.max)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <ProvStationList stations={data.stations} provName={prov.name} initialCity={initialCity} />
        </>
      )}

      {sisters.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Other provincias in {region?.name}</h2>
          <div className="flex flex-wrap gap-2">
            {sisters.map((p) => (
              <a
                key={p.code}
                href={`/country/es/prov/${p.code.toLowerCase()}`}
                className="text-xs text-gray-300 px-2.5 py-1 rounded bg-oil-900/60 border border-oil-700 hover:border-oil-500 hover:text-white transition"
              >
                <span className="font-mono text-gray-500">{p.code}</span> {p.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-oil-800/40 pt-6 text-xs text-gray-500 leading-relaxed space-y-2">
        <p>
          <strong className="text-gray-400">Source:</strong>{' '}
          <a
            href="https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/help/operations/EstacionesTerrestres"
            target="_blank"
            rel="noopener noreferrer"
            className="text-oil-400 hover:underline"
          >
            Geoportal de Hidrocarburos
          </a>{' '}
          (Ministerio para la Transición Ecológica). Refreshed daily.
        </p>
        <p>
          <strong className="text-gray-400">Methodology:</strong>{' '}
          <a href="/methodology" className="text-oil-400 hover:underline">/methodology</a>{' '}
          · <strong className="text-gray-400">All of Spain:</strong>{' '}
          <a href="/country/es" className="text-oil-400 hover:underline">/country/es</a>{' '}
          · <strong className="text-gray-400">EU comparison:</strong>{' '}
          <a href="/prices" className="text-oil-400 hover:underline">/prices</a>
        </p>
      </footer>
    </div>
  );
}
