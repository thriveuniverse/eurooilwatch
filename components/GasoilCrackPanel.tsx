/**
 * European Gasoil (Diesel) Crack panel — ICE Gasoil minus Brent.
 *
 * The benchmark European refining margin. Europe runs a diesel-long slate, so
 * the gasoil crack is the number EU refiners watch most — a *true* traded
 * European metric, unlike the Brent 3-2-1 panel which uses NY Harbor products
 * as a proxy. Renders only when data/gasoil.json is present (its fetcher refuses
 * to write implausible values), so an absent panel is a failed fetch, never a
 * wrong number.
 *
 * Server component — receives data read from data/gasoil.json by the page.
 */

export interface GasoilData {
  lastUpdated: string;
  latestDate: string;
  crackUsd: number;
  crackChangeUsd: number;
  crackVsYearAgoUsd: number;
  components: { brentUsd: number; gasoilUsdTonne: number; gasoilUsdBbl: number };
  history: { date: string; crackUsd: number }[];
  formula: string;
  legs: { crude: string; distillate: string };
  basis: string;
  dataSource: string;
}

function Sparkline({ points }: { points: { date: string; crackUsd: number }[] }) {
  if (points.length < 2) return null;
  const W = 320, H = 56, PAD = 3;
  const vals = points.map(p => p.crackUsd);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - min) / range) * (H - 2 * PAD);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.crackUsd).toFixed(1)}`).join(' ');
  const area = `${PAD},${H - PAD} ${line} ${(W - PAD).toFixed(1)},${H - PAD}`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none" role="img"
         aria-label={`Gasoil crack trend, latest $${last.crackUsd.toFixed(2)} per barrel`}>
      <polygon points={area} fill="rgb(52 211 153 / 0.10)" />
      <polyline points={line} fill="none" stroke="rgb(52 211 153)" strokeWidth="1.5"
                strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.crackUsd)} r="2.5" fill="rgb(52 211 153)" />
    </svg>
  );
}

export default function GasoilCrackPanel({ data }: { data: GasoilData }) {
  const { crackUsd, crackChangeUsd, crackVsYearAgoUsd, components: c, history } = data;
  const up = crackChangeUsd >= 0;
  const first = history[0];
  const last = history[history.length - 1];

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          European Gasoil (Diesel) Crack
        </h2>
        <span className="text-[10px] font-mono text-gray-600">NWE refining margin</span>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-mono font-bold text-white leading-none">
              ${crackUsd.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">/bbl</span>
            </p>
            <p className={`mt-1.5 text-xs font-mono ${up ? 'text-red-400' : 'text-emerald-400'}`}>
              {up ? '▲' : '▼'} ${Math.abs(crackChangeUsd).toFixed(2)} d/d
              <span className="text-gray-600 ml-2">
                {crackVsYearAgoUsd >= 0 ? '+' : '−'}${Math.abs(crackVsYearAgoUsd).toFixed(2)} vs yr ago
              </span>
            </p>
          </div>
          <div className="flex-1 max-w-[220px]">
            <Sparkline points={history} />
            <div className="flex justify-between text-[9px] font-mono text-gray-600 -mt-0.5">
              <span>{first?.date}</span>
              <span>{last?.date}</span>
            </div>
          </div>
        </div>

        {/* Component legs */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Brent</p>
            <p className="text-sm font-mono font-semibold text-white">${c.brentUsd.toFixed(2)}</p>
            <p className="text-[9px] text-gray-600">/bbl</p>
          </div>
          <div className="rounded border border-oil-800/60 bg-oil-950/40 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">ICE Gasoil</p>
            <p className="text-sm font-mono font-semibold text-white">${c.gasoilUsdTonne.toFixed(0)}</p>
            <p className="text-[9px] text-gray-600">/tonne (${c.gasoilUsdBbl.toFixed(2)}/bbl)</p>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
          Europe runs a diesel-long refinery slate, so the <span className="text-gray-400">gasoil
          crack</span> — ICE Low-Sulphur Gasoil minus Brent — is the margin that matters most here.
          A wide crack means diesel is holding its value even as crude falls, so pump prices need not
          follow crude down. Unlike the 3-2-1 above, this is a traded European benchmark, not a proxy.
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-amber-500/70">
          Gross paper margin vs Brent — a refiner's cash margin runs lower after sour-crude
          differentials and energy/hydrogen costs. Read it as a diesel-tightness gauge.{' '}
          <a href="/analysis/record-crack-is-not-record-profit" className="underline hover:text-amber-400">Why →</a>
        </p>
        <p className="mt-2 text-[10px] font-mono text-gray-600">
          {data.dataSource} · latest {data.latestDate}
        </p>
      </div>
    </div>
  );
}
