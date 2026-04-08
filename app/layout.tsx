import type { Metadata } from 'next';
import './globals.css';
import MobileNav from '@/components/MobileNav';

export const metadata: Metadata = {
  metadataBase: new URL('https://eurooilwatch.com'),
  title: {
    default: 'EuroOilWatch — EU Fuel Reserve & Price Intelligence',
    template: '%s | EuroOilWatch',
  },
  description:
    'Monitor fuel reserve levels and prices across 27 EU countries. Official Eurostat data, weekly price updates, AI analysis. Used by logistics operators, analysts, and journalists.',
  keywords: [
    'EU fuel reserves', 'European oil stocks', 'fuel prices Europe',
    'energy security', 'strategic petroleum reserves', 'oil watch Europe',
    'Brent crude', 'diesel shortage Europe', 'EU oil stocks Eurostat',
    'fuel reserve monitor', 'EU energy crisis', 'European diesel crisis 2026',
    'EU fuel security dashboard', 'fuel intelligence Europe',
  ],
  authors: [{ name: 'EuroOilWatch' }],
  creator: 'EuroOilWatch',
  publisher: 'EuroOilWatch',
  openGraph: {
    title: 'EuroOilWatch — EU Fuel Reserve & Price Intelligence',
    description: 'Monitor fuel reserves and prices across 27 EU countries. Official Eurostat data, AI analysis, 18-month trend charts.',
    url: 'https://eurooilwatch.com',
    siteName: 'EuroOilWatch',
    type: 'website',
    locale: 'en_GB',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EuroOilWatch — EU fuel reserve gauges and price data' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EuroOilWatch — EU Fuel Reserve & Price Intelligence',
    description: 'Monitor fuel reserves and prices across 27 EU countries.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: 'https://eurooilwatch.com' },
  verification: { google: 'google873cc4d2dfb83a49' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06111f" />
      </head>
      <body className="min-h-screen bg-oil-950 text-gray-200 antialiased">
        <header className="border-b border-oil-800 bg-oil-950/80 backdrop-blur sticky top-0 z-50">
          <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2" aria-label="EuroOilWatch home">
              <span className="text-2xl" role="img" aria-label="Oil barrel">🛢️</span>
              <div>
                <span className="font-bold text-lg tracking-tight text-white">
                  Euro<span className="text-oil-400">Oil</span>Watch
                </span>
                <span className="hidden sm:inline text-xs text-gray-500 ml-2">
                  Fuel security intelligence for Europe
                </span>
              </div>
            </a>
            <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-400" aria-label="Main navigation">
              <a href="/" className="hover:text-white transition">Dashboard</a>
              <a href="/prices" className="hover:text-white transition">Prices</a>
              <a href="/analysis" className="hover:text-white transition">Analysis</a>
              <a href="/news" className="hover:text-white transition">News</a>
              <a href="/methodology" className="hover:text-white transition">Methodology</a>
              <a href="/about" className="hover:text-white transition">About</a>
            </nav>
            <MobileNav />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6" role="main">{children}</main>

        <footer className="border-t border-oil-800 mt-12" role="contentinfo">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="text-xs text-gray-500 max-w-lg">
                <p>
                  EuroOilWatch monitors European fuel reserves and prices using
                  official Eurostat and EC Oil Bulletin data. Independent. Not
                  affiliated with any government or energy company. Nothing on
                  this site constitutes financial advice.
                </p>
              </div>
              <div className="flex flex-col sm:items-end gap-1 text-xs text-gray-500">
                <div className="flex gap-4">
                  <a href="/" className="hover:text-gray-300">Dashboard</a>
                  <a href="/prices" className="hover:text-gray-300">Prices</a>
                  <a href="/methodology" className="hover:text-gray-300">Methodology</a>
                  <a href="/about" className="hover:text-gray-300">About</a>
                </div>
                <div className="flex gap-4">
                  <a href="#briefing" className="hover:text-gray-300">Weekly Briefing</a>
                  <a href="https://ukoilwatch.com" className="hover:text-gray-300">UK Data →</a>
                  <a href="mailto:jon@eurooilwatch.com" className="hover:text-gray-300">Contact</a>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-gray-600">
              © {new Date().getFullYear()} EuroOilWatch ·{' '}
              <a href="mailto:jon@eurooilwatch.com" className="hover:text-gray-400">jon@eurooilwatch.com</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
