import type { Metadata } from 'next';
import './globals.css';
import MobileNav from '@/components/MobileNav';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  metadataBase: new URL('https://eurooilwatch.com'),
  title: {
    default: 'EuroOilWatch — European Fuel Reserve Monitor',
    template: '%s | EuroOilWatch',
  },
  description:
    'Live EU fuel reserve tracking, price monitoring, and AI-powered energy security analysis across 27 European countries. Track petrol, diesel, and jet fuel stock levels against the 90-day mandatory minimum.',
  keywords: [
    'EU fuel reserves',
    'European oil stocks',
    'fuel prices Europe',
    'energy security',
    'strategic petroleum reserves',
    'oil watch Europe',
    'Brent crude',
    'diesel shortage Europe',
    'EU oil stocks Eurostat',
    'fuel reserve monitor',
    'EU energy crisis',
    'Strait of Hormuz oil',
    'European diesel crisis 2026',
    'EU fuel security dashboard',
  ],
  authors: [{ name: 'EuroOilWatch' }],
  creator: 'EuroOilWatch',
  publisher: 'EuroOilWatch',
  openGraph: {
    title: 'EuroOilWatch — European Fuel Reserve Monitor',
    description:
      'Live EU fuel reserve tracking and energy security analysis across 27 countries. 11 EU countries below the 90-day diesel safety threshold.',
    url: 'https://eurooilwatch.com',
    siteName: 'EuroOilWatch',
    type: 'website',
    locale: 'en_GB',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EuroOilWatch dashboard showing EU fuel reserve gauges — Petrol 105 days, Diesel 93 days',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EuroOilWatch — European Fuel Reserve Monitor',
    description:
      'Live EU fuel reserve tracking across 27 countries. 11 countries below the 90-day diesel minimum.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://eurooilwatch.com',
  },
  verification: {
    google: 'google873cc4d2dfb83a49',
  },
  category: 'energy',
  other: {
    'theme-color': '#06111f',
    'color-scheme': 'dark',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06111f" />
      </head>
      <body className="min-h-screen bg-oil-950 text-gray-200 antialiased">
        <JsonLd type="home" />
        <header className="border-b border-oil-800 bg-oil-950/80 backdrop-blur sticky top-0 z-50">
          <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2" aria-label="EuroOilWatch home">
              <span className="text-2xl" role="img" aria-label="Oil barrel">🛢️</span>
              <span className="font-bold text-lg tracking-tight text-white">
                Euro<span className="text-oil-400">Oil</span>Watch
              </span>
            </a>
            <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-400" aria-label="Main navigation">
              <a href="/" className="hover:text-white transition">Dashboard</a>
              <a href="/prices" className="hover:text-white transition">Prices</a>
              <a href="/methodology" className="hover:text-white transition">Methodology</a>
              <a href="/about" className="hover:text-white transition">About</a>
            </nav>
            <MobileNav />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6" role="main">{children}</main>

        <footer className="border-t border-oil-800 mt-12" role="contentinfo">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-gray-500">
            <p>
              EuroOilWatch is an independent transparency tool. Reserve figures
              are sourced from{' '}
              <a href="https://ec.europa.eu/eurostat" className="underline hover:text-gray-300" target="_blank" rel="noopener noreferrer">Eurostat</a>
              {' '}and the{' '}
              <a href="https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en" className="underline hover:text-gray-300" target="_blank" rel="noopener noreferrer">EC Weekly Oil Bulletin</a>
              , not live tank gauges. Nothing on this site constitutes financial advice.
            </p>
            <p className="mt-2 text-gray-600">
              © {new Date().getFullYear()} EuroOilWatch · Built with public EU data
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
