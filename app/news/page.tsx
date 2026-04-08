import { fetchNews } from '@/lib/news';
import { getDashboardData } from '@/lib/data';
import NewsFeed from '@/components/NewsFeed';
import EmailCTA from '@/components/EmailCTA';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Latest Oil & Fuel News — EuroOilWatch',
  description:
    'Recent news driving European fuel supply, prices, and reserve levels. Curated from leading energy sources.',
  alternates: { canonical: 'https://eurooilwatch.com/news' },
};

// Refresh news every hour
export const revalidate = 3600;

export default async function NewsPage() {
  const { analysis } = getDashboardData();
  const items = await fetchNews();

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Back link */}
      <a href="/" className="inline-flex items-center gap-1 text-xs text-oil-400 hover:underline">
        ← Back to Dashboard
      </a>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Latest European Fuel &amp; Oil News</h1>
        <p className="mt-1 text-sm text-gray-400">
          Recent stories driving EU fuel supply, prices, and reserve levels.
        </p>
      </div>

      {/* AI summary box — reuses analysis.keyPoints as "this week's themes" */}
      {analysis.keyPoints.length > 0 && (
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm" role="img" aria-label="AI">🤖</span>
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
              This week&apos;s top supply-risk themes
            </h2>
          </div>
          <div className="space-y-2">
            {analysis.keyPoints.slice(0, 3).map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-oil-400 mt-0.5 text-xs">●</span>
                <span className="text-sm text-gray-300">{point}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-600 italic">
            From AI analysis of latest Eurostat stock data ·{' '}
            <a href="/" className="text-oil-400 hover:underline">See full dashboard →</a>
          </p>
        </div>
      )}

      {/* News feed with client-side filter + search */}
      {items.length > 0 ? (
        <NewsFeed items={items} />
      ) : (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-10 text-center">
          <p className="text-sm text-gray-500">News feed temporarily unavailable.</p>
          <p className="mt-1 text-xs text-gray-600">Check back shortly — feeds refresh every hour.</p>
        </div>
      )}

      {/* Reuse existing subscribe CTA */}
      <EmailCTA />

    </div>
  );
}
