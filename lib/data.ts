import * as fs from 'fs';
import * as path from 'path';
import type {
  StockDataset,
  PriceDataset,
  BrentData,
  AIAnalysis,
  DashboardData,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

function loadJSON<T>(filename: string): T | null {
  try {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return null;
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
}

const FALLBACK_STOCKS: StockDataset = {
  lastUpdated: new Date().toISOString(), dataPeriod: 'pending',
  dataSource: 'Awaiting first data fetch', countries: [],
  euAverage: { petrolDays: 0, dieselDays: 0, jetFuelDays: 0, overallStatus: 'watch' },
};
const FALLBACK_PRICES: PriceDataset = {
  lastUpdated: new Date().toISOString(), bulletinDate: 'pending',
  dataSource: 'Awaiting first data fetch', countries: [],
  euAverage: { petrolPrice: 0, dieselPrice: 0 },
};
const FALLBACK_BRENT: BrentData = {
  lastUpdated: new Date().toISOString(), priceUsd: 0, priceEur: 0,
  changeUsd: 0, changePct: 0, dataSource: 'Awaiting first data fetch',
};
const FALLBACK_ANALYSIS: AIAnalysis = {
  generatedAt: new Date().toISOString(),
  statusLine: 'Data pipeline initialising — run npm run update to fetch data',
  overallStatus: 'watch',
  fullAnalysis: 'Run npm run update to populate the dashboard.',
  keyPoints: ['Run: npm run fetch:all', 'Run: npm run analyze'],
  dataPeriod: 'pending', model: 'none',
};

export function getDashboardData(): DashboardData {
  return {
    stocks: loadJSON<StockDataset>('stocks.json') ?? FALLBACK_STOCKS,
    prices: loadJSON<PriceDataset>('prices.json') ?? FALLBACK_PRICES,
    brent: loadJSON<BrentData>('brent.json') ?? FALLBACK_BRENT,
    analysis: loadJSON<AIAnalysis>('analysis.json') ?? FALLBACK_ANALYSIS,
  };
}

export interface HistoryPoint {
  period: string;
  petrolDays: number | null;
  dieselDays: number | null;
  jetDays: number | null;
}

export interface CountryHistory {
  countryCode: string;
  countryName: string;
  data: HistoryPoint[];
}

export interface HistoryDataset {
  lastUpdated: string;
  periods: string[];
  countries: CountryHistory[];
  euAverage: HistoryPoint[];
}

export function getHistoryData(): HistoryDataset | null {
  return loadJSON<HistoryDataset>('history.json');
}

export function getCountryHistory(countryCode: string): HistoryPoint[] | null {
  const history = getHistoryData();
  if (!history) return null;
  const country = history.countries.find(
    c => c.countryCode === countryCode.toUpperCase()
  );
  return country?.data ?? null;
}

export function getEUHistory(): HistoryPoint[] | null {
  const history = getHistoryData();
  return history?.euAverage ?? null;
}

// ── CENTCOM advisories ──
export interface CentcomAdvisory {
  id: string;
  title: string;
  region: string;
  incident: string;
  severity: 'critical' | 'high' | 'elevated' | 'normal';
  url: string;
  publishedAt: string;
}

export interface CentcomData {
  lastUpdated: string;
  source: string;
  sourceUrl: string;
  count: number;
  advisories: CentcomAdvisory[];
}

export function getCentcom(): CentcomData | null {
  return loadJSON<CentcomData>('centcom-advisories.json');
}

// ── Refinery outages ──
export type RefineryOutageSeverity = 'critical' | 'high' | 'elevated' | 'normal';
export type RefineryRegion = 'europe' | 'uk' | 'americas' | 'asia' | 'middle-east' | 'africa' | 'other';
export type RefineryOutageType = 'fire' | 'explosion' | 'unplanned' | 'turnaround' | 'strike'
                              | 'shutdown' | 'restart' | 'leak' | 'run-cuts' | 'unknown';

export interface RefineryOutage {
  id: string;
  headline: string;
  url: string;
  source: string;
  publishedAt: string;
  region: RefineryRegion;
  outageType: RefineryOutageType;
  severity: RefineryOutageSeverity;
  summary: string;
}

export interface RefineryOutageData {
  lastUpdated: string;
  source: string;
  feeds: string[];
  count: number;
  outages: RefineryOutage[];
}

export function getRefineryOutages(): RefineryOutageData | null {
  return loadJSON<RefineryOutageData>('refinery-outages.json');
}
