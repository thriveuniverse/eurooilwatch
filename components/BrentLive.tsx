'use client';

import { useEffect, useState } from 'react';

interface BrentLiveData {
  priceUsd: number;
  priceEur: number;
  changeUsd: number;
  changePct: number;
  loading: boolean;
  error: boolean;
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
    error: false,
  });

  useEffect(() => {
    async function fetchBrent() {
      try {
        // Yahoo Finance chart API — no key needed
        const res = await fetch(
          'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=5d',
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Yahoo API error');
        const json = await res.json();
        const result = json?.chart?.result?.[0];
        if (!result) throw new Error('No data');

        const closes = result.indicators?.quote?.[0]?.close?.filter(
          (c: any) => c != null
        ) || [];
        if (closes.length < 2) throw new Error('Insufficient data');

        const latest = closes[closes.length - 1];
        const previous = closes[closes.length - 2];
        const change = latest - previous;
        const changePct = (change / previous) * 100;

        // EUR/USD rate — fetch live
        let eurRate = 0.92; // fallback
        try {
          const fxRes = await fetch(
            'https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=1d&range=1d'
          );
          if (fxRes.ok) {
            const fxJson = await fxRes.json();
            const fxCloses = fxJson?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
              (c: any) => c != null
            ) || [];
            if (fxCloses.length > 0) {
              eurRate = 1 / fxCloses[fxCloses.length - 1];
            }
          }
        } catch {}

        setData({
          priceUsd: Math.round(latest * 100) / 100,
          priceEur: Math.round(latest * eurRate * 100) / 100,
          changeUsd: Math.round(change * 100) / 100,
          changePct: Math.round(changePct * 100) / 100,
          loading: false,
          error: false,
        });
      } catch {
        // Keep fallback values but mark as loaded
        setData(prev => ({ ...prev, loading: false, error: true }));
      }
    }

    fetchBrent();
    // Refresh every 5 minutes
    const interval = setInterval(fetchBrent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isPositive = data.changeUsd >= 0;

  return (
    <>
      {/* Brent USD */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
            Brent Crude
          </p>
          {!data.loading && !data.error && (
            <span className="text-[9px] text-green-500 font-mono">● LIVE</span>
          )}
          {data.error && (
            <span className="text-[9px] text-gray-600 font-mono">cached</span>
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

      {/* Brent EUR */}
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
