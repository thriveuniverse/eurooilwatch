'use client';

import { useEffect, useState } from 'react';

/**
 * Embeds a self-contained OilWatch tool (static HTML in /public) and auto-sizes
 * the iframe to its content. The tool posts {oilwatchToolHeight} via postMessage
 * (see the resize snippet at the foot of each tool's HTML).
 */
export default function ToolFrame({
  src,
  title,
  minHeight = 1600,
}: {
  src: string;
  title: string;
  minHeight?: number;
}) {
  const [h, setH] = useState(minHeight);
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data as { oilwatchToolHeight?: number } | null;
      if (d && typeof d === 'object' && typeof d.oilwatchToolHeight === 'number') {
        const nh = Math.max(minHeight, Math.ceil(d.oilwatchToolHeight) + 8);
        // only resize on a real change — prevents the resize-observer feedback loop
        setH((prev) => (Math.abs(nh - prev) > 8 ? nh : prev));
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [minHeight]);

  return (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      className="w-full rounded-lg border border-oil-800"
      style={{ height: h, background: '#0a0d10' }}
    />
  );
}
