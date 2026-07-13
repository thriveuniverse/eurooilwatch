import fs from 'fs';
import path from 'path';
import FreshnessGuard from '@/components/FreshnessGuard';
import { getHormuzTimeline } from '@/lib/hormuz-timeline';

/**
 * Hormuz Force Posture — a SOURCED US/Iran naval order-of-battle for the strait.
 * The credible inverse of an AI "tactical situation" graphic: every entry carries a
 * source, a last-confirmed date, and a confidence flag (confirmed = agency/official
 * reporting; assessed = analyst/reference estimate). Framed as REPORTED open-source
 * posture, not live positions. Editorially maintained via data/hormuz-posture.json.
 */

interface Force {
  category: string;
  detail: string;
  confidence: 'confirmed' | 'assessed';
  source: { label: string; url: string };
  lastConfirmed: string;
}
interface Side {
  label: string;
  forces: Force[];
}
interface Posture {
  asOf: string;
  operation?: string;
  disclaimer: string;
  us: Side;
  iran: Side;
}

function readPosture(): Posture | null {
  const p = path.join(process.cwd(), 'data', 'hormuz-posture.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as Posture; } catch { return null; }
}

function fmt(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function Column({ side, accent }: { side: Side; accent: string }) {
  return (
    <div className="min-w-0">
      <h3 className={`text-xs font-mono font-semibold tracking-widest uppercase ${accent}`}>{side.label}</h3>
      <ul className="mt-2 space-y-3">
        {side.forces.map((f, i) => (
          <li key={i} className="text-xs leading-relaxed">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">{f.category}</span>
              <span
                className={`text-[9px] font-mono uppercase tracking-wide rounded px-1 py-0.5 border ${
                  f.confidence === 'confirmed'
                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'
                    : 'bg-amber-950/40 text-amber-300/90 border-amber-800/40'
                }`}
              >
                {f.confidence}
              </span>
            </div>
            <p className="mt-0.5 text-gray-400">{f.detail}</p>
            <p className="mt-0.5 text-[10px] text-gray-600 font-mono">
              <a
                href={f.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-400"
              >
                {f.source.label}
              </a>
              {' · confirmed '}
              {fmt(f.lastConfirmed)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HormuzPosturePanel() {
  const d = readPosture();
  if (!d) return null;

  const incidents = getHormuzTimeline()
    .events.filter((e) => e.category === 'military' || e.category === 'shipping')
    .slice(0, 4);

  return (
    <section aria-label="Hormuz force posture" className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          Strait of Hormuz — Force Posture
        </h2>
        <span className="text-[10px] font-mono text-gray-600">
          {d.operation ? `${d.operation} · ` : ''}reported, not live positions
        </span>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Column side={d.us} accent="text-sky-400/80" />
          <Column side={d.iran} accent="text-red-400/80" />
        </div>

        {incidents.length > 0 && (
          <div className="mt-4 pt-3 border-t border-oil-800/50">
            <h3 className="text-[10px] font-mono font-semibold tracking-widest text-gray-500 uppercase">
              Recent incidents · from the crisis timeline
            </h3>
            <ul className="mt-2 space-y-1.5">
              {incidents.map((e) => (
                <li key={e.id} className="flex gap-2 text-[11px] leading-relaxed">
                  <span className="flex-shrink-0 font-mono text-gray-600">{fmt(e.date)}</span>
                  <span className="text-gray-400">
                    {e.headline}
                    {e.sources?.[0] && (
                      <>
                        {' · '}
                        <a
                          href={e.sources[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 underline hover:text-gray-400"
                        >
                          {e.sources[0].label}
                        </a>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-gray-600">
              Full chronology:{' '}
              <a href="/hormuz-timeline" className="underline hover:text-gray-400">
                Strait of Hormuz crisis timeline &rarr;
              </a>
            </p>
          </div>
        )}

        <p className="mt-4 pt-3 border-t border-oil-800/50 text-[10px] text-gray-500 leading-relaxed">
          {d.disclaimer}
        </p>

        <FreshnessGuard lastUpdated={d.asOf} maxAgeDays={7} label="This posture snapshot" className="mt-2" />
      </div>
    </section>
  );
}
