#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Tanker Traffic Aggregator
 * =========================================
 * Reads data/tanker-snapshots.json and produces data/tanker-traffic.json
 * with per-zone counts: latest snapshot, 24h unique tankers, 7d unique
 * tankers, and 4-week trailing daily average for trend comparison.
 *
 * Usage: npx tsx scripts/aggregate-tanker-traffic.ts
 * Output: data/tanker-traffic.json
 */

import * as fs from 'fs';
import * as path from 'path';

const SNAPSHOTS_FILE = path.join(__dirname, '..', 'data', 'tanker-snapshots.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'tanker-traffic.json');

interface Snapshot {
  capturedAt: string;
  captureWindowMs: number;
  zones: Record<string, { name: string; uniqueTankers: number; mmsis: string[] }>;
}

interface SnapshotsFile {
  lastUpdated: string;
  retentionDays: number;
  snapshots: Snapshot[];
}

interface ZoneAggregate {
  name: string;
  latestSnapshotCount: number;       // tankers in zone in most recent snapshot
  latestSnapshotAt: string;
  unique24h: number;                  // unique MMSIs across last-24h snapshots
  unique7d: number;                   // unique MMSIs across last-7d snapshots
  trailing28dDailyAvg: number;        // average daily-unique-MMSIs over trailing 28d (excl. last 7d)
  weekOverWeekDelta: number | null;   // unique7d minus prior-7d unique (null if insufficient history)
  history: { date: string; uniqueMmsis: number }[];  // daily counts, oldest first
}

interface TrafficFile {
  generatedAt: string;
  zones: Record<string, ZoneAggregate>;
}

function dayKey(iso: string): string { return iso.slice(0, 10); }

function uniqueMmsisInRange(snapshots: Snapshot[], zoneKey: string, fromMs: number, toMs: number): Set<string> {
  const seen = new Set<string>();
  for (const s of snapshots) {
    const t = new Date(s.capturedAt).getTime();
    if (t < fromMs || t >= toMs) continue;
    const z = s.zones[zoneKey];
    if (!z) continue;
    for (const m of z.mmsis) seen.add(m);
  }
  return seen;
}

function buildHistory(snapshots: Snapshot[], zoneKey: string, days: number): { date: string; uniqueMmsis: number }[] {
  const byDay = new Map<string, Set<string>>();
  for (const s of snapshots) {
    const k = dayKey(s.capturedAt);
    if (!byDay.has(k)) byDay.set(k, new Set());
    const z = s.zones[zoneKey];
    if (!z) continue;
    for (const m of z.mmsis) byDay.get(k)!.add(m);
  }
  // Fill missing days with 0 over the last N days
  const out: { date: string; uniqueMmsis: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const k = d.toISOString().slice(0, 10);
    out.push({ date: k, uniqueMmsis: byDay.get(k)?.size ?? 0 });
  }
  return out;
}

function aggregate(snapshots: Snapshot[]): TrafficFile {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const zones = new Set<string>();
  for (const s of snapshots) for (const z of Object.keys(s.zones)) zones.add(z);

  const out: TrafficFile = { generatedAt: new Date().toISOString(), zones: {} };

  // Use the latest snapshot to source zone display names
  const latestByZone: Record<string, Snapshot | undefined> = {};
  const sortedDesc = [...snapshots].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  for (const z of zones) latestByZone[z] = sortedDesc.find(s => s.zones[z] !== undefined);

  for (const z of zones) {
    const latest = latestByZone[z];
    const last24 = uniqueMmsisInRange(snapshots, z, now - day, now);
    const last7d = uniqueMmsisInRange(snapshots, z, now - 7 * day, now);
    const prior7d = uniqueMmsisInRange(snapshots, z, now - 14 * day, now - 7 * day);
    const trailing28dExcl7 = uniqueMmsisInRange(snapshots, z, now - 35 * day, now - 7 * day);
    // Average over the 28-day window (4 weeks of daily-equivalent counts)
    const trailing28dDailyAvg = trailing28dExcl7.size / 28;
    const wow = prior7d.size > 0 ? last7d.size - prior7d.size : null;

    out.zones[z] = {
      name: latest?.zones[z].name ?? z,
      latestSnapshotCount: latest?.zones[z].uniqueTankers ?? 0,
      latestSnapshotAt: latest?.capturedAt ?? new Date(0).toISOString(),
      unique24h: last24.size,
      unique7d: last7d.size,
      trailing28dDailyAvg: Number(trailing28dDailyAvg.toFixed(1)),
      weekOverWeekDelta: wow,
      history: buildHistory(snapshots, z, 30),
    };
  }

  return out;
}

function main() {
  if (!fs.existsSync(SNAPSHOTS_FILE)) {
    console.error(`❌ ${SNAPSHOTS_FILE} not found — run collect-tanker-snapshot first`);
    process.exit(1);
  }
  const file: SnapshotsFile = JSON.parse(fs.readFileSync(SNAPSHOTS_FILE, 'utf-8'));
  const traffic = aggregate(file.snapshots);

  console.log('🛢️  Aggregated tanker traffic:');
  for (const [k, z] of Object.entries(traffic.zones)) {
    const wow = z.weekOverWeekDelta;
    const wowStr = wow === null ? 'n/a' : (wow >= 0 ? `+${wow}` : `${wow}`);
    console.log(`   ${k.padEnd(8)} ${z.name.padEnd(24)} latest=${z.latestSnapshotCount} 24h=${z.unique24h} 7d=${z.unique7d} (WoW ${wowStr}) trailing28d-daily-avg=${z.trailing28dDailyAvg}`);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(traffic, null, 2));
  console.log(`✅ Wrote ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

main();
