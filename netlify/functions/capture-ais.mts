import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import WebSocket from 'ws';

/**
 * Scheduled AIS snapshot producer.
 *
 * Runs every 5 minutes, opens EXACTLY ONE short aisstream connection, and writes
 * the result to a Netlify Blob. Browsers never touch aisstream — they poll
 * /api/ais-snapshot, which only reads what this function wrote.
 *
 * Why scheduled rather than lazy/on-demand: a "refresh when a request finds the
 * cache expired" design lets N simultaneous visitors stampede an expired cache
 * and open N upstream connections before the first finishes writing. Upstream
 * load must be a constant independent of traffic — that is the whole point.
 *
 * ── The 8-second window problem, and how the type cache solves it ───────────
 * Classifying a vessel as a tanker requires ShipStaticData, which carries the
 * `Type` field. AIS transmits static data only every ~6 minutes, so an 8-second
 * capture sees it for almost nobody — while PositionReports arrive constantly.
 * Naively, a short window would yield positions we cannot classify and would
 * report near-zero tankers.
 *
 * So we persist an MMSI → type cache in a second Blob. Each run learns whatever
 * static data it happens to catch, merges it in, and classifies this run's
 * positions against the accumulated cache. After a few hours the cache covers
 * the regulars and classification is reliable, with an 8-second upstream cost.
 */

const CAPTURE_MS = 8_000;
const STORE = 'ais';
const SNAPSHOT_KEY = 'snapshot.json';
const TYPE_CACHE_KEY = 'vessel-types.json';

// Bound the cache so it cannot grow forever in blob storage.
const TYPE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const TYPE_CACHE_MAX = 60_000;

/**
 * European waters — the geography the MAP needs.
 *
 * Deliberately NOT the collector's chokepoint boxes (hormuz/ara/suez): that job
 * measures transit counts through three straits, this one paints a European
 * picture. Note aisstream is terrestrial AIS, so real coverage is far better in
 * the North Sea than the Mediterranean, and the Persian Gulf has effectively
 * none — which is why Hormuz is sourced from PortWatch satellite data instead
 * and must never be presented as covered here.
 */
const ZONES: Record<string, [[number, number], [number, number]]> = {
  nwEurope: [[48.0, -10.0], [61.0, 13.0]], // North Sea, Channel, ARA, Irish Sea
  baltic:   [[53.0, 9.0], [66.0, 31.0]],
  medWest:  [[30.0, -6.0], [46.0, 37.0]],  // Med incl. Gibraltar and Aegean
};

function isTankerType(t: number) {
  return t >= 80 && t <= 89;
}

function zoneFor(lat: number, lon: number): string | null {
  for (const [key, box] of Object.entries(ZONES)) {
    if (lat >= box[0][0] && lat <= box[1][0] && lon >= box[0][1] && lon <= box[1][1]) return key;
  }
  return null;
}

interface Vessel {
  mmsi: string;
  name?: string;
  lat: number;
  lon: number;
  cog?: number;
  sog?: number;
  zone: string;
}

interface TypeCacheEntry { type: number; name?: string; seen: number }

interface CaptureResult {
  vessels: Vessel[];
  messageCount: number;
  serverNotice: string;
  learnedTypes: Map<string, TypeCacheEntry>;
}

