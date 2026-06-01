import * as fs from 'fs';
import * as path from 'path';
import type { Metadata } from 'next';
import { BUNDESLAENDER } from '@/lib/germany-geo';
import { notFound } from 'next/navigation';
import LandStationList from '@/components/LandStationList';

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

interface LandData {
  code: string;
  name: string;
  fullName: string;
  asOf: string;
  source: string;
  licence: string;
  stationCount: number;
  fuels: Partial<Record<FuelKey, FuelStats>>;
  stations: Station[];
}

const FUEL_LABEL: Record<FuelKey, string> = {
  gazole: 'Diesel',
  sp95: 'Super E5',
  sp98: 'Super Plus',
  e10: 'Super E10',
  e85: 'E85',
  gplc: 'Autogas',
};

const PRIMARY: FuelKey[] = ['gazole', 'sp95', 'e10'];

function loadLand(code: string): LandData | null {
  try {
    const p = path.join(process.cwd(), 'data', 'germany-land', `${code}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as LandData;
  } catch {
    return null;
  }
}

function fmt(v: number | undefined): string {
  return v === undefined ? '—' : `€${v.toFixed(3)}`;
}

export function generateStaticParams() {
  return Object.keys(BUNDESLAENDER).map((code) => ({ code: code.toLowerCase() }));
}

export function generateMetadata({ params }: { params: { code: string } }): Metadata {
  const code = params.code.toUpperCase();
  const land = BUNDESLAENDER[code];
  if (!land) return { title: 'Bundesland not found' };
  return {
    title: `Spritpreise ${land.name} (${code}) — Diesel, Super E5, Super E10`,
    description: `Live fuel prices for every station in ${land.fullName}. Diesel, Super E5, Super E10 — updated daily from tankerkoenig.de (MTS-K).`,
    alternates: { canonical: `https://eurooilwatch.com/country/de/land/${params.code.toLowerCase()}` },
    openGraph: {
      title: `Spritpreise ${land.name} — EuroOilWatch`,
      description: `Live fuel prices for every station in ${land.fullName}, updated daily.`,
      url: `https://eurooilwatch.com/country/de/land/${params.code.toLowerCase()}`,
      siteName: 'EuroOilWatch',
      type: 'article',
    },
  };
}

export default function LandPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { ville?: string };
}) {
  const code = params.code.toUpperCase();
  const land = BUNDESLAENDER[code];
  if (!land) notFound();

  const data = loadLand(code);
  const initialCity = typeof searchParams?.ville === 'string' ? searchParams.ville : '';

  const sisters = Object.values(BUNDESLAENDER)
    .filter((b) => b.code !== code)
    .sort((a, b) => a.name.localeCompare(b.name));

  const updatedDate = data
    ? new Date(data.asOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <a href="/" className="text-oil-400 hover:underline">EuroOilWatch</a>
        <span>›</span>
        <a href="/country/de" className="text-oil-400 hover:underline">Deutschland</a>
        <span>›</span>
        <span className="text-gray-300">{land.name} ({code})</span>
      </div>

      <header className="space-y-3">
        <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          Bundesland {code} · Federal Republic of Germany
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Spritpreise — {land.fullName}</h1>
        {data ? (
          <p className="text-base text-gray-300 leading-relaxed">
            Live fuel prices for{' '}
            <strong className="text-white">{data.stationCount.toLocaleString('en-GB')} stations</strong>{' '}
            across {land.fullName}. Refreshed daily from{' '}
            <a
              href="https://creativecommons.tankerkoenig.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-oil-400 hover:underline"
            >
              tankerkoenig.de
            </a>{' '}
            (Bundeskartellamt MTS-K, CC BY 4.0).
          </p>
        ) : (
          <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 px-5 py-4 space-y-2">
            <p className="text-sm text-amber-100 leading-relaxed">
              <strong>Coming soon.</strong> The German integration is built and ready; we&apos;re waiting
              on the tankerkoenig.de API key to populate station data. Bundesland geography, page
              architecture, and the daily refresh pipeline are all in place — populating
              automatically on the first cron tick after the key arrives.
            </p>
            <p className="text-xs text-gray-400">
              In the meantime, see{' '}
              <a href="/country/fr" className="text-oil-400 hover:underline">🇫🇷 France</a>,{' '}
              <a href="/country/it" className="text-oil-400 hover:underline">🇮🇹 Italy</a>, or{' '}
              <a href="/country/es" className="text-oil-400 hover:underline">🇪🇸 Spain</a> for live granular
              coverage.
            </p>
          </div>
        )}
      </header>

      {data && (
        <>
          <section className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
                Durchschnitt in {land.name}
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

          <LandStationList stations={data.stations} landName={land.name} initialCity={initialCity} />
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Andere Bundesländer</h2>
        <div className="flex flex-wrap gap-2">
          {sisters.map((b) => (
            <a
              key={b.code}
              href={`/country/de/land/${b.code.toLowerCase()}`}
              className="text-xs text-gray-300 px-2.5 py-1 rounded bg-oil-900/60 border border-oil-700 hover:border-oil-500 hover:text-white transition"
            >
              <span className="font-mono text-gray-500">{b.code}</span> {b.name}
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-oil-800/40 pt-6 text-xs text-gray-500 leading-relaxed space-y-2">
        <p>
          <strong className="text-gray-400">Quelle:</strong>{' '}
          <a
            href="https://creativecommons.tankerkoenig.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-oil-400 hover:underline"
          >
            tankerkoenig.de
          </a>{' '}
          — Daten von der Markttransparenzstelle für Kraftstoffe (Bundeskartellamt), Lizenz CC BY 4.0.
          Refreshed daily.
        </p>
        <p>
          <strong className="text-gray-400">Methodology:</strong>{' '}
          <a href="/methodology" className="text-oil-400 hover:underline">/methodology</a>{' '}
          · <strong className="text-gray-400">All of Germany:</strong>{' '}
          <a href="/country/de" className="text-oil-400 hover:underline">/country/de</a>{' '}
          · <strong className="text-gray-400">EU comparison:</strong>{' '}
          <a href="/prices" className="text-oil-400 hover:underline">/prices</a>
        </p>
      </footer>
    </div>
  );
}
