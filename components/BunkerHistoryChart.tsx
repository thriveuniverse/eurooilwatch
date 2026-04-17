'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

interface BunkerHistoryEntry {
  date: string;
  brentBasis: number;
  rotterdam: { vlsfo: number; mgo: number };
  fujairah:  { vlsfo: number; mgo: number };
  singapore: { vlsfo: number; mgo: number };
}

function formatDate(date: string): string {
  const d = new Date(date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

function BunkerTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-oil-900 border border-oil-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-bold">${p.value}/mt</span>
        </p>
      ))}
    </div>
  );
}

export default function BunkerHistoryChart({ entries }: { entries: BunkerHistoryEntry[] }) {
  if (!entries || entries.length < 2) return null;

  const chartData = entries.map(e => ({
    date: e.date,
    'Rotterdam VLSFO': e.rotterdam.vlsfo,
    'Fujairah VLSFO':  e.fujairah.vlsfo,
    'Rotterdam MGO':   e.rotterdam.mgo,
  }));

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Bunker Prices — Historical Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" domain={['dataMin - 20', 'dataMax + 20']} tickFormatter={(v) => `$${v}`} width={44} />
            <Tooltip content={<BunkerTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Line type="monotone" dataKey="Rotterdam VLSFO" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            <Line type="monotone" dataKey="Fujairah VLSFO"  stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            <Line type="monotone" dataKey="Rotterdam MGO"   stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 3" activeDot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-gray-500">Estimated from Brent crude benchmark. VLSFO = IMO 2020 low-sulphur fuel oil. MGO = marine gas oil.</p>
    </div>
  );
}
