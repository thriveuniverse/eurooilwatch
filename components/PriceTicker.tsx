import type { BrentData, PriceDataset } from '@/lib/types';
import BrentLive from './BrentLive';

interface PriceTickerProps {
  brent: BrentData;
  prices: PriceDataset;
}

export default function PriceTicker({ brent, prices }: PriceTickerProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Brent USD + EUR — live client-side updates */}
      <BrentLive
        fallbackUsd={brent.priceUsd}
        fallbackEur={brent.priceEur}
        fallbackChange={brent.changeUsd}
        fallbackChangePct={brent.changePct}
      />

      {/* EU averages — from weekly Oil Bulletin, static is correct */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/50 px-4 py-3">
        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
          EU Avg Petrol
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white font-mono">
            {prices.euAverage.petrolPrice > 0
              ? `€${prices.euAverage.petrolPrice.toFixed(3)}`
              : '—'}
          </span>
          <span className="text-xs text-gray-400">/litre</span>
        </div>
      </div>
      <div className="rounded-lg border border-oil-800 bg-oil-900/50 px-4 py-3">
        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
          EU Avg Diesel
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white font-mono">
            {prices.euAverage.dieselPrice > 0
              ? `€${prices.euAverage.dieselPrice.toFixed(3)}`
              : '—'}
          </span>
          <span className="text-xs text-gray-400">/litre</span>
        </div>
      </div>
    </div>
  );
}
