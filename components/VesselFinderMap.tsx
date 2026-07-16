/**
 * VesselFinderMap — live global AIS map embed (worldwide shipping & tanker traffic).
 *
 * Renders VesselFinder's official free embed as a direct iframe rather than via
 * their aismap.js widget (which uses document.write and breaks under React/Next
 * hydration). The iframe URL + params mirror what aismap.js generates. The map is
 * global and fully pannable/zoomable; props set only the initial view.
 *
 * IMPORTANT — this is ILLUSTRATIVE context, not a traffic count. It shows only
 * vessels actively broadcasting AIS; ships running dark (AIS off) or affected by
 * GPS spoofing do not appear, which structurally understates true traffic. For
 * chokepoint transit measures the authoritative sources stay JMIC / IMF PortWatch
 * (panels below).
 */

type Props = {
  /** Initial centre latitude (default: broad Europe–Africa–Middle East view) */
  lat?: number;
  /** Initial centre longitude */
  lon?: number;
  /** Initial zoom, 3–18 (low = wide/global) */
  zoom?: number;
  /** Iframe height in px */
  height?: number;
};

export default function VesselFinderMap({
  lat = 30,
  lon = 15,
  zoom = 3,
  height = 480,
}: Props) {
  const src =
    'https://www.vesselfinder.com/aismap' +
    `?zoom=${zoom}&lat=${lat}&lon=${lon}` +
    '&names=true&clicktoact=true&default_maptype=0' +
    `&width=100%25&height=${height}`;

  return (
    <section
      aria-label="Live global AIS map — worldwide shipping and tanker traffic"
      className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          Live Global AIS &mdash; Shipping &amp; Tanker Traffic
        </h2>
        <a
          href="https://www.vesselfinder.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-gray-600 hover:text-gray-400"
        >
          Map: VesselFinder &rarr;
        </a>
      </div>

      <div className="p-3">
        <div className="overflow-hidden rounded" style={{ height }}>
          <iframe
            title="VesselFinder live global AIS map"
            src={src}
            width="100%"
            height={height}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            style={{ border: 0, display: 'block', width: '100%' }}
          />
        </div>
      </div>

      <div className="px-5 py-2.5 border-t border-oil-800/60 bg-oil-950/30">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          <span className="text-gray-400 font-medium">Illustrative, not a count.</span>{' '}
          Live positions of vessels broadcasting AIS worldwide &mdash; pan and zoom to any region
          or chokepoint. Ships running <span className="text-gray-400">dark (AIS off)</span> or
          affected by GPS spoofing do not appear, so this is a live picture, not a measure of
          traffic. For chokepoint transit counts &mdash; the authoritative figures &mdash; see the
          Hormuz throughput and IMF PortWatch panels below. Map data &copy; VesselFinder.
        </p>
      </div>
    </section>
  );
}
