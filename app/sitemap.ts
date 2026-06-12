import { MetadataRoute } from 'next';
import { EU27_CODES } from '@/lib/countries';
import { DEPARTMENTS } from '@/lib/france-geo';
import { PROVINCES as ES_PROVINCES } from '@/lib/spain-geo';
import { PROVINCES as IT_PROVINCES } from '@/lib/italy-geo';
import { PROVINCES as PT_PROVINCES } from '@/lib/portugal-geo';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://eurooilwatch.com';

  // Auto-discover analysis articles
  const analysisDir = path.join(process.cwd(), 'content/analysis');
  const analysisPages: MetadataRoute.Sitemap = fs.existsSync(analysisDir)
    ? fs
        .readdirSync(analysisDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
          const slug = f.replace(/\.md$/, '');
          let lastModified: Date;
          try {
            const file = fs.readFileSync(path.join(analysisDir, f), 'utf-8');
            const { data } = matter(file);
            lastModified = data.date ? new Date(String(data.date)) : new Date();
          } catch {
            lastModified = new Date();
          }
          return {
            url: `${baseUrl}/analysis/${slug}`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.75,
          };
        })
    : [];

  const countryPages: MetadataRoute.Sitemap = EU27_CODES.map((code) => ({
    url: `${baseUrl}/country/${code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // France département pages — daily-refreshed, station-level
  const franceDeptPages: MetadataRoute.Sitemap = Object.keys(DEPARTMENTS).map((code) => ({
    url: `${baseUrl}/country/fr/dept/${code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.65,
  }));

  // Spain provincia pages — daily-refreshed, station-level
  const spainProvPages: MetadataRoute.Sitemap = Object.keys(ES_PROVINCES).map((code) => ({
    url: `${baseUrl}/country/es/prov/${code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.65,
  }));

  // Italy provincia pages — daily-refreshed, station-level
  const italyProvPages: MetadataRoute.Sitemap = Object.keys(IT_PROVINCES).map((code) => ({
    url: `${baseUrl}/country/it/prov/${code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.65,
  }));

  // Portugal distrito pages — daily-refreshed, station-level (DGEG open data)
  const portugalDistritoPages: MetadataRoute.Sitemap = Object.keys(PT_PROVINCES).map((code) => ({
    url: `${baseUrl}/country/pt/distrito/${code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.65,
  }));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl,                                          lastModified: new Date(),                changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/prices`,                              lastModified: new Date(),                changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/supply`,                              lastModified: new Date(),                changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/fertilizer`,                          lastModified: new Date(),                changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${baseUrl}/analysis`,                            lastModified: new Date(),                changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/reports/from-hormuz-to-hunger`,       lastModified: new Date('2026-04-30'),    changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/reports/the-fall-of-the-uk`,          lastModified: new Date('2026-04-30'),    changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/news`,                                lastModified: new Date(),                changeFrequency: 'daily',   priority: 0.7 },
    { url: `${baseUrl}/methodology`,                         lastModified: new Date(),                changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/doom-loop`,                           lastModified: new Date(),                changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/runway`,                              lastModified: new Date(),                changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`,                               lastModified: new Date(),                changeFrequency: 'monthly', priority: 0.4 },
  ];

  return [...staticRoutes, ...analysisPages, ...countryPages, ...franceDeptPages, ...spainProvPages, ...italyProvPages, ...portugalDistritoPages];
}
