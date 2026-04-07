import { MetadataRoute } from 'next';
import { EU27_CODES } from '@/lib/countries';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://eurooilwatch.com';

  const analysisDir = path.join(process.cwd(), 'content/analysis');
  const analysisPages: MetadataRoute.Sitemap = fs.existsSync(analysisDir)
    ? fs
        .readdirSync(analysisDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => ({
          url: `${baseUrl}/analysis/${f.replace(/\.md$/, '')}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
    : [];

  const countryPages = EU27_CODES.map((code) => ({
    url: `${baseUrl}/country/${code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/prices`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/analysis`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    ...analysisPages,
    ...countryPages,
  ];
}
