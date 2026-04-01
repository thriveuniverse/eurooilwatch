import { MetadataRoute } from 'next';
import { EU27_CODES } from '@/lib/countries';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://eurooilwatch.com';

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
    ...countryPages,
  ];
}
