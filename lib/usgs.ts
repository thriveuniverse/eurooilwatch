export interface USGSQuake {
  id: string;
  title: string;
  place: string;
  magnitude: number;
  time: number; // ms timestamp
  url: string;
  alert: 'green' | 'yellow' | 'orange' | 'red' | null; // PAGER estimated impact
  tsunami: boolean;
  coordinates: [number, number, number]; // [lon, lat, depth_km]
  region: string;
}

// Bounding boxes for regions with direct relevance to EU oil supply infrastructure
const OIL_REGIONS: { name: string; minLat: number; maxLat: number; minLon: number; maxLon: number }[] = [
  { name: 'Middle East & Gulf',      minLat: 10, maxLat: 42, minLon: 28, maxLon: 65 },
  { name: 'North Africa',            minLat: 14, maxLat: 38, minLon: -18, maxLon: 37 },
  { name: 'Caspian & Central Asia',  minLat: 35, maxLat: 50, minLon: 48, maxLon: 70 },
  { name: 'Caucasus',                minLat: 38, maxLat: 44, minLon: 39, maxLon: 54 },
  { name: 'North Sea & Nordic',      minLat: 50, maxLat: 73, minLon: -15, maxLon: 35 },
  { name: 'Southern Europe',         minLat: 35, maxLat: 48, minLon: -10, maxLon: 30 },
];

const MIN_MAGNITUDE = 5.0;

function getRegion(lon: number, lat: number): string | null {
  for (const r of OIL_REGIONS) {
    if (lat >= r.minLat && lat <= r.maxLat && lon >= r.minLon && lon <= r.maxLon) {
      return r.name;
    }
  }
  return null;
}

type GeoJSONFeature = {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    alert: string | null;
    tsunami: number;
    title: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
};

export async function getUSGSQuakes(): Promise<USGSQuake[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson',
      {
        signal: controller.signal,
        next: { revalidate: 3600 },
      }
    );
    clearTimeout(timeout);

    if (!res.ok) return [];

    const json = await res.json() as { features: GeoJSONFeature[] };
    const quakes: USGSQuake[] = [];

    for (const f of json.features || []) {
      const mag = f.properties.mag;
      if (!mag || mag < MIN_MAGNITUDE) continue;

      const [lon, lat, depth] = f.geometry.coordinates;
      const region = getRegion(lon, lat);
      if (!region) continue;

      const alert = f.properties.alert as USGSQuake['alert'];

      quakes.push({
        id: f.id,
        title: f.properties.title,
        place: f.properties.place || '',
        magnitude: mag,
        time: f.properties.time,
        url: f.properties.url,
        alert,
        tsunami: f.properties.tsunami === 1,
        coordinates: [lon, lat, depth],
        region,
      });
    }

    // Most severe first, then most recent
    return quakes.sort((a, b) => {
      const magDiff = b.magnitude - a.magnitude;
      if (Math.abs(magDiff) > 0.4) return magDiff;
      return b.time - a.time;
    });
  } catch {
    return [];
  }
}

// Magnitude-based severity for display (used when PAGER alert is unavailable)
export function magSeverity(mag: number): 'red' | 'orange' | 'yellow' | 'gray' {
  if (mag >= 6.5) return 'red';
  if (mag >= 6.0) return 'orange';
  if (mag >= 5.5) return 'yellow';
  return 'gray';
}
