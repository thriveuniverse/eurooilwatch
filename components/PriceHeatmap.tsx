'use client';

import { useState } from 'react';
import type { PriceDataset, CountryCode } from '@/lib/types';
import { COUNTRIES } from '@/lib/countries';

interface PriceHeatmapProps {
  prices: PriceDataset;
}

type FuelView = 'diesel' | 'petrol';

/**
 * EU cartogram grid — approximate geographic positions.
 * Each entry: [row, col, countryCode]
 */
const GRID: [number, number, CountryCode][] = [
  [0, 3, 'FI'],
  [0, 4, 'EE'],
  [1, 1, 'IE'],
  [1, 2, 'SE'],
  [1, 3, 'LV'],
  [1, 4, 'LT'],
  [2, 1, 'DK'],
  [2, 2, 'NL'],
  [2, 3, 'PL'],
  [3, 0, 'BE'],
  [3, 1, 'DE'],
  [3, 2, 'CZ'],
  [3, 3, 'SK'],
  [4, 0, 'LU'],
  [4, 1, 'FR'],
  [4, 2, 'AT'],
  [4, 3, 'HU'],
  [4, 4, 'RO'],
  [5, 1, 'SI'],
  [5, 2, 'HR'],
  [5, 3, 'BG'],
  [6, 0, 'ES'],
  [6, 1, 'IT'],
  [6, 2, 'GR'],
  [6, 4, 'CY'],
  [7, 0, 'PT'],
  [7, 3, 'MT'],
];

function getColor(price: number | null, min: number, max: number): string {
  if (price === null || price === 0) return '#1a3a5c';
  const ratio = Math.max(0, Math.min(1, (price - min) / (max - min)));
  // Green → Yellow → Red gradient
  if (ratio < 0.5) {
    const t = ratio * 2;
    const r = Math.round(34 + t * (245 - 34));
    const g = Math.round(197 + t * (158 - 197));
    const b = Math.round(94 + t * (11 - 94));
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (ratio - 0.5) * 2;
    const r = Math.round(245 + t * (239 - 245));
    const g = Math.round(158 + t * (68 - 158));
    const b = Math.round(11 + t * (68 - 11));
    return `rgb(${r},${g},${b})`;
  }
}

export default function PriceHeatmap({ prices }: PriceHeatmapProps) {
  const [fuel, setFuel] = useState<FuelView>('diesel');
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const priceMap = new Map(
    prices.countries.map((c) => [
      c.countryCode,
      fuel === 'diesel' ? c.dieselPrice : c.petrolPrice,
    ])
  );

  const allPrices = [...priceMap.values()].filter(
    (p): p is number => p !== null && p > 0
  );
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);

  const hoveredData = hoveredCountry
    ? prices.countries.find((c) => c.countryCode === hoveredCountry)
    : null;
  const hoveredInfo = hoveredCountry
    ? COUNTRIES[hoveredCountry as keyof typeof COUNTRIES]
    : null;

  const cellSize = 72;
  const gap = 4;
  const cols = 5;
  const rows = 8;

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5">
      {/* Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">
          EU Price Heatmap
        </h2>
        <div className="flex bg-oil-800 rounded-lg p-0.5">
          <button
            onClick={() => setFuel('diesel')}
            className={`px-3 py-1 text-xs rounded-md transition ${
              fuel === 'diesel'
                ? 'bg-oil-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Diesel
          </button>
          <button
            onClick={() => setFuel('petrol')}
            className={`px-3 py-1 text-xs rounded-md transition ${
              fuel === 'petrol'
                ? 'bg-oil-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Petrol
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cartogram */}
        <div className="flex-1 flex justify-center">
          <svg
            viewBox={`0 0 ${cols * (cellSize + gap)} ${rows * (cellSize + gap)}`}
            className="w-full max-w-md"
          >
            {GRID.map(([row, col, code]) => {
              const price = priceMap.get(code) ?? null;
              const color = getColor(price, minPrice, maxPrice);
              const info = COUNTRIES[code as keyof typeof COUNTRIES];
              const x = col * (cellSize + gap);
              const y = row * (cellSize + gap);
              const isHovered = hoveredCountry === code;

              return (
                <g
                  key={code}
                  onMouseEnter={() => setHoveredCountry(code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={6}
                    fill={color}
                    stroke={isHovered ? '#fff' : '#0a1f3b'}
                    strokeWidth={isHovered ? 2 : 1}
                    opacity={isHovered ? 1 : 0.85}
                  />
                  <text
                    x={x + cellSize / 2}
                    y={y + 28}
                    textAnchor="middle"
                    fill="white"
                    fontSize="13"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {code}
                  </text>
                  <text
                    x={x + cellSize / 2}
                    y={y + 48}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.8)"
                    fontSize="12"
                    fontFamily="monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {price ? `€${price.toFixed(2)}` : '—'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Info panel */}
        <div className="lg:w-64 space-y-4">
          {/* Hover info */}
          <div className="rounded-lg bg-oil-800/50 p-4 min-h-[120px]">
            {hoveredData && hoveredInfo ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{hoveredInfo.flag}</span>
                  <span className="font-semibold text-white">
                    {hoveredInfo.name}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">
                    Petrol:{' '}
                    <span className="text-white font-mono">
                      {hoveredData.petrolPrice
                        ? `€${hoveredData.petrolPrice.toFixed(3)}`
                        : '—'}
                    </span>
                    /L
                  </p>
                  <p className="text-gray-400">
                    Diesel:{' '}
                    <span className="text-white font-mono">
                      {hoveredData.dieselPrice
                        ? `€${hoveredData.dieselPrice.toFixed(3)}`
                        : '—'}
                    </span>
                    /L
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">
                Hover over a country to see prices
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-lg bg-oil-800/50 p-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
              {fuel === 'diesel' ? 'Diesel' : 'Petrol'} price (€/L)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                €{minPrice.toFixed(2)}
              </span>
              <div
                className="flex-1 h-3 rounded-full"
                style={{
                  background: `linear-gradient(to right, #22c55e, #f59e0b, #ef4444)`,
                }}
              />
              <span className="text-xs text-gray-400">
                €{maxPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-lg bg-oil-800/50 p-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Quick stats
            </p>
            <p className="text-sm text-gray-300">
              EU avg:{' '}
              <span className="text-white font-mono">
                €
                {fuel === 'diesel'
                  ? prices.euAverage.dieselPrice.toFixed(3)
                  : prices.euAverage.petrolPrice.toFixed(3)}
              </span>
              /L
            </p>
            <p className="text-sm text-gray-300">
              Cheapest:{' '}
              <span className="text-green-400">
                {
                  [...prices.countries]
                    .filter((c) =>
                      fuel === 'diesel' ? c.dieselPrice : c.petrolPrice
                    )
                    .sort((a, b) =>
                      fuel === 'diesel'
                        ? (a.dieselPrice || 99) - (b.dieselPrice || 99)
                        : (a.petrolPrice || 99) - (b.petrolPrice || 99)
                    )[0]?.countryName
                }
              </span>
            </p>
            <p className="text-sm text-gray-300">
              Priciest:{' '}
              <span className="text-red-400">
                {
                  [...prices.countries]
                    .filter((c) =>
                      fuel === 'diesel' ? c.dieselPrice : c.petrolPrice
                    )
                    .sort((a, b) =>
                      fuel === 'diesel'
                        ? (b.dieselPrice || 0) - (a.dieselPrice || 0)
                        : (b.petrolPrice || 0) - (a.petrolPrice || 0)
                    )[0]?.countryName
                }
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
