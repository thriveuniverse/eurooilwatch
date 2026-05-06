/**
 * Fetch current sea-state (wave height + wind) for key oil-shipping chokepoints
 * via Open-Meteo's free Marine + Forecast APIs.
 *
 * Output: data/sea-state.json
 *
 * Usage:
 *   tsx scripts/fetch-sea-state.ts
 *
 * Open-Meteo is free, no auth required. Marine wave data is sourced from
 * European met agencies (DWD-led ensemble). For more authoritative analysis
 * later we can swap to Copernicus Marine Service direct without changing
 * the JSON schema or downstream component.
 */

import fs from 'fs';
import path from 'path';

interface Chokepoint {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  context: string;
}

const CHOKEPOINTS: Chokepoint[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    region: 'Persian Gulf / Gulf of Oman',
    lat: 26.567, lon: 56.250,
    context: '~20% of world seaborne oil and LNG normally transits here.',
  },
  {
    id: 'bab-el-mandeb',
    name: 'Bab el-Mandeb',
    region: 'Red Sea / Gulf of Aden',
    lat: 12.583, lon: 43.333,
    context: 'Red Sea entry; routes for Suez-bound traffic from the Gulf and Asia.',
  },
  {
    id: 'suez-approaches',
    name: 'Suez Approaches (Port Said)',
    region: 'Eastern Mediterranean',
    lat: 31.250, lon: 32.300,
    context: 'Northern entry to the Suez Canal; ~10% of seaborne crude.',
  },
  {
    id: 'english-channel',
    name: 'English Channel (Dover Strait)',
    region: 'NW Europe',
    lat: 50.950, lon: 1.367,
    context: 'Busiest shipping lane in the world; critical for UK / NW European fuel imports.',
  },
  {
    id: 'skagerrak',
    name: 'Skagerrak',
    region: 'North Sea / Baltic',
    lat: 57.750, lon: 9.000,
    context: 'Connects North Sea to Baltic; route for Norwegian and Russian-origin crude.',
  },
  {
    id: 'panama-caribbean',
    name: 'Panama Canal (Caribbean approach)',
    region: 'Caribbean',
    lat: 9.350, lon: -79.917,
    context: 'Atlantic entry to Panama Canal; Pacific–Atlantic arbitrage route.',
  },
  {
    id: 'strait-of-florida',
    name: 'Strait of Florida',
    region: 'Gulf of Mexico / Atlantic',
    lat: 24.500, lon: -80.500,
    context: 'Gulf of Mexico crude exports route to Atlantic basin.',
  },
];

interface MarineCurrent {
  time: string;
  wave_height: number;
  wave_period: number;
  wave_direction: number;
}

interface ForecastCurrent {
  time: string;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
}

async function fetchMarine(lat: number, lon: number): Promise<MarineCurrent | null> {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,wave_direction&timezone=UTC`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json() as { current?: MarineCurrent };
  return data.current ?? null;
}

async function fetchWind(lat: number, lon: number): Promise<ForecastCurrent | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&windspeed_unit=ms&timezone=UTC`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json() as { current?: ForecastCurrent };
  return data.current ?? null;
}

type RiskBand = 'calm' | 'moderate' | 'rough' | 'dangerous';

function classifyRisk(waveHeightM: number | null, windMs: number | null): RiskBand {
  // Worst-of: wave-height bands roughly mirror Douglas / WMO sea-state codes.
  // Wind bands use Beaufort thresholds (m/s).
  let waveBand: RiskBand = 'calm';
  if (waveHeightM != null) {
    if (waveHeightM >= 4.0) waveBand = 'dangerous';
    else if (waveHeightM >= 2.5) waveBand = 'rough';
    else if (waveHeightM >= 1.25) waveBand = 'moderate';
  }
  let windBand: RiskBand = 'calm';
  if (windMs != null) {
    if (windMs >= 17.2) windBand = 'dangerous';   // 8 Beaufort gale
    else if (windMs >= 10.8) windBand = 'rough';  // 6 Beaufort strong breeze
    else if (windMs >= 5.5)  windBand = 'moderate'; // 4 Beaufort
  }
  const order: RiskBand[] = ['calm', 'moderate', 'rough', 'dangerous'];
  return order[Math.max(order.indexOf(waveBand), order.indexOf(windBand))];
}

async function fetchOne(cp: Chokepoint) {
  const [marine, wind] = await Promise.all([
    fetchMarine(cp.lat, cp.lon).catch(() => null),
    fetchWind(cp.lat, cp.lon).catch(() => null),
  ]);
  return {
    id: cp.id,
    name: cp.name,
    region: cp.region,
    lat: cp.lat,
    lon: cp.lon,
    context: cp.context,
    waveHeightM:    marine?.wave_height    ?? null,
    wavePeriodS:    marine?.wave_period    ?? null,
    waveDirectionDeg: marine?.wave_direction ?? null,
    windSpeedMs:    wind?.wind_speed_10m  ?? null,
    windGustsMs:    wind?.wind_gusts_10m  ?? null,
    windDirectionDeg: wind?.wind_direction_10m ?? null,
    risk: classifyRisk(marine?.wave_height ?? null, wind?.wind_speed_10m ?? null),
    observedAt: marine?.time ?? wind?.time ?? null,
  };
}

async function main() {
  const chokepoints = await Promise.all(CHOKEPOINTS.map(fetchOne));

  const out = {
    lastUpdated: new Date().toISOString(),
    dataSource: 'Open-Meteo Marine + Forecast APIs (sourced from European met agencies)',
    sourceUrl: 'https://open-meteo.com',
    methodology: 'Significant wave height (m), wave period (s), 10m wind speed (m/s). Risk band is the worst of wave/wind classifications (calm / moderate / rough / dangerous), using Douglas-style sea-state and Beaufort wind thresholds.',
    chokepoints,
  };

  const outPath = path.join(process.cwd(), 'data', 'sea-state.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${chokepoints.length} chokepoints to ${outPath}`);
  for (const c of chokepoints) {
    const wave = c.waveHeightM != null ? `${c.waveHeightM.toFixed(2)}m` : '—';
    const wind = c.windSpeedMs != null ? `${c.windSpeedMs.toFixed(1)}m/s` : '—';
    console.log(`  ${c.name.padEnd(35)} wave ${wave.padEnd(8)} wind ${wind.padEnd(8)} risk ${c.risk}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
