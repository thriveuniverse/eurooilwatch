/**
 * API root — machine-readable index of available endpoints.
 * Human-readable docs at /api.
 */

import { NextResponse } from 'next/server';

const BASE = 'https://eurooilwatch.com/api/v1';

const RESOURCES = [
  { name: 'stocks',             description: 'EU-27 country fuel reserve levels and days-of-supply (Eurostat)',                source: 'Eurostat (nrg_stk_oilm)' },
  { name: 'prices',             description: 'EU-27 weekly consumer fuel prices (EC Weekly Oil Bulletin)',                     source: 'European Commission DG Energy' },
  { name: 'prices-history',     description: 'EU average petrol and diesel price history',                                     source: 'European Commission' },
  { name: 'brent',              description: 'Current Brent crude price (front-month futures)',                                source: 'Stooq (cb.f)' },
  { name: 'brent-history',      description: '52-week Brent crude price history (weekly close)',                                source: 'Stooq' },
  { name: 'brent-eia-daily',    description: 'EIA Europe Brent Spot Price FOB daily series, since 20 May 1987',                 source: 'U.S. EIA (RBRTE)' },
  { name: 'gas',                description: 'Dutch TTF + US Henry Hub gas prices + AGSI EU storage levels',                   source: 'Yahoo Finance + AGSI/GIE' },
  { name: 'ara-stocks',         description: 'ARA hub weekly product stocks (jet, gasoline, naphtha, gasoil)',                 source: 'Argus Media (syndicating Insights Global)' },
  { name: 'bunker',             description: 'Marine bunker fuel price estimates (VLSFO / MGO)',                                source: 'Derived from Brent' },
  { name: 'bunker-history',     description: 'Rolling history of bunker fuel estimates',                                       source: 'Derived from Brent' },
  { name: 'sea-state',          description: 'Live wave height + wind at key oil-shipping chokepoints',                        source: 'Open-Meteo Marine + Forecast' },
  { name: 'history',            description: '18-month EU stocks history (days of cover by fuel)',                              source: 'Eurostat' },
  { name: 'marad-advisories',   description: 'US MARAD maritime security advisories (filtered for European supply relevance)', source: 'maritime.dot.gov' },
  { name: 'centcom-advisories', description: 'CENTCOM Middle East maritime advisories',                                        source: 'U.S. Central Command via DVIDS' },
  { name: 'crea-feed',          description: 'Energy and clean air research feed',                                              source: 'CREA' },
];

export async function GET() {
  return NextResponse.json(
    {
      service: 'EuroOilWatch Public API',
      version: 'v1',
      docs: 'https://eurooilwatch.com/api',
      cors: 'open',
      cache: 'public, s-maxage=300, stale-while-revalidate=3600',
      citation: 'EuroOilWatch — eurooilwatch.com',
      resources: RESOURCES.map(r => ({ ...r, url: `${BASE}/${r.name}` })),
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
