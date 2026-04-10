'use client';

import { useState, useEffect } from 'react';

// Version this key — changing it will re-show the banner even for users who dismissed it.
// Update the date suffix whenever you update the banner content.
const DISMISS_KEY = 'disruption-banner-v20260410';

interface Props {
  /** Short bold label, e.g. "Active supply disruption" */
  headline: string;
  /** One-sentence body, no punctuation needed */
  body: string;
  /** Link label, e.g. "Supply Routes →" */
  linkLabel: string;
  /** Internal href, e.g. "/supply" */
  linkHref: string;
}

export default function DisruptionBanner({ headline, body, linkLabel, linkHref }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't dismissed this version yet
    if (!localStorage.getItem(DISMISS_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-800/70 bg-red-950/50 px-4 py-3 flex items-start gap-3 text-sm"
    >
      {/* Icon */}
      <span className="flex-shrink-0 mt-0.5 text-red-400 text-base leading-none">⚠</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-red-300">{headline} — </span>
        <span className="text-red-200/80">{body}</span>
        {' '}
        <a
          href={linkHref}
          className="text-red-300 underline underline-offset-2 hover:text-white transition whitespace-nowrap"
        >
          {linkLabel}
        </a>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dismiss alert"
        className="flex-shrink-0 text-red-500 hover:text-red-200 transition text-lg leading-none p-0.5 -mt-0.5"
      >
        ×
      </button>
    </div>
  );
}
