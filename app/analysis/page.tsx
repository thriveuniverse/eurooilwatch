import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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

export default function AnalysisPage() {
  const articles = getArticles();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">
          ← Back to dashboard
        </a>
        <h1 className="mt-2 text-2xl font-bold text-white">Analysis</h1>
        <p className="mt-2 text-sm text-gray-400">
          In-depth analysis of European oil markets and energy security.
        </p>
      </div>

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
    </div>
  );
}
