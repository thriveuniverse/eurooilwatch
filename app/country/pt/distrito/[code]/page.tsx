import * as fs from 'fs';
import * as path from 'path';
import type { Metadata } from 'next';
import { PROVINCES, REGIONS } from '@/lib/portugal-geo';
import { notFound } from 'next/navigation';
import ProvinciaStationList from '@/components/ProvinciaStationList';
import JsonLd from '@/components/JsonLd';
import AreaPriceSummary, { type FuelSummaryLine } from '@/components/AreaPriceSummary';

type FuelKey = 'gazole' | 'sp95';

interface FuelStats { count: number; mean: number; median: number; min: number; max: number; }
interface Station { id: string; cp: string; ville: string; adresse: string; brand?: string; lat: number | null; lng: number | null; fuels: Partial<Record<FuelKey, number>>; }
interface DistData {
  code: string; name: string; regionCode: string; regionName: string;
  asOf: string; source: string; stationCount: number;
  fuels: Partial<Record<FuelKey, FuelStats>>; stations: Station[];
}

const FUEL_LABEL: Record<FuelKey, string> = { gazole: 'Gasóleo', sp95: 'Gasolina 95' };
const PRIMARY: FuelKey[] = ['gazole', 'sp95'];
const SOURCE_URL = 'https://precoscombustiveis.dgeg.gov.pt/';

function loadDist(code: string): DistData | null {
  try {
    const p = path.join(process.cwd(), 'data', 'pt-distrito', `${code}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as DistData;
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
  const code = params.code.toUpperCase();
  const dist = PROVINCES[code];
  if (!dist) return { title: 'Distrito not found' };
  const region = REGIONS[dist.regionCode]?.name ?? '';
  return {
    title: `Preços dos combustíveis ${dist.name} — gasóleo, gasolina`,
    description: `Live fuel prices for every station in the distrito of ${dist.name} (${region}). Gasóleo simples and Gasolina 95 — updated daily from DGEG open data.`,
    alternates: { canonical: `https://eurooilwatch.com/country/pt/distrito/${params.code.toLowerCase()}` },
    openGraph: {
      title: `Preços dos combustíveis ${dist.name} — EuroOilWatch`,
      description: `Live fuel prices for every station in the distrito of ${dist.name}, updated daily.`,
      url: `https://eurooilwatch.com/country/pt/distrito/${params.code.toLowerCase()}`,
      siteName: 'EuroOilWatch',
      type: 'article',
    },
  };
}

export default function DistritoPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { ville?: string };
}) {
  const code = params.code.toUpperCase();
  const dist = PROVINCES[code];
  if (!dist) notFound();

  const data = loadDist(code);
  const region = REGIONS[dist.regionCode];
  const initialCity = typeof searchParams?.ville === 'string' ? searchParams.ville : '';

  const sisters = Object.values(PROVINCES)
    .filter((p) => p.regionCode === dist.regionCode && p.code !== code)
    .sort((a, b) => a.name.localeCompare(b.name));

  const updatedDate = data
    ? new Date(data.asOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <JsonLd
        type="area"
        countryName="Portugal"
        countryCode="PT"
        areaName={dist.name}
        areaKind="distrito"
        areaPath={`/country/pt/distrito/${params.code.toLowerCase()}`}
        regionName={region?.name}
        fuels="gasóleo, gasolina 95"
        sourceName="DGEG"
        sourceUrl={SOURCE_URL}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <a href="/" className="text-oil-400 hover:underline">EuroOilWatch</a>
        <span>›</span>
        <a href="/country/pt" className="text-oil-400 hover:underline">Portugal</a>
        <span>›</span>
        <span className="text-gray-400">{region?.name}</span>
        <span>›</span>
        <span className="text-gray-300">{dist.name}</span>
      </div>

      <header className="space-y-3">
        <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          Distrito · {region?.name}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Distrito de {dist.name} — Preços dos combustíveis</h1>
        {data ? (
          <p className="text-base text-gray-300 leading-relaxed">
            Live fuel prices for{' '}
            <strong className="text-white">{data.stationCount.toLocaleString('en-GB')} stations</strong>{' '}
            across the distrito of {dist.name}. Refreshed daily from{' '}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">
              DGEG — Preços dos Combustíveis Online
            </a>{' '}
            (Direção-Geral de Energia e Geologia).
          </p>
        ) : (
          <p className="text-sm text-gray-400">Live station data is not yet available for this distrito.</p>
        )}
      </header>

      {data && (() => {
        const lines = PRIMARY.flatMap((key): FuelSummaryLine[] => {
          const stat = data.fuels[key];
          if (!stat || !stat.count) return [];
          let best = Infinity;
          let where = '';
          for (const s of data.stations) {
            const p = s.fuels[key];
            if (typeof p === 'number' && p > 0 && p < best) {
              best = p;
              where = s.brand ? `${s.brand}, ${s.ville}` : s.ville;
            }
          }
          if (!Number.isFinite(best) || !where) return [];
          return [{ label: FUEL_LABEL[key], cheapest: best, where, average: stat.mean, count: stat.count }];
        });
        return lines.length ? (
          <AreaPriceSummary areaName={dist.name} areaKind="distrito" asOf={data.asOf} lines={lines} />
        ) : null;
      })()}

      {data && (
        <>
          <section className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
                Média no distrito de {dist.name}
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Updated {updatedDate}</span>
            </div>
            <div className="px-5 py-4 grid sm:grid-cols-2 gap-3">
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

          <ProvinciaStationList stations={data.stations} provName={dist.name} initialCity={initialCity} />
        </>
      )}

      {sisters.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Outros distritos em {region?.name}</h2>
          <div className="flex flex-wrap gap-2">
            {sisters.map((p) => (
              <a
                key={p.code}
                href={`/country/pt/distrito/${p.code.toLowerCase()}`}
                className="text-xs text-gray-300 px-2.5 py-1 rounded bg-oil-900/60 border border-oil-700 hover:border-oil-500 hover:text-white transition"
              >
                {p.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-oil-800/40 pt-6 text-xs text-gray-500 leading-relaxed space-y-2">
        <p>
          <strong className="text-gray-400">Fonte:</strong>{' '}
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">
            DGEG — Preços dos Combustíveis Online
          </a>. Free, non-commercial use. Refreshed daily.
        </p>
        <p>
          <strong className="text-gray-400">Methodology:</strong>{' '}
          <a href="/methodology" className="text-oil-400 hover:underline">/methodology</a>{' '}
          · <strong className="text-gray-400">All of Portugal:</strong>{' '}
          <a href="/country/pt" className="text-oil-400 hover:underline">/country/pt</a>{' '}
          · <strong className="text-gray-400">EU comparison:</strong>{' '}
          <a href="/prices" className="text-oil-400 hover:underline">/prices</a>
        </p>
      </footer>
    </div>
  );
}
