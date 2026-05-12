'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface FuelEntry {
  fuelType: string;
  stockKilotonnes?: number;
  consumptionKilotonnes?: number;
  daysOfSupply: number;
  mandatoryMinimumDays?: number;
  status: 'safe' | 'watch' | 'warning' | 'critical';
}

interface CountryStocks {
  countryCode: string;
  countryName: string;
  datePeriod?: string;
  fuels: FuelEntry[];
}

interface StocksFile {
  lastUpdated: string;
  dataPeriod: string;
  dataSource: string;
  countries: CountryStocks[];
  euAverage: {
    petrolDays: number;
    dieselDays: number;
    jetFuelDays: number;
    overallStatus: string;
  };
}

interface HistoryPoint {
  period: string;
  petrolDays: number;
  dieselDays: number;
  jetDays: number;
}

interface AraFigure {
  product: string;
  tonnes: number | null;
  wowPercent: number | null;
  direction: string | null;
  note: string | null;
}

interface AraWeek {
  weekEnding: string;
  publishedAt: string;
  sourceUrls?: string[];
  figures: AraFigure[];
}

interface AraStocks {
  lastUpdated: string;
  source: string;
  weeks: AraWeek[];
}

export interface JetFuelTrackerProps {
  stocks: StocksFile;
  history: { euAverage: HistoryPoint[] } | null;
  ara: AraStocks | null;
  /** Optional UK callout — if provided, renders a UK-context card */
  ukJet?: { daysOfSupply: number; lastUpdated: string; status: string } | null;
}

const STATUS_STYLES: Record<string, { dot: string; bar: string; label: string; row: string }> = {
  critical: { dot: 'bg-red-500',     bar: 'bg-red-500',     label: 'text-red-300',     row: 'bg-red-950/15' },
  warning:  { dot: 'bg-orange-500',  bar: 'bg-orange-500',  label: 'text-orange-300',  row: 'bg-orange-950/10' },
  watch:    { dot: 'bg-amber-400',   bar: 'bg-amber-400',   label: 'text-amber-300',   row: 'bg-amber-950/10' },
  safe:     { dot: 'bg-emerald-500', bar: 'bg-emerald-500', label: 'text-emerald-300', row: 'bg-oil-900/30' },
};

function formatPeriod(p: string): string {
  const [y, m] = p.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-oil-900 border border-oil-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-400 mb-1">{formatPeriod(label)}</p>
      <p className="text-amber-400">EU jet days: <span className="font-mono font-bold">{payload[0].value.toFixed(1)}</span></p>
    </div>
  );
}

