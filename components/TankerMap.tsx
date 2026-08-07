'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * TankerMap — reads vessel positions from /api/ais-snapshot.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * HARD RULE: this component MUST NEVER hold an aisstream.io credential or open
 * a connection to aisstream. It talks to our own API and nothing else.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Until Aug 2026 this component opened a WebSocket straight to aisstream using a
 * browser-exposed (NEXT_PUBLIC_) key. Two consequences: the key was compiled into the
 * browser bundle and readable by every visitor, and upstream connections scaled
 * one-per-viewer, which throttled the aisstream account at *user* level and
 * starved the 4-hourly collector for two days before anyone noticed.
 *
 * Now: a scheduled server-side producer makes exactly one short capture on a
 * fixed interval; every browser polls the resulting snapshot. Upstream load is
 * a constant, whether one person is watching or five thousand.
 */

interface Vessel {
  mmsi: string;
  name?: string;
  lat: number;
  lon: number;
  cog?: number;
  sog?: number;
  zone: string;
}

interface SnapshotResponse {
  capturedAt: string | null;
  source: 'aisstream-scheduled' | 'aisstream-collector' | null;
  ageMs: number | null;
  stale: boolean;
  vessels: Vessel[];
  note?: string;
}

interface Props {
  defaultCenter: [number, number];
  defaultZoom: number;
}

// How often the browser asks our API for a fresher snapshot. Deliberately slow:
// the producer only refreshes on its own schedule, so polling faster just costs
// bandwidth without ever yielding newer data.
const POLL_MS = 90_000;

// Age thresholds per producer, used to colour the freshness label. The two
// producers run at very different cadences, so a single threshold would either
// mark the 5-minute feed stale too late or the 4-hourly one stale immediately.
const AGE_THRESHOLDS: Record<string, { fresh: number; ageing: number }> = {
  'aisstream-scheduled': { fresh: 15 * 60_000, ageing: 60 * 60_000 },
  'aisstream-collector': { fresh: 5 * 3_600_000, ageing: 9 * 3_600_000 },
};

function formatAge(ms: number): string {
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
  return `${Math.round(hours / 24)} day${Math.round(hours / 24) !== 1 ? 's' : ''} ago`;
}

