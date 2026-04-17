export interface ReliefWebReport {
  id: string;
  title: string;
  date: string;        // ISO string
  sources: string[];   // e.g. ["OCHA", "WFP"]
  countries: string[]; // affected countries
  themes: string[];
  url: string;
  snippet: string;     // first ~200 chars of body, HTML stripped
}

type RWField = { name: string };
type RWResponse = {
  data: {
    id: string;
    fields: {
      title: string;
      date: { created: string };
      source?: RWField[];
      country?: RWField[];
      theme?: RWField[];
      url_alias?: string;
      body?: string;
    };
  }[];
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function getReliefWebReports(): Promise<ReliefWebReport[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      'https://api.reliefweb.int/v1/reports?appname=eurooilwatch.com&slim=1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            value: 'oil fuel energy supply disruption refinery tanker Hormuz "Red Sea" sanctions pipeline',
            operator: 'OR',
            fields: ['title^3', 'body'],
          },
          filter: { field: 'status', value: 'published' },
          fields: {
            include: ['title', 'date.created', 'source.name', 'country.name', 'theme.name', 'url_alias', 'body'],
          },
          sort: ['date.created:desc'],
          limit: 8,
        }),
        signal: controller.signal,
        next: { revalidate: 3600 },
      }
    );
    clearTimeout(timeout);

    if (!res.ok) return [];

    const json = await res.json() as RWResponse;

    return (json.data || []).map((item) => {
      const f = item.fields;
      const body = f.body ? stripHtml(f.body).slice(0, 220).trim() : '';
      const snippet = body.length === 220 ? body + '…' : body;

      return {
        id: item.id,
        title: f.title,
        date: f.date?.created ?? '',
        sources: (f.source ?? []).map((s) => s.name),
        countries: (f.country ?? []).map((c) => c.name).slice(0, 3),
        themes: (f.theme ?? []).map((t) => t.name),
        url: f.url_alias ?? `https://reliefweb.int/report/${item.id}`,
        snippet,
      };
    });
  } catch {
    return [];
  }
}
