import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Live Tanker Map — European Waters | EuroOilWatch',
  description:
    'Live AIS tracking of oil tankers across European waters, the North Sea, Mediterranean, and key chokepoints including the Strait of Hormuz and Suez Canal approaches.',
  alternates: { canonical: 'https://eurooilwatch.com/supply/map' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Live Tanker Map — European Waters | EuroOilWatch',
    description: 'Real-time oil tanker tracking across European waters, the Mediterranean, and key chokepoints.',
    url: 'https://eurooilwatch.com/supply/map',
    siteName: 'EuroOilWatch',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EuroOilWatch Live Tanker Map' }],
  },
};

// Must be dynamically imported — Leaflet cannot run server-side
const TankerMap = dynamic(() => import('@/components/TankerMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[500px] bg-oil-900/30 rounded-lg border border-oil-800">
      <div className="text-center space-y-3">
        <div className="text-3xl">🛢️</div>
        <p className="text-sm text-gray-400 animate-pulse">Loading map…</p>
      </div>
    </div>
  ),
});

// EU-focused bounding boxes:
// Core European waters: covers North Sea, English Channel, Baltic, Mediterranean, Black Sea
// Red Sea / Suez approaches: covers the Suez Canal corridor and Bab-el-Mandeb
const EU_BOUNDING_BOXES: [[number, number], [number, number]][] = [
  [[35.0, -15.0], [66.0, 40.0]],  // European waters — Atlantic coast, North Sea, Med, Black Sea
  [[10.0, 32.0],  [32.0, 62.0]],  // Red Sea, Bab-el-Mandeb, Gulf of Aden, Persian Gulf, Hormuz
];

export default function TankerMapPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <a href="/supply" className="text-xs text-oil-400 hover:underline">← Supply Routes</a>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
          <div>
            <h1 className="text-xl font-bold text-white">Live Tanker Map — European Waters</h1>
            <p className="mt-1 text-sm text-gray-400 max-w-2xl">
              Real-time AIS positions of oil tankers (vessel types 80–89) across European waters:
              North Sea, English Channel, Mediterranean, Baltic Sea, and key chokepoint approaches
              including Suez and the Red Sea. Click any vessel for details.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded border border-oil-700 text-gray-400 bg-oil-900/40">
              🔴 Live
            </span>
          </div>
        </div>
      </div>

      {/* Map — fills most of the viewport */}
      <div className="rounded-lg border border-oil-800 overflow-hidden" style={{ height: 'calc(100vh - 16rem)', minHeight: '500px', maxHeight: '780px' }}>
        <TankerMap
          boundingBoxes={EU_BOUNDING_BOXES}
          defaultCenter={[51.0, 10.0]}
          defaultZoom={5}
        />
      </div>

      {/* Context + notes */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-4 py-3 space-y-2">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">What you&apos;re seeing</h2>
          <div className="text-xs text-gray-400 space-y-1.5">
            <p>Vessels self-reporting as tanker types (80–89): crude oil tankers, product tankers, chemical tankers, and gas carriers. Type confirmation arrives via static data messages — unconfirmed vessels appear briefly then are filtered.</p>
            <p>Includes inland waterway tankers on the Rhine, Danube, and other major rivers — these may appear to be on land at low zoom levels. Zoom in to see river routing detail. Coverage also includes the Red Sea, Persian Gulf, and Strait of Hormuz.</p>
          </div>
        </div>
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-4 py-3 space-y-2">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Limitations</h2>
          <div className="text-xs text-gray-400 space-y-1.5">
            <p>AIS is self-reported and can be switched off. Shadow fleet tankers carrying sanctioned Russian oil frequently disable or spoof their AIS transponders, so coverage in the Baltic and Black Sea is incomplete.</p>
            <p>This tracker shows positional data only — cargo type, origin, and destination are not available from AIS position reports.</p>
          </div>
        </div>
      </div>

      {/* Data source */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-oil-800 bg-oil-900/20 px-4 py-3">
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>
            <span className="text-gray-400">AIS data:</span>{' '}
            <a href="https://aisstream.io" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">aisstream.io</a>
            {' '}— real-time WebSocket stream
          </p>
          <p>
            <span className="text-gray-400">Map tiles:</span>{' '}
            © <a href="https://openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">OpenStreetMap</a> contributors,{' '}
            © <a href="https://carto.com" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">CARTO</a>
          </p>
        </div>
        <a
          href="/supply"
          className="text-xs text-oil-400 hover:underline flex-shrink-0"
        >
          ← Back to Supply Routes analysis
        </a>
      </div>
    </div>
  );
}
