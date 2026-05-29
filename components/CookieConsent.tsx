'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('cookieConsent')) setShow(true);
    } catch {
      // localStorage unavailable — show nothing rather than block
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem('cookieConsent', 'granted');
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    } catch {}
    setShow(false);
  }

  function decline() {
    try {
      localStorage.setItem('cookieConsent', 'denied');
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-oil-700 bg-oil-950/95 backdrop-blur px-4 py-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-xs text-gray-300 leading-relaxed flex-1">
          We use Google Analytics to understand how readers use the site (anonymised, no ads).
          Decline and the site works the same — we just won&apos;t see your visit.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="rounded-md border border-oil-700 hover:border-oil-500 text-gray-300 text-xs px-4 py-2 transition"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-oil-600 hover:bg-oil-500 text-white text-xs px-4 py-2 transition font-medium"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
