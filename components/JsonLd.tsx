/**
 * EuroOilWatch — JSON-LD Structured Data
 * ========================================
 * Provides rich structured data for Google, Bing, and AI systems.
 * Includes: WebSite, Organization, Dataset, WebApplication schemas.
 */

interface JsonLdProps {
  type: 'home' | 'country' | 'prices' | 'about' | 'methodology';
  countryName?: string;
  countryCode?: string;
}

export default function JsonLd({ type, countryName, countryCode }: JsonLdProps) {
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
    description: 'Monthly oil stock levels, weekly fuel prices, and crude oil benchmarks for all 27 EU member states. Sources: Eurostat (nrg_stk_oilm), EC Weekly Oil Bulletin, Yahoo Finance.',
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
        url: 'https://ec.europa.eu/eurostat/databrowser/view/NRG_STK_OILM',
      },
      {
        '@type': 'Dataset',
        name: 'EC Weekly Oil Bulletin',
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
