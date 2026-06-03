/**
 * EuroOilWatch — JSON-LD Structured Data
 * ========================================
 * Provides rich structured data for Google, Bing, and AI systems.
 * Includes: WebSite, Organization, Dataset, WebApplication schemas.
 */

interface JsonLdProps {
  type: 'home' | 'country' | 'prices' | 'about' | 'methodology' | 'area';
  countryName?: string;
  countryCode?: string;
  // area-specific (département / provincia station-price pages)
  areaName?: string;
  areaKind?: string; // "département" | "provincia"
  areaPath?: string; // "/country/fr/dept/75"
  regionName?: string;
  fuels?: string; // human-readable fuel list, e.g. "gazole, SP95-E10, SP98"
  sourceName?: string;
  sourceUrl?: string;
}

export default function JsonLd({
  type,
  countryName,
  countryCode,
  areaName,
  areaKind,
  areaPath,
  regionName,
  fuels,
  sourceName,
  sourceUrl,
}: JsonLdProps) {
  const baseUrl = 'https://eurooilwatch.com';

  // Organization — appears on all pages
  const organization = {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'EuroOilWatch',
    url: baseUrl,
    description: 'Independent European fuel reserve and price transparency dashboard',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'admin@eurooilwatch.com',
      contactType: 'customer service',
    },
  };

  // WebSite — for sitelinks search box
  const webSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'EuroOilWatch',
    url: baseUrl,
    description: 'Live EU fuel reserve tracking, price monitoring, and AI-powered energy security analysis across 27 European countries.',
    publisher: { '@id': `${baseUrl}/#organization` },
    inLanguage: 'en',
  };

  // Dataset — for Google Dataset Search
  const dataset = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'EU Fuel Reserve and Price Data',
    description: 'Monthly oil stock levels, weekly fuel prices, and crude oil benchmarks for all 27 EU member states. Sources: Eurostat (nrg_stk_oilm), EC Weekly Oil Bulletin, Stooq.',
    url: baseUrl,
    license: 'https://ec.europa.eu/eurostat/about-us/policies/copyright',
    creator: organization,
    temporalCoverage: '2024/..',
    spatialCoverage: {
      '@type': 'Place',
      name: 'European Union',
      geo: {
        '@type': 'GeoShape',
        box: '34.5 -10.5 71.5 40.0',
      },
    },
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: `${baseUrl}/api/data/stocks`,
      },
    ],
    variableMeasured: [
      {
        '@type': 'PropertyValue',
        name: 'Oil stock levels',
        unitText: 'thousand tonnes',
        description: 'Monthly closing stock levels for petrol, diesel, and jet fuel by EU country',
      },
      {
        '@type': 'PropertyValue',
        name: 'Days of supply',
        unitText: 'days',
        description: 'Calculated days of fuel supply based on stock levels and consumption rates',
      },
      {
        '@type': 'PropertyValue',
        name: 'Consumer fuel prices',
        unitText: 'EUR per litre',
        description: 'Weekly national average pump prices including all taxes',
      },
    ],
    isBasedOn: [
      {
        '@type': 'Dataset',
        name: 'Eurostat Oil Stock Levels (nrg_stk_oilm)',
        description: 'Eurostat monthly oil and petroleum-product stock levels for EU member states (dataset nrg_stk_oilm).',
        url: 'https://ec.europa.eu/eurostat/databrowser/view/NRG_STK_OILM',
      },
      {
        '@type': 'Dataset',
        name: 'EC Weekly Oil Bulletin',
        description: 'European Commission weekly consumer fuel prices (petrol, diesel, heating oil) for all EU member states, including taxes.',
        url: 'https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en',
      },
    ],
  };

  // WebApplication — for the dashboard itself
  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'EuroOilWatch Dashboard',
    url: baseUrl,
    applicationCategory: 'ReferenceApplication',
    operatingSystem: 'Any',
    description: 'Real-time European fuel reserve monitoring dashboard with AI-powered analysis',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    creator: organization,
  };

  // Page-specific schemas
  const schemas: object[] = [];

  if (type === 'home') {
    schemas.push(webSite, dataset, webApp);

    // WebPage
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'EuroOilWatch — European Fuel Reserve Monitor',
      description: 'Live EU fuel reserve tracking, price monitoring, and AI-powered energy security analysis across 27 European countries.',
      url: baseUrl,
      isPartOf: { '@id': `${baseUrl}/#website` },
      about: {
        '@type': 'Thing',
        name: 'European Union fuel security',
      },
      mainEntity: { '@id': `${baseUrl}/#dataset` },
    });
  }

  if (type === 'country' && countryName && countryCode) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: countryName,
          item: `${baseUrl}/country/${countryCode.toLowerCase()}`,
        },
      ],
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${countryName} — Fuel Reserves & Prices | EuroOilWatch`,
      description: `Fuel reserve levels and pump prices for ${countryName}. Track petrol, diesel, and jet fuel stock days and weekly prices.`,
      url: `${baseUrl}/country/${countryCode.toLowerCase()}`,
      isPartOf: { '@id': `${baseUrl}/#website` },
      about: {
        '@type': 'Country',
        name: countryName,
      },
    });
  }

  if (type === 'area' && areaName && areaPath && countryName) {
    const url = `${baseUrl}${areaPath}`;

    // Breadcrumb: Home → Country → Area
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        {
          '@type': 'ListItem',
          position: 2,
          name: countryName,
          item: `${baseUrl}/country/${(countryCode ?? '').toLowerCase()}`,
        },
        { '@type': 'ListItem', position: 3, name: areaName, item: url },
      ],
    });

    // Dataset: the live station-price feed for this area
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `Live fuel prices — ${areaName}${areaKind ? ` (${areaKind})` : ''}`,
      description: `Station-level ${fuels ?? 'fuel'} prices for ${areaName}${regionName ? `, ${regionName}` : ''}, ${countryName}. Updated daily${sourceName ? ` from ${sourceName}` : ''}.`,
      url,
      isAccessibleForFree: true,
      creator: organization,
      temporalCoverage: '2024/..',
      spatialCoverage: {
        '@type': 'Place',
        name: `${areaName}, ${countryName}`,
      },
      variableMeasured: {
        '@type': 'PropertyValue',
        name: 'Consumer fuel prices',
        unitText: 'EUR per litre',
        description: `Station-level pump prices (${fuels ?? 'multiple fuel grades'}) including all taxes`,
      },
      ...(sourceUrl
        ? { isBasedOn: { '@type': 'Dataset', name: sourceName ?? 'Official source', url: sourceUrl } }
        : {}),
    });
  }

  if (type === 'prices') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'EU Fuel Prices — All 27 Countries | EuroOilWatch',
      description: 'Compare petrol and diesel prices across all 27 EU countries. Weekly data from the EC Oil Bulletin.',
      url: `${baseUrl}/prices`,
      isPartOf: { '@id': `${baseUrl}/#website` },
    });
  }

  if (type === 'methodology') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'EuroOilWatch Methodology',
      description: 'How EuroOilWatch collects, processes, and presents EU fuel reserve and price data from Eurostat and the EC Oil Bulletin.',
      url: `${baseUrl}/methodology`,
      author: organization,
    });
  }

  if (type === 'about') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About EuroOilWatch',
      description: 'About EuroOilWatch — an independent European fuel reserve and price transparency dashboard.',
      url: `${baseUrl}/about`,
      mainEntity: organization,
    });
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
