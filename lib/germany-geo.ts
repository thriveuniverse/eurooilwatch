/**
 * Germany geographic lookup tables.
 *
 * - 16 Bundesländer (federal states)
 *
 * German postal codes (PLZ) do NOT map cleanly to Bundesländer — many PLZ
 * ranges span multiple states. The plzToBundesland() helper below uses
 * first-two-digit prefix matching for a best-effort lookup that covers
 * ~85–90% of cases correctly. For ambiguous prefixes the most populous
 * matching state is chosen.
 *
 * When the tankerkoenig API integration goes live, we can improve accuracy
 * by cross-referencing station.place (city name) against a complete PLZ
 * dataset — but the first-pass lookup is enough to populate 16 Bundesland
 * pages with usable data.
 */

export interface BundeslandInfo {
  code: string; // ISO 3166-2:DE 2-letter code (BE, BY, NW, etc.)
  name: string;
  fullName: string; // for SEO meta titles
}

export const BUNDESLAENDER: Record<string, BundeslandInfo> = {
  BW: { code: 'BW', name: 'Baden-Württemberg', fullName: 'Baden-Württemberg' },
  BY: { code: 'BY', name: 'Bayern',            fullName: 'Freistaat Bayern' },
  BE: { code: 'BE', name: 'Berlin',            fullName: 'Berlin' },
  BB: { code: 'BB', name: 'Brandenburg',       fullName: 'Brandenburg' },
  HB: { code: 'HB', name: 'Bremen',            fullName: 'Freie Hansestadt Bremen' },
  HH: { code: 'HH', name: 'Hamburg',           fullName: 'Freie und Hansestadt Hamburg' },
  HE: { code: 'HE', name: 'Hessen',            fullName: 'Hessen' },
  MV: { code: 'MV', name: 'Mecklenburg-Vorpommern', fullName: 'Mecklenburg-Vorpommern' },
  NI: { code: 'NI', name: 'Niedersachsen',     fullName: 'Niedersachsen' },
  NW: { code: 'NW', name: 'Nordrhein-Westfalen', fullName: 'Nordrhein-Westfalen' },
  RP: { code: 'RP', name: 'Rheinland-Pfalz',   fullName: 'Rheinland-Pfalz' },
  SL: { code: 'SL', name: 'Saarland',          fullName: 'Saarland' },
  SN: { code: 'SN', name: 'Sachsen',           fullName: 'Freistaat Sachsen' },
  ST: { code: 'ST', name: 'Sachsen-Anhalt',    fullName: 'Sachsen-Anhalt' },
  SH: { code: 'SH', name: 'Schleswig-Holstein', fullName: 'Schleswig-Holstein' },
  TH: { code: 'TH', name: 'Thüringen',         fullName: 'Freistaat Thüringen' },
};

/**
 * Best-effort PLZ-prefix → Bundesland mapping.
 *
 * Map keyed by first two digits of the postal code. Where a prefix straddles
 * multiple states, the state with the larger population share gets the
 * mapping. Edge-case PLZs will be misattributed; we accept that for the
 * first-pass build and will tighten via station.place lookups once live
 * data is available.
 */
const PLZ2_TO_LAND: Record<string, string> = {
  '01': 'SN', '02': 'SN', '03': 'BB', '04': 'SN', '05': 'SN', '06': 'ST',
  '07': 'TH', '08': 'SN', '09': 'SN',
  '10': 'BE', '11': 'BE', '12': 'BE', '13': 'BE', '14': 'BB',
  '15': 'BB', '16': 'BB', '17': 'MV', '18': 'MV', '19': 'MV',
  '20': 'HH', '21': 'HH', '22': 'HH',
  '23': 'SH', '24': 'SH', '25': 'SH',
  '26': 'NI', '27': 'NI', '28': 'HB', '29': 'NI',
  '30': 'NI', '31': 'NI',
  '32': 'NW', '33': 'NW',
  '34': 'HE', '35': 'HE', '36': 'HE',
  '37': 'NI', '38': 'NI', '39': 'ST',
  '40': 'NW', '41': 'NW', '42': 'NW', '43': 'NW', '44': 'NW',
  '45': 'NW', '46': 'NW', '47': 'NW', '48': 'NW', '49': 'NI',
  '50': 'NW', '51': 'NW', '52': 'NW', '53': 'NW',
  '54': 'RP', '55': 'RP', '56': 'RP', '57': 'NW', '58': 'NW', '59': 'NW',
  '60': 'HE', '61': 'HE', '63': 'HE', '64': 'HE', '65': 'HE',
  '66': 'SL', '67': 'RP', '68': 'BW', '69': 'BW',
  '70': 'BW', '71': 'BW', '72': 'BW', '73': 'BW', '74': 'BW', '75': 'BW',
  '76': 'BW', '77': 'BW', '78': 'BW', '79': 'BW',
  '80': 'BY', '81': 'BY', '82': 'BY', '83': 'BY', '84': 'BY', '85': 'BY',
  '86': 'BY', '87': 'BY', '88': 'BW', '89': 'BW',
  '90': 'BY', '91': 'BY', '92': 'BY', '93': 'BY', '94': 'BY', '95': 'BY',
  '96': 'BY', '97': 'BY',
  '98': 'TH', '99': 'TH',
};

/**
 * Derive a best-guess Bundesland 2-letter code from a 5-digit German postal code.
 *
 * Uses first-two-digit prefix mapping. Returns null when the prefix isn't
 * recognised (Germany has 8,000+ PLZ codes — uncommon prefixes may slip
 * through to "null"; callers should treat that as "unknown" rather than
 * fatal).
 */
export function bundeslandFromPlz(plz: string): string | null {
  if (!plz || plz.length < 2) return null;
  const trimmed = plz.trim().padStart(5, '0');
  const prefix = trimmed.slice(0, 2);
  return PLZ2_TO_LAND[prefix] ?? null;
}
