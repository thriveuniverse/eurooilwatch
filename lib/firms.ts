export interface FIRMSDetection {
  id: string;
  latitude: number;
  longitude: number;
  frp: number;           // Fire Radiative Power in MW
  confidence: 'l' | 'n' | 'h';
  acqDate: string;       // YYYY-MM-DD
  acqTime: string;       // HHMM
  daynight: 'D' | 'N';
  satellite: string;
  refinery: string;      // name of the nearby refinery/terminal
}

// Major EU and Gulf refinery / terminal locations
// Used to filter: only return FIRMS detections within RADIUS_DEG of a known facility
const KEY_FACILITIES: { name: string; lat: number; lon: number }[] = [
  // Northwest Europe
  { name: 'Shell Pernis, Rotterdam',         lat: 51.878, lon: 4.394 },
  { name: 'ExxonMobil Rotterdam',            lat: 51.892, lon: 4.255 },
  { name: 'Total Antwerp',                   lat: 51.274, lon: 4.343 },
  { name: 'BP Lingen, Germany',              lat: 52.524, lon: 7.323 },
  { name: 'Heide Refinery, Germany',         lat: 54.190, lon: 9.090 },
  { name: 'MiRO Karlsruhe, Germany',         lat: 49.033, lon: 8.270 },
  { name: 'PCK Schwedt, Germany',            lat: 52.990, lon: 14.280 },
  { name: 'PKN Orlen Płock, Poland',         lat: 52.550, lon: 19.730 },
  { name: 'Lotos Gdańsk, Poland',            lat: 54.320, lon: 18.720 },
  // Mediterranean
  { name: 'Total La Mède, Marseille',        lat: 43.389, lon: 5.089 },
  { name: 'Fos-sur-Mer terminal',            lat: 43.440, lon: 4.980 },
  { name: 'Saras Sarroch, Sardinia',         lat: 39.072, lon: 8.950 },
  { name: 'ISAB Priolo, Sicily',             lat: 37.182, lon: 15.170 },
  { name: 'Motor Oil Corinth, Greece',       lat: 37.940, lon: 22.890 },
  { name: 'Hellenic Petroleum Elefsina',     lat: 38.030, lon: 23.540 },
  { name: 'Tupras Izmit, Turkey',            lat: 40.754, lon: 29.830 },
  { name: 'Tupras Aliağa, Turkey',           lat: 38.820, lon: 26.970 },
  // Persian Gulf & Iran
  { name: 'Abadan Refinery, Iran',           lat: 30.330, lon: 48.320 },
  { name: 'Bandar Abbas Refinery, Iran',     lat: 27.170, lon: 56.270 },
  { name: 'Tehran Refinery, Iran',           lat: 35.640, lon: 51.320 },
  { name: 'Ras Tanura, Saudi Arabia',        lat: 26.650, lon: 50.160 },
  { name: 'Jubail Industrial City, KSA',     lat: 27.000, lon: 49.580 },
  { name: 'ADNOC Ruwais, UAE',               lat: 24.100, lon: 52.730 },
  { name: 'Mina Al Ahmadi, Kuwait',          lat: 29.070, lon: 48.140 },
];

// ~15km radius at mid-latitudes
const RADIUS_DEG = 0.14;

// Three non-overlapping bounding boxes covering all facility regions
const QUERY_AREAS = [
  '-12,35,28,60',  // Western & Central Europe
  '28,34,45,46',   // Eastern Med, Turkey, Black Sea
  '44,22,62,33',   // Persian Gulf, Iran, Gulf of Oman
];

type RawFIRMS = {
  latitude: string;
  longitude: string;
  frp: string;
  confidence: string;
  acq_date: string;
  acq_time: string;
  daynight: string;
  satellite: string;
};

function nearestFacility(lat: number, lon: number): string | null {
  for (const f of KEY_FACILITIES) {
    const d = Math.sqrt((lat - f.lat) ** 2 + (lon - f.lon) ** 2);
    if (d <= RADIUS_DEG) return f.name;
  }
  return null;
}

async function fetchArea(mapKey: string, area: string): Promise<FIRMSDetection[]> {
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/json/${mapKey}/VIIRS_SNPP_NRT/${area}/1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const res = await fetch(url, {
    signal: controller.signal,
    next: { revalidate: 3600 },
  });
  clearTimeout(timeout);

  if (!res.ok) return [];

  // FIRMS returns HTML error pages for bad keys — guard against that
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
    const text = await res.text();
    if (text.trimStart().startsWith('<')) return []; // HTML error
    try {
      const parsed = JSON.parse(text) as RawFIRMS[];
      return processRaw(parsed);
    } catch {
      return [];
    }
  }

  const raw = await res.json() as RawFIRMS[];
  return processRaw(raw);
}

function processRaw(raw: RawFIRMS[]): FIRMSDetection[] {
  const results: FIRMSDetection[] = [];
  for (const r of raw) {
    const lat = parseFloat(r.latitude);
    const lon = parseFloat(r.longitude);
    const frp = parseFloat(r.frp);
    if (isNaN(lat) || isNaN(lon) || isNaN(frp)) continue;

    // Low confidence = skip
    if (r.confidence === 'l') continue;

    const refinery = nearestFacility(lat, lon);
    if (!refinery) continue;

    results.push({
      id: `${r.acq_date}-${r.acq_time}-${lat.toFixed(3)}-${lon.toFixed(3)}`,
      latitude: lat,
      longitude: lon,
      frp,
      confidence: r.confidence as 'l' | 'n' | 'h',
      acqDate: r.acq_date,
      acqTime: r.acq_time,
      daynight: r.daynight as 'D' | 'N',
      satellite: r.satellite,
      refinery,
    });
  }
  return results;
}

export type FIRMSStatus = 'ok' | 'no_key' | 'error';

export async function getFIRMSDetections(): Promise<{ status: FIRMSStatus; detections: FIRMSDetection[] }> {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) return { status: 'no_key', detections: [] };

  try {
    const results = await Promise.allSettled(
      QUERY_AREAS.map(area => fetchArea(mapKey, area))
    );

    const detections: FIRMSDetection[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') detections.push(...r.value);
    }

    // Deduplicate by id, sort strongest FRP first
    const seen = new Set<string>();
    const unique = detections.filter(d => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    return {
      status: 'ok',
      detections: unique.sort((a, b) => b.frp - a.frp),
    };
  } catch {
    return { status: 'error', detections: [] };
  }
}

export function frpSeverity(frp: number): 'red' | 'orange' | 'yellow' | 'gray' {
  if (frp >= 500) return 'red';
  if (frp >= 100) return 'orange';
  if (frp >= 30)  return 'yellow';
  return 'gray';
}
