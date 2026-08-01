import type { Metadata } from 'next';
import GlobalDisruptionStatus from '@/components/GlobalDisruptionStatus';

export const metadata: Metadata = {
  title: 'Global Disruption Status — EuroOilWatch',
  description:
    'The live status board tracking the compound energy, shipping and food-security disruption — Hormuz, the Red Sea, refining, diesel, LNG, fertiliser and food — every entry sourced and dated.',
};

export default function GlobalDisruptionStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Global Disruption Status</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-3xl leading-relaxed">
          The full status board: energy, shipping and food-security risks tracked as one
          compounding system, from the Strait of Hormuz to Europe&rsquo;s rivers. Every entry is
          sourced and dated, and updated as the situation moves &mdash; not on a schedule.
        </p>
      </div>

      <GlobalDisruptionStatus site="euro" />

      <p className="text-xs text-gray-500">
        <a href="/" className="text-oil-300 hover:text-white underline underline-offset-2">
          &larr; Back to the dashboard
        </a>{' '}
        &middot; For the analytical background, see the{' '}
        <a href="/analysis" className="text-oil-300 hover:text-white underline underline-offset-2">
          analysis archive
        </a>{' '}
        and the{' '}
        <a href="/hormuz-timeline" className="text-oil-300 hover:text-white underline underline-offset-2">
          Hormuz crisis timeline
        </a>
        .
      </p>
    </div>
  );
}
