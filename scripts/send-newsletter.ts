#!/usr/bin/env npx tsx
/**
 * EuroOilWatch — Newsletter Sender
 * ==================================
 * Sends any .html or .md files found in newsletters/outbox/ as a Resend
 * Broadcast to the full subscriber audience, then moves them to newsletters/sent/.
 *
 * Usage:
 *   npx tsx scripts/send-newsletter.ts
 *
 * Required env vars:
 *   RESEND_API_KEY        — Resend API key
 *   RESEND_SEGMENT_ID     — Resend Segment ID (subscribers)
 *   RESEND_TOPIC_ID       — Resend Topic ID (optional, for unsubscribe preferences)
 *   RESEND_FROM_ADDRESS   — Verified sending address, e.g. "EuroOilWatch <briefing@eurooilwatch.com>"
 *
 * HTML files — subject via comment near the top:
 *   <!-- subject: EU Fuel Reserves Drop — Weekly Briefing #12 -->
 *
 * Markdown files — subject via frontmatter:
 *   ---
 *   subject: EU Fuel Reserves Drop — Weekly Briefing #12
 *   ---
 */

import fs   from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

// Load .env.local for local development (GitHub Actions uses secrets directly)
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}
loadEnvFile();

const RESEND_API_KEY    = process.env.RESEND_API_KEY;
const RESEND_SEGMENT_ID = process.env.RESEND_SEGMENT_ID;
const RESEND_TOPIC_ID   = process.env.RESEND_TOPIC_ID;
const FROM_ADDRESS      = process.env.RESEND_FROM_ADDRESS || 'EuroOilWatch <briefing@eurooilwatch.com>';

const OUTBOX_DIR = path.join(process.cwd(), 'newsletters', 'outbox');
const SENT_DIR   = path.join(process.cwd(), 'newsletters', 'sent');

// ─── Validation ──────────────────────────────────────────────────────────────

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set.');
  process.exit(1);
}
if (!RESEND_SEGMENT_ID) {
  console.error('❌ RESEND_SEGMENT_ID is not set.');
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

/**
 * Wraps converted markdown HTML in a minimal, email-client-safe template.
 * Uses inline styles only — no external CSS, no flexbox, no grid.
 */
function wrapInEmailTemplate(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#1e293b;border-radius:8px;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #334155;">
              <span style="font-size:13px;font-weight:bold;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">EuroOilWatch</span>
              <span style="font-size:13px;color:#475569;margin-left:8px;">Weekly Fuel Security Briefing</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#e2e8f0;font-size:15px;line-height:1.7;">
              <style>
                /* Scoped styles for markdown-generated content */
                h1 { font-size:22px;font-weight:bold;color:#f8fafc;margin:0 0 16px 0; }
                h2 { font-size:17px;font-weight:bold;color:#f1f5f9;margin:28px 0 10px 0;border-bottom:1px solid #334155;padding-bottom:6px; }
                h3 { font-size:15px;font-weight:bold;color:#cbd5e1;margin:20px 0 8px 0; }
                p  { margin:0 0 14px 0;color:#cbd5e1; }
                ul, ol { margin:0 0 14px 0;padding-left:20px;color:#cbd5e1; }
                li { margin-bottom:6px; }
                strong { color:#f1f5f9; }
                a  { color:#38bdf8;text-decoration:none; }
                hr { border:none;border-top:1px solid #334155;margin:24px 0; }
                blockquote { border-left:3px solid #475569;margin:0 0 14px 0;padding:8px 16px;color:#94a3b8; }
                code { background:#0f172a;padding:2px 6px;border-radius:4px;font-size:13px;color:#7dd3fc; }
              </style>
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#475569;">
                You're receiving this because you subscribed at <a href="https://eurooilwatch.com" style="color:#38bdf8;">eurooilwatch.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#334155;">
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#475569;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Parse a markdown file — returns { subject, html }
 */
async function parseMarkdown(raw: string, filename: string): Promise<{ subject: string; html: string }> {
  const { data, content } = matter(raw);

  if (!data.subject) {
    throw new Error(
      `No subject found in ${filename}.\n` +
      `Add frontmatter at the top of the file:\n` +
      `  ---\n  subject: Your Subject Line Here\n  ---`
    );
  }

  const bodyHtml = await marked(content);
  const html     = wrapInEmailTemplate(data.subject, bodyHtml);
  return { subject: data.subject, html };
}

/**
 * Parse an HTML file — returns { subject, html }
 */
function parseHtml(raw: string, filename: string): { subject: string; html: string } {
  const match = raw.match(/<!--\s*subject:\s*(.+?)\s*-->/i);
  if (!match) {
    throw new Error(
      `No subject found in ${filename}.\n` +
      `Add this near the top of the file:\n` +
      `  <!-- subject: Your Subject Line Here -->`
    );
  }
  return { subject: match[1].trim(), html: raw };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const files = fs.readdirSync(OUTBOX_DIR)
    .filter(f => f.endsWith('.html') || f.endsWith('.md'));

  if (files.length === 0) {
    console.log('📭 No newsletters in outbox — nothing to send.');
    process.exit(0);
  }

  console.log(`📬 Found ${files.length} newsletter(s) to send.\n`);

  for (const file of files) {
    const filePath = path.join(OUTBOX_DIR, file);
    const raw      = fs.readFileSync(filePath, 'utf-8');
    const ext      = path.extname(file);

    console.log(`── ${file}`);

    const { subject, html } = ext === '.md'
      ? await parseMarkdown(raw, file)
      : parseHtml(raw, file);

    console.log(`   Subject : ${subject}`);
    console.log(`   From    : ${FROM_ADDRESS}`);
    console.log(`   Segment : ${RESEND_SEGMENT_ID}`);

    // Create and send broadcast in one step
    const broadcastName = path.basename(file, path.extname(file));
    const payload: Record<string, unknown> = {
      segment_id: RESEND_SEGMENT_ID,
      from:       FROM_ADDRESS,
      name:       broadcastName,
      subject,
      html,
      send:       true,
    };
    if (RESEND_TOPIC_ID) payload.topic_id = RESEND_TOPIC_ID;

    const { id: broadcastId } = await resendPost('/broadcasts', payload);
    console.log(`   ✓ Broadcast created and sent: ${broadcastId}`);

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
