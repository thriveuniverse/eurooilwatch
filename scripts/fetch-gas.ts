/**
 * Fetch European and US natural gas benchmark prices.
 *
 * Sources:
 *   TTF=F (Dutch TTF Natural Gas Front Month)  — Yahoo Finance, EUR/MWh
 *   NG=F  (Henry Hub Natural Gas Front Month)  — Yahoo Finance, USD/MMBtu
 *
 * Output: data/gas.json
 *
 * The TTF↔Henry Hub spread is the headline number for European energy
 * security: it shows what Europe pays vs the US for the same molecule.
 * Pre-Ukraine the ratio was ~1.5×; war-period peaks pushed it past 10×.
 */

import fs from 'fs';
import path from 'path';

const TTF_SYMBOL = 'TTF=F';
const HH_SYMBOL  = 'NG=F';
const EURUSD_SYMBOL = 'EURUSD=X';

const MWH_TO_MMBTU = 3.412;  // 1 MWh = 3.412 MMBtu

async function fetchYahoo(symbol: string, range = '1mo'): Promise<{
  currency: string;
  price: number;
  changePct: number;
  weekHigh: number;
  weekLow: number;
  history: { date: string; close: number }[];
} | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) return null;
  const data = await res.json() as any;
  const r = data?.chart?.result?.[0];
  if (!r) return null;
  const meta = r.meta ?? {};
  const ts: number[] = r.timestamp ?? [];
  const closes: (number | null)[] = r.indicators?.quote?.[0]?.close ?? [];

  const history: { date: string; close: number }[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c == null) continue;
    history.push({
      date: new Date(ts[i] * 1000).toISOString().slice(0, 10),
      close: c,
    });
  }

  const last  = history.length ? history[history.length - 1].close : meta.regularMarketPrice;
  const prev  = history.length >= 2 ? history[history.length - 2].close : last;
  const changePct = prev ? ((last - prev) / prev) * 100 : 0;
  // 7-day high/low from history
  const last7 = history.slice(-7).map(h => h.close);
  const weekHigh = last7.length ? Math.max(...last7) : last;
  const weekLow  = last7.length ? Math.min(...last7) : last;

  return {
    currency: meta.currency ?? '',
    price: last,
    changePct: Math.round(changePct * 100) / 100,
    weekHigh: Math.round(weekHigh * 100) / 100,
    weekLow:  Math.round(weekLow * 100) / 100,
    history,
  };
}

interface AgsiCurrent {
  code: string;
  name: string;
  gasDayStart: string;
  gasInStorage: string;
  full: string;
  trend: string;
  workingGasVolume: string;
}

const AGSI_COUNTRIES: { code: string; name: string }[] = [
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'AT', name: 'Austria' },
  { code: 'ES', name: 'Spain' },
];

async function fetchAgsi(query: string): Promise<AgsiCurrent[] | null> {
  const apiKey = process.env.AGSI_API_KEY;
  if (!apiKey) return null;
  const url = `https://agsi.gie.eu/api?${query}&size=1`;
  const res = await fetch(url, { headers: { 'x-key': apiKey } });
  if (!res.ok) return null;
  const json = await res.json() as { data?: AgsiCurrent[] };
  return json.data ?? null;
}

interface StoragePoint {
  code: string;
  name: string;
  fullPct: number;
  gasInStorageTwh: number;
  workingGasVolumeTwh: number;
  trend: number;
  asOf: string;
}

async function fetchStorage(): Promise<{ eu: StoragePoint | null; countries: StoragePoint[] } | null> {
  if (!process.env.AGSI_API_KEY) return null;

  const [euRows, ...countryResponses] = await Promise.all([
    fetchAgsi('country=eu&type=eu'),
    ...AGSI_COUNTRIES.map(c => fetchAgsi(`country=${c.code}`)),
  ]);

  const toPoint = (rows: AgsiCurrent[] | null): StoragePoint | null => {
    if (!rows?.length) return null;
    const r = rows[0];
    return {
      code: r.code.toUpperCase(),
      name: r.name,
      fullPct: parseFloat(r.full),
      gasInStorageTwh: parseFloat(r.gasInStorage),
      workingGasVolumeTwh: parseFloat(r.workingGasVolume),
      trend: parseFloat(r.trend),
      asOf: r.gasDayStart,
    };
  };

  const eu = toPoint(euRows);
  const countries: StoragePoint[] = countryResponses
    .map(toPoint)
    .filter((p): p is StoragePoint => !!p)
    .sort((a, b) => b.gasInStorageTwh - a.gasInStorageTwh);

  return { eu, countries };
}

