'use client';

import { useState, useEffect } from 'react';

// Version this key — changing it will re-show the banner even for users who dismissed it.
// Update the date suffix whenever you update the banner content.
const DISMISS_KEY = 'disruption-banner-v20260713-oil-jumps';

interface Props {
  /** Short bold label, e.g. "Active supply disruption" */
  headline: string;
  /** One-sentence body, no punctuation needed */
  body: string;
  /** Link label, e.g. "Supply Routes →" */
  linkLabel: string;
  /** Internal href, e.g. "/supply" */
  linkHref: string;
  /** 'alert' = red (active disruption) | 'update' = amber (de-escalation / status change) */
  tone?: 'alert' | 'update';
}

export default function DisruptionBanner({ headline, body, linkLabel, linkHref, tone = 'alert' }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  const c =
    tone === 'update'
      ? { box: 'border-amber-700/60 bg-amber-950/40', icon: 'text-amber-300', head: 'text-amber-200', body: 'text-amber-100/80', link: 'text-amber-200', dismiss: 'text-amber-500 hover:text-amber-200', glyph: '⚑' }
      : { box: 'border-red-800/70 bg-red-950/50', icon: 'text-red-400', head: 'text-red-300', body: 'text-red-200/80', link: 'text-red-300', dismiss: 'text-red-500 hover:text-red-200', glyph: '⚠' };

  return (
    <div role="alert" className={`rounded-lg border ${c.box} px-4 py-3 flex items-start gap-3 text-sm`}>
      <span className={`flex-shrink-0 mt-0.5 ${c.icon} text-base leading-none`}>{c.glyph}</span>

      <div className="flex-1 min-w-0">
        <span className={`font-semibold ${c.head}`}>{headline} — </span>
        <span className={c.body}>{body}</span>
        {' '}
        <a
          href={linkHref}
          className={`${c.link} underline underline-offset-2 hover:text-white transition whitespace-nowrap`}
        >
          {linkLabel}
        </a>
      </div>

      <button
        onClick={dismiss}
        aria-label="Dismiss alert"
        className={`flex-shrink-0 ${c.dismiss} transition text-lg leading-none p-0.5 -mt-0.5`}
      >
        ×
      </button>
    </div>
  );
}
