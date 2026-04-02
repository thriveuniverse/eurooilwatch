'use client';

import { useEffect, useState } from 'react';

interface BrentLiveData {
  priceUsd: number;
  priceEur: number;
  changeUsd: number;
  changePct: number;
  loading: boolean;
  live: boolean;
}

export default function BrentLive({
  fallbackUsd,
  fallbackEur,
  fallbackChange,
  fallbackChangePct,
}: {
  fallbackUsd: number;
  fallbackEur: number;
  fallbackChange: number;
  fallbackChangePct: number;
}) {
  const [data, setData] = useState<BrentLiveData>({
    priceUsd: fallbackUsd,
    priceEur: fallbackEur,
    changeUsd: fallbackChange,
    changePct: fallbackChangePct,
    loading: true,
    live: false,
  });

  useEffect(() => {
    async function fetchBrent() {
      try {
        const res = await fetch('/api/brent', { cache: 'no-store' });
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        if (json.error) throw new Error(json.error);

        setData({
          priceUsd: json.priceUsd,
          priceEur: json.priceEur,
          changeUsd: json.changeUsd,
          changePct: json.changePct,
          loading: false,
          live: true,
        });
      } catch {
        setData(prev => ({ ...prev, loading: false, live: false }));
      }
    }

    fetchBrent();
    const interval = setInterval(fetchBrent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isPositive = data.changeUsd >= 0;

  return (
    <>
      <div className="rounded-lg border border-oil-800 bg-oil-900/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
            Brent Crude
          </p>
          {data.live && (
            <span className="text-[9px] text-green-500 font-mono">● LIVE</span>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white font-mono">
            {data.priceUsd > 0 ? `$${data.priceUsd.toFixed(2)}` : '—'}
          </span>
          <span className="text-xs text-gray-400">/barrel</span>
        </div>
        {data.changePct !== 0 && (
          <p className={`mt-1 text-xs font-mono ${isPositive ? 'text-red-400' : 'text-green-400'}`}>
            {isPositive ? '▲' : '▼'}{' '}
            {isPositive ? '+' : ''}{data.changeUsd.toFixed(2)} ({isPositive ? '+' : ''}{data.changePct.toFixed(1)}%)
          </p>
        )}
      </div>

      <div className="rounded-lg border border-oil-800 bg-oil-900/50 px-4 py-3">
        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
          Brent (EUR)
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white font-mono">
            {data.priceEur > 0 ? `€${data.priceEur.toFixed(2)}` : '—'}
          </span>
          <span className="text-xs text-gray-400">/barrel</span>
        </div>
      </div>
    </>
  );
}
