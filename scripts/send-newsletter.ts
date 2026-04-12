#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Newsletter Sender
 * ==================================
 * Sends any .html files found in newsletters/outbox/ as a Resend Broadcast
 * to the full subscriber audience, then moves them to newsletters/sent/.
 *
 * Usage:
 *   npx tsx scripts/send-newsletter.ts
 *
 * Required env vars:
 *   RESEND_API_KEY        — Resend API key
 *   RESEND_AUDIENCE_ID    — Resend Audience ID (subscribers)
 *   RESEND_FROM_ADDRESS   — Verified sending address, e.g. "EuroOilWatch <briefing@eurooilwatch.com>"
 *
 * Each HTML file must contain a subject line comment near the top:
 *   <!-- subject: EU Fuel Reserves Drop — Weekly Briefing #12 -->
 */

import fs from 'fs';
import path from 'path';

const RESEND_API_KEY     = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const FROM_ADDRESS       = process.env.RESEND_FROM_ADDRESS || 'EuroOilWatch <briefing@eurooilwatch.com>';

const OUTBOX_DIR = path.join(process.cwd(), 'newsletters', 'outbox');
const SENT_DIR   = path.join(process.cwd(), 'newsletters', 'sent');

// ─── Validation ──────────────────────────────────────────────────────────────

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set.');
  process.exit(1);
}
if (!RESEND_AUDIENCE_ID) {
  console.error('❌ RESEND_AUDIENCE_ID is not set.');
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resendPost(endpoint: string, body: object): Promise<any> {
  const res = await fetch(`https://api.resend.com${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Resend API error (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

function extractSubject(html: string, filename: string): string {
  const match = html.match(/<!--\s*subject:\s*(.+?)\s*-->/i);
  if (!match) {
    throw new Error(
      `No subject found in ${filename}.\n` +
      `Add this near the top of the file:\n` +
      `  <!-- subject: Your Subject Line Here -->`
    );
  }
  return match[1].trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const files = fs.readdirSync(OUTBOX_DIR).filter(f => f.endsWith('.html'));

  if (files.length === 0) {
    console.log('📭 No newsletters in outbox — nothing to send.');
    process.exit(0);
  }

  console.log(`📬 Found ${files.length} newsletter(s) to send.\n`);

  for (const file of files) {
    const filePath = path.join(OUTBOX_DIR, file);
    const html     = fs.readFileSync(filePath, 'utf-8');

    console.log(`── ${file}`);

    // Extract subject
    const subject = extractSubject(html, file);
    console.log(`   Subject : ${subject}`);
    console.log(`   From    : ${FROM_ADDRESS}`);
    console.log(`   Audience: ${RESEND_AUDIENCE_ID}`);

    // Step 1 — Create broadcast
    const { id: broadcastId } = await resendPost('/broadcasts', {
      audience_id: RESEND_AUDIENCE_ID,
      from:        FROM_ADDRESS,
      subject,
      html,
    });
    console.log(`   ✓ Broadcast created: ${broadcastId}`);

    // Step 2 — Send broadcast
    await resendPost(`/broadcasts/${broadcastId}/send`, {});
    console.log(`   ✓ Broadcast sent`);

    // Step 3 — Move to sent/
    const datestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const sentName  = `${datestamp}_${file}`;
    const sentPath  = path.join(SENT_DIR, sentName);
    fs.renameSync(filePath, sentPath);
    console.log(`   ✓ Moved to newsletters/sent/${sentName}\n`);
  }

  console.log('✅ All newsletters sent successfully.');
}

main().catch(err => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
