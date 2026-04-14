import Parser from 'rss-parser';

export type GDACSAlertLevel = 'Green' | 'Orange' | 'Red';

export interface GDACSEvent {
  id: string;
  title: string;
  country: string;
  alertLevel: GDACSAlertLevel;
  eventType: string;
  severity: string;
  date: string;
  url: string;
}

// Countries with direct relevance to EU oil supply routes
const OIL_RELEVANT_COUNTRIES = new Set([
  'Iran', 'Iraq', 'Saudi Arabia', 'Kuwait', 'United Arab Emirates', 'UAE',
  'Qatar', 'Oman', 'Yemen', 'Libya', 'Algeria', 'Nigeria', 'Russia',
  'Azerbaijan', 'Kazakhstan', 'Norway', 'Egypt', 'Turkey', 'Syria',
  'Lebanon', 'Djibouti', 'Eritrea', 'Somalia', 'Sudan', 'South Sudan',
  'Netherlands', 'Belgium', 'Germany', 'France', 'Italy', 'Spain',
  'Greece', 'Poland',
]);

type CustomItem = {
  'gdacs:alertlevel'?: string;
  'gdacs:eventtype'?: string;
  'gdacs:country'?: string;
  'gdacs:severity'?: string;
};

export async function getGDACSEvents(): Promise<GDACSEvent[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://www.gdacs.org/xml/rss_24h.xml', {
      signal: controller.signal,
      // Next.js cache — revalidate every hour alongside the page
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();

    const parser = new Parser<Record<string, never>, CustomItem>({
      customFields: {
        item: [
          'gdacs:alertlevel',
          'gdacs:eventtype',
          'gdacs:country',
          'gdacs:severity',
        ],
      },
    });

    const feed = await parser.parseString(xml);
    const events: GDACSEvent[] = [];

    for (const item of feed.items || []) {
      const rawLevel = item['gdacs:alertlevel'];
      if (!rawLevel) continue;

      // Normalise casing — GDACS sends "Green", "Orange", "Red"
      const alertLevel = (rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase()) as GDACSAlertLevel;
      if (!['Green', 'Orange', 'Red'].includes(alertLevel)) continue;

      const country = (item['gdacs:country'] || '').trim();

      // Show Red/Orange globally; Green only for oil-supply-relevant countries
      if (alertLevel === 'Green' && !OIL_RELEVANT_COUNTRIES.has(country)) continue;

      events.push({
        id: item.guid || item.link || `${item.title}-${item.pubDate}`,
        title: (item.title || 'Unknown event').trim(),
        country,
        alertLevel,
        eventType: (item['gdacs:eventtype'] || '').trim(),
        severity: (item['gdacs:severity'] || '').trim(),
        date: item.isoDate || item.pubDate || new Date().toISOString(),
        url: item.link || 'https://www.gdacs.org',
      });
    }

    // Most severe first, then most recent
    const levelOrder: Record<GDACSAlertLevel, number> = { Red: 0, Orange: 1, Green: 2 };
    return events.sort((a, b) => {
      const levelDiff = levelOrder[a.alertLevel] - levelOrder[b.alertLevel];
      if (levelDiff !== 0) return levelDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  } catch {
    return [];
  }
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  EQ: 'Earthquake',
  TC: 'Tropical Cyclone',
  FL: 'Flood',
  VO: 'Volcano',
  DR: 'Drought',
  WF: 'Wildfire',
  TS: 'Tsunami',
  CY: 'Cyclone',
};

export const EVENT_TYPE_ICONS: Record<string, string> = {
  EQ: '🌍',
  TC: '🌀',
  FL: '💧',
  VO: '🌋',
  DR: '☀️',
  WF: '🔥',
  TS: '🌊',
  CY: '🌀',
};
