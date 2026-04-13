#!/usr/bin/env npx tsx
/**
 * One-time Resend setup script.
 * Creates the EuroOilWatch segment and topic, then prints the IDs
 * for you to add to .env.local and GitHub Secrets.
 *
 * Usage: npx tsx scripts/setup-resend.ts
 * Requires RESEND_API_KEY in .env.local
 */

import fs from 'fs';
import path from 'path';

// Load .env.local manually (tsx doesn't auto-load it)
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY in .env.local');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${RESEND_API_KEY}`,
  'Content-Type': 'application/json',
};

async function createSegment(name: string): Promise<string> {
  const res = await fetch('https://api.resend.com/segments', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create segment: ${err}`);
  }
  const data = await res.json() as { id: string; name: string };
  return data.id;
}

async function createTopic(name: string): Promise<string> {
  const res = await fetch('https://api.resend.com/topics', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name,
      default_subscription: 'opt_in',
      visibility: 'public',
      description: 'Weekly EU fuel reserve status, price movements, and supply-risk signals.',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create topic: ${err}`);
  }
  const data = await res.json() as { id: string; name: string };
  return data.id;
}

async function main() {
  console.log('Setting up Resend for EuroOilWatch...\n');

  console.log('Creating segment "EuroOilWatch"...');
  const segmentId = await createSegment('EuroOilWatch');
  console.log(`✓ Segment created: ${segmentId}`);

  console.log('Creating topic "EuroOilWatch Weekly"...');
  const topicId = await createTopic('EuroOilWatch Weekly');
  console.log(`✓ Topic created: ${topicId}`);

  console.log('\n─────────────────────────────────────────');
  console.log('Add these to your .env.local and GitHub Secrets:');
  console.log('─────────────────────────────────────────');
  console.log(`RESEND_SEGMENT_ID=${segmentId}`);
  console.log(`RESEND_TOPIC_ID=${topicId}`);
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
