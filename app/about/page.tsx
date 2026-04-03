import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | EuroOilWatch',
  description: 'About EuroOilWatch — fuel security intelligence for Europe. Who built it, who uses it, and how the data works.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">About EuroOilWatch</h1>
      </div>

      <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <p>
          EuroOilWatch provides European fuel security intelligence by
          aggregating official EU data into a single, readable monitoring
          dashboard.
        </p>
        <p>
          The site tracks fuel reserve levels, weekly pump prices, and crude
          oil benchmarks across all 27 EU member states — presenting data
          that exists publicly but is otherwise scattered across government
          databases in technical formats.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">What the dashboard covers</h2>
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-4 space-y-2 text-gray-400">
          <p>Oil stock levels by country and fuel type (petrol, diesel, jet fuel)</p>
          <p>Days-of-supply calculations against EU regulatory benchmarks</p>
          <p>Weekly consumer fuel prices from the EC Oil Bulletin</p>
          <p>Brent crude oil benchmark pricing, updated in near real-time</p>
          <p>AI-generated analysis summarising the current reserve picture</p>
          <p>18-month historical trend charts</p>
        </div>

        <h2 className="text-lg font-semibold text-white pt-2">Data and methodology</h2>
        <p>
          All reserve data comes from Eurostat (dataset nrg_stk_oilm),
          published monthly with an approximate 2-month lag. Fuel prices come
          from the European Commission&apos;s Weekly Oil Bulletin, updated every
          Thursday. The dashboard refreshes daily to capture new submissions.
        </p>
        <p>
          This is the latest available official data — not real-time tank
          levels. Full details on sources, calculations, and limitations are
          on the{' '}
          <a href="/methodology" className="text-oil-400 underline">
            Methodology
          </a>{' '}
          page.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">Who this is for</h2>
        <p>
          EuroOilWatch is used by logistics and fleet operators monitoring
          diesel availability, procurement teams tracking price movements,
          energy analysts and researchers, and journalists covering European
          fuel supply and security.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">Background</h2>
        <p>
          The project was built in response to the 2026 Middle East supply
          disruptions, which highlighted that while EU fuel reserve data
          exists publicly, it was not being presented in a format accessible
          to non-specialists. EuroOilWatch was inspired by{' '}
          <a href="https://nzoilwatch.com" className="text-oil-400 underline" target="_blank" rel="noopener noreferrer">
            NZOilWatch
          </a>
          , which brought similar transparency to New Zealand and Australia.
        </p>
        <p>
          The site is independent and not affiliated with any government,
          energy company, or political organisation.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">For journalists and analysts</h2>
        <p>
          If you are covering European energy and would like to discuss the
          data, methodology, or specific country findings, I&apos;m available for
          background briefings, data context, or on-record commentary.
        </p>
        <p>
          Data exports and custom analysis can be provided on request.
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">Sister site</h2>
        <p>
          For UK-specific fuel monitoring, see{' '}
          <a href="https://ukoilwatch.com" className="text-oil-400 underline" target="_blank" rel="noopener noreferrer">
            UKOilWatch.com
          </a>{' '}
          (coming soon).
        </p>

        <h2 className="text-lg font-semibold text-white pt-2">Contact</h2>
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-4 space-y-2 text-gray-400">
          <p>
            <span className="text-gray-300 font-medium">Jon Kelly</span> — Founder, EuroOilWatch
          </p>
          <p>
            Media, data enquiries, and commentary:{' '}
            <a href="mailto:jon@eurooilwatch.com" className="text-oil-400 underline">
              jon@eurooilwatch.com
            </a>
          </p>
          <p>
            Partnerships, sponsorship, or data licensing:{' '}
            <a href="mailto:admin@eurooilwatch.com" className="text-oil-400 underline">
              admin@eurooilwatch.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
