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

/** Fallback data so the dashboard renders even before the pipeline runs */
const FALLBACK_STOCKS: StockDataset = {
  lastUpdated: new Date().toISOString(),
  dataPeriod: 'pending',
  dataSource: 'Awaiting first data fetch',
  countries: [],
  euAverage: {
    petrolDays: 0,
    dieselDays: 0,
    jetFuelDays: 0,
    overallStatus: 'watch',
  },
};

const FALLBACK_PRICES: PriceDataset = {
  lastUpdated: new Date().toISOString(),
  bulletinDate: 'pending',
  dataSource: 'Awaiting first data fetch',
  countries: [],
  euAverage: { petrolPrice: 0, dieselPrice: 0 },
};

const FALLBACK_BRENT: BrentData = {
  lastUpdated: new Date().toISOString(),
  priceUsd: 0,
  priceEur: 0,
  changeUsd: 0,
  changePct: 0,
  dataSource: 'Awaiting first data fetch',
};

const FALLBACK_ANALYSIS: AIAnalysis = {
  generatedAt: new Date().toISOString(),
  statusLine: 'Data pipeline initialising — run npm run update to fetch data',
  overallStatus: 'watch',
  fullAnalysis:
    'EuroOilWatch is starting up. Run the data pipeline to populate this dashboard with live EU fuel reserve and price data from Eurostat and the EC Weekly Oil Bulletin.',
  keyPoints: [
    'Run: npm run fetch:all to pull data',
    'Run: npm run analyze to generate AI analysis',
    'Or: npm run update to do both',
  ],
  dataPeriod: 'pending',
  model: 'none',
};

export function getDashboardData(): DashboardData {
  return {
    stocks: loadJSON<StockDataset>('stocks.json') ?? FALLBACK_STOCKS,
    prices: loadJSON<PriceDataset>('prices.json') ?? FALLBACK_PRICES,
    brent: loadJSON<BrentData>('brent.json') ?? FALLBACK_BRENT,
    analysis: loadJSON<AIAnalysis>('analysis.json') ?? FALLBACK_ANALYSIS,
  };
}
