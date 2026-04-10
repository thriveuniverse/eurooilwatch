#!/usr/bin/env tsx
/**
 * check-supply-staleness.ts
 *
 * Reads app/supply/page.tsx, extracts every chokepoint name + lastReviewed date,
 * and warns if any entry is older than STALE_DAYS days.
 *
 * Runs automatically before `next build` via the "prebuild" npm script.
 * Exits 0 (warn only) — does not fail the build.
 */

import * as fs from 'fs';
import * as path from 'path';

const STALE_DAYS = 21;
const SUPPLY_PAGE = path.join(process.cwd(), 'app/supply/page.tsx');

const content = fs.readFileSync(SUPPLY_PAGE, 'utf8');

// Pull chokepoint names and lastReviewed dates in document order
const names   = [...content.matchAll(/name:\s*'([^']+)'/g)].map(m => m[1]);
const dates   = [...content.matchAll(/lastReviewed:\s*'(\d{4}-\d{2}-\d{2})'/g)].map(m => m[1]);

if (names.length === 0 || dates.length === 0) {
  console.warn('\n⚠️  check-supply-staleness: could not parse chokepoints from app/supply/page.tsx\n');
  process.exit(0);
}

const today = new Date();
today.setHours(0, 0, 0, 0);

let staleCount = 0;

console.log('\n── Supply Routes Staleness Check ──────────────────────────');

names.forEach((name, i) => {
  const dateStr = dates[i];
  if (!dateStr) return;

  const reviewed = new Date(dateStr);
  const daysSince = Math.floor((today.getTime() - reviewed.getTime()) / 86_400_000);

  if (daysSince > STALE_DAYS) {
    console.warn(`  ⚠  STALE  ${name.padEnd(28)} last reviewed ${daysSince}d ago (${dateStr})`);
    staleCount++;
  } else {
    console.log(`  ✓  OK     ${name.padEnd(28)} reviewed ${String(daysSince).padStart(2)}d ago (${dateStr})`);
  }
});

console.log('────────────────────────────────────────────────────────────');

if (staleCount > 0) {
  console.warn(
    `\n  ⚠  ${staleCount} chokepoint${staleCount !== 1 ? 's are' : ' is'} overdue for review` +
    ` (>${STALE_DAYS} days). Update lastReviewed dates in app/supply/page.tsx.\n`
  );
} else {
  console.log(`\n  ✓  All chokepoints reviewed within ${STALE_DAYS} days.\n`);
}

process.exit(0);
