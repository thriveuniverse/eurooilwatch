/**
 * Spain geographic lookup tables.
 *
 * - 17 autonomous communities (CCAA) + 2 autonomous cities (Ceuta, Melilla)
 * - 52 provincial-level units (50 provinces + Ceuta + Melilla)
 *
 * Province code = first two digits of the postal code (Spanish postcodes are
 * 5 digits, first two always = province ISO code). Codes go 01–52.
 */

export interface RegionInfo {
  code: string;
  name: string;
}

export interface ProvinceInfo {
  code: string;
  name: string;
  regionCode: string;
}

export const REGIONS: Record<string, RegionInfo> = {
  AND: { code: 'AND', name: 'Andalucía' },
  ARA: { code: 'ARA', name: 'Aragón' },
  AST: { code: 'AST', name: 'Asturias' },
  BAL: { code: 'BAL', name: 'Islas Baleares' },
  CAN: { code: 'CAN', name: 'Canarias' },
  CTB: { code: 'CTB', name: 'Cantabria' },
  CLM: { code: 'CLM', name: 'Castilla-La Mancha' },
  CYL: { code: 'CYL', name: 'Castilla y León' },
  CAT: { code: 'CAT', name: 'Cataluña' },
  EXT: { code: 'EXT', name: 'Extremadura' },
  GAL: { code: 'GAL', name: 'Galicia' },
  RIO: { code: 'RIO', name: 'La Rioja' },
  MAD: { code: 'MAD', name: 'Madrid' },
  MUR: { code: 'MUR', name: 'Murcia' },
  NAV: { code: 'NAV', name: 'Navarra' },
  PVA: { code: 'PVA', name: 'País Vasco' },
  VAL: { code: 'VAL', name: 'Comunidad Valenciana' },
  CEU: { code: 'CEU', name: 'Ceuta' },
  MEL: { code: 'MEL', name: 'Melilla' },
};

export const PROVINCES: Record<string, ProvinceInfo> = {
  '01': { code: '01', name: 'Álava',                       regionCode: 'PVA' },
  '02': { code: '02', name: 'Albacete',                    regionCode: 'CLM' },
  '03': { code: '03', name: 'Alicante',                    regionCode: 'VAL' },
  '04': { code: '04', name: 'Almería',                     regionCode: 'AND' },
  '05': { code: '05', name: 'Ávila',                       regionCode: 'CYL' },
  '06': { code: '06', name: 'Badajoz',                     regionCode: 'EXT' },
  '07': { code: '07', name: 'Islas Baleares',              regionCode: 'BAL' },
  '08': { code: '08', name: 'Barcelona',                   regionCode: 'CAT' },
  '09': { code: '09', name: 'Burgos',                      regionCode: 'CYL' },
  '10': { code: '10', name: 'Cáceres',                     regionCode: 'EXT' },
  '11': { code: '11', name: 'Cádiz',                       regionCode: 'AND' },
  '12': { code: '12', name: 'Castellón',                   regionCode: 'VAL' },
  '13': { code: '13', name: 'Ciudad Real',                 regionCode: 'CLM' },
  '14': { code: '14', name: 'Córdoba',                     regionCode: 'AND' },
  '15': { code: '15', name: 'A Coruña',                    regionCode: 'GAL' },
  '16': { code: '16', name: 'Cuenca',                      regionCode: 'CLM' },
  '17': { code: '17', name: 'Girona',                      regionCode: 'CAT' },
  '18': { code: '18', name: 'Granada',                     regionCode: 'AND' },
  '19': { code: '19', name: 'Guadalajara',                 regionCode: 'CLM' },
  '20': { code: '20', name: 'Guipúzcoa',                   regionCode: 'PVA' },
  '21': { code: '21', name: 'Huelva',                      regionCode: 'AND' },
  '22': { code: '22', name: 'Huesca',                      regionCode: 'ARA' },
  '23': { code: '23', name: 'Jaén',                        regionCode: 'AND' },
  '24': { code: '24', name: 'León',                        regionCode: 'CYL' },
  '25': { code: '25', name: 'Lleida',                      regionCode: 'CAT' },
  '26': { code: '26', name: 'La Rioja',                    regionCode: 'RIO' },
  '27': { code: '27', name: 'Lugo',                        regionCode: 'GAL' },
  '28': { code: '28', name: 'Madrid',                      regionCode: 'MAD' },
  '29': { code: '29', name: 'Málaga',                      regionCode: 'AND' },
  '30': { code: '30', name: 'Murcia',                      regionCode: 'MUR' },
  '31': { code: '31', name: 'Navarra',                     regionCode: 'NAV' },
  '32': { code: '32', name: 'Ourense',                     regionCode: 'GAL' },
  '33': { code: '33', name: 'Asturias',                    regionCode: 'AST' },
  '34': { code: '34', name: 'Palencia',                    regionCode: 'CYL' },
  '35': { code: '35', name: 'Las Palmas',                  regionCode: 'CAN' },
  '36': { code: '36', name: 'Pontevedra',                  regionCode: 'GAL' },
  '37': { code: '37', name: 'Salamanca',                   regionCode: 'CYL' },
  '38': { code: '38', name: 'Santa Cruz de Tenerife',      regionCode: 'CAN' },
  '39': { code: '39', name: 'Cantabria',                   regionCode: 'CTB' },
  '40': { code: '40', name: 'Segovia',                     regionCode: 'CYL' },
  '41': { code: '41', name: 'Sevilla',                     regionCode: 'AND' },
  '42': { code: '42', name: 'Soria',                       regionCode: 'CYL' },
  '43': { code: '43', name: 'Tarragona',                   regionCode: 'CAT' },
  '44': { code: '44', name: 'Teruel',                      regionCode: 'ARA' },
  '45': { code: '45', name: 'Toledo',                      regionCode: 'CLM' },
  '46': { code: '46', name: 'Valencia',                    regionCode: 'VAL' },
  '47': { code: '47', name: 'Valladolid',                  regionCode: 'CYL' },
  '48': { code: '48', name: 'Vizcaya',                     regionCode: 'PVA' },
  '49': { code: '49', name: 'Zamora',                      regionCode: 'CYL' },
  '50': { code: '50', name: 'Zaragoza',                    regionCode: 'ARA' },
  '51': { code: '51', name: 'Ceuta',                       regionCode: 'CEU' },
  '52': { code: '52', name: 'Melilla',                     regionCode: 'MEL' },
};

/**
 * Derive a province code from a Spanish postal code (first two digits).
 * Returns null if the postcode doesn't map to a known province (01–52).
 */
export function provFromPostalCode(cp: string): string | null {
  if (!cp || cp.length < 2) return null;
  const trimmed = cp.trim().padStart(5, '0');
  const code = trimmed.slice(0, 2);
  return PROVINCES[code] ? code : null;
}
