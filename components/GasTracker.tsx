'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

interface HistoryPoint {
  date: string;
  ttfEurMwh: number;
  hhUsdMmbtu: number;
  ttfUsdMmbtu: number;
  ratio: number;
}

interface StoragePoint {
  code: string;
  name: string;
  fullPct: number;
  gasInStorageTwh: number;
  workingGasVolumeTwh: number;
  trend: number;
  asOf: string;
}

export interface GasData {
  lastUpdated: string;
  eurUsd: number;
  ttf: {
    priceEurMwh: number;
    changePct: number;
    weekHigh: number;
    weekLow: number;
    source: string;
  };
  hh: {
    priceUsdMmbtu: number;
    changePct: number;
    weekHigh: number;
    weekLow: number;
    source: string;
  };
  spread: {
    ttfUsdMmbtu: number;
    spreadUsdMmbtu: number;
    ratio: number;
  };
  history: HistoryPoint[];
  storage: {
    asOf: string;
    eu: StoragePoint;
    countries: StoragePoint[];
    target: { fullPct: number; deadline: string; basis: string };
  } | null;
  methodology: string;
}

function storageColor(fullPct: number): string {
  if (fullPct >= 70) return 'text-emerald-400';
  if (fullPct >= 50) return 'text-amber-400';
  if (fullPct >= 30) return 'text-orange-400';
  return 'text-red-400';
}

