import type { CountryStockData, CountryPriceData, ReserveStatus } from '@/lib/types';
import { COUNTRIES } from '@/lib/countries';

const STATUS_BADGE: Record<ReserveStatus, { bg: string; text: string }> = {
  safe:     { bg: 'bg-green-900/50', text: 'text-green-300' },
  watch:    { bg: 'bg-yellow-900/50', text: 'text-yellow-300' },
  warning:  { bg: 'bg-orange-900/50', text: 'text-orange-300' },
  critical: { bg: 'bg-red-900/50', text: 'text-red-300' },
};

interface CountryGridProps {
  stocks: CountryStockData[];
  prices: CountryPriceData[];
}

export default function CountryGrid({ stocks, prices }: CountryGridProps) {
  const priceMap = new Map(prices.map(p => [p.countryCode, p]));
  const hasStocks = stocks.length > 0;

  const statusOrder: ReserveStatus[] = ['critical', 'warning', 'watch', 'safe'];
  const sorted = hasStocks
    ? [...stocks].sort(
        (a, b) =>
          statusOrder.indexOf(a.overallStatus) -
          statusOrder.indexOf(b.overallStatus)
      )
    : [];

  const displayCountries = hasStocks
    ? sorted
    : prices.map(p => ({
        countryCode: p.countryCode,
        countryName: p.countryName,
        overallStatus: 'watch' as ReserveStatus,
        averageDays: 0,
        datePeriod: '',
        fuels: [],
      }));

  if (displayCountries.length === 0) {
    return (
      <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-8 text-center text-gray-500">
        <p className="text-lg">No country data available yet</p>
        <p className="mt-2 text-sm">
          Run <code className="bg-oil-800 px-2 py-0.5 rounded">npm run update</code> to fetch data from Eurostat
        </p>
      </div>
    );
  }

  /** Format the data period for display */
  function formatPeriod(period: string): { label: string; isAnnual: boolean } {
    if (!period) return { label: '', isAnnual: false };
    if (period.includes('annual')) {
      const year = period.replace(/[^0-9]/g, '');
      return { label: year, isAnnual: true };
    }
    // Monthly: "2026-01" → "Jan 2026"
    const [year, month] = period.split('-');
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = parseInt(month);
    if (m >= 1 && m <= 12) {
      return { label: `${monthNames[m]} ${year}`, isAnnual: false };
    }
    return { label: period, isAnnual: false };
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          EU27 Country Overview
        </h2>
        <span className="text-xs text-gray-500">
          {hasStocks ? `${stocks.length} countries with data` : `${prices.length} countries`}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {displayCountries.map((country) => {
          const price = priceMap.get(country.countryCode as any);
          const info = COUNTRIES[country.countryCode as keyof typeof COUNTRIES];
          const badge = STATUS_BADGE[country.overallStatus];
          const { label: periodLabel, isAnnual } = formatPeriod(country.datePeriod);

          return (
            <a
              key={country.countryCode}
              href={`/country/${country.countryCode.toLowerCase()}`}
              className="rounded-lg border border-oil-800 bg-oil-900/40 p-3 hover:bg-oil-800/60 hover:border-oil-600 transition group"
            >
              {/* Country header */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{info?.flag ?? '🏳️'}</span>
                <span className="text-sm font-medium text-white truncate group-hover:text-oil-300">
                  {country.countryName}
                </span>
              </div>

              {/* Reserve info */}
              {hasStocks && country.averageDays > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Reserves</span>
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}
                    >
                      {Math.round(country.averageDays)}d
                    </span>
                  </div>
                  {/* Mini bar */}
                  <div className="mt-1 h-1.5 bg-oil-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((country.averageDays / 150) * 100, 100)}%`,
                        backgroundColor:
                          country.overallStatus === 'safe'
                            ? '#22c55e'
                            : country.overallStatus === 'watch'
                            ? '#f59e0b'
                            : country.overallStatus === 'warning'
                            ? '#f97316'
                            : '#ef4444',
                      }}
                    />
                  </div>
                  {/* Data period label */}
                  {periodLabel && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isAnnual
                            ? 'bg-amber-900/40 text-amber-400/80 border border-amber-800/40'
                            : 'bg-oil-800/60 text-gray-500'
                        }`}
                      >
                        {isAnnual ? `⏳ ${periodLabel}` : periodLabel}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Price info */}
              {price && (
                <div className="mt-2 flex justify-between text-xs">
                  {price.petrolPrice && (
                    <span className="text-gray-400">
                      ⛽ €{price.petrolPrice.toFixed(2)}
                    </span>
                  )}
                  {price.dieselPrice && (
                    <span className="text-gray-500">
                      🛢 €{price.dieselPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </a>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block bg-oil-800/60 text-gray-500 px-1.5 py-0.5 rounded">Jan 2026</span>
          Monthly data (latest)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block bg-amber-900/40 text-amber-400/80 border border-amber-800/40 px-1.5 py-0.5 rounded">⏳ 2024</span>
          Annual data (older — monthly not yet reported)
        </span>
      </div>
    </div>
  );
}
