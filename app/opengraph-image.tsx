import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'EuroOilWatch — EU-27 Fuel Reserve & Price Intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function loadJson<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

export default async function OgHome() {
  const stocks = loadJson<any>('stocks.json');
  const brent  = loadJson<any>('brent.json');
  const gas    = loadJson<any>('gas.json');

  const avg = stocks?.euAverage ?? { petrolDays: 0, dieselDays: 0, jetFuelDays: 0 };
  const period = stocks?.dataPeriod ?? '2026-02';
  const criticalCount = stocks?.countries?.filter((c: any) =>
    c.fuels?.some((f: any) => f.status === 'critical')
  ).length ?? 0;
  const totalCountries = stocks?.countries?.length ?? 27;

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
          </div>
          <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#64748b', letterSpacing: 1.5 }}>
            eurooilwatch.com
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 60 }}>
          <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8', marginBottom: 18 }}>
            <span>EU-27 fuel reserves · Eurostat period {period}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 50 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Jet</span>
              <span style={{ fontSize: 84, fontWeight: 800, color: '#fbbf24', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>{avg.jetFuelDays.toFixed(1)}</span>
              <span style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>days</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Diesel</span>
              <span style={{ fontSize: 84, fontWeight: 800, color: '#60a5fa', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>{avg.dieselDays.toFixed(1)}</span>
              <span style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>days</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Petrol</span>
              <span style={{ fontSize: 84, fontWeight: 800, color: '#10b981', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>{avg.petrolDays.toFixed(1)}</span>
              <span style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>days</span>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center',
            marginTop: 32, padding: '14px 22px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 10, alignSelf: 'flex-start',
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#f87171', fontFamily: 'monospace' }}>
              {criticalCount}
            </span>
            <span style={{ fontSize: 18, color: '#cbd5e1', marginLeft: 12 }}>
              of {totalCountries} EU countries critical on at least one fuel
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {brent && (
              <span style={{ fontSize: 18, color: '#94a3b8' }}>
                Brent: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>${brent.priceUsd}/bbl</span>
              </span>
            )}
            {gas && (
              <span style={{ fontSize: 18, color: '#94a3b8', marginTop: 4 }}>
                TTF: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>€{gas.ttf?.priceEurMwh?.toFixed(2)}/MWh</span>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', letterSpacing: 1 }}>
              Source: Eurostat (nrg_stk_oilm)
            </span>
            <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace', letterSpacing: 1, marginTop: 4 }}>
              eurooilwatch.com/api
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