export default function TankerMap({ defaultCenter, defaultZoom }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  // Ticks once a minute purely so the "updated N min ago" label stays honest
  // between polls, without refetching.
  const [, setClockTick] = useState(0);

  const movingCount = vessels.filter(v => (v.sog ?? 0) > 0.5).length;

  const ageMs = capturedAt ? Date.now() - new Date(capturedAt).getTime() : null;
  const thresholds = AGE_THRESHOLDS[source ?? ''] ?? AGE_THRESHOLDS['aisstream-collector'];
  const ageState: 'fresh' | 'ageing' | 'stale' =
    ageMs === null || !Number.isFinite(ageMs) ? 'stale'
      : ageMs <= thresholds.fresh ? 'fresh'
      : ageMs <= thresholds.ageing ? 'ageing'
      : 'stale';

  // ── Fetch snapshot ────────────────────────────────────────────────────────
  const loadSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/ais-snapshot', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SnapshotResponse = await res.json();
      setFetchFailed(false);
      // Never replace good data with an empty result. A producer hiccup should
      // leave the last known picture on screen, ageing visibly, rather than
      // blanking the map and implying the sea emptied.
      if (Array.isArray(data.vessels) && data.vessels.length > 0) {
        setVessels(data.vessels);
        setCapturedAt(data.capturedAt);
        setSource(data.source);
      }
    } catch {
      // Same principle: a failed poll marks the data suspect but keeps it.
      setFetchFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
    const poll = setInterval(loadSnapshot, POLL_MS);
    const clock = setInterval(() => setClockTick(t => t + 1), 60_000);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, [loadSnapshot]);

  // ── Initialise Leaflet ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    import('leaflet').then(L => {
      if (!mapDivRef.current || mapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapDivRef.current!, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors © <a href="https://carto.com" target="_blank">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = { map, L };
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reconcile markers with the current snapshot ───────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const { map, L } = mapRef.current;
    const seen = new Set<string>();

    for (const vessel of vessels) {
      seen.add(vessel.mmsi);
      const moving = (vessel.sog ?? 0) > 0.5;
      const color = moving ? '#f97316' : '#6b7280';
      const size = moving ? 10 : 8;
      const cog = vessel.cog ?? 0;

      const arrowSvg = moving
        ? `<polygon points="4,0 0,10 8,10" fill="${color}" opacity="0.9" transform="rotate(${cog}, 4, 5) translate(-4,-5)"/>`
        : '';

      const icon = L.divIcon({
        className: '',
        iconSize: [size + 8, size + 8],
        iconAnchor: [(size + 8) / 2, (size + 8) / 2],
        html: `<svg width="${size + 8}" height="${size + 8}" viewBox="0 0 ${size + 8} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${(size + 8) / 2}" cy="${(size + 8) / 2}" r="${size / 2}" fill="${color}" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
          ${arrowSvg}
        </svg>`,
      });

      const existing = markersRef.current.get(vessel.mmsi);
      if (existing) {
        existing.setLatLng([vessel.lat, vessel.lon]);
        existing.setIcon(icon);
        existing.off('click');
        existing.on('click', () => setSelectedVessel(vessel));
      } else {
        const marker = L.marker([vessel.lat, vessel.lon], { icon }).addTo(map);
        marker.on('click', () => setSelectedVessel(vessel));
        markersRef.current.set(vessel.mmsi, marker);
      }
    }

    // Drop markers for vessels absent from the latest snapshot.
    for (const [mmsi, marker] of markersRef.current) {
      if (!seen.has(mmsi)) {
        marker.remove();
        markersRef.current.delete(mmsi);
      }
    }
  }, [vessels]);

  const dotClass =
    ageState === 'fresh'  ? 'bg-green-400' :
    ageState === 'ageing' ? 'bg-amber-400' : 'bg-red-400';
  const textClass =
    ageState === 'fresh'  ? 'text-green-400' :
    ageState === 'ageing' ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-oil-900/80 border-b border-oil-800 text-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
            <span className={`font-mono font-medium ${textClass}`}>
              {loading && !capturedAt
                ? 'Loading…'
                : capturedAt
                  ? `AIS positions · updated ${formatAge(ageMs ?? 0)}`
                  : 'No AIS positions available'}
            </span>
          </span>
          {vessels.length > 0 && (
            <span className="text-gray-500">
              {vessels.length} tanker{vessels.length !== 1 ? 's' : ''} · {movingCount} under way
            </span>
          )}
          {fetchFailed && capturedAt && (
            <span className="text-amber-400/80">Refresh failed — showing last known positions</span>
          )}
        </div>
        <span className="text-gray-600 hidden sm:inline">
          AIS via aisstream.io · tanker types 80–89
          {source === 'aisstream-collector' && ' · 4-hourly collector'}
        </span>
      </div>

      {/* Map container */}
      <div className="relative flex-1 min-h-0">
        <style>{`
          @import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
          .leaflet-container { background: #06111f; }
          .leaflet-control-attribution { background: rgba(6,17,31,0.85) !important; color: #4b5563 !important; font-size: 10px !important; }
          .leaflet-control-attribution a { color: #6b7280 !important; }
          .leaflet-bar a { background: #0d1f33 !important; color: #e5e7eb !important; border-color: #1e3a5f !important; }
          .leaflet-bar a:hover { background: #1e3a5f !important; }
        `}</style>

        <div ref={mapDivRef} className="absolute inset-0" />

        {/* Legend */}
        <div className="absolute bottom-6 left-3 z-[1000] bg-oil-950/90 border border-oil-800 rounded-lg px-3 py-2.5 text-xs space-y-1.5 pointer-events-none">
          <p className="font-mono font-semibold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Tankers</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
            <span className="text-gray-400">Under way</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500 flex-shrink-0" />
            <span className="text-gray-400">Anchored / moored</span>
          </div>
        </div>

        {/* No data at all — distinct from "stale but showing something" */}
        {!loading && vessels.length === 0 && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-oil-950/80 backdrop-blur-sm">
            <div className="bg-oil-900 border border-oil-700 rounded-xl px-6 py-5 max-w-sm w-full mx-4 text-center space-y-3">
              <p className="text-3xl">🛰️</p>
              <p className="text-sm font-semibold text-white">No AIS positions available</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Neither the scheduled capture nor the 4-hourly collector has returned
                plottable vessel positions. Coverage is terrestrial AIS, so it is
                strongest in North-West European waters.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected vessel info panel */}
      {selectedVessel && (
        <div className="flex-shrink-0 border-t border-oil-800 bg-oil-900/90 px-4 py-3">
          <div className="flex items-start justify-between gap-4 max-w-4xl">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {selectedVessel.name || `MMSI ${selectedVessel.mmsi}`}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                <span className="font-mono">MMSI: {selectedVessel.mmsi}</span>
                {selectedVessel.sog !== undefined && (
                  <span>Speed: <span className="text-white">{selectedVessel.sog.toFixed(1)} kn</span></span>
                )}
                {selectedVessel.cog !== undefined && (
                  <span>Course: <span className="text-white">{Math.round(selectedVessel.cog)}°</span></span>
                )}
                <span className="font-mono text-gray-500">
                  {selectedVessel.lat.toFixed(4)}, {selectedVessel.lon.toFixed(4)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedVessel(null)}
              className="text-gray-500 hover:text-white text-lg leading-none flex-shrink-0"
              aria-label="Close vessel details"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
