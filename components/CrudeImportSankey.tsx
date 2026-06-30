'use client';

// EU-27 crude oil import origins — Sankey (suppliers → EU) on real Eurostat
// NRG_TI_OIL data. Spine is volume (Mt); mb/d is derived with the documented
// factor in data.meta. "Other" is computed = EU total minus the listed partners.
import { useEffect, useMemo, useState } from 'react';
import type { EuCrudeImports } from '@/lib/data';

const REGION_COLOR: Record<string, string> = {
  'Europe (non-EU)': '#34d399',
  'N. America': '#38bdf8',
  Russia: '#f87171',
  'Caspian / C. Asia': '#c084fc',
  'Middle East': '#fbbf24',
  Africa: '#facc15',
  'S. America': '#2dd4bf',
  Other: '#94a3b8',
};
const REGION_ORDER = [
  'Europe (non-EU)', 'N. America', 'Russia', 'Caspian / C. Asia',
  'Middle East', 'Africa', 'S. America', 'Other',
];

type Group = 'country' | 'region';
type Unit = 'mbd' | 'mt';
interface Node { name: string; region: string; mt: number }

export default function CrudeImportSankey({ data }: { data: EuCrudeImports }) {
  const years = data.years;
  const [yi, setYi] = useState(years.length - 1);
  const [group, setGroup] = useState<Group>('country');
  const [unit, setUnit] = useState<Unit>('mbd');
  const [hover, setHover] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const factor = data.meta.conversion_factor_bbl_per_tonne;
  const year = years[yi];
  const conv = (mt: number) => (unit === 'mbd' ? (mt * factor) / 365 : mt);
  const fmt = (mt: number) => (unit === 'mbd' ? conv(mt).toFixed(2) : conv(mt).toFixed(1));
  const unitLbl = unit === 'mbd' ? 'mb/d' : 'Mt';

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setYi((i) => (i >= years.length - 1 ? 0 : i + 1)), 700);
    return () => clearInterval(t);
  }, [playing, years.length]);

  const { nodes, total } = useMemo(() => {
    const items: Node[] = Object.values(data.partners)
      .map((p) => ({ name: p.name, region: p.region, mt: p.mt[year] || 0 }))
      .filter((d) => d.mt > 0);
    const tot = data.total_mt[year] || items.reduce((a, d) => a + d.mt, 0);
    let ns: Node[];
    if (group === 'region') {
      const m: Record<string, number> = {};
      items.forEach((d) => { m[d.region] = (m[d.region] || 0) + d.mt; });
      const listed = Object.values(m).reduce((a, b) => a + b, 0);
      if (tot - listed > 0.05) m.Other = (m.Other || 0) + (tot - listed);
      ns = Object.entries(m)
        .map(([r, mt]) => ({ name: r, region: r, mt }))
        .sort((a, b) => REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region));
    } else {
      const sorted = [...items].sort((a, b) => b.mt - a.mt);
      const top = sorted.slice(0, 10);
      const rest = tot - top.reduce((a, d) => a + d.mt, 0);
      ns = top.slice();
      if (rest > 0.05) ns.push({ name: 'Other', region: 'Other', mt: rest });
    }
    return { nodes: ns, total: tot };
  }, [data, year, group]);

  // ── layout (viewBox units) ──
  const W = 1000, H = 520, pad = 22, xL = 160, wL = 11, xR = 900, wR = 13, gap = 8;
  const n = nodes.length;
  const avail = H - 2 * pad - (n - 1) * gap;
  const scale = avail / (total || 1);
  const euH = total * scale, euY0 = (H - euH) / 2;
  let ly = pad, ec = euY0;
  const laid = nodes.map((d) => {
    const h = d.mt * scale;
    const o = { ...d, h, ly0: ly, ly1: ly + h, ey0: ec, ey1: ec + h };
    ly += h + gap; ec += h;
    return o;
  });
  const mx = Math.max(...nodes.map((d) => d.mt), 0.01);

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">Where Europe&apos;s crude comes from</h2>
        <span className="text-[11px] text-gray-500">EU-27 crude oil imports by origin · Eurostat</span>
      </div>
      <p className="mt-1 text-xs text-gray-400 max-w-2xl">
        Which barrels actually feed Europe, by supplier country. Drag the year slider to watch Russia&apos;s
        share collapse after the Dec-2022 seaborne ban and Feb-2023 products embargo, with the US, Norway and
        Kazakhstan filling the gap.
      </p>

      {/* controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Toggle value={group} onChange={(v) => setGroup(v as Group)} options={[['country', 'by country'], ['region', 'by region']]} />
        <Toggle value={unit} onChange={(v) => setUnit(v as Unit)} options={[['mbd', 'mb/d'], ['mt', 'Mt/yr']]} />
        <span className="flex-1" />
        <span className="font-mono text-lg font-bold text-white tabular-nums">{year}</span>
      </div>

      {/* sankey */}
      <div className="mt-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* ribbons */}
          {laid.map((d, i) => {
            const c = REGION_COLOR[d.region] || REGION_COLOR.Other;
            const op = hover == null ? 0.55 : hover === i ? 0.95 : 0.1;
            const x1 = xL + wL, x2 = xR, cx = (x1 + x2) / 2;
            const dd =
              `M ${x1} ${d.ly0.toFixed(1)} C ${cx} ${d.ly0.toFixed(1)} ${cx} ${d.ey0.toFixed(1)} ${x2} ${d.ey0.toFixed(1)} ` +
              `L ${x2} ${d.ey1.toFixed(1)} C ${cx} ${d.ey1.toFixed(1)} ${cx} ${d.ly1.toFixed(1)} ${x1} ${d.ly1.toFixed(1)} Z`;
            return (
              <path key={i} d={dd} fill={c} opacity={op}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                style={{ transition: 'opacity .15s', cursor: 'pointer' }} />
            );
          })}
          {/* left supplier nodes + labels */}
          {laid.map((d, i) => {
            const c = REGION_COLOR[d.region] || REGION_COLOR.Other;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
                <rect x={xL} y={d.ly0} width={wL} height={Math.max(1.5, d.h)} fill={c} />
                <text x={xL - 8} y={(d.ly0 + d.ly1) / 2} textAnchor="end" dominantBaseline="middle"
                  fontSize={13} fill={hover === i ? '#fff' : '#cbd5e1'} fontFamily="ui-monospace, monospace">
                  {d.name}
                </text>
              </g>
            );
          })}
          {/* EU sink */}
          <rect x={xR} y={euY0} width={wR} height={euH} fill="#0f1a14" stroke={REGION_COLOR['Europe (non-EU)']} strokeWidth={1.4} />
          <text x={xR + wR + 7} y={euY0 + euH / 2 - 7} textAnchor="start" fontSize={14} fill="#34d399" fontWeight={700} fontFamily="ui-monospace, monospace">EU-27</text>
          <text x={xR + wR + 7} y={euY0 + euH / 2 + 11} textAnchor="start" fontSize={11} fill="#94a3b8" fontFamily="ui-monospace, monospace">{fmt(total)} {unitLbl}</text>
        </svg>
      </div>

      {/* year scrubber */}
      <div className="mt-1 flex items-center gap-3">
        <button onClick={() => setPlaying((p) => !p)}
          className="text-xs font-mono px-2.5 py-1 rounded border border-oil-700 text-gray-300 hover:bg-oil-800/40 transition">
          {playing ? '❚❚ pause' : '▶ play'}
        </button>
        <span className="text-[10px] text-gray-600 font-mono">{years[0]}</span>
        <input type="range" min={0} max={years.length - 1} value={yi}
          onChange={(e) => setYi(+e.target.value)} className="flex-1 accent-emerald-400" />
        <span className="text-[10px] text-gray-600 font-mono">{years[years.length - 1]}</span>
      </div>

      {/* breakdown */}
      <h3 className="mt-4 text-[10px] font-mono font-semibold tracking-[0.2em] text-oil-400 uppercase">
        {group === 'region' ? 'By region' : 'Top suppliers'} · {year}
      </h3>
      <div className="mt-1 divide-y divide-oil-800/60">
        {laid.map((d, i) => {
          const c = REGION_COLOR[d.region] || REGION_COLOR.Other;
          return (
            <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              className={`flex items-center gap-3 py-1.5 ${hover === i ? 'bg-oil-800/30' : ''}`}>
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c }} />
              <span className="text-xs text-gray-200 min-w-[120px] flex-1 truncate">{d.name}</span>
              <div className="hidden sm:block flex-1 h-1.5 bg-oil-950/60 rounded-sm overflow-hidden max-w-[180px]">
                <div className="h-full rounded-sm" style={{ width: `${(d.mt / mx) * 100}%`, background: c }} />
              </div>
              <span className="font-mono text-xs text-white w-[58px] text-right tabular-nums">{fmt(d.mt)}</span>
              <span className="font-mono text-[11px] text-gray-500 w-[40px] text-right tabular-nums">{((d.mt / total) * 100).toFixed(0)}%</span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        Source:{' '}
        <a href={data.meta.source_url} target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">
          Eurostat — NRG_TI_OIL
        </a>{' '}
        (crude oil, reporter EU27_2020), retrieved {data.meta.retrieved}. Spine is volume (Mt);{' '}
        <span className="text-gray-400">mb/d is derived</span> as Mt × {factor} ÷ 365.
        “Other” is computed (EU total minus the listed partners).
      </p>
    </div>
  );
}

function Toggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex border border-oil-700 rounded overflow-hidden">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`text-[11px] font-mono px-2.5 py-1 border-r border-oil-700 last:border-r-0 transition ${
            value === v ? 'bg-oil-800 text-emerald-300' : 'text-gray-500 hover:text-gray-300'
          }`}>
          {label}
        </button>
      ))}
    </div>
  );
}
