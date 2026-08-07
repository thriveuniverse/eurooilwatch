import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Read-only AIS snapshot endpoint.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * HARD RULE: this route MUST NEVER open a connection to aisstream.io.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Why: until Aug 2026 the map connected each visitor's browser directly to
 * aisstream using a NEXT_PUBLIC_ key. That (a) shipped the credential to every
 * visitor and (b) scaled upstream connections with traffic, which throttled the
 * whole aisstream account at user level and starved the 4-hourly collector.
 *
 * The replacement is a producer/consumer split:
 *   producer — a *scheduled* job opens exactly one short aisstream connection
 *              and writes a snapshot.
 *   consumer — this route, which only ever reads what the producer wrote.
 *
 * Note the producer is deliberately NOT "whichever request finds an empty
 * cache". That design lets N simultaneous visitors stampede an expired cache
 * and open N upstream connections before the first one finishes writing.
 * A scheduled producer makes upstream load a constant, independent of traffic.
 */

export const dynamic = 'force-dynamic';

const SNAPSHOTS_FILE = path.join(process.cwd(), 'data', 'tanker-snapshots.json');

// Committed collector runs every 4h. Anything older than ~9h means two
// consecutive runs failed and the map should say so rather than imply currency.
const COLLECTOR_STALE_AFTER_MS = 9 * 60 * 60 * 1000;

interface Vessel {
  mmsi: string;
  lat: number;
  lon: number;
  cog?: number;
  sog?: number;
  zone: string;
}

interface SnapshotPayload {
  capturedAt: string;
  source: 'aisstream-scheduled' | 'aisstream-collector';
  ageMs: number;
  stale: boolean;
  vessels: Vessel[];
}

// The scheduled producer refreshes every 5 min. Past ~20 min means several runs
// failed and the map should stop implying the picture is current.
const SCHEDULED_STALE_AFTER_MS = 20 * 60 * 1000;

/**
 * Preferred source: the Blob written by netlify/functions/capture-ais.mts.
 *
 * Returning null falls through to the 4-hourly collector file, which is the
 * required graceful-degradation path — a failed live capture must never blank
 * the map. Note this only ever READS; the producer is the only thing that talks
 * to aisstream, and it runs on a schedule rather than on request.
 */
async function readScheduledSnapshot(): Promise<SnapshotPayload | null> {
  try {
    // Imported lazily so local `next dev` (where Blobs is unconfigured) falls
    // straight through to the collector file instead of failing the route.
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('ais');
    const blob = await store.get('snapshot.json', { type: 'json' });
    if (!blob || typeof blob !== 'object') return null;

    const snap = blob as { capturedAt?: string; vessels?: Vessel[] };
    const vessels = Array.isArray(snap.vessels) ? snap.vessels : [];
    if (!snap.capturedAt || vessels.length === 0) return null;

    const ageMs = Date.now() - new Date(snap.capturedAt).getTime();
    return {
      capturedAt: snap.capturedAt,
      source: 'aisstream-scheduled',
      ageMs,
      stale: !Number.isFinite(ageMs) || ageMs > SCHEDULED_STALE_AFTER_MS,
      vessels,
    };
  } catch {
    // Blobs unavailable (local dev, misconfiguration, transient error).
    // Silent by design: the collector fallback below is a valid answer.
    return null;
  }
}

/** Fallback: latest snapshot committed by the 4-hourly GitHub Actions collector. */
function readCollectorSnapshot(): SnapshotPayload | null {
  try {
    if (!fs.existsSync(SNAPSHOTS_FILE)) return null;
    const file = JSON.parse(fs.readFileSync(SNAPSHOTS_FILE, 'utf8'));
    const snapshots = Array.isArray(file?.snapshots) ? file.snapshots : [];
    if (snapshots.length === 0) return null;

    // Walk backwards to the most recent snapshot that actually carries
    // plottable positions. Snapshots captured before Aug 2026 stored only
    // MMSIs, so the newest entry is not necessarily the newest *usable* one.
    for (let i = snapshots.length - 1; i >= 0; i--) {
      const snap = snapshots[i];
      const vessels: Vessel[] = Array.isArray(snap?.vessels) ? snap.vessels : [];
      if (vessels.length === 0) continue;
      const capturedAt = snap.capturedAt;
      const ageMs = Date.now() - new Date(capturedAt).getTime();
      return {
        capturedAt,
        source: 'aisstream-collector',
        ageMs,
        stale: !Number.isFinite(ageMs) || ageMs > COLLECTOR_STALE_AFTER_MS,
        vessels,
      };
    }
    return null;
  } catch (err) {
    console.error('[/api/ais-snapshot] Failed to read collector snapshot:', err);
    return null;
  }
}

export async function GET() {
  const payload = (await readScheduledSnapshot()) ?? readCollectorSnapshot();

  if (!payload) {
    // No positions available from any producer. Return 200 with an explicit
    // empty result rather than an error: the map renders an honest "no data"
    // state, and a transient producer failure never surfaces as a broken page.
    return NextResponse.json(
      {
        capturedAt: null,
        source: null,
        ageMs: null,
        stale: true,
        vessels: [],
        note: 'No AIS positions available. The scheduled producer and the 4-hourly collector both returned no plottable data.',
      },
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' } },
    );
  }

  return NextResponse.json(payload, {
    // Short edge cache. The producer refreshes on a fixed schedule, so serving a
    // slightly stale copy is always preferable to hitting origin on every poll.
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' },
  });
}
