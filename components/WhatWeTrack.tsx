export default function WhatWeTrack() {
  return (
    <section aria-label="What this dashboard tracks" className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-5">
      <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">
        What This Dashboard Tracks
      </h2>
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-300">
        <div className="flex items-start gap-2">
          <span className="text-oil-400 mt-0.5">📦</span>
          <span>Reserve stock levels by country — petrol, diesel, jet fuel</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-oil-400 mt-0.5">⛽</span>
          <span>Weekly pump prices — all 27 EU member states</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-oil-400 mt-0.5">📈</span>
          <span>18-month trend charts — track reserve movements over time</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-oil-400 mt-0.5">🤖</span>
          <span>AI-generated analysis — plain-English briefing, refreshed daily</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Used by logistics operators, procurement teams, energy analysts, and journalists covering European fuel supply.
      </p>
    </section>
  );
}
