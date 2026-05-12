import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'EuroOilWatch — European Gas Tracker: TTF vs Henry Hub + AGSI storage';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function loadJson<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

export default async function OgGas() {
  const gas = loadJson<any>('gas.json');
  const ttfEur = gas?.ttf?.priceEurMwh ?? 0;
  const hhUsd  = gas?.hh?.priceUsdMmbtu ?? 0;
  const ratio  = gas?.spread?.ratio ?? 0;
  const storage = gas?.storage?.eu;
  const target  = gas?.storage?.target?.fullPct ?? 90;
  const lowest  = gas?.storage?.countries
    ? [...gas.storage.countries].sort((a: any, b: any) => a.fullPct - b.fullPct)[0]
    : null;

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #0a1929 0%, #0f1e35 50%, #1a2942 100%)',
        padding: '60px 70px', color: '#e2e8f0', fontFamily: 'sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: '#f59e0b', boxShadow: '0 0 18px #f59e0b' }} />
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>EuroOilWatch</span>
            <span style={{
              marginLeft: 10, fontSize: 13, fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase',
              color: '#fbbf24', padding: '4px 10px',
              border: '1px solid rgba(217, 119, 6, 0.6)', borderRadius: 6, background: 'rgba(120, 53, 15, 0.25)',
            }}>
              Gas Tracker
            </span>
          </div>
          <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#64748b', letterSpacing: 1.5 }}>
            eurooilwatch.com/gas
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 50 }}>
          <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8', marginBottom: 24 }}>
            <span>Europe pays vs US for the same natural gas energy</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 30, marginBottom: 28 }}>
            <span style={{
              fontSize: 180, fontWeight: 800,
              color: ratio >= 5 ? '#ef4444' : ratio >= 3 ? '#f97316' : '#fbbf24',
              lineHeight: 1, fontFamily: 'monospace',
            }}>
              {ratio.toFixed(2)}x
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 22, color: '#cbd5e1' }}>TTF / Henry Hub</span>
              <span style={{ fontSize: 16, color: '#94a3b8', marginTop: 4 }}>normalised to USD/MMBtu</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Dutch TTF</span>
              <span style={{ fontSize: 42, fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace', marginTop: 4 }}>
                €{ttfEur.toFixed(2)}
              </span>
              <span style={{ fontSize: 14, color: '#94a3b8' }}>/MWh</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Henry Hub</span>
              <span style={{ fontSize: 42, fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace', marginTop: 4 }}>
                ${hhUsd.toFixed(3)}
              </span>
              <span style={{ fontSize: 14, color: '#94a3b8' }}>/MMBtu</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 720 }}>
            {storage ? (
              <span style={{ fontSize: 18, color: '#cbd5e1' }}>
                EU gas storage: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>{storage.fullPct.toFixed(1)}%</span> full · gap to {target}% target: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>{(target - storage.fullPct).toFixed(1)} pts</span>
                {lowest && (
                  <span> · lowest: <span style={{ color: '#f87171', fontFamily: 'monospace' }}>{lowest.name} {lowest.fullPct.toFixed(1)}%</span></span>
                )}
              </span>
            ) : (
              <span style={{ fontSize: 18, color: '#94a3b8' }}>EU gas storage data pending</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', letterSpacing: 1 }}>
              Source: Yahoo + AGSI/GIE
            </span>
            <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace', letterSpacing: 1, marginTop: 4 }}>
              eurooilwatch.com/api/v1/gas
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
