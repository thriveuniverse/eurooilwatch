interface SeaStateChokepoint {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  context: string;
  waveHeightM: number | null;
  wavePeriodS: number | null;
  waveDirectionDeg: number | null;
  windSpeedMs: number | null;
  windGustsMs: number | null;
  windDirectionDeg: number | null;
  risk: 'calm' | 'moderate' | 'rough' | 'dangerous';
  observedAt: string | null;
}

export interface SeaStateData {
  lastUpdated: string;
  dataSource: string;
  sourceUrl: string;
  methodology: string;
  chokepoints: SeaStateChokepoint[];
}

const RISK_STYLES = {
  calm:      { dot: 'bg-emerald-500', border: 'border-oil-800',     bg: 'bg-oil-900/30',    label: 'Calm',      labelColor: 'text-emerald-400' },
  moderate:  { dot: 'bg-amber-400',   border: 'border-amber-700/40', bg: 'bg-amber-950/15', label: 'Moderate',  labelColor: 'text-amber-300' },
  rough:     { dot: 'bg-orange-500',  border: 'border-orange-700/50', bg: 'bg-orange-950/20', label: 'Rough',     labelColor: 'text-orange-300' },
  dangerous: { dot: 'bg-red-500',     border: 'border-red-700/60',  bg: 'bg-red-950/25',    label: 'Dangerous', labelColor: 'text-red-300' },
} as const;

function msToKnots(ms: number): number {
  return ms * 1.94384;
}

function compass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function formatObserved(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', timeZone: 'UTC',
  }) + ' UTC';
}

export default function SeaStatePanel({ data, only }: { data: SeaStateData; only?: string[] }) {
  const list = only?.length
    ? only.map(id => data.chokepoints.find(c => c.id === id)).filter((c): c is SeaStateChokepoint => !!c)
    : data.chokepoints;

  if (!list.length) return null;

  return (
    <section className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
            Live Sea State — Oil Shipping Chokepoints
          </h2>
          <p className="text-[10px] text-gray-600 mt-0.5">
            Significant wave height, wave period, and 10-metre wind speed. Updated {formatObserved(data.lastUpdated)}.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {(['calm','moderate','rough','dangerous'] as const).map(r => (
            <span key={r} className="flex items-center gap-1 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${RISK_STYLES[r].dot}`} />
              <span className={RISK_STYLES[r].labelColor}>{RISK_STYLES[r].label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-oil-800/40">
        {list.map(c => {
          const style = RISK_STYLES[c.risk];
          const wave = c.waveHeightM != null ? c.waveHeightM.toFixed(2) : '—';
          const period = c.wavePeriodS != null ? c.wavePeriodS.toFixed(1) : '—';
          const windKt = c.windSpeedMs != null ? Math.round(msToKnots(c.windSpeedMs)) : null;
          const gustKt = c.windGustsMs != null ? Math.round(msToKnots(c.windGustsMs)) : null;
          const windDir = c.windDirectionDeg != null ? compass(c.windDirectionDeg) : '';
          return (
            <div key={c.id} className={`px-4 py-3.5 ${style.bg} flex flex-col gap-2`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{c.region}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${style.labelColor}`}>
                    {style.label}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <div>
                  <p className="text-2xl font-mono font-bold text-white leading-none">{wave}<span className="text-sm text-gray-500 ml-0.5">m</span></p>
                  <p className="text-[10px] text-gray-500 mt-0.5">wave height</p>
                </div>
                <div>
                  <p className="text-sm font-mono text-gray-300">{period}<span className="text-[10px] text-gray-500 ml-0.5">s</span></p>
                  <p className="text-[10px] text-gray-500">period</p>
                </div>
                <div>
                  <p className="text-sm font-mono text-gray-300">
                    {windKt != null ? windKt : '—'}
                    <span className="text-[10px] text-gray-500 ml-0.5">kt</span>
                    {gustKt != null && gustKt > (windKt ?? 0) && (
                      <span className="text-[10px] text-gray-500"> · g{gustKt}</span>
                    )}
                    {windDir && <span className="text-[10px] text-gray-500 ml-1">{windDir}</span>}
                  </p>
                  <p className="text-[10px] text-gray-500">wind</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-950/40">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Source: {data.dataSource}.{' '}
          Risk band uses Douglas-style sea-state (wave height) and Beaufort-style wind thresholds; whichever is worse sets the band.
          {' '}
          <a href={data.sourceUrl} target="_blank" rel="noopener" className="text-oil-400 hover:underline">
            open-meteo.com ↗
          </a>
        </p>
      </div>
    </section>
  );
}
