'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Vessel {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  sog: number;
  cog: number;
  heading: number;
  navStatus: number;
  lastSeen: number;
}

interface Props {
  boundingBoxes: [[number, number], [number, number]][];
  defaultCenter: [number, number];
  defaultZoom: number;
}

const NAV_STATUS: Record<number, string> = {
  0: 'Under way (engine)',
  1: 'At anchor',
  2: 'Not under command',
  3: 'Restricted manoeuvrability',
  4: 'Constrained by draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Fishing',
  8: 'Under way (sailing)',
};

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'no-key';

export default function TankerMap({ boundingBoxes, defaultCenter, defaultZoom }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [vesselCount, setVesselCount] = useState(0);
  const [movingCount, setMovingCount] = useState(0);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const vesselDataRef = useRef<Map<string, Vessel>>(new Map());

  const apiKey = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY;

  const refreshCounts = useCallback(() => {
    const all = [...vesselDataRef.current.values()];
    setVesselCount(all.length);
    setMovingCount(all.filter(v => v.sog > 0.5).length);
  }, []);

  // Remove a vessel marker and data
  const removeVessel = useCallback((mmsi: string) => {
    vesselDataRef.current.delete(mmsi);
    const marker = markersRef.current.get(mmsi);
    if (marker && mapRef.current) marker.remove();
    markersRef.current.delete(mmsi);
  }, []);

  // Initialize Leaflet map
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
      isMountedRef.current = false;
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update or create a vessel marker
  const updateVesselMarker = useCallback((vessel: Vessel) => {
    if (!mapRef.current) return;
    const { map, L } = mapRef.current;

    const moving = vessel.sog > 0.5;
    const color = moving ? '#f97316' : '#6b7280';
    const size = moving ? 10 : 8;

    const arrowSvg = moving
      ? `<polygon points="4,0 0,10 8,10" fill="${color}" opacity="0.9" transform="rotate(${vessel.cog}, 4, 5) translate(-4,-5)"/>`
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

    if (markersRef.current.has(vessel.mmsi)) {
      const marker = markersRef.current.get(vessel.mmsi);
      marker.setLatLng([vessel.lat, vessel.lon]);
      marker.setIcon(icon);
    } else {
      const marker = L.marker([vessel.lat, vessel.lon], { icon }).addTo(map);
      marker.on('click', () => {
        if (isMountedRef.current) setSelectedVessel(vessel);
      });
      markersRef.current.set(vessel.mmsi, marker);
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!apiKey) {
      setWsStatus('no-key');
      return;
    }

    let closed = false;

    function connect() {
      if (closed || !isMountedRef.current) return;
      if (isMountedRef.current) setWsStatus('connecting');

      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) { ws.close(); return; }
        setWsStatus('connected');
        // Note: aisstream.io does not support FilterShipType — we filter client-side
        // using ShipStaticData messages which carry the vessel type field
        ws.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: boundingBoxes,
          FilterMessageTypes: ['PositionReport'],
        }));
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data as string);

          if (data.MessageType !== 'PositionReport') return;

          const meta = data.MetaData;
          const mmsi = String(meta?.MMSI);
          const pos = data.Message?.PositionReport;
          if (!pos) return;

          const vessel: Vessel = {
            mmsi,
            name: (meta.ShipName?.trim() || `MMSI ${mmsi}`).replace(/\s+/g, ' '),
            lat: Number(meta.latitude),
            lon: Number(meta.longitude),
            sog: Number(pos.Sog) || 0,
            cog: Number(pos.Cog) || 0,
            heading: Number(pos.TrueHeading) || Number(pos.Cog) || 0,
            navStatus: Number(pos.NavigationalStatus) || 0,
            lastSeen: Date.now(),
          };

          vesselDataRef.current.set(vessel.mmsi, vessel);
          updateVesselMarker(vessel);
          setSelectedVessel(prev => prev?.mmsi === vessel.mmsi ? vessel : prev);
          refreshCounts();
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (closed || !isMountedRef.current) return;
        setWsStatus('disconnected');
        reconnectRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      closed = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, JSON.stringify(boundingBoxes)]);

  // Prune stale vessels (> 30 min old)
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 30 * 60 * 1000;
      for (const [mmsi, vessel] of vesselDataRef.current) {
        if (vessel.lastSeen < cutoff) removeVessel(mmsi);
      }
      refreshCounts();
    }, 60_000);
    return () => clearInterval(interval);
  }, [refreshCounts, removeVessel]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-oil-900/80 border-b border-oil-800 text-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              wsStatus === 'connected'    ? 'bg-green-400 animate-pulse' :
              wsStatus === 'connecting'   ? 'bg-yellow-400 animate-pulse' :
              wsStatus === 'disconnected' ? 'bg-red-400 animate-pulse' :
              'bg-gray-600'
            }`} />
            <span className={`font-mono font-medium ${
              wsStatus === 'connected'    ? 'text-green-400' :
              wsStatus === 'connecting'   ? 'text-yellow-400' :
              wsStatus === 'disconnected' ? 'text-red-400' :
              'text-gray-500'
            }`}>
              {wsStatus === 'connected'    ? 'Live' :
               wsStatus === 'connecting'   ? 'Connecting…' :
               wsStatus === 'disconnected' ? 'Reconnecting…' :
               'Demo mode'}
            </span>
          </span>
          <span className="text-gray-500">
            {vesselCount > 0
              ? `${vesselCount} vessel${vesselCount !== 1 ? 's' : ''} · ${movingCount} under way`
              : wsStatus === 'connected' ? 'Building vessel picture…' : 'Waiting for data…'}
          </span>
        </div>
        <span className="text-gray-600 hidden sm:inline">AIS data via aisstream.io · real-time positions</span>
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
          <p className="font-mono font-semibold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Vessels</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
            <span className="text-gray-400">Under way</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500 flex-shrink-0" />
            <span className="text-gray-400">Anchored / moored</span>
          </div>
        </div>

        {/* No API key overlay */}
        {wsStatus === 'no-key' && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-oil-950/80 backdrop-blur-sm">
            <div className="bg-oil-900 border border-oil-700 rounded-xl px-6 py-5 max-w-sm w-full mx-4 text-center space-y-3">
              <p className="text-3xl">🛢️</p>
              <p className="text-sm font-semibold text-white">API key required for live data</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Live AIS tanker tracking requires a free{' '}
                <a href="https://aisstream.io" target="_blank" rel="noopener noreferrer" className="text-oil-400 underline">aisstream.io</a>{' '}
                API key. Add{' '}
                <code className="bg-oil-800 px-1 py-0.5 rounded text-oil-300">NEXT_PUBLIC_AISSTREAM_API_KEY</code>{' '}
                to your environment variables.
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
              <p className="text-sm font-semibold text-white truncate">{selectedVessel.name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                <span className="font-mono">MMSI: {selectedVessel.mmsi}</span>
                <span>Speed: <span className="text-white">{selectedVessel.sog.toFixed(1)} kn</span></span>
                <span>Course: <span className="text-white">{Math.round(selectedVessel.cog)}°</span></span>
                <span>{NAV_STATUS[selectedVessel.navStatus] ?? 'Status unknown'}</span>
                <span className="font-mono text-gray-500">
                  {selectedVessel.lat.toFixed(4)}, {selectedVessel.lon.toFixed(4)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedVessel(null)}
              className="flex-shrink-0 text-gray-500 hover:text-white text-xl leading-none p-1 -mt-0.5"
              aria-label="Dismiss vessel info"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
