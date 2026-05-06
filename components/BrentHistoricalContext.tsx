'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

export interface BrentDailyEntry { date: string; priceUsd: number; }

export interface BrentHistoricalProps {
  entries: BrentDailyEntry[];          // full daily series, sorted ascending
  allTimeHigh: { date: string; priceUsd: number };
  allTimeLow:  { date: string; priceUsd: number };
  livePriceUsd?: number;               // optional override from live feed (Stooq)
}

type Range = '1Y' | '5Y' | '10Y' | '20Y' | 'ALL';

const RANGE_DAYS: Record<Range, number | null> = {
  '1Y':  365,
  '5Y':  365 * 5,
  '10Y': 365 * 10,
  '20Y': 365 * 20,
  'ALL': null,
};

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function formatAxis(iso: string): string {
  const [y, m] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-oil-900 border border-oil-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-400 mb-1">{formatLongDate(p.payload.date)}</p>
      <p className="text-amber-400">Brent: <span className="font-mono font-bold">${p.value.toFixed(2)}/bbl</span></p>
    </div>
  );
}

export default function BrentHistoricalContext({
  entries, allTimeHigh, allTimeLow, livePriceUsd,
}: BrentHistoricalProps) {
  const [range, setRange] = useState<Range>('5Y');

  const stats = useMemo(() => {
    if (!entries.length) return null;
    const latest = entries[entries.length - 1];
    const current = livePriceUsd ?? latest.priceUsd;

    // Percentile of current price across full series
    const sorted = entries.map(e => e.priceUsd).slice().sort((a, b) => a - b);
    const rank = sorted.findIndex(p => p >= current);
    const percentile = rank < 0 ? 100 : Math.round((rank / sorted.length) * 100);

    // 5-year average (last ~1300 daily prints)
    const fiveYearAgo = new Date();
    fiveYearAgo.setFullYear(fiveYearAgo.getFullYear() - 5);
    const fyCutoff = fiveYearAgo.toISOString().slice(0, 10);
    const fyEntries = entries.filter(e => e.date >= fyCutoff);
    const fyAvg = fyEntries.length
      ? fyEntries.reduce((s, e) => s + e.priceUsd, 0) / fyEntries.length
      : null;

    // Days above $100 in calendar year of latest record
    const latestYear = latest.date.slice(0, 4);
    const ytdEntries = entries.filter(e => e.date.startsWith(latestYear));
    const daysAbove100Ytd = ytdEntries.filter(e => e.priceUsd >= 100).length;

    // Days above $100 in 2008 (the previous comparable spike year)
    const days2008Above100 = entries.filter(e => e.date.startsWith('2008') && e.priceUsd >= 100).length;
    // Days above $100 in 2022 (Ukraine)
    const days2022Above100 = entries.filter(e => e.date.startsWith('2022') && e.priceUsd >= 100).length;

    return {
      current,
      latestDate: latest.date,
      percentile,
      fiveYearAvg: fyAvg,
      daysAbove100Ytd,
      latestYear,
      days2008Above100,
      days2022Above100,
    };
  }, [entries, livePriceUsd]);

  const chartData = useMemo(() => {
    if (!entries.length) return [];
    const days = RANGE_DAYS[range];
    if (days === null) {
      // Downsample to weekly for All view (else 9,879 daily points hammer mobile)
      return entries.filter((_, i) => i % 7 === 0);
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    const slice = entries.filter(e => e.date >= cutoffIso);
    // Lightly downsample 10Y / 20Y views for chart smoothness
    if (days >= 365 * 10) return slice.filter((_, i) => i % 3 === 0);
    return slice;
  }, [entries, range]);

  if (!stats) return null;

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5 space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-white">Brent in Historical Context — since 1987</h3>
        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
          EIA daily spot · {entries.length.toLocaleString()} prints
        </span>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Current"
          value={`$${stats.current.toFixed(2)}`}
          sub={`${stats.percentile}th pctile vs 1987→now`}
          accent="amber"
        />
        <Stat
          label="All-time high"
          value={`$${allTimeHigh.priceUsd.toFixed(2)}`}
          sub={formatLongDate(allTimeHigh.date)}
        />
        <Stat
          label="5-year avg"
          value={stats.fiveYearAvg ? `$${stats.fiveYearAvg.toFixed(0)}` : '—'}
          sub="rolling daily"
        />
        <Stat
          label={`Days >$100 in ${stats.latestYear}`}
          value={String(stats.daysAbove100Ytd)}
          sub={`vs ${stats.days2008Above100} in 2008 · ${stats.days2022Above100} in 2022`}
        />
      </div>

      {/* Range selector */}
      <div className="flex gap-1 flex-wrap">
        {(Object.keys(RANGE_DAYS) as Range[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 text-[11px] font-mono rounded border transition ${
              range === r
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                : 'border-oil-700 bg-oil-900/50 text-gray-400 hover:border-oil-600 hover:text-gray-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" />
            <XAxis
              dataKey="date"
              tickFormatter={formatAxis}
              tick={{ fill: '#64748b', fontSize: 11 }}
              stroke="#1a3a5c"
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              stroke="#1a3a5c"
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(v) => `$${v}`}
              width={45}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={100}
              stroke="#dc2626"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{ value: '$100', position: 'right', fill: '#dc2626', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="priceUsd"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        Source: U.S. Energy Information Administration — Europe Brent Spot Price FOB daily series (RBRTE).
        Live current-price card on this site uses Stooq front-month futures, which can diverge from EIA spot by
        $1–3 in normal markets and considerably more during volatility. EIA spot is the more authoritative reference
        for analytical work.{' '}
        <a
          href="https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RBRTE&f=D"
          target="_blank"
          rel="noopener"
          className="text-amber-400 hover:underline"
        >
          eia.gov ↗
        </a>
      </p>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: 'amber' }) {
  return (
    <div className="rounded-md border border-oil-800 bg-oil-950/40 px-3 py-2.5">
      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`font-mono font-semibold text-base ${accent === 'amber' ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{sub}</p>
    </div>
  );
}
