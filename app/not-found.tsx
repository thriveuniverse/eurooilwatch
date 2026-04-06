import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Page Not Found | EuroOilWatch',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-oil-400 font-mono text-sm tracking-widest uppercase mb-4">404</p>
      <h1 className="text-3xl font-bold text-white mb-3">Page not found</h1>
      <p className="text-gray-400 text-sm max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4 text-sm">
        <a
          href="/"
          className="px-4 py-2 rounded bg-oil-800 text-white hover:bg-oil-700 transition"
        >
          Back to dashboard
        </a>
        <a
          href="/sitemap.xml"
          className="px-4 py-2 rounded border border-oil-800 text-gray-400 hover:text-white hover:border-oil-600 transition"
        >
          Sitemap
        </a>
      </div>
    </div>
  );
}
