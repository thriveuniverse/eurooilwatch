'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

interface PriceEntry { date: string; petrolEur: number; dieselEur: number; }

function formatDate(date: string): string {
  const d = new Date(date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-oil-900 border border-oil-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-bold">€{p.value.toFixed(3)}/L</span>
        </p>
      ))}
    </div>
  );
}

export default function EUPriceHistoryChart({ entries }: { entries: PriceEntry[] }) {
  if (!entries || entries.length < 2) return null;

  const chartData = entries.map(e => ({ ...e, dateLabel: formatDate(e.date) }));

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">EU Average Pump Prices — Weekly Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" domain={['dataMin - 0.05', 'dataMax + 0.05']} tickFormatter={(v) => `€${v.toFixed(2)}`} width={48} />
            <Tooltip content={<PriceTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            <Line type="monotone" dataKey="petrolEur" name="Petrol" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="dieselEur" name="Diesel" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-gray-500">EU 27-country average. Source: EC Weekly Oil Bulletin. Includes taxes.</p>
    </div>
  );
}
