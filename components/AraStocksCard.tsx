import fs from 'fs';
import path from 'path';

type Product = 'gasoil' | 'gasoline' | 'naphtha' | 'jet' | 'fuel_oil' | 'total';

interface Figure {
  product: Product;
  tonnes: number | null;
  wowPercent: number | null;
  direction: 'up' | 'down' | 'flat' | null;
  note: string | null;
}

interface WeeklySnapshot {
  weekEnding: string;
  publishedAt: string;
  sourceUrls: string[];
  figures: Figure[];
}

interface AraStocksFile {
  lastUpdated: string;
  source: string;
  weeks: WeeklySnapshot[];
}

const PRODUCT_LABEL: Record<Product, string> = {
  gasoil: 'Gasoil / Diesel',
  gasoline: 'Gasoline',
  naphtha: 'Naphtha',
  jet: 'Jet Fuel',
  fuel_oil: 'Fuel Oil',
  total: 'Total',
};

const PRODUCT_ORDER: Product[] = ['gasoil', 'jet', 'gasoline', 'naphtha', 'fuel_oil'];

function loadAraStocks(): AraStocksFile | null {
  const p = path.join(process.cwd(), 'data', 'ara-stocks.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function formatTonnes(t: number | null): string {
  if (t === null) return '—';
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(2)} Mt`;
  return `${(t / 1_000).toFixed(0)} kt`;
}

function deltaStyle(wow: number | null, direction: Figure['direction']) {
  if (wow === null && !direction) return 'text-gray-500';
  const sig = wow ?? (direction === 'up' ? 1 : direction === 'down' ? -1 : 0);
  if (sig <= -5) return 'text-red-400';
  if (sig < 0)   return 'text-amber-400';
  if (sig >= 5)  return 'text-emerald-400';
  if (sig > 0)   return 'text-emerald-300';
  return 'text-gray-400';
}

function deltaArrow(direction: Figure['direction']): string {
  if (direction === 'up') return '▲';
  if (direction === 'down') return '▼';
  return '·';
}

function formatWowPercent(wow: number | null): string {
  if (wow === null) return '—';
  const sign = wow > 0 ? '+' : '';
  return `${sign}${wow.toFixed(1)}%`;
}

export default function AraStocksCard() {
  const data = loadAraStocks();
  if (!data || data.weeks.length === 0) return null;

  const latest = data.weeks[0];
  const figureByProduct = new Map<Product, Figure>();
  for (const f of latest.figures) figureByProduct.set(f.product, f);

  const weekEndingDate = new Date(latest.weekEnding).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const publishedDate = new Date(latest.publishedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  });

  return (
    <div className="rounded-xl border border-oil-700 bg-oil-900/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-oil-800 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">ARA Independent Stocks</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Amsterdam–Rotterdam–Antwerp refining hub · Week ending {weekEndingDate} · Source: Insights Global via Argus
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
          Published {publishedDate}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-oil-800">
        {PRODUCT_ORDER.map((p) => {
          const f = figureByProduct.get(p);
          const hasData = !!f && (f.tonnes !== null || f.wowPercent !== null || f.direction !== null);
          return (
            <div key={p} className="bg-oil-900/60 px-4 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">{PRODUCT_LABEL[p]}</p>
              <p className="mt-1 text-xl font-bold text-white font-mono">{f ? formatTonnes(f.tonnes) : '—'}</p>
              {hasData ? (
                <p className={`mt-1 text-xs font-mono ${deltaStyle(f!.wowPercent, f!.direction)}`}>
                  <span className="mr-1">{deltaArrow(f!.direction)}</span>
                  {formatWowPercent(f!.wowPercent)}
                  <span className="text-[10px] text-gray-500 ml-1">w/w</span>
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-600">Not reported this week</p>
              )}
              {f?.note && (
                <p className="mt-2 text-[10px] text-gray-500 leading-snug">{f.note}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
        <p className="text-[10px] text-gray-600">
          Independently-held inventories at the ARA hub — the single most-watched European refined-product signal for traders.
          Insights Global publishes weekly Thursdays 16:15 CET, sourced directly from terminal management systems.
          {' '}EuroOilWatch ingests via Argus Media's free syndication.
          {data.weeks.length > 1 && <> · {data.weeks.length} weeks of history available.</>}
          {latest.sourceUrls.length > 0 && (
            <> · <a href={latest.sourceUrls[0]} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">Source article →</a></>
          )}
        </p>
      </div>
    </div>
  );
}
