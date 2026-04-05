'use client';

import { useState } from 'react';

export default function ProTeaser() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'pro-early-access' }),
      });
      const data = await res.json();
      setStatus(data.success ? 'success' : 'error');
      if (data.success) setEmail('');
    } catch { setStatus('error'); }
  };

  const features = [
    { label: 'Threshold Alerts', desc: 'Get notified when a country drops below your custom reserve or price limit' },
    { label: 'Historical Exports', desc: 'Download 18 months of reserve and price data in CSV or JSON, updated weekly' },
    { label: 'Country Watchlists', desc: 'Save your operating markets and see a filtered view of just those countries' },
    { label: 'Monthly Intelligence Brief', desc: 'Analyst-grade PDF covering reserve trends, price outlook, and country-specific notes' },
  ];

  return (
    <section className="rounded-lg border border-oil-700 bg-gradient-to-br from-oil-900/80 to-oil-800/30 px-5 py-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Coming Soon</h2>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-oil-600/40 text-oil-300 border border-oil-600/30">PRO</span>
      </div>
      <p className="text-sm text-gray-300 mt-2 mb-5">Professional-grade fuel monitoring tools for teams that need deeper visibility across European markets.</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {features.map(f => (
          <div key={f.label} className="flex items-start gap-3 rounded bg-oil-900/50 border border-oil-800/50 px-4 py-3">
            <span className="text-oil-400 mt-0.5 text-sm">→</span>
            <div>
              <p className="text-sm font-medium text-white">{f.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-oil-800/50">
        <p className="text-xs text-gray-400 flex-1">The free dashboard and weekly briefing remain free. Always.</p>
        {status === 'success' ? (
          <p className="text-sm text-green-400">✓ You&apos;re on the early access list.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" required
              className="w-48 px-3 py-2 text-sm rounded-lg bg-oil-950 border border-oil-700 text-white placeholder-gray-500 focus:outline-none focus:border-oil-500" />
            <button type="submit" disabled={status === 'loading'}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-oil-500 hover:bg-oil-400 text-white transition whitespace-nowrap disabled:opacity-50">
              {status === 'loading' ? 'Joining...' : 'Get Early Access'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
