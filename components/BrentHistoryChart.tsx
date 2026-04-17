'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface BrentEntry { date: string; priceUsd: number; priceEur: number; }

function formatDate(date: string): string {
  const d = new Date(date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

function BrentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const usd = payload.find((p: any) => p.dataKey === 'priceUsd');
  const eur = payload.find((p: any) => p.dataKey === 'priceEur');
  return (
    <div className="bg-oil-900 border border-oil-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {usd && <p className="text-amber-400">USD: <span className="font-mono font-bold">${usd.value.toFixed(2)}/bbl</span></p>}
      {eur && <p className="text-blue-400">EUR: <span className="font-mono font-bold">€{eur.value.toFixed(2)}/bbl</span></p>}
    </div>
  );
}

export default function BrentHistoryChart({ entries }: { entries: BrentEntry[] }) {
  if (!entries || entries.length < 2) return null;

  const chartData = entries.map(e => ({ ...e, dateLabel: formatDate(e.date) }));
  const avg = Math.round(entries.reduce((s, e) => s + e.priceUsd, 0) / entries.length);

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Brent Crude — 52-Week Trend</h3>
        <span className="text-xs text-gray-500 font-mono">avg ${avg}/bbl</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(v) => `$${v}`} width={40} />
            <Tooltip content={<BrentTooltip />} />
            <ReferenceLine y={avg} stroke="#64748b" strokeDasharray="4 3" strokeWidth={1}
              label={{ value: `avg $${avg}`, position: 'right', fill: '#64748b', fontSize: 10 }} />
            <Line type="monotone" dataKey="priceUsd" name="Brent USD" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-gray-500">Source: Yahoo Finance (BZ=F). Weekly close prices.</p>
    </div>
  );
}