function capture(apiKey: string, typeCache: Map<string, TypeCacheEntry>): Promise<CaptureResult> {
  return new Promise((resolve) => {
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    const positions = new Map<string, { lat: number; lon: number; cog?: number; sog?: number; zone: string }>();
    const learnedTypes = new Map<string, TypeCacheEntry>();
    let messageCount = 0;
    let serverNotice = '';
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Close explicitly — never leave a socket dangling into the next invocation.
      try { ws.close(); } catch { /* already closing */ }

      const vessels: Vessel[] = [];
      for (const [mmsi, pos] of positions) {
        const known = learnedTypes.get(mmsi) ?? typeCache.get(mmsi);
        if (!known || !isTankerType(known.type)) continue;
        vessels.push({ mmsi, name: known.name, lat: pos.lat, lon: pos.lon, cog: pos.cog, sog: pos.sog, zone: pos.zone });
      }
      resolve({ vessels, messageCount, serverNotice, learnedTypes });
    };

    const timer = setTimeout(finish, CAPTURE_MS);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: Object.values(ZONES),
        // Only what we need. Subscribing to the whole world or to every message
        // type would multiply upstream volume for no benefit.
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      }));
    });

    ws.on('message', (raw: Buffer) => {
      messageCount++;
      try {
        const msg = JSON.parse(raw.toString());
        if (!msg.MetaData) {
          // Non-AIS frame: aisstream reports auth/quota rejections this way.
          if (!serverNotice) serverNotice = raw.toString().slice(0, 300);
          return;
        }
        const mmsi = String(msg.MetaData.MMSI);

        if (msg.MessageType === 'PositionReport') {
          const pr = msg.Message?.PositionReport;
          if (!pr) return;
          const { Latitude: lat, Longitude: lon } = pr;
          if (typeof lat !== 'number' || typeof lon !== 'number') return;
          const zone = zoneFor(lat, lon);
          if (!zone) return;
          positions.set(mmsi, { lat, lon, cog: pr.Cog, sog: pr.Sog, zone });
        } else if (msg.MessageType === 'ShipStaticData') {
          const sd = msg.Message?.ShipStaticData;
          if (!sd) return;
          const name = typeof sd.Name === 'string' && sd.Name.trim() ? sd.Name.trim() : undefined;
          learnedTypes.set(mmsi, { type: sd.Type ?? 0, name, seen: Date.now() });
        }
      } catch { /* malformed frame — ignore */ }
    });

    ws.on('error', () => finish());
    ws.on('close', () => finish());
  });
}

export default async function handler() {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.error('[capture-ais] AISSTREAM_API_KEY not set — leaving previous snapshot untouched.');
    return new Response('Missing AISSTREAM_API_KEY', { status: 500 });
  }

  const store = getStore(STORE);

  // Load the accumulated MMSI → type cache.
  let typeCache = new Map<string, TypeCacheEntry>();
  try {
    const raw = await store.get(TYPE_CACHE_KEY, { type: 'json' });
    if (raw && typeof raw === 'object') typeCache = new Map(Object.entries(raw as Record<string, TypeCacheEntry>));
  } catch (err) {
    console.warn('[capture-ais] Could not read type cache, starting empty:', err);
  }

  const { vessels, messageCount, serverNotice, learnedTypes } = await capture(apiKey, typeCache);

  console.log(`[capture-ais] frames=${messageCount} tankers=${vessels.length} newTypes=${learnedTypes.size} cache=${typeCache.size}`);

  // Merge and prune the type cache. Worth persisting even when the capture
  // yielded no plottable tankers — the types learned still improve later runs.
  if (learnedTypes.size > 0) {
    for (const [mmsi, entry] of learnedTypes) typeCache.set(mmsi, entry);
    const cutoff = Date.now() - TYPE_CACHE_TTL_MS;
    let entries = [...typeCache].filter(([, v]) => (v.seen ?? 0) >= cutoff);
    if (entries.length > TYPE_CACHE_MAX) {
      entries.sort((a, b) => (b[1].seen ?? 0) - (a[1].seen ?? 0));
      entries = entries.slice(0, TYPE_CACHE_MAX);
    }
    try {
      await store.setJSON(TYPE_CACHE_KEY, Object.fromEntries(entries));
    } catch (err) {
      console.error('[capture-ais] Failed to persist type cache:', err);
    }
  }

  // ── Never replace good data with an empty snapshot ───────────────────────
  // A throttled key, an aisstream hiccup or a cold type cache all produce zero
  // vessels. Overwriting a good snapshot with that would blank the map and
  // imply the sea emptied. Leave the previous blob in place and let the map's
  // age indicator go amber, then red, which is the honest signal.
  if (vessels.length === 0) {
    console.error(
      `[capture-ais] No tankers resolved (frames=${messageCount}). Retaining previous snapshot.` +
      (serverNotice ? ` aisstream said: ${serverNotice}` : messageCount === 0
        ? ' Zero frames — key is likely expired, revoked or throttled.'
        : ' Frames arrived but none resolved to a known tanker; the type cache may still be warming.')
    );
    return new Response('No vessels captured; previous snapshot retained', { status: 200 });
  }

  await store.setJSON(SNAPSHOT_KEY, {
    capturedAt: new Date().toISOString(),
    source: 'aisstream-scheduled',
    captureWindowMs: CAPTURE_MS,
    messageCount,
    vessels,
  });

  return new Response(`Captured ${vessels.length} tankers`, { status: 200 });
}

export const config: Config = {
  schedule: '*/5 * * * *',
};