export default function JetFuelTracker({ stocks, history, ara, ukJet }: JetFuelTrackerProps) {
  // Build per-country jet rows
  const jetRows = stocks.countries
    .map(c => {
      const jet = c.fuels.find(f => f.fuelType === 'jet_fuel');
      return jet ? {
        code: c.countryCode,
        name: c.countryName,
        days: jet.daysOfSupply,
        stock: jet.stockKilotonnes ?? null,
        consumption: jet.consumptionKilotonnes ?? null,
        status: jet.status,
        period: c.datePeriod,
      } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => a.days - b.days);

  const critical = jetRows.filter(r => r.status === 'critical');
  const warning  = jetRows.filter(r => r.status === 'warning');
  const watch    = jetRows.filter(r => r.status === 'watch');
  const safe     = jetRows.filter(r => r.status === 'safe');
  const mostStressed = jetRows[0];

  // ARA jet hub
  const latestAraWeek = ara?.weeks?.[0];
  const araJet = latestAraWeek?.figures.find(f => f.product === 'jet');

  // EU jet history trend
  const histPoints = history?.euAverage ?? [];

  return (
    <section className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          European Jet Fuel — Country Days-of-Cover + ARA Hub
        </h2>
        <span className="text-[10px] font-mono text-gray-600">
          Eurostat period {stocks.dataPeriod} · updated {formatDate(stocks.lastUpdated)}
        </span>
      </div>

      {/* Hero stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-oil-800/40">
        <Stat
          label="EU average — jet"
          value={stocks.euAverage.jetFuelDays.toFixed(1)}
          unit="days"
          sub={`strategic + commercial combined · 90-day benchmark`}
          valueColor={stocks.euAverage.jetFuelDays < 60 ? 'text-orange-400' : 'text-emerald-400'}
        />
        <Stat
          label="Most-stressed country"
          value={mostStressed ? `${mostStressed.days.toFixed(1)}` : '—'}
          unit={mostStressed ? 'days' : ''}
          sub={mostStressed ? `${mostStressed.name} · ${critical.length} of 27 countries jet-critical` : ''}
          valueColor="text-red-400"
        />
        {araJet ? (
          <Stat
            label="ARA hub commercial jet"
            value={araJet.tonnes ? `${(araJet.tonnes / 1000).toFixed(0)}` : '—'}
            unit={araJet.tonnes ? 'kt' : ''}
            sub={
              araJet.note
                ? `${araJet.note}${araJet.wowPercent != null ? ` · ${araJet.wowPercent >= 0 ? '+' : ''}${araJet.wowPercent}% WoW` : ''}`
                : (araJet.wowPercent != null ? `${araJet.wowPercent >= 0 ? '+' : ''}${araJet.wowPercent}% WoW` : '')
            }
            valueColor={(araJet.wowPercent ?? 0) < 0 ? 'text-orange-400' : 'text-emerald-400'}
          />
        ) : (
          <Stat label="ARA hub commercial jet" value="—" unit="" sub="data pending" />
        )}
      </div>

      {/* The bifurcation explainer */}
      <div className="px-5 py-3 border-t border-oil-800/40 bg-oil-950/30">
        <p className="text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-200">Two numbers, two stories.</strong>{' '}
          EU jet cover on Eurostat&apos;s basis ({stocks.euAverage.jetFuelDays.toFixed(0)} days) combines strategic and commercial stocks, and looks comfortable.
          {araJet?.tonnes && araJet.note?.toLowerCase().includes('low') ? (
            <> But the <strong className="text-gray-200">commercial stocks</strong> that actually feed airlines through the ARA hub are at {araJet.note}.</>
          ) : (
            <> The <strong className="text-gray-200">commercial stocks</strong> that actually feed airlines through the ARA hub move on a faster timescale.</>
          )}{' '}
          Strategic reserves help cushion shocks, but airlines depend on commercial inventory week-to-week — which is why the ARA number is the one to watch for summer-flight risk.
        </p>
      </div>

      {/* Per-country breakdown */}
      <div className="px-5 py-4 border-t border-oil-800/40">
        <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-3">
          27 EU countries — jet fuel days of supply, sorted lowest first
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase border-b border-oil-800">
                <th className="text-left px-3 py-2">Country</th>
                <th className="text-right px-3 py-2">Days</th>
                <th className="text-right px-3 py-2 hidden sm:table-cell">Stock (kt)</th>
                <th className="text-right px-3 py-2 hidden sm:table-cell">Monthly cons. (kt)</th>
                <th className="text-right px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {jetRows.map(r => {
                const s = STATUS_STYLES[r.status] ?? STATUS_STYLES.safe;
                return (
                  <tr key={r.code} className={`border-b border-oil-800/40 ${s.row}`}>
                    <td className="px-3 py-2 text-gray-200">{r.name}</td>
                    <td className="px-3 py-2 text-right font-mono text-white">{r.days.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-400 hidden sm:table-cell">{r.stock?.toFixed(0) ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-400 hidden sm:table-cell">{r.consumption?.toFixed(0) ?? '—'}</td>
                    <td className={`px-3 py-2 text-right font-mono font-semibold ${s.label}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${s.dot}`} />
                      {r.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-gray-600">
          {critical.length} critical · {warning.length} warning · {watch.length} watch · {safe.length} safe.
          Countries with very small jet consumption (e.g. Slovenia, Estonia) can show inflated days-of-cover because the denominator is so small — read those with appropriate scepticism.
        </p>
      </div>

      {/* History chart */}
      {histPoints.length > 1 && (
        <div className="px-5 py-4 border-t border-oil-800/40">
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">
            EU average jet fuel days of cover — last {histPoints.length} months
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={histPoints} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" />
                <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" minTickGap={30} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#1a3a5c" domain={['dataMin - 10', 'dataMax + 10']} width={35} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={90} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1} label={{ value: '90-day benchmark', position: 'right', fill: '#10b981', fontSize: 10 }} />
                <ReferenceLine y={23} stroke="#dc2626" strokeDasharray="4 3" strokeWidth={1} label={{ value: '23-day floor (IEA framing)', position: 'right', fill: '#dc2626', fontSize: 10 }} />
                <Line type="monotone" dataKey="jetDays" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* UK callout */}
      {ukJet && (
        <div className="px-5 py-4 border-t border-oil-800/40 bg-oil-950/20">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
              UK — outside the EU framework, but on the same supply system
            </p>
            <span className="text-[10px] text-gray-600">DESNZ · updated {formatDate(ukJet.lastUpdated)}</span>
          </div>
          <div className="flex items-baseline gap-4 flex-wrap">
            <p className="text-2xl font-mono font-bold text-orange-400">
              {ukJet.daysOfSupply.toFixed(1)}<span className="text-sm text-gray-500 ml-1">days</span>
            </p>
            <p className="text-xs text-gray-400">
              Jet fuel days of cover · status:{' '}
              <span className={`font-mono font-semibold ${STATUS_STYLES[ukJet.status]?.label ?? 'text-gray-300'}`}>
                {ukJet.status}
              </span>
            </p>
          </div>
          <p className="mt-2 text-xs text-gray-400 leading-relaxed">
            The UK holds no dedicated strategic jet-fuel reserve, sits outside the EU&apos;s 90-day stockholding framework, and relies heavily on imports from NW European refineries. Heathrow alone accounts for a large share of national jet demand.
            For the UK-specific view, see <a href="https://ukoilwatch.com/" target="_blank" rel="noopener" className="text-oil-400 hover:underline">UKOilWatch</a>.
          </p>
        </div>
      )}

      <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-950/40">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Country jet stocks via{' '}
          <a href="https://ec.europa.eu/eurostat/databrowser/view/NRG_STK_OILM" target="_blank" rel="noopener" className="text-oil-400 hover:underline">Eurostat (nrg_stk_oilm)</a>
          {' '}— monthly, ~2-month publication lag. ARA hub commercial stocks via Argus Media (syndicating Insights Global), weekly.
          The 90-day benchmark is the EU stockholding obligation (Directive 2009/119/EC);
          the 23-day floor is the IEA&apos;s commercial-stocks shortage threshold cited in recent oil market reports.
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value, unit, sub, valueColor = 'text-white' }: {
  label: string; value: string; unit: string; sub: string; valueColor?: string;
}) {
  return (
    <div className="bg-oil-900/30 px-5 py-4">
      <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">{label}</p>
      <p className={`text-2xl font-mono font-bold leading-none ${valueColor}`}>
        {value}<span className="text-sm text-gray-500 ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">{sub}</p>
    </div>
  );
}
