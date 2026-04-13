import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, source } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    const apiKey = process.env.RESEND_API_KEY;
    const segmentId = process.env.RESEND_SEGMENT_ID;
    const topicId = process.env.RESEND_TOPIC_ID;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }
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
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
