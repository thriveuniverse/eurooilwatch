// Europe Replacement Barrel Tracker (EuroOilWatch only) — aggregates the European
// ports from PortWatch into a Europe-wide tanker import/export read vs 2023, plus a
// regional rollup. NOTE: PortWatch gives no origin or grade — this shows WHERE tankers
// are arriving, not confirmed replacement of specific Middle East barrels.
import type { PortFlowData } from './PortFlowPanel';

const GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Northwest Europe', keys: ['rotterdam', 'antwerp'] },
  { label: 'Baltic & North Sea', keys: ['gdansk', 'primorsk'] },
  { label: 'Mediterranean', keys: ['trieste', 'augusta', 'sines', 'algeciras', 'piraeus'] },
  { label: 'Black Sea', keys: ['novorossiysk'] },
];

const kt = (t: number) => Math.round(t / 1000).toLocaleString();
const sevTxt = (pct: number | null) =>
  pct == null ? 'text-gray-400' : pct < 50 ? 'text-red-400' : pct < 90 ? 'text-orange-300' : pct <= 120 ? 'text-emerald-300' : 'text-sky-300';

export default function EuropeBarrelTracker({ data }: { data: PortFlowData }) {
  if (!data?.ports?.length) return null;
  type P = PortFlowData['ports'][number] & { baseImp?: number | null; baseExp?: number | null };
  const byKey = new Map<string, P>(data.ports.map((p) => [p.key, p as P]));

  const agg = (keys: string[]) => {
    const ps = keys.map((k) => byKey.get(k)).filter(Boolean) as P[];
    const s = (f: 'imp7' | 'exp7' | 'baseImp' | 'baseExp') => ps.reduce((a, b) => a + ((b[f] as number) || 0), 0);
    const imp = s('imp7'), exp = s('exp7'), bi = s('baseImp'), be = s('baseExp');
    return {
      imp, exp,
      impPct: bi > 0 ? Math.round((imp / bi) * 100) : null,
      expPct: be > 0 ? Math.round((exp / be) * 100) : null,
    };
  };

  const allKeys = GROUPS.flatMap((g) => g.keys);
  const eu = agg(allKeys);
  const net = eu.imp - eu.exp;
  const latest = data.ports.map((r) => r.latestDate).sort().at(-1);

  const Tile = ({ label, value, sub, cls }: { label: string; value: string; sub: string; cls?: string }) => (
    <div className="flex-1 min-w-[120px] rounded-md border border-oil-800 bg-oil-950/40 px-3 py-2.5">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500">{label}</div>
      <div className={`text-xl font-bold ${cls || 'text-white'}`}>{value}</div>
      <div className="text-[11px] text-gray-500">{sub}</div>
    </div>
  );

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">Europe Replacement Barrel Tracker</h2>
        <span className="text-[11px] text-gray-500">Tanker tonnage vs 2023 · IMF PortWatch (AIS estimates)</span>
      </div>
      <p className="mt-1 text-xs text-gray-400 max-w-2xl">
        Where Europe is taking crude and product by sea — total tanker tonnage arriving and leaving, against the 2023
        norm. A read on whether Europe is sourcing enough volume, not which barrels.
      </p>

      <div className="mt-4 flex gap-3 flex-wrap">
        <Tile label="Tanker imports" value={`${kt(eu.imp)} kt/d`} sub={eu.impPct != null ? `${eu.impPct}% of 2023` : '—'} cls={sevTxt(eu.impPct)} />
        <Tile label="Tanker exports" value={`${kt(eu.exp)} kt/d`} sub={eu.expPct != null ? `${eu.expPct}% of 2023` : '—'} cls={sevTxt(eu.expPct)} />
        <Tile
          label="Net balance"
          value={`${net >= 0 ? 'net import' : 'net export'}`}
          sub={`${kt(Math.abs(net))} kt/d`}
          cls={net >= 0 ? 'text-sky-300' : 'text-orange-300'}
        />
      </div>

      <h3 className="mt-5 text-[10px] font-mono font-semibold tracking-[0.2em] text-oil-400 uppercase">By region</h3>
      <div className="mt-1 divide-y divide-oil-800/70">
        {GROUPS.map((g) => {
          const a = agg(g.keys);
          return (
            <div key={g.label} className="flex items-center gap-3 py-2.5">
              <div className="min-w-[150px] flex-1">
                <div className="text-sm text-white">{g.label}</div>
                <div className="text-[11px] text-gray-500">↓ {kt(a.imp)} in · ↑ {kt(a.exp)} out kt/d</div>
              </div>
              <div className="text-right min-w-[92px]">
                <div className={`text-lg font-bold ${sevTxt(a.impPct)}`}>{a.impPct != null ? `${a.impPct}%` : '—'}</div>
                <div className="text-[10px] text-gray-500 leading-tight">imports vs 2023</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        Latest data {latest}. Trailing 7-day tanker tonnage vs the {data.baselineYear} daily average. Source:{' '}
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">
          IMF PortWatch
        </a>{' '}
        — AIS estimates. PortWatch gives no origin or grade, so this shows <span className="text-gray-400">where tankers
        are arriving</span>, not confirmed replacement of specific Middle East barrels.
      </p>
    </div>
  );
}
