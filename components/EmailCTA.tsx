'use client';

import { useState } from 'react';

export default function EmailCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    window.location.href = `mailto:admin@eurooilwatch.com?subject=Weekly%20Briefing%20Signup&body=Please%20add%20me%20to%20the%20weekly%20fuel%20security%20briefing.%0A%0AEmail:%20${encodeURIComponent(email)}`;
    setSubmitted(true);
  };

  return (
    <section
      aria-label="Newsletter signup"
      className="rounded-lg border border-oil-700 bg-gradient-to-r from-oil-900/80 to-oil-800/40 px-5 py-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-white">
            Weekly Fuel Security Briefing
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Every Thursday: reserve status changes, price movements, and supply-risk
            signals across all 27 EU countries — in one concise email.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Read by logistics operators, procurement teams, and energy analysts.
          </p>
        </div>
        {submitted ? (
          <p className="text-sm text-green-400">
            ✓ Thanks — you&apos;ll receive the next briefing on Thursday.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="flex-1 sm:w-56 px-3 py-2 text-sm rounded-lg bg-oil-950 border border-oil-700 text-white placeholder-gray-500 focus:outline-none focus:border-oil-500"
              aria-label="Email address"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-oil-500 hover:bg-oil-400 text-white transition whitespace-nowrap"
            >
              Subscribe — Free
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
