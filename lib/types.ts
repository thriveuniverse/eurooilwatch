// ============================================================
// EuroOilWatch — Core Types
// ============================================================

/** EU27 country ISO 3166-1 alpha-2 codes */
export type CountryCode =
  | 'AT' | 'BE' | 'BG' | 'HR' | 'CY' | 'CZ' | 'DK' | 'EE'
  | 'FI' | 'FR' | 'DE' | 'GR' | 'HU' | 'IE' | 'IT' | 'LV'
  | 'LT' | 'LU' | 'MT' | 'NL' | 'PL' | 'PT' | 'RO' | 'SK'
  | 'SI' | 'ES' | 'SE';

/** Also track Norway and UK (North Sea producers, not EU but critical) */
export type ExtendedCountryCode = CountryCode | 'NO' | 'GB';

export type FuelType = 'petrol' | 'diesel' | 'jet_fuel';

export type ReserveStatus = 'safe' | 'watch' | 'warning' | 'critical';

// ------------------------------------------------------------
// Oil Stock Data (from Eurostat nrg_stk_oilm)
// ------------------------------------------------------------

export interface FuelStock {
  fuelType: FuelType;
  /** Stock in thousand tonnes */
  stockKilotonnes: number;
  /** Monthly consumption in thousand tonnes (for days-of-supply calc) */
  consumptionKilotonnes: number;
  /** Calculated: (stock / consumption) * 30 */
  daysOfSupply: number;
  /** EU mandatory minimum: 90 days of net imports or 61 days of consumption */
  mandatoryMinimumDays: number;
  /** Derived status based on ratio to mandatory minimum */
  status: ReserveStatus;
}

export interface CountryStockData {
  countryCode: ExtendedCountryCode;
  countryName: string;
  /** ISO date of the data period, e.g. "2025-12" */
  datePeriod: string;
  fuels: FuelStock[];
  /** Average days across all fuel types */
  averageDays: number;
  /** Worst status across fuel types */
  overallStatus: ReserveStatus;
}

export interface StockDataset {
  lastUpdated: string; // ISO datetime
  dataPeriod: string;  // e.g. "2025-12" (the month the data covers)
  dataSource: string;
  countries: CountryStockData[];
  euAverage: {
    petrolDays: number;
    dieselDays: number;
    jetFuelDays: number;
    overallStatus: ReserveStatus;
  };
}

// ------------------------------------------------------------
// Fuel Price Data (from EC Weekly Oil Bulletin)
// ------------------------------------------------------------

export interface CountryPriceData {
  countryCode: CountryCode;
  countryName: string;
  /** EUR per litre */
  petrolPrice: number | null;
  dieselPrice: number | null;
  /** Week-on-week change as percentage */
  petrolChangePct: number | null;
  dieselChangePct: number | null;
}

export interface PriceDataset {
  lastUpdated: string;
  bulletinDate: string; // The Wednesday this data covers
  dataSource: string;
  countries: CountryPriceData[];
  euAverage: {
    petrolPrice: number;
    dieselPrice: number;
  };
}

// ------------------------------------------------------------
// Crude Oil Price (Brent benchmark)
// ------------------------------------------------------------

export interface BrentData {
  lastUpdated: string;
  priceUsd: number;
  priceEur: number;
  changeUsd: number;
  changePct: number;
  dataSource: string;
}

// ------------------------------------------------------------
// AI Analysis
// ------------------------------------------------------------

export interface AIAnalysis {
  generatedAt: string;
  /** One-line status: "EU fuel reserves adequate" / "Watch: petrol stocks declining" */
  statusLine: string;
  /** Traffic light */
  overallStatus: ReserveStatus;
  /** 2-4 paragraph analysis */
  fullAnalysis: string;
  /** Key bullet points for the dashboard */
  keyPoints: string[];
  /** Data period this analysis covers */
  dataPeriod: string;
  model: string;
}

// ------------------------------------------------------------
// Combined Dashboard Data
// ------------------------------------------------------------

export interface DashboardData {
  stocks: StockDataset;
  prices: PriceDataset;
  brent: BrentData;
  analysis: AIAnalysis;
}

// ------------------------------------------------------------
// Eurostat API Response Types
// ------------------------------------------------------------

export interface EurostatResponse {
  version: string;
  label: string;
  updated: string;
  source: string;
  id: string[];
  size: number[];
  dimension: Record<string, EurostatDimension>;
  value: Record<string, number>;
  status?: Record<string, string>;
}

export interface EurostatDimension {
  label: string;
  category: {
    index: Record<string, number>;
    label: Record<string, string>;
  };
}
