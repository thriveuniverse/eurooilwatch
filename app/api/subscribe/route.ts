import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, source } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    if (!apiKey || !audienceId) {
      console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_ID');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Add contact to Resend audience
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: '',
        last_name: '',
        unsubscribed: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      // If contact already exists, that's fine
      if (res.status === 409) {
        return NextResponse.json({ success: true, message: 'Already subscribed' });
      }
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
    }

    console.log(`✅ New subscriber: ${email} (source: ${source || 'briefing'})`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Subscribe error:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
