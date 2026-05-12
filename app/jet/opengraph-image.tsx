import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'EuroOilWatch — European Jet Fuel Tracker: country days-of-cover + ARA hub';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function loadJson<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

export default async function OgJet() {
  const stocks = loadJson<any>('stocks.json');
  const ara    = loadJson<any>('ara-stocks.json');

  const euJet = stocks?.euAverage?.jetFuelDays ?? 0;
  const period = stocks?.dataPeriod ?? '2026-02';
  const jetRows = (stocks?.countries ?? [])
    .map((c: any) => {
      const j = c.fuels?.find((f: any) => f.fuelType === 'jet_fuel');
      return j ? { name: c.countryName, days: j.daysOfSupply, status: j.status } : null;
    })
    .filter((x: any) => x);
  const stressed = jetRows.sort((a: any, b: any) => a.days - b.days)[0];
  const criticalCount = jetRows.filter((r: any) => r.status === 'critical').length;

  const araJet = ara?.weeks?.[0]?.figures?.find((f: any) => f.product === 'jet');
  const araKt = araJet?.tonnes ? Math.round(araJet.tonnes / 1000) : null;

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
              Jet Fuel Tracker
            </span>
          </div>
          <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#64748b', letterSpacing: 1.5 }}>
            eurooilwatch.com/jet
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 60 }}>
          <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8', marginBottom: 24 }}>
            <span>EU-27 jet fuel days of cover · Eurostat period {period}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 60 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>EU average</span>
              <span style={{ fontSize: 110, fontWeight: 800, color: euJet < 60 ? '#f97316' : '#10b981', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>
                {euJet.toFixed(1)}
              </span>
              <span style={{ fontSize: 18, color: '#94a3b8', marginTop: 4 }}>days</span>
            </div>

            {stressed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Most stressed</span>
                <span style={{ fontSize: 110, fontWeight: 800, color: '#ef4444', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>
                  {stressed.days.toFixed(1)}
                </span>
                <span style={{ fontSize: 16, color: '#cbd5e1', marginTop: 4 }}>{stressed.name}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Countries critical</span>
              <span style={{ fontSize: 110, fontWeight: 800, color: '#f87171', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>
                {criticalCount}
              </span>
              <span style={{ fontSize: 16, color: '#94a3b8', marginTop: 4 }}>of 27</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 720 }}>
            {araKt != null && (
              <span style={{ fontSize: 18, color: '#cbd5e1' }}>
                ARA hub commercial jet: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>{araKt} kt</span>
                {araJet?.note && <span style={{ color: '#94a3b8' }}> · {araJet.note}</span>}
              </span>
            )}
            <span style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
              Strategic + commercial combined looks healthy; commercial hub stocks tell a different story.
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', letterSpacing: 1 }}>
              Source: Eurostat + Argus / Insights Global
            </span>
            <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace', letterSpacing: 1, marginTop: 4 }}>
              eurooilwatch.com/api/v1/stocks
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
