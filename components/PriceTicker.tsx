import type { BrentData, PriceDataset } from '@/lib/types';

interface PriceTickerProps {
  brent: BrentData;
  prices: PriceDataset;
}

function PriceCard({
  label,
  value,
  unit,
  change,
  changePct,
}: {
  label: string;
  value: string;
  unit: string;
  change?: number;
  changePct?: number;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/50 px-4 py-3">
      <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold text-white font-mono">{value}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      {changePct != null && (
        <p
          className={`mt-1 text-xs font-mono ${
            isPositive ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {isPositive ? '▲' : '▼'}{' '}
          {change != null && `${isPositive ? '+' : ''}${change.toFixed(2)} `}(
          {isPositive ? '+' : ''}
          {changePct.toFixed(1)}%)
        </p>
      )}
    </div>
  );
}

export default function PriceTicker({ brent, prices }: PriceTickerProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <PriceCard
        label="Brent Crude"
        value={brent.priceUsd > 0 ? `$${brent.priceUsd.toFixed(2)}` : '—'}
        unit="/barrel"
        change={brent.changeUsd}
        changePct={brent.changePct}
      />
      <PriceCard
        label="Brent (EUR)"
        value={brent.priceEur > 0 ? `€${brent.priceEur.toFixed(2)}` : '—'}
        unit="/barrel"
      />
      <PriceCard
        label="EU Avg Petrol"
        value={
          prices.euAverage.petrolPrice > 0
            ? `€${prices.euAverage.petrolPrice.toFixed(3)}`
            : '—'
        }
        unit="/litre"
      />
      <PriceCard
        label="EU Avg Diesel"
        value={
          prices.euAverage.dieselPrice > 0
            ? `€${prices.euAverage.dieselPrice.toFixed(3)}`
            : '—'
        }
        unit="/litre"
      />
    </div>
  );
}
