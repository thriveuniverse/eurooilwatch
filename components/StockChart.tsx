'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

interface DataPoint {
  period: string;
  petrolDays: number | null;
  dieselDays: number | null;
  jetDays: number | null;
}

interface StockChartProps {
  data: DataPoint[];
  title: string;
  showMinimumLine?: boolean;
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = parseInt(month);
  return `${months[m]} '${year.slice(2)}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-oil-900 border border-oil-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-400 mb-1">{formatPeriod(label)}</p>
      {payload.map((entry: any) => (
        entry.value !== null && (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: <span className="font-mono font-bold">{entry.value}d</span>
          </p>
        )
      ))}
      <p className="text-gray-500 mt-1 border-t border-oil-700 pt-1">
        Minimum: 90 days
      </p>
    </div>
  );
}

export default function StockChart({ data, title, showMinimumLine = true }: StockChartProps) {
  // Filter out empty data points at the start
  const chartData = data
    .filter(d => d.petrolDays !== null || d.dieselDays !== null || d.jetDays !== null)
    .map(d => ({
      ...d,
      periodLabel: formatPeriod(d.period),
    }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-8 text-center text-gray-500">
        <p>No historical data available yet</p>
      </div>
    );
  }

  // Check which fuels have data
  const hasPetrol = chartData.some(d => d.petrolDays !== null);
  const hasDiesel = chartData.some(d => d.dieselDays !== null);
  const hasJet = chartData.some(d => d.jetDays !== null);

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" />
            <XAxis
              dataKey="period"
              tickFormatter={formatPeriod}
              tick={{ fill: '#64748b', fontSize: 11 }}
              stroke="#1a3a5c"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              stroke="#1a3a5c"
              domain={[0, 'auto']}
              tickFormatter={(v) => `${v}d`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
            />
            {showMinimumLine && (
              <ReferenceLine
                y={90}
                stroke="#ef4444"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: '90-day minimum',
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 10,
                }}
              />
            )}
            {hasPetrol && (
              <Line
                type="monotone"
                dataKey="petrolDays"
                name="Petrol"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#22c55e' }}
                connectNulls
              />
            )}
            {hasDiesel && (
              <Line
                type="monotone"
                dataKey="dieselDays"
                name="Diesel"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#f59e0b' }}
                connectNulls
              />
            )}
            {hasJet && (
              <Line
                type="monotone"
                dataKey="jetDays"
                name="Jet Fuel"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
