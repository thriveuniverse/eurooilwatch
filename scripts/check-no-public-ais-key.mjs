#!/usr/bin/env node
/**
 * Build guard: fail if an aisstream credential can reach the browser.
 *
 * Background: until Aug 2026 the tanker map read NEXT_PUBLIC_AISSTREAM_API_KEY.
 * Next.js inlines every NEXT_PUBLIC_* variable into the client bundle, so the
 * key was served to every visitor — and because each browser then opened its
 * own aisstream connection, the account was throttled at user level, which
 * silently starved the 4-hourly collector.
 *
 * aisstream authenticates over the WebSocket itself and explicitly warns against
 * putting API keys in browser applications. There is therefore no safe way to
 * reintroduce this variable; the guard exists to make a regression a build
 * failure rather than a slow leak nobody notices.
 *
 * Run: node scripts/check-no-public-ais-key.mjs   (wired into `npm run build`)
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const FORBIDDEN = 'NEXT_PUBLIC_AISSTREAM_API_KEY';

const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'out', 'dist', 'coverage', '.netlify', '.vercel',
]);

// This guard necessarily contains the string it forbids, as does the changelog
// entry describing the incident. Allow those, and nothing else.
const ALLOWLIST = new Set([
  path.join('scripts', 'check-no-public-ais-key.mjs'),
]);

const TEXT_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.env',
  '.local', '.example', '.yml', '.yaml', '.toml', '.md',
]);

/** @type {{file: string, line: number, text: string}[]} */
const hits = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name));
      continue;
    }
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (ALLOWLIST.has(rel)) continue;

    // .env.local has no conventional extension pattern — match by name too.
    const ext = path.extname(entry.name);
    const isEnvFile = entry.name.startsWith('.env');
    if (!isEnvFile && !TEXT_EXT.has(ext)) continue;

    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch {
      continue; // unreadable or binary — not a source of client-bundled config
    }
    if (!content.includes(FORBIDDEN)) continue;

    content.split('\n').forEach((line, i) => {
      if (line.includes(FORBIDDEN)) {
        hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 160) });
      }
    });
  }
}

walk(ROOT);

if (hits.length > 0) {
  console.error('');
  console.error(`❌ Build blocked: ${FORBIDDEN} found in ${hits.length} place(s).`);
  console.error('');
  for (const h of hits) {
    console.error(`   ${h.file}:${h.line}`);
    console.error(`     ${h.text}`);
  }
  console.error('');
  console.error('   Any NEXT_PUBLIC_* variable is compiled into the browser bundle, so this');
  console.error('   ships an aisstream credential to every visitor and lets upstream AIS');
  console.error('   connections scale with traffic — which throttled the account in Aug 2026.');
  console.error('');
  console.error('   Read the key only as AISSTREAM_API_KEY in server-side code, and have the');
  console.error('   browser fetch /api/ais-snapshot instead of connecting to aisstream.');
  console.error('');
  process.exit(1);
}

console.log(`✅ No ${FORBIDDEN} references — no AIS credential can reach the browser.`);
