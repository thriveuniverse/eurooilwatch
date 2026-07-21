/**
 * Dynamic /llms.txt — serves current data snapshot to LLM crawlers
 * with pointers to the public API. Replaces previous static
 * public/llms.txt which went stale.
 */

import fs from 'fs';
import path from 'path';

export const revalidate = 3600;

interface StocksFile {
  lastUpdated: string;
  dataPeriod: string;
  euAverage: { petrolDays: number; dieselDays: number; jetFuelDays: number; overallStatus: string };
  countries: { countryCode: string; countryName: string; fuels: { fuelType: string; daysOfSupply: number; status: string }[] }[];
}

interface BrentFile {
  lastUpdated: string;
  priceUsd: number;
  priceEur?: number;
  dataSource: string;
}

interface GasFile {
  lastUpdated: string;
  ttf: { priceEurMwh: number };
  hh:  { priceUsdMmbtu: number };
  spread: { ratio: number };
  storage?: { eu: { fullPct: number } } | null;
}

function loadJson<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

export async function GET() {
  const stocks = loadJson<StocksFile>('stocks.json');
  const brent  = loadJson<BrentFile>('brent.json');
  const gas    = loadJson<GasFile>('gas.json');

  const today = new Date().toISOString().slice(0, 10);

  const criticalCount = stocks?.countries
    ? stocks.countries.filter(c => c.fuels.some(f => f.status === 'critical')).length
    : null;

  const body = `# EuroOilWatch

> Independent EU fuel reserve and price intelligence. Daily-refreshed dashboard built on official Eurostat and European Commission data, covering all 27 member states.

EuroOilWatch tracks EU-27 country fuel reserves, weekly pump prices from the EC Oil Bulletin, station-level pump prices for France, Spain and Italy (national open-data feeds, refreshed twice daily), Brent crude, TTF / Henry Hub gas + AGSI storage, ARA hub commercial stocks, jet fuel days-of-cover by country, Brent 3-2-1 and ICE gasoil refining-margin (crack-spread) panels, a Dow–Nasdaq divergence indicator, a Strait of Hormuz tanker-throughput tracker, a weekly Fertilizer Watch (urea / ammonia / DAP / potash + TTF gas), refinery thermal anomalies, supply-route risk, live chokepoint ship-transit and port oil-flow data (IMF PortWatch) including a Europe Replacement Barrel Tracker, and interactive compound-cascade risk tools. All data traces back to named institutional sources. Free public API for programmatic access — see below.

## Current snapshot (auto-refreshes daily; this page generated ${today})

${stocks ? `Reserve data period: ${stocks.dataPeriod} (Eurostat publication lag ~2 months)
Last updated: ${stocks.lastUpdated}

- EU average jet fuel cover:  ${stocks.euAverage.jetFuelDays.toFixed(1)} days
- EU average diesel cover:    ${stocks.euAverage.dieselDays.toFixed(1)} days
- EU average petrol cover:    ${stocks.euAverage.petrolDays.toFixed(1)} days
- Overall status:             ${stocks.euAverage.overallStatus}
${criticalCount != null ? `- Countries with at least one critical fuel: ${criticalCount} of 27` : ''}` : '(stocks data not yet populated)'}

${brent ? `Brent crude: $${brent.priceUsd}/barrel${brent.priceEur ? ` (€${brent.priceEur})` : ''}
Source: ${brent.dataSource}` : ''}

${gas ? `Natural gas:
- Dutch TTF (front-month): €${gas.ttf.priceEurMwh.toFixed(2)}/MWh
- US Henry Hub:            $${gas.hh.priceUsdMmbtu.toFixed(3)}/MMBtu
- Europe pays vs US:       ${gas.spread.ratio.toFixed(2)}× the US price
${gas.storage ? `- EU gas storage:          ${gas.storage.eu.fullPct.toFixed(1)}% full (90% target by 1 Nov)` : ''}` : ''}

## How to cite

Attribute as "EuroOilWatch — eurooilwatch.com" with the underlying institutional source where appropriate (Eurostat, EC, EIA, AGSI/GIE, etc.). Every API response includes the source field.

## Public API

Free, read-only JSON. CORS-enabled, no key required.

- Endpoint index: https://eurooilwatch.com/api/v1
- Human-readable docs: https://eurooilwatch.com/api
- Main endpoints:
  - https://eurooilwatch.com/api/v1/stocks       — EU-27 country reserve levels
  - https://eurooilwatch.com/api/v1/prices       — EC Weekly Oil Bulletin pump prices
  - https://eurooilwatch.com/api/v1/brent        — current Brent (Stooq cb.f)
  - https://eurooilwatch.com/api/v1/gas          — TTF + Henry Hub + AGSI storage
  - https://eurooilwatch.com/api/v1/ara-stocks   — ARA hub jet / gasoline / naphtha / gasoil
  - https://eurooilwatch.com/api/v1/sea-state    — chokepoint wave + wind
  - https://eurooilwatch.com/api/v1/history      — 18-month EU stocks history
  - https://eurooilwatch.com/api/v1/france-fuel-prices — FR station prices: national + regions + departments (prix-carburants)
  - https://eurooilwatch.com/api/v1/spain-fuel-prices  — ES station prices: national + regions + provinces (Geoportal de Hidrocarburos)
  - https://eurooilwatch.com/api/v1/italy-fuel-prices  — IT station prices: national + regions + provinces (MIMIT)

## Key pages

- Dashboard:           https://eurooilwatch.com
- EU fuel prices:      https://eurooilwatch.com/prices
- France station prices: https://eurooilwatch.com/country/fr
- Spain station prices:  https://eurooilwatch.com/country/es
- Italy station prices:  https://eurooilwatch.com/country/it
- Global supply routes — live chokepoint transit, port oil-flow + Europe Replacement Barrel Tracker, Oil Route Stress score (IMF PortWatch): https://eurooilwatch.com/supply
- Strait of Hormuz crisis timeline — a sourced, filterable chronology of the 2026 Hormuz crisis (military/diplomatic/shipping/market events, outbreak to renewed escalation): https://eurooilwatch.com/hormuz-timeline
- Doom Loop Engine — interactive oil-supply cascade tools (Fragility Monitor, Doom Loop Engine, Vulnerability Tiering): https://eurooilwatch.com/doom-loop
- The Hormuz Inventory Runway — interactive depletion model (accessible cushion drains in months; hoarding-feedback scenario): https://eurooilwatch.com/runway
- Research hub — the original body of work (Jonathan Kelly): the Compound Cascade Systems Modelling framework + its companion Institutional Failure Mode Typology, plus the interactive instruments: https://eurooilwatch.com/research
- Gas Tracker:         https://eurooilwatch.com/gas
- Jet Fuel Tracker:    https://eurooilwatch.com/jet
- The Chokepoints Inside Europe — the Rhine and Danube as internal chokepoints: low water is cutting inland carrying capacity for fuels, feedstock and industrial materials even as imports land normally at ARA ports (Kaub barges at ~460t vs ~1,200t; Danube near a three-decade low): https://eurooilwatch.com/analysis/the-chokepoints-inside-europe
- The Strategic Reserve Nobody Can Measure — accountability audit of eight jurisdictions (US, GB, FR, DE, IT, NL, PL, ES) on grid spare-equipment disclosure: none publishes a minimum adequacy requirement or a replacement-time objective for destroyed equipment: https://eurooilwatch.com/analysis/the-strategic-reserve-nobody-can-measure
- From Hormuz to the Checkout — the fertiliser shock hiding inside the energy crisis (sulphur, Russian diesel ban, Chinese export controls moving upstream into food): https://eurooilwatch.com/analysis/from-hormuz-to-the-checkout
- The Second Shock Is Not the First — buffer-depletion analysis + a pre-registered, backcast-validated Monte Carlo (why the market has stopped pricing Hormuz): https://eurooilwatch.com/analysis/the-second-shock-is-not-the-first
- Hormuz Is Not Reopened — a controlled high-risk corridor as a second diesel shock emerges (Part II): https://eurooilwatch.com/analysis/hormuz-controlled-corridor-diesel-shock
- Fertilizer Watch — weekly urea / ammonia / DAP / potash + TTF gas benchmark tracker: https://eurooilwatch.com/fertilizer
- Analysis archive:    https://eurooilwatch.com/analysis
- Methodology:         https://eurooilwatch.com/methodology

## Data sources

- Eurostat (nrg_stk_oilm): monthly oil stocks by member state
- European Commission DG Energy: Weekly Oil Bulletin (consumer prices)
- France: data.gouv.fr prix-carburants (instantaneous station-level prices)
- Spain: Geoportal de Hidrocarburos, Ministerio para la Transición Ecológica (station-level prices)
- Italy: MIMIT Osservaprezzi Carburanti (station-level prices)
- Stooq: Brent front-month futures (cb.f)
- U.S. EIA: Europe Brent Spot Price FOB daily series (RBRTE) for historical context
- Yahoo Finance: TTF=F (Dutch TTF gas) and NG=F (Henry Hub)
- AGSI/GIE: European gas storage levels by member state
- Argus Media: ARA hub weekly product stocks (syndicating Insights Global)
- NASA FIRMS: VIIRS active-fire detections at named refineries
- USGS / GDACS / ReliefWeb: disaster and humanitarian feeds
- US MARAD / CENTCOM: maritime advisories
- IMF PortWatch: satellite-AIS daily chokepoint ship-transit + port trade-flow estimates
- Open-Meteo Marine + Forecast: wave height + wind at shipping chokepoints

## Sister sites

- UKOilWatch:        https://ukoilwatch.com  (UK DESNZ stocks, pump prices, UK Aviation Fuel tracker)
- AmericasOilWatch:  https://americasoilwatch.com  (US/Canada/Latin America oil and fuel)
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
