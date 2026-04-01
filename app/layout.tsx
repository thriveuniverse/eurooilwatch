import type { Metadata } from 'next';
import './globals.css';
import MobileNav from '@/components/MobileNav';

export const metadata: Metadata = {
  title: 'EuroOilWatch — European Fuel Reserve Monitor',
  description:
    'Live EU fuel reserve tracking, price monitoring, and AI-powered energy security analysis across 27 European countries.',
  keywords: [
    'EU fuel reserves',
    'European oil stocks',
    'fuel prices Europe',
    'energy security',
    'strategic petroleum reserves',
    'oil watch',
    'Brent crude',
  ],
  openGraph: {
    title: 'EuroOilWatch — European Fuel Reserve Monitor',
    description:
      'Live EU fuel reserve tracking and energy security analysis across 27 countries.',
    url: 'https://eurooilwatch.com',
    siteName: 'EuroOilWatch',
    type: 'website',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EuroOilWatch — European Fuel Reserve Monitor',
    description:
      'Live EU fuel reserve tracking and energy security analysis.',
  },
  robots: { index: true, follow: true },
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
      </head>
      <body className="min-h-screen bg-oil-950 text-gray-200 antialiased">
        {/* ── Top bar ── */}
        <header className="border-b border-oil-800 bg-oil-950/80 backdrop-blur sticky top-0 z-50">
          <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🛢️</span>
              <span className="font-bold text-lg tracking-tight text-white">
                Euro<span className="text-oil-400">Oil</span>Watch
              </span>
            </a>
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-400">
              <a href="/" className="hover:text-white transition">
                Dashboard
              </a>
              <a href="/prices" className="hover:text-white transition">
                Prices
              </a>
              <a href="/methodology" className="hover:text-white transition">
                Methodology
              </a>
              <a href="/about" className="hover:text-white transition">
                About
              </a>
            </nav>
            {/* Mobile nav */}
            <MobileNav />
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

        {/* ── Footer ── */}
        <footer className="border-t border-oil-800 mt-12">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-gray-500">
            <p>
              EuroOilWatch is an independent transparency tool. Reserve figures
              are sourced from{' '}
              <a
                href="https://ec.europa.eu/eurostat"
                className="underline hover:text-gray-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Eurostat
              </a>{' '}
              and the{' '}
              <a
                href="https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en"
                className="underline hover:text-gray-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                EC Weekly Oil Bulletin
              </a>
              , not live tank gauges. Nothing on this site constitutes financial
              advice.
            </p>
            <p className="mt-2 text-gray-600">
              © {new Date().getFullYear()} EuroOilWatch · Built with public EU
              data
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
