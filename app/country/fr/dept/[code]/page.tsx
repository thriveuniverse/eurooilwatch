import * as fs from 'fs';
import * as path from 'path';
import type { Metadata } from 'next';
import { DEPARTMENTS, REGIONS } from '@/lib/france-geo';
import { notFound } from 'next/navigation';
import DeptStationList from '@/components/DeptStationList';
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
  pop: 'A' | 'R' | null;
  lat: number | null;
  lng: number | null;
  fuels: Partial<Record<FuelKey, number>>;
}

interface DeptData {
  code: string;
  name: string;
  regionCode: string;
  regionName: string;
  asOf: string;
  source: string;
  freshnessFilterDays: number;
  stationCount: number;
  fuels: Partial<Record<FuelKey, FuelStats>>;
  stations: Station[];
}

const FUEL_LABEL: Record<FuelKey, string> = {
  gazole: 'Gazole',
  e10: 'SP95-E10',
  sp95: 'SP95',
  sp98: 'SP98',
  e85: 'E85',
  gplc: 'GPLc',
};

const PRIMARY: FuelKey[] = ['gazole', 'e10', 'sp95', 'sp98'];

function loadDept(code: string): DeptData | null {
  try {
    const p = path.join(process.cwd(), 'data', 'france-dept', `${code}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as DeptData;
  } catch {
    return null;
  }
}

function fmt(v: number | undefined): string {
  return v === undefined ? '—' : `€${v.toFixed(3)}`;
}

export function generateStaticParams() {
  return Object.keys(DEPARTMENTS).map((code) => ({ code: code.toLowerCase() }));
}

export function generateMetadata({ params }: { params: { code: string } }): Metadata {
  const upper = params.code.toUpperCase();
  const dept = DEPARTMENTS[upper];
  if (!dept) return { title: 'Département not found' };
  const region = REGIONS[dept.regionCode]?.name ?? '';
  return {
    title: `Prix carburants ${dept.name} (${upper}) — gazole, SP95-E10, SP98`,
    description: `Live fuel prices for every station in ${dept.name} (département ${upper}, ${region}). Gazole, SP95-E10, SP95, SP98 — updated daily from official prix-carburants data.`,
    alternates: { canonical: `https://eurooilwatch.com/country/fr/dept/${params.code.toLowerCase()}` },
    openGraph: {
      title: `Prix carburants ${dept.name} — EuroOilWatch`,
      description: `Live fuel prices for every station in ${dept.name}, updated daily.`,
      url: `https://eurooilwatch.com/country/fr/dept/${params.code.toLowerCase()}`,
      siteName: 'EuroOilWatch',
      type: 'article',
    },
  };
}

export default function DeptPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { ville?: string };
}) {
  const upper = params.code.toUpperCase();
  const dept = DEPARTMENTS[upper];
  if (!dept) notFound();

  const data = loadDept(upper);
  const region = REGIONS[dept.regionCode];
  const initialCity = typeof searchParams?.ville === 'string' ? searchParams.ville : '';

  // Sister départements in the same region (for cross-linking)
  const sisters = Object.values(DEPARTMENTS)
    .filter((d) => d.regionCode === dept.regionCode && d.code !== upper)
    .sort((a, b) => a.name.localeCompare(b.name));

  const updatedDate = data
    ? new Date(data.asOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <JsonLd
        type="area"
        countryName="France"
        countryCode="FR"
        areaName={dept.name}
        areaKind="département"
        areaPath={`/country/fr/dept/${params.code.toLowerCase()}`}
        regionName={region?.name}
        fuels="gazole, SP95-E10, SP95, SP98"
        sourceName="prix-carburants (data.economie.gouv.fr)"
        sourceUrl="https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/"
      />
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <a href="/" className="text-oil-400 hover:underline">EuroOilWatch</a>
        <span>›</span>
        <a href="/country/fr" className="text-oil-400 hover:underline">France</a>
        <span>›</span>
        <span className="text-gray-400">{region?.name}</span>
        <span>›</span>
        <span className="text-gray-300">{dept.name} ({upper})</span>
      </div>

      {/* Header */}
      <header className="space-y-3">
        <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          Département {upper} · {region?.name}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          {dept.name} — Fuel Prices
        </h1>
        {data ? (
          <p className="text-base text-gray-300 leading-relaxed">
            Live fuel prices for{' '}
            <strong className="text-white">{data.stationCount.toLocaleString('en-GB')} stations</strong>{' '}
            across {dept.name}. Refreshed daily from{' '}
            <a
              href="https://www.prix-carburants.gouv.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-oil-400 hover:underline"
            >
              prix-carburants.gouv.fr
            </a>{' '}
            (Direction générale de la concurrence, de la consommation et de la répression des fraudes).
          </p>
        ) : (
          <p className="text-sm text-gray-400">Live station data is not yet available for this département.</p>
        )}
      </header>

      {data && (
        <>
          {/* Aggregate stats */}
          <section className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
                Average across {dept.name}
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                Updated {updatedDate}
              </span>
            </div>
            <div className="px-5 py-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

          {/* Filterable station list + cheapest-5 (client component) */}
          <DeptStationList stations={data.stations} deptName={dept.name} initialCity={initialCity} />
        </>
      )}

      {/* Other départements in the same region */}
      {sisters.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Other départements in {region?.name}</h2>
          <div className="flex flex-wrap gap-2">
            {sisters.map((d) => (
              <a
                key={d.code}
                href={`/country/fr/dept/${d.code.toLowerCase()}`}
                className="text-xs text-gray-300 px-2.5 py-1 rounded bg-oil-900/60 border border-oil-700 hover:border-oil-500 hover:text-white transition"
              >
                <span className="font-mono text-gray-500">{d.code}</span> {d.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-oil-800/40 pt-6 text-xs text-gray-500 leading-relaxed space-y-2">
        <p>
          <strong className="text-gray-400">Source:</strong>{' '}
          <a
            href="https://www.prix-carburants.gouv.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-oil-400 hover:underline"
          >
            prix-carburants.gouv.fr
          </a>{' '}
          via{' '}
          <a
            href="https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-oil-400 hover:underline"
          >
            data.economie.gouv.fr
          </a>
          . Refreshed daily. Stations whose last price update is more than {data?.freshnessFilterDays ?? 14} days old
          are excluded.
        </p>
        <p>
          <strong className="text-gray-400">Methodology:</strong>{' '}
          <a href="/methodology" className="text-oil-400 hover:underline">/methodology</a>{' '}
          · <strong className="text-gray-400">All of France:</strong>{' '}
          <a href="/country/fr" className="text-oil-400 hover:underline">/country/fr</a>{' '}
          · <strong className="text-gray-400">EU-wide comparison:</strong>{' '}
          <a href="/prices" className="text-oil-400 hover:underline">/prices</a>
        </p>
      </footer>
    </div>
  );
}
