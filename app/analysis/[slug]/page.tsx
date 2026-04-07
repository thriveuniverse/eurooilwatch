import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import EmailCTA from '@/components/EmailCTA';

const CONTENT_DIR = path.join(process.cwd(), 'content/analysis');

function getArticle(slug: string) {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { data, content };
}

export async function generateStaticParams() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ slug: f.replace(/\.md$/, '') }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = getArticle(params.slug);
  if (!article) return {};
  const { data } = article;
  return {
    title: data.title,
    description: data.excerpt,
    authors: data.author ? [{ name: data.author }] : undefined,
    alternates: {
      canonical: `https://eurooilwatch.com/analysis/${params.slug}`,
    },
    openGraph: {
      title: data.title,
      description: data.excerpt,
      url: `https://eurooilwatch.com/analysis/${params.slug}`,
      siteName: 'EuroOilWatch',
      type: 'article',
      publishedTime: data.date,
    },
  };
}

// Configure marked for safe rendering using extensions API (marked v5+)
marked.use({
  renderer: {
    table(token) {
      const headerCells = token.header
        .map((cell) => {
          const align = cell.align ? ` style="text-align:${cell.align}"` : '';
          return `<th class="border border-oil-800 bg-oil-900/60 px-3 py-2 text-left font-semibold text-white"${align}>${cell.text}</th>`;
        })
        .join('');
      const headerRow = `<thead><tr>${headerCells}</tr></thead>`;
      const bodyRows = token.rows
        .map((row) => {
          const cells = row
            .map((cell) => {
              const align = cell.align ? ` style="text-align:${cell.align}"` : '';
              return `<td class="border border-oil-800 bg-oil-900/30 px-3 py-2 text-gray-300"${align}>${cell.text}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      const body = `<tbody>${bodyRows}</tbody>`;
      return `<div class="overflow-x-auto my-6"><table class="w-full text-sm border-collapse border border-oil-800">${headerRow}${body}</table></div>`;
    },
    blockquote(token) {
      return `<blockquote class="border-l-4 border-oil-600 pl-4 my-4 text-gray-400 italic">${token.text}</blockquote>`;
    },
    hr() {
      return `<hr class="border-oil-800 my-8" />`;
    },
  },
});

export default function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = getArticle(params.slug);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto">
        <a href="/analysis" className="text-xs text-oil-400 hover:underline">
          ← Back to Analysis
        </a>
        <p className="mt-8 text-gray-400">Article not found.</p>
      </div>
    );
  }

  const { data, content } = article;
  const html = marked.parse(content) as string;

  const formattedDate = data.date
    ? new Date(data.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <a href="/analysis" className="text-xs text-oil-400 hover:underline">
          ← Back to Analysis
        </a>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          {formattedDate && (
            <time dateTime={data.date}>{formattedDate}</time>
          )}
          {data.author && (
            <>
              <span>·</span>
              <span>{data.author}</span>
            </>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold text-white leading-snug">
          {data.title}
        </h1>
        {data.excerpt && (
          <p className="mt-3 text-base text-gray-400 leading-relaxed border-l-4 border-oil-700 pl-4">
            {data.excerpt}
          </p>
        )}
      </div>

      <article
        className="prose-article text-sm text-gray-300 leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="pt-4 border-t border-oil-800">
        <EmailCTA />
      </div>

      <div className="pb-4">
        <a href="/analysis" className="text-xs text-oil-400 hover:underline">
          ← Back to Analysis
        </a>
      </div>
    </div>
  );
}
