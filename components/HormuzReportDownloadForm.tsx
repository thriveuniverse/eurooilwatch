'use client';

import { useState, type FormEvent } from 'react';

interface Props {
  siteName: string;
}

export default function HormuzReportDownloadForm({ siteName }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError('Please tick the box to consent to receive emails.');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setError('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source: 'hormuz-report' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      setStatus('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-700/50 bg-green-950/20 px-5 py-5">
        <p className="text-sm font-semibold text-white">Thank you. Your reports are ready below.</p>
        <p className="mt-1 text-xs text-gray-400">
          We&apos;ve added you to the {siteName} mailing list. You can unsubscribe at any time using the link in any email we send.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <a
            href="/reports/h2h_brief_v4.pdf"
            className="rounded-lg border border-oil-700 bg-oil-900/40 px-5 py-4 hover:border-oil-500 hover:bg-oil-900/60 transition group"
          >
            <p className="text-[10px] font-mono font-semibold tracking-widest text-oil-400 uppercase">Policy Brief · v4</p>
            <p className="mt-2 text-sm font-semibold text-white group-hover:text-oil-300 transition">
              Download Policy Brief →
            </p>
            <p className="mt-1 text-xs text-gray-500">
              ~25 pages · The compressed case, nine causal chains, scenarios, policy recommendations.
            </p>
          </a>
          <a
            href="/reports/h2h_tech_v4.pdf"
            className="rounded-lg border border-oil-700 bg-oil-900/40 px-5 py-4 hover:border-oil-500 hover:bg-oil-900/60 transition group"
          >
            <p className="text-[10px] font-mono font-semibold tracking-widest text-oil-400 uppercase">Technical Report · v4</p>
            <p className="mt-2 text-sm font-semibold text-white group-hover:text-oil-300 transition">
              Download Technical Report →
            </p>
            <p className="mt-1 text-xs text-gray-500">
              ~80 pages · Full methodology, 30-section analysis, sensitivity analysis, historical calibration.
            </p>
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-oil-700 bg-oil-900/40 px-5 py-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-white">Download the full reports</p>
        <p className="mt-1 text-xs text-gray-400">
          Enter your email to access the policy brief (~25 pages) and technical report (~80 pages).
          Used by analysts, policymakers, and journalists tracking the Hormuz cascade.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="hormuz-name" className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">
            Name (optional)
          </label>
          <input
            id="hormuz-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={status === 'submitting'}
            className="w-full rounded-md border border-oil-800 bg-oil-950/50 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-oil-500 focus:outline-none focus:ring-1 focus:ring-oil-500 disabled:opacity-50"
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="hormuz-email" className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="hormuz-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={status === 'submitting'}
            required
            className="w-full rounded-md border border-oil-800 bg-oil-950/50 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-oil-500 focus:outline-none focus:ring-1 focus:ring-oil-500 disabled:opacity-50"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          disabled={status === 'submitting'}
          className="mt-0.5 accent-oil-500"
        />
        <span>
          I&apos;d like to receive future updates from <strong className="text-gray-300">{siteName}</strong>, including
          analysis updates and the weekly briefing. You can unsubscribe at any time.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-md bg-oil-600 hover:bg-oil-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition"
      >
        {status === 'submitting' ? 'Submitting…' : 'Get the reports →'}
      </button>

      {status === 'error' && error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <p className="text-[10px] text-gray-600">
        We&apos;ll never share your email. Reports are also available to journalists and researchers on request —
        contact jon@thethriveclan.com.
      </p>
    </form>
  );
}
