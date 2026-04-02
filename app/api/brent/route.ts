import { NextResponse } from 'next/server';

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=5d',
      { headers: { 'User-Agent': 'EuroOilWatch/0.1' }, next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('No data');

    const closes = result.indicators?.quote?.[0]?.close?.filter(
      (c: any) => c != null
    ) || [];
    if (closes.length < 2) throw new Error('Insufficient data');

    const latest = closes[closes.length - 1];
    const previous = closes[closes.length - 2];
    const change = latest - previous;
    const changePct = (change / previous) * 100;

    // EUR/USD rate
    let eurRate = 0.92;
    try {
      const fxRes = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=1d&range=1d',
        { headers: { 'User-Agent': 'EuroOilWatch/0.1' } }
      );
      if (fxRes.ok) {
        const fxJson = await fxRes.json();
        const fxCloses = fxJson?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
          (c: any) => c != null
        ) || [];
        if (fxCloses.length > 0) eurRate = 1 / fxCloses[fxCloses.length - 1];
      }
    } catch {}

    return NextResponse.json({
      priceUsd: Math.round(latest * 100) / 100,
      priceEur: Math.round(latest * eurRate * 100) / 100,
      changeUsd: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