async function main() {
  const [ttf, hh, fx, storage] = await Promise.all([
    fetchYahoo(TTF_SYMBOL),
    fetchYahoo(HH_SYMBOL),
    fetchYahoo(EURUSD_SYMBOL, '5d'),
    fetchStorage(),
  ]);

  if (!ttf || !hh) {
    throw new Error('Failed to fetch gas benchmarks from Yahoo Finance');
  }

  const eurUsd = fx?.price ?? 1.087;  // sensible fallback if FX fetch fails

  // TTF (EUR/MWh) → USD/MMBtu for direct comparison with Henry Hub
  const ttfUsdMmbtu = (ttf.price * eurUsd) / MWH_TO_MMBTU;
  const spreadUsdMmbtu = ttfUsdMmbtu - hh.price;
  const ratio = ttfUsdMmbtu / hh.price;

  // Build a paired history (last ~30 days, intersected on dates)
  const ttfMap = new Map(ttf.history.map(h => [h.date, h.close]));
  const hhMap  = new Map(hh.history.map(h => [h.date, h.close]));
  const allDates = Array.from(new Set([...ttfMap.keys(), ...hhMap.keys()])).sort();
  const history = allDates
    .map(date => {
      const t = ttfMap.get(date);
      const n = hhMap.get(date);
      if (t == null || n == null) return null;
      const ttfMmbtu = (t * eurUsd) / MWH_TO_MMBTU;
      return {
        date,
        ttfEurMwh: Math.round(t * 100) / 100,
        hhUsdMmbtu: Math.round(n * 100) / 100,
        ttfUsdMmbtu: Math.round(ttfMmbtu * 100) / 100,
        ratio: Math.round((ttfMmbtu / n) * 100) / 100,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const out = {
    lastUpdated: new Date().toISOString(),
    eurUsd: Math.round(eurUsd * 10000) / 10000,
    ttf: {
      symbol: TTF_SYMBOL,
      priceEurMwh: Math.round(ttf.price * 100) / 100,
      changePct: ttf.changePct,
      weekHigh: ttf.weekHigh,
      weekLow: ttf.weekLow,
      source: 'Yahoo Finance TTF=F (Dutch TTF Natural Gas Front Month Futures)',
    },
    hh: {
      symbol: HH_SYMBOL,
      priceUsdMmbtu: Math.round(hh.price * 1000) / 1000,
      changePct: hh.changePct,
      weekHigh: hh.weekHigh,
      weekLow: hh.weekLow,
      source: 'Yahoo Finance NG=F (Henry Hub Natural Gas Front Month Futures)',
    },
    spread: {
      ttfUsdMmbtu:    Math.round(ttfUsdMmbtu * 100) / 100,
      spreadUsdMmbtu: Math.round(spreadUsdMmbtu * 100) / 100,
      ratio:          Math.round(ratio * 100) / 100,
    },
    history,
    storage: storage && storage.eu ? {
      asOf: storage.eu.asOf,
      eu: storage.eu,
      countries: storage.countries,
      target: { fullPct: 90, deadline: '1 November', basis: 'EU Gas Storage Regulation 2022/1032' },
    } : null,
    methodology: 'TTF converted to USD/MMBtu using current EUR/USD rate and 1 MWh = 3.412 MMBtu. Spread is what Europe pays per unit of natural gas energy vs the US benchmark. Storage levels via AGSI/GIE — % full is gasInStorage / workingGasVolume.',
  };

  const outPath = path.join(process.cwd(), 'data', 'gas.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`  TTF      €${out.ttf.priceEurMwh}/MWh  (${out.ttf.changePct >= 0 ? '+' : ''}${out.ttf.changePct}%)`);
  console.log(`  HH       $${out.hh.priceUsdMmbtu}/MMBtu  (${out.hh.changePct >= 0 ? '+' : ''}${out.hh.changePct}%)`);
  console.log(`  TTF→USD/MMBtu:  $${out.spread.ttfUsdMmbtu}`);
  console.log(`  Spread:         $${out.spread.spreadUsdMmbtu}/MMBtu  (${out.spread.ratio}× ratio)`);
  if (out.storage?.eu) {
    console.log(`  Storage (EU):   ${out.storage.eu.fullPct.toFixed(2)}% full · trend ${out.storage.eu.trend > 0 ? '+' : ''}${out.storage.eu.trend} · gap to 90%: ${(90 - out.storage.eu.fullPct).toFixed(1)} pts`);
    for (const c of out.storage.countries) {
      console.log(`    ${c.code} (${c.name.padEnd(13)}) ${c.fullPct.toFixed(2)}% full`);
    }
  } else if (process.env.AGSI_API_KEY) {
    console.log('  Storage: AGSI fetch returned no data');
  } else {
    console.log('  Storage: skipped (set AGSI_API_KEY env var to populate)');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
