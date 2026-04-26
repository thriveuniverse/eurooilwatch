#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Tanker Snapshot Collector
 * =========================================
 * Connects to aisstream.io for ~3 minutes, captures unique tanker MMSIs
 * (vessel types 80–89) inside three chokepoint polygons, and appends a
 * snapshot to data/tanker-snapshots.json (rolling 30-day window).
 *
 * Designed to be run on a GitHub Actions cron — the aggregator script
 * (aggregate-tanker-traffic.ts) then turns these snapshots into the
 * trend dataset that powers the UI.
 *
 * Env: AISSTREAM_API_KEY (server-side, set as GitHub secret)
 * Usage: npx tsx scripts/collect-tanker-snapshot.ts
 * Output: data/tanker-snapshots.json
 */

import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'tanker-snapshots.json');
const RETENTION_DAYS = 30;
const CAPTURE_MS = parseInt(process.env.CAPTURE_MS ?? '180000', 10); // 3 min default

// Bounding boxes are [[minLat, minLon], [maxLat, maxLon]] — match aisstream format
const ZONES = {
  hormuz: { name: 'Strait of Hormuz', box: [[24.0, 54.0], [27.5, 58.0]] as [[number, number], [number, number]] },
  ara:    { name: 'ARA approaches',   box: [[51.0,  2.0], [53.5,  5.5]] as [[number, number], [number, number]] },
  suez:   { name: 'Suez / Bab-el-Mandeb', box: [[10.0, 32.0], [32.0, 44.0]] as [[number, number], [number, number]] },
};

type ZoneKey = keyof typeof ZONES;

interface Snapshot {
  capturedAt: string;            // ISO timestamp
  captureWindowMs: number;       // how long we listened
  zones: Record<ZoneKey, {
    name: string;
    uniqueTankers: number;       // unique MMSIs of vessel types 80-89 seen in window
    mmsis: string[];             // for downstream dedup / transit detection
  }>;
}

interface SnapshotsFile {
  lastUpdated: string;
  retentionDays: number;
  snapshots: Snapshot[];
}

function inBox(lat: number, lon: number, box: [[number, number], [number, number]]) {
  return lat >= box[0][0] && lat <= box[1][0] && lon >= box[0][1] && lon <= box[1][1];
}

function isTankerType(t: number) {
  return t >= 80 && t <= 89;
}

async function captureSnapshot(apiKey: string): Promise<Snapshot> {
  const seenInZone: Record<ZoneKey, Set<string>> = {
    hormuz: new Set(), ara: new Set(), suez: new Set(),
  };
  // We may receive a position before a static-type message (or vice versa).
  // Track last-known zone per MMSI and last-known type, then count once we know both.
  const positionZone = new Map<string, ZoneKey>();
  const knownType = new Map<string, number>();

  function tryClassify(mmsi: string) {
    const zone = positionZone.get(mmsi);
    const type = knownType.get(mmsi);
    if (zone === undefined || type === undefined) return;
    if (isTankerType(type)) seenInZone[zone].add(mmsi);
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    const startedAt = Date.now();

    const closeAndResolve = () => {
      try { ws.close(); } catch { /* ignore */ }
      const snapshot: Snapshot = {
        capturedAt: new Date().toISOString(),
        captureWindowMs: Date.now() - startedAt,
        zones: {
          hormuz: { name: ZONES.hormuz.name, uniqueTankers: seenInZone.hormuz.size, mmsis: [...seenInZone.hormuz] },
          ara:    { name: ZONES.ara.name,    uniqueTankers: seenInZone.ara.size,    mmsis: [...seenInZone.ara] },
          suez:   { name: ZONES.suez.name,   uniqueTankers: seenInZone.suez.size,   mmsis: [...seenInZone.suez] },
        },
      };
      resolve(snapshot);
    };

    ws.addEventListener('open', () => {
      console.log('🛰️  WebSocket open, subscribing…');
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [
          ZONES.hormuz.box,
          ZONES.ara.box,
          ZONES.suez.box,
        ],
        // Subscribe to position reports + static data so we can filter to tankers
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      }));
      setTimeout(closeAndResolve, CAPTURE_MS);
    });

    ws.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        const meta = msg.MetaData;
        if (!meta) return;
        const mmsi = String(meta.MMSI);
        if (msg.MessageType === 'PositionReport') {
          const pr = msg.Message?.PositionReport;
          if (!pr) return;
          const lat = pr.Latitude, lon = pr.Longitude;
          for (const [key, z] of Object.entries(ZONES) as [ZoneKey, typeof ZONES[ZoneKey]][]) {
            if (inBox(lat, lon, z.box)) {
              positionZone.set(mmsi, key);
              break;
            }
          }
          tryClassify(mmsi);
        } else if (msg.MessageType === 'ShipStaticData') {
          const sd = msg.Message?.ShipStaticData;
          if (!sd) return;
          knownType.set(mmsi, sd.Type ?? 0);
          tryClassify(mmsi);
        }
      } catch (e) {
        // Ignore malformed messages
      }
    });

    ws.addEventListener('error', (ev) => {
      console.error('⚠️  WebSocket error:', ev);
      reject(new Error('WebSocket error'));
    });

    ws.addEventListener('close', () => {
      // If we close before timeout, still resolve with whatever we got
      if (Date.now() - startedAt < CAPTURE_MS - 1000) {
        console.log('  socket closed early, returning partial snapshot');
        const snapshot: Snapshot = {
          capturedAt: new Date().toISOString(),
          captureWindowMs: Date.now() - startedAt,
          zones: {
            hormuz: { name: ZONES.hormuz.name, uniqueTankers: seenInZone.hormuz.size, mmsis: [...seenInZone.hormuz] },
            ara:    { name: ZONES.ara.name,    uniqueTankers: seenInZone.ara.size,    mmsis: [...seenInZone.ara] },
            suez:   { name: ZONES.suez.name,   uniqueTankers: seenInZone.suez.size,   mmsis: [...seenInZone.suez] },
          },
        };
        resolve(snapshot);
      }
    });
  });
}

function loadExisting(): SnapshotsFile {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return { lastUpdated: new Date(0).toISOString(), retentionDays: RETENTION_DAYS, snapshots: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  } catch {
    return { lastUpdated: new Date(0).toISOString(), retentionDays: RETENTION_DAYS, snapshots: [] };
  }
}

function pruneOld(snapshots: Snapshot[]): Snapshot[] {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return snapshots.filter(s => new Date(s.capturedAt).getTime() >= cutoff);
}

async function main() {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.error('❌ AISSTREAM_API_KEY env var not set');
    process.exit(1);
  }

  console.log(`🛢️  Capturing tanker snapshot (${CAPTURE_MS / 1000}s window)…`);
  const snap = await captureSnapshot(apiKey);

  console.log('📊 Tankers in zone:');
  for (const [k, z] of Object.entries(snap.zones)) {
    console.log(`   ${k.padEnd(8)} ${z.name.padEnd(24)} ${z.uniqueTankers}`);
  }

  const file = loadExisting();
  file.snapshots.push(snap);
  file.snapshots = pruneOld(file.snapshots);
  file.lastUpdated = new Date().toISOString();

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(file, null, 2));
  console.log(`✅ Saved ${file.snapshots.length} snapshots to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

main().catch(err => {
  console.error('❌ Collector failed:', err);
  process.exit(1);
});
