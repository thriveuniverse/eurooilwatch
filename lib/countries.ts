import { CountryCode, ExtendedCountryCode } from './types';

export interface CountryInfo {
  code: ExtendedCountryCode;
  name: string;
  /** Eurostat geo code (usually same as ISO alpha-2) */
  eurostatCode: string;
  /** EU member state */
  isEU: boolean;
  /** Flag emoji */
  flag: string;
  /** Approximate latitude for map positioning */
  lat: number;
  lng: number;
}

export const COUNTRIES: Record<ExtendedCountryCode, CountryInfo> = {
  AT: { code: 'AT', name: 'Austria', eurostatCode: 'AT', isEU: true, flag: '🇦🇹', lat: 47.5, lng: 14.6 },
  BE: { code: 'BE', name: 'Belgium', eurostatCode: 'BE', isEU: true, flag: '🇧🇪', lat: 50.8, lng: 4.4 },
  BG: { code: 'BG', name: 'Bulgaria', eurostatCode: 'BG', isEU: true, flag: '🇧🇬', lat: 42.7, lng: 25.5 },
  HR: { code: 'HR', name: 'Croatia', eurostatCode: 'HR', isEU: true, flag: '🇭🇷', lat: 45.1, lng: 15.2 },
  CY: { code: 'CY', name: 'Cyprus', eurostatCode: 'CY', isEU: true, flag: '🇨🇾', lat: 35.1, lng: 33.4 },
  CZ: { code: 'CZ', name: 'Czechia', eurostatCode: 'CZ', isEU: true, flag: '🇨🇿', lat: 49.8, lng: 15.5 },
  DK: { code: 'DK', name: 'Denmark', eurostatCode: 'DK', isEU: true, flag: '🇩🇰', lat: 56.3, lng: 9.5 },
  EE: { code: 'EE', name: 'Estonia', eurostatCode: 'EE', isEU: true, flag: '🇪🇪', lat: 58.6, lng: 25.0 },
  FI: { code: 'FI', name: 'Finland', eurostatCode: 'FI', isEU: true, flag: '🇫🇮', lat: 61.9, lng: 25.7 },
  FR: { code: 'FR', name: 'France', eurostatCode: 'FR', isEU: true, flag: '🇫🇷', lat: 46.2, lng: 2.2 },
  DE: { code: 'DE', name: 'Germany', eurostatCode: 'DE', isEU: true, flag: '🇩🇪', lat: 51.2, lng: 10.4 },
  GR: { code: 'GR', name: 'Greece', eurostatCode: 'EL', isEU: true, flag: '🇬🇷', lat: 39.1, lng: 21.8 },
  HU: { code: 'HU', name: 'Hungary', eurostatCode: 'HU', isEU: true, flag: '🇭🇺', lat: 47.2, lng: 19.5 },
  IE: { code: 'IE', name: 'Ireland', eurostatCode: 'IE', isEU: true, flag: '🇮🇪', lat: 53.1, lng: -7.7 },
  IT: { code: 'IT', name: 'Italy', eurostatCode: 'IT', isEU: true, flag: '🇮🇹', lat: 41.9, lng: 12.6 },
  LV: { code: 'LV', name: 'Latvia', eurostatCode: 'LV', isEU: true, flag: '🇱🇻', lat: 56.9, lng: 24.1 },
  LT: { code: 'LT', name: 'Lithuania', eurostatCode: 'LT', isEU: true, flag: '🇱🇹', lat: 55.2, lng: 23.9 },
  LU: { code: 'LU', name: 'Luxembourg', eurostatCode: 'LU', isEU: true, flag: '🇱🇺', lat: 49.8, lng: 6.1 },
  MT: { code: 'MT', name: 'Malta', eurostatCode: 'MT', isEU: true, flag: '🇲🇹', lat: 35.9, lng: 14.5 },
  NL: { code: 'NL', name: 'Netherlands', eurostatCode: 'NL', isEU: true, flag: '🇳🇱', lat: 52.1, lng: 5.3 },
  PL: { code: 'PL', name: 'Poland', eurostatCode: 'PL', isEU: true, flag: '🇵🇱', lat: 51.9, lng: 19.1 },
  PT: { code: 'PT', name: 'Portugal', eurostatCode: 'PT', isEU: true, flag: '🇵🇹', lat: 39.4, lng: -8.2 },
  RO: { code: 'RO', name: 'Romania', eurostatCode: 'RO', isEU: true, flag: '🇷🇴', lat: 45.9, lng: 24.9 },
  SK: { code: 'SK', name: 'Slovakia', eurostatCode: 'SK', isEU: true, flag: '🇸🇰', lat: 48.7, lng: 19.7 },
  SI: { code: 'SI', name: 'Slovenia', eurostatCode: 'SI', isEU: true, flag: '🇸🇮', lat: 46.2, lng: 14.8 },
  ES: { code: 'ES', name: 'Spain', eurostatCode: 'ES', isEU: true, flag: '🇪🇸', lat: 40.5, lng: -3.7 },
  SE: { code: 'SE', name: 'Sweden', eurostatCode: 'SE', isEU: true, flag: '🇸🇪', lat: 60.1, lng: 18.6 },
  // Non-EU but important for North Sea / energy context
  NO: { code: 'NO', name: 'Norway', eurostatCode: 'NO', isEU: false, flag: '🇳🇴', lat: 60.5, lng: 8.5 },
  GB: { code: 'GB', name: 'United Kingdom', eurostatCode: 'UK', isEU: false, flag: '🇬🇧', lat: 55.4, lng: -3.4 },
};

export const EU27_CODES: CountryCode[] = Object.values(COUNTRIES)
  .filter(c => c.isEU)
  .map(c => c.code) as CountryCode[];

/** Note: Greece uses 'EL' in Eurostat, not 'GR' */
export function toEurostatGeo(code: ExtendedCountryCode): string {
  return COUNTRIES[code]?.eurostatCode ?? code;
}

export function fromEurostatGeo(eurostatCode: string): ExtendedCountryCode | null {
  const entry = Object.values(COUNTRIES).find(c => c.eurostatCode === eurostatCode);
  return entry?.code ?? null;
}

/** Eurostat SIEC codes for fuel types */
export const FUEL_SIEC_CODES = {
  /** Motor gasoline (petrol) */
  petrol: 'O4652',
  /** Gas/diesel oil (diesel) */
  diesel: 'O4671',
  /** Kerosene-type jet fuel */
  jet_fuel: 'O4661',
} as const;

/** Labels for display */
export const FUEL_LABELS: Record<string, string> = {
  petrol: 'Petrol (Gasoline)',
  diesel: 'Diesel',
  jet_fuel: 'Jet Fuel (Kerosene)',
};
