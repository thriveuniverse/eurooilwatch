import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getReliefWebReports } from '@/lib/reliefweb';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Analysis | EuroOilWatch',
  description:
    'In-depth analysis of European oil markets, supply security, and energy geopolitics from EuroOilWatch.',
  alternates: { canonical: 'https://eurooilwatch.com/analysis' },
  openGraph: {
    title: 'Analysis | EuroOilWatch',
    description:
      'In-depth analysis of European oil markets, supply security, and energy geopolitics.',
    url: 'https://eurooilwatch.com/analysis',
    siteName: 'EuroOilWatch',
    type: 'website',
  },
};

interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author?: string;
}

function getArticles(): ArticleMeta[] {
  const dir = path.join(process.cwd(), 'content/analysis');
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

  const articles: ArticleMeta[] = files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { data } = matter(raw);
    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? '',
      excerpt: data.excerpt ?? '',
      author: data.author,
    };
  });

  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default async function AnalysisPage() {
  const articles = getArticles();
  const rwReports = await getReliefWebReports();

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">
          ← Back to dashboard
        </a>
        <h1 className="mt-2 text-2xl font-bold text-white">Analysis</h1>
        <p className="mt-2 text-sm text-gray-400">
          In-depth analysis of European oil markets and energy security.
        </p>
      </div>

      {/* Editorial articles */}
      {articles.length === 0 ? (
        <p className="text-gray-500 text-sm">No articles yet.</p>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <a
              key={article.slug}
              href={`/analysis/${article.slug}`}
              className="block rounded-lg border border-oil-800 bg-oil-900/30 p-5 hover:border-oil-600 hover:bg-oil-900/50 transition group"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                {article.date && (
                  <time dateTime={article.date}>
                    {new Date(article.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                )}
                {article.author && (
                  <>
                    <span>·</span>
                    <span>{article.author}</span>
                  </>
                )}
              </div>
              <h2 className="text-lg font-semibold text-white group-hover:text-oil-400 transition">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="mt-2 text-sm text-gray-400 leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>
              )}
              <span className="mt-3 inline-block text-xs text-oil-400 group-hover:underline">
                Read more →
              </span>
            </a>
          ))}
        </div>
      )}

      {/* ReliefWeb situation reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
            UN / OCHA Situation Reports
          </h2>
          <a
            href="https://reliefweb.int"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-600 hover:text-gray-400 transition"
          >
            Source: ReliefWeb →
          </a>
        </div>

        {rwReports.length === 0 ? (
          <p className="text-xs text-gray-600">No recent reports available.</p>
        ) : (
          <div className="space-y-3">
            {rwReports.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-oil-800 bg-oil-900/20 p-4 hover:border-oil-700 hover:bg-oil-900/40 transition group"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {r.date && (
                    <time dateTime={r.date} className="text-[10px] text-gray-500">
                      {new Date(r.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  )}
                  {r.sources.length > 0 && (
                    <>
                      <span className="text-[10px] text-gray-600">·</span>
                      <span className="text-[10px] text-gray-500">{r.sources.join(', ')}</span>
                    </>
                  )}
                  {r.countries.length > 0 && (
                    <>
                      <span className="text-[10px] text-gray-600">·</span>
                      <span className="text-[10px] text-gray-500">{r.countries.join(', ')}</span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-300 group-hover:text-white transition leading-snug">
                  {r.title}
                </h3>
                {r.snippet && (
                  <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {r.snippet}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}

        <p className="text-[10px] text-gray-600">
          Situation reports sourced from ReliefWeb (UN OCHA). Filtered for relevance to oil, fuel, and energy supply security.
          Updated hourly.
        </p>
      </div>
    </div>
  );
}
