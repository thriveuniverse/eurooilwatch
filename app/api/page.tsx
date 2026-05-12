import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public API — EuroOilWatch',
  description:
    'Free, read-only JSON API exposing the data that powers the EuroOilWatch dashboard: EU-27 country fuel stocks, TTF gas, AGSI storage, ARA hub, Brent. CORS-enabled, no auth.',
  alternates: { canonical: 'https://eurooilwatch.com/api' },
};

const RESOURCES = [
  { name: 'stocks',             desc: 'EU-27 country fuel reserve levels and days-of-supply',                                   source: 'Eurostat (nrg_stk_oilm)' },
  { name: 'prices',             desc: 'EU-27 weekly consumer fuel prices',                                                       source: 'EC Weekly Oil Bulletin' },
  { name: 'prices-history',     desc: 'EU average petrol and diesel price history',                                              source: 'European Commission' },
  { name: 'brent',              desc: 'Current Brent crude price (front-month futures)',                                          source: 'Stooq (cb.f)' },
  { name: 'brent-history',      desc: '52-week Brent crude price history (weekly close)',                                         source: 'Stooq' },
  { name: 'brent-eia-daily',    desc: 'EIA Europe Brent Spot Price FOB daily series, since 20 May 1987',                          source: 'U.S. EIA (RBRTE)' },
  { name: 'gas',                desc: 'Dutch TTF + US Henry Hub gas prices + AGSI EU storage levels',                             source: 'Yahoo Finance + AGSI/GIE' },
  { name: 'ara-stocks',         desc: 'ARA hub weekly product stocks (jet, gasoline, naphtha, gasoil)',                           source: 'Argus Media (syndicating Insights Global)' },
  { name: 'bunker',             desc: 'Marine bunker fuel price estimates (VLSFO / MGO)',                                         source: 'Derived from Brent' },
  { name: 'bunker-history',     desc: 'Rolling history of bunker fuel estimates',                                                source: 'Derived from Brent' },
  { name: 'sea-state',          desc: 'Live wave height + wind at key oil-shipping chokepoints',                                  source: 'Open-Meteo Marine + Forecast' },
  { name: 'history',            desc: '18-month EU stocks history (days of cover by fuel)',                                       source: 'Eurostat' },
  { name: 'marad-advisories',   desc: 'US MARAD maritime security advisories (filtered for European supply relevance)',          source: 'maritime.dot.gov' },
  { name: 'centcom-advisories', desc: 'CENTCOM Middle East maritime advisories',                                                 source: 'U.S. Central Command via DVIDS' },
  { name: 'crea-feed',          desc: 'Energy and clean air research feed',                                                      source: 'CREA' },
];

export default function ApiPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">EuroOilWatch Public API</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Free, read-only JSON access to the same data that powers the dashboard. CORS-enabled, no
          authentication, no key required. Built so journalists, analysts, researchers, and LLM agents
          can cite the underlying numbers directly rather than scraping the rendered page.
        </p>
      </div>

      <section className="rounded-lg border border-oil-800 bg-oil-900/30 p-5 space-y-3">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Quick start</h2>
        <pre className="bg-oil-950/60 border border-oil-800 rounded p-3 text-[11px] text-gray-300 overflow-x-auto"><code>{`# EU-27 country fuel reserves and days of cover
curl https://eurooilwatch.com/api/v1/stocks

# TTF + Henry Hub gas prices + AGSI storage
curl https://eurooilwatch.com/api/v1/gas

# Index of all available endpoints
curl https://eurooilwatch.com/api/v1`}</code></pre>
        <p className="text-xs text-gray-400">
          All responses are <code className="text-gray-300">application/json; charset=utf-8</code>.
          Cache headers are set to <code className="text-gray-300">s-maxage=300, stale-while-revalidate=3600</code>
          {' '}so the CDN serves quickly while keeping data fresh.
        </p>
      </section>

      <section className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
        <div className="px-5 py-3 border-b border-oil-800/60">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Available endpoints</h2>
        </div>
        <div className="divide-y divide-oil-800/40">
          {RESOURCES.map(r => (
            <div key={r.name} className="px-5 py-3 hover:bg-oil-800/20 transition">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <a href={`/api/v1/${r.name}`} className="font-mono text-sm text-amber-300 hover:underline">
                  /api/v1/{r.name}
                </a>
                <span className="text-[10px] text-gray-500">Source: {r.source}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 space-y-3">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Usage</h2>
        <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
          <p>
            <span className="text-gray-300 font-medium">Free.</span>{' '}
            No key, no rate limits beyond reasonable use. CORS is open
            (<code className="text-gray-300">Access-Control-Allow-Origin: *</code>).
          </p>
          <p>
            <span className="text-gray-300 font-medium">Attribution requested.</span>{' '}
            Cite as <code className="text-gray-300">&quot;EuroOilWatch&quot;</code> with a link to{' '}
            <a href="https://eurooilwatch.com" className="text-oil-400 hover:underline">eurooilwatch.com</a>.
            Every payload also includes the underlying institutional source — please also credit those
            where appropriate.
          </p>
          <p>
            <span className="text-gray-300 font-medium">No warranty.</span>{' '}
            Data is provided as-is from public official sources. We do not guarantee accuracy, completeness
            or fitness for any specific purpose. Do not use for trading or safety-critical decisions
            without independent verification.
          </p>
          <p>
            <span className="text-gray-300 font-medium">Update cadence.</span>{' '}
            Underlying data files refresh daily via automated workflow at 05:00 UTC, plus extra runs after
            key official releases (EC Oil Bulletin Thursdays, EIA Wednesdays). The API serves the latest
            committed file at each request, with CDN caching of up to 5 minutes.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">Also available</h2>
        <ul className="space-y-1.5 text-xs text-gray-400">
          <li>
            <a href="https://ukoilwatch.com/api" target="_blank" rel="noopener" className="text-oil-300 hover:underline">UKOilWatch API ↗</a> —
            UK DESNZ stocks, pump prices, jet/diesel divergence
          </li>
          <li>
            <a href="https://americasoilwatch.com/api" target="_blank" rel="noopener" className="text-oil-300 hover:underline">AmericasOilWatch API ↗</a> —
            WTI, US commercial / SPR stocks, US retail pump prices
          </li>
        </ul>
      </section>
    </div>
  );
}