function storageBar(fullPct: number): string {
  if (fullPct >= 70) return 'bg-emerald-500';
  if (fullPct >= 50) return 'bg-amber-500';
  if (fullPct >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

function formatAxis(iso: string): string {
  const [, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as HistoryPoint;
  if (!d) return null;
  return (
    <div className="bg-oil-900 border border-oil-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-400 mb-1">{formatLongDate(d.date)}</p>
      <p className="text-amber-400">TTF: <span className="font-mono font-bold">€{d.ttfEurMwh}/MWh</span> <span className="text-gray-500">(${d.ttfUsdMmbtu}/MMBtu)</span></p>
      <p className="text-blue-400">Henry Hub: <span className="font-mono font-bold">${d.hhUsdMmbtu}/MMBtu</span></p>
      <p className="text-rose-400 mt-0.5">Ratio: <span className="font-mono font-bold">{d.ratio}×</span></p>
    </div>
  );
}

export default function GasTracker({ data }: { data: GasData }) {
  if (!data) return null;

  const ratioStyle =
    data.spread.ratio >= 5  ? 'text-red-400'
    : data.spread.ratio >= 3 ? 'text-orange-400'
    : data.spread.ratio >= 2 ? 'text-amber-400'
    : 'text-emerald-400';

  return (
    <section className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          European Gas — TTF vs Henry Hub
        </h2>
        <span className="text-[10px] font-mono text-gray-600">
          Updated {new Date(data.lastUpdated).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
        </span>
      </div>

      {/* Headline stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-oil-800/40">
        <Stat
          label="Dutch TTF (front-month)"
          value={`€${data.ttf.priceEurMwh.toFixed(2)}`}
          unit="/MWh"
          sub={`${data.ttf.changePct >= 0 ? '▲' : '▼'} ${Math.abs(data.ttf.changePct).toFixed(2)}% · 7d high €${data.ttf.weekHigh}`}
          subColor={data.ttf.changePct >= 0 ? 'text-red-400' : 'text-emerald-400'}
        />
        <Stat
          label="Henry Hub (front-month)"
          value={`$${data.hh.priceUsdMmbtu.toFixed(3)}`}
          unit="/MMBtu"
          sub={`${data.hh.changePct >= 0 ? '▲' : '▼'} ${Math.abs(data.hh.changePct).toFixed(2)}% · 7d high $${data.hh.weekHigh}`}
          subColor={data.hh.changePct >= 0 ? 'text-red-400' : 'text-emerald-400'}
        />
        <Stat
          label="Europe pays vs US"
          value={`${data.spread.ratio.toFixed(2)}×`}
          unit=""
          valueColor={ratioStyle}
          sub={`spread $${data.spread.spreadUsdMmbtu.toFixed(2)}/MMBtu · TTF in USD: $${data.spread.ttfUsdMmbtu.toFixed(2)}`}
          subColor="text-gray-500"
        />
      </div>

      {/* Spread interpretation */}
      <div className="px-5 py-3 border-t border-oil-800/40 bg-oil-950/30">
        <p className="text-xs text-gray-400 leading-relaxed">
          Europe is currently paying{' '}
          <strong className={ratioStyle}>{data.spread.ratio.toFixed(2)}×</strong>{' '}
          the U.S. price for the same unit of natural gas energy.{' '}
          {data.spread.ratio >= 4
            ? 'A wide spread on this scale is a direct competitiveness drag for European chemical, fertiliser and steel producers, and a structural pull for U.S. LNG export volumes.'
            : data.spread.ratio >= 2.5
            ? 'A spread above ~2.5× is a meaningful drag on European industrial competitiveness and supports continued U.S. LNG export economics.'
            : 'Spread is in the historically normal range for transatlantic gas; LNG export economics remain attractive but not exceptional.'}
        </p>
      </div>

      {/* Storage — AGSI/GIE */}
      {data.storage && (
        <div className="px-5 py-4 border-t border-oil-800/40">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
              EU Gas Storage — AGSI/GIE · gas day {data.storage.asOf}
            </p>
            <p className="text-[10px] text-gray-600">
              EU regulation target: <span className="text-gray-400">{data.storage.target.fullPct}% by {data.storage.target.deadline}</span>
            </p>
          </div>

          {/* EU aggregate headline */}
          <div className="rounded-md border border-oil-800 bg-oil-950/50 px-4 py-3 mb-3">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">EU aggregate</p>
                <p className="mt-0.5">
                  <span className={`text-2xl font-mono font-bold ${storageColor(data.storage.eu.fullPct)}`}>
                    {data.storage.eu.fullPct.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    · {data.storage.eu.gasInStorageTwh.toFixed(0)} TWh of {data.storage.eu.workingGasVolumeTwh.toFixed(0)} TWh capacity
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500">Gap to {data.storage.target.fullPct}% target</p>
                <p className="text-base font-mono font-semibold text-gray-200">
                  {(data.storage.target.fullPct - data.storage.eu.fullPct).toFixed(1)} pts
                </p>
              </div>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-oil-800 overflow-hidden">
              <div
                className={`h-full ${storageBar(data.storage.eu.fullPct)}`}
                style={{ width: `${Math.min(100, data.storage.eu.fullPct)}%` }}
              />
            </div>
          </div>

          {/* Per-country grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.storage.countries.map(c => (
              <div key={c.code} className="rounded-md border border-oil-800 bg-oil-950/30 px-3 py-2">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-gray-300 truncate">{c.name}</span>
                  <span className={`text-sm font-mono font-bold ${storageColor(c.fullPct)}`}>
                    {c.fullPct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-oil-800 overflow-hidden">
                  <div
                    className={`h-full ${storageBar(c.fullPct)}`}
                    style={{ width: `${Math.min(100, c.fullPct)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1">
                  {c.gasInStorageTwh.toFixed(1)} TWh stored
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History chart */}
      {data.history.length > 1 && (
        <div className="px-5 py-4 border-t border-oil-800/40">
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">
            Last {data.history.length} sessions — both benchmarks normalised to USD/MMBtu
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" />
                <XAxis dataKey="date" tickFormatter={formatAxis} tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" minTickGap={30} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" tickFormatter={(v) => `$${v}`} width={40} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="line" />
                <Line type="monotone" name="TTF (USD/MMBtu)" dataKey="ttfUsdMmbtu" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" name="Henry Hub" dataKey="hhUsdMmbtu" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-950/40">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Sources: Yahoo Finance — TTF=F (Dutch TTF) and NG=F (Henry Hub) front-month futures.
          TTF converted to USD/MMBtu using EUR/USD ≈ {data.eurUsd.toFixed(4)} and 1 MWh = 3.412 MMBtu.
          {data.storage && ' Storage levels via AGSI/GIE — % full = gasInStorage ÷ workingGasVolume per the EU Storage Regulation framework.'}
          {' '}US LNG export-cargo counts are planned for v2.
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value, unit, sub, valueColor = 'text-white', subColor = 'text-gray-500' }:
  { label: string; value: string; unit: string; sub: string; valueColor?: string; subColor?: string }) {
  return (
    <div className="bg-oil-900/30 px-5 py-4">
      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">{label}</p>
      <p className={`text-2xl font-mono font-bold leading-none ${valueColor}`}>
        {value}<span className="text-sm text-gray-500 ml-0.5">{unit}</span>
      </p>
      <p className={`text-[10px] mt-1.5 ${subColor}`}>{sub}</p>
    </div>
  );
}
