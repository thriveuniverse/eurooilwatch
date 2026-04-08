import Parser from 'rss-parser';

export type NewsCategory =
  | 'Geopolitics'
  | 'Refinery'
  | 'Policy'
  | 'Diesel & Reserves'
  | 'Crude Prices'
  | 'General';

export interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  source: string;
  date: string; // ISO string
  url: string;
  category: NewsCategory;
  thumbnail?: string;
}

// Reliable free RSS feeds covering energy, oil, and European supply news
const FEEDS: { url: string; source: string }[] = [
  { url: 'https://oilprice.com/rss/main', source: 'OilPrice.com' },
  { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters' },
  { url: 'https://www.offshore-technology.com/feed/', source: 'Offshore Technology' },
];

type CustomItem = {
  'media:thumbnail'?: { $: { url: string } };
  'media:content'?: { $: { url: string } };
};

function categorize(title: string, snippet: string): NewsCategory {
  const text = (title + ' ' + snippet).toLowerCase();
  if (/hormuz|opec|iran|saudi|middle east|conflict|geopolit|russia|ukraine|tanker|sanctions/.test(text))
    return 'Geopolitics';
  if (/refiner|refining|capacity|throughput|cracking|petrochemical/.test(text))
    return 'Refinery';
  if (/\beu\b|europe|directive|regulation|\biea\b|policy|government|commission|parliament/.test(text))
    return 'Policy';
  if (/diesel|shortage|reserves|stock|emergency|strategic|supply disruption/.test(text))
    return 'Diesel & Reserves';
  if (/brent|wti|crude|barrel|price|opec/.test(text))
    return 'Crude Prices';
  return 'General';
}

export async function fetchNews(): Promise<NewsItem[]> {
  const parser = new Parser<Record<string, never>, CustomItem>({
    timeout: 8000,
    customFields: {
      item: ['media:thumbnail', 'media:content'],
    },
  });

  const results = await Promise.allSettled(
    FEEDS.map(feed =>
      parser.parseURL(feed.url).then(data => ({ data, source: feed.source }))
    )
  );

  const items: NewsItem[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const { data, source } = result.value;

    for (const item of (data.items || []).slice(0, 25)) {
      if (!item.title || !item.link) continue;

      const snippet = (item.contentSnippet || item.summary || '')
        .replace(/<[^>]+>/g, '') // strip any HTML tags
        .slice(0, 220)
        .trim();

      const date = item.isoDate || item.pubDate || new Date().toISOString();

      const thumbnail =
        item['media:thumbnail']?.$.url ||
        item['media:content']?.$.url;

      items.push({
        id: item.guid || item.link,
        title: item.title.trim(),
        snippet,
        source,
        date,
        url: item.link,
        category: categorize(item.title, snippet),
        ...(thumbnail ? { thumbnail } : {}),
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((item, i, arr) => arr.findIndex(x => x.url === item.url) === i) // deduplicate
    .slice(0, 30);
}
