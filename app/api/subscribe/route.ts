import { NextResponse } from 'next/server';

const SITE_NAME = 'EuroOilWatch';
const SITE_BASE_URL = 'https://eurooilwatch.com';

export async function POST(request: Request) {
  try {
    const { email, source } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    const apiKey = process.env.RESEND_API_KEY;
    const segmentId = process.env.RESEND_SEGMENT_ID;
    const topicId = process.env.RESEND_TOPIC_ID;
    const fromAddress = process.env.RESEND_FROM_ADDRESS;

    // Loud, specific logging when required env vars are missing — silent
    // 500s have historically been hard to diagnose because the operator
    // can't see *which* var is wrong from the client-side error alone.
    if (!apiKey) {
      console.error('[/api/subscribe] FATAL: RESEND_API_KEY is not set — subscription cannot proceed.');
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }
    if (!segmentId) console.warn('[/api/subscribe] RESEND_SEGMENT_ID is not set — new contact will not join the EuroOilWatch audience.');
    if (!topicId) console.warn('[/api/subscribe] RESEND_TOPIC_ID is not set — new contact will have no opt-in topic recorded.');
    if (!fromAddress) console.warn('[/api/subscribe] RESEND_FROM_ADDRESS is not set — transactional thank-you emails will be skipped.');
    const body: Record<string, unknown> = { email, unsubscribed: false };
    if (segmentId) body.segments = [{ id: segmentId }];
    if (topicId) body.topics = [{ id: topicId, subscription: 'opt_in' }];
    const res = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok && res.status !== 409) {
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
    }

    console.log(`✅ New subscriber: ${email} (source: ${source || 'briefing'})`);

    // Best-effort transactional thank-you for report downloads.
    // Failure does not block the subscription success response.
    if (source === 'hormuz-report' && fromAddress) {
      sendHormuzThankYou(apiKey, fromAddress, email).catch(err =>
        console.error('Thank-you email failed:', err)
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function sendHormuzThankYou(apiKey: string, fromAddress: string, to: string) {
  const html = `
    <p>Thank you for downloading <strong>From Hormuz to Hunger</strong>.</p>
    <p>Your downloads:</p>
    <ul>
      <li><a href="${SITE_BASE_URL}/reports/from-hormuz-to-hunger-policy-brief.pdf">Policy Brief — v3.0 (~25 pages)</a></li>
      <li><a href="${SITE_BASE_URL}/reports/from-hormuz-to-hunger-technical-report.pdf">Technical Report — v3.0 (~80 pages)</a></li>
    </ul>
    <p>This analysis will be updated as new data becomes available. If you find it useful, please forward to a colleague. For questions or to discuss the methodology, contact <a href="mailto:jon@thethriveclan.com">jon@thethriveclan.com</a>.</p>
    <p>—<br>${SITE_NAME}</p>
  `;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject: 'Your reports — From Hormuz to Hunger',
      html,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Resend email send ${res.status}: ${errText}`);
  }
}
