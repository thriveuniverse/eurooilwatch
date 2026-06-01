/**
 * France geographic lookup tables.
 *
 * - 13 metropolitan regions (since 2016 reform), plus 5 overseas regions.
 * - 96 metropolitan départements, plus overseas (971-976).
 *
 * Department code is derived from the first two characters of the French
 * postal code, with two exceptions:
 *   - Corsica is "2A" / "2B" (postal codes 200xx, 201xx for Ajaccio,
 *     202xx for Bastia)
 *   - Overseas codes 971-976 use the first three digits.
 */

export interface RegionInfo {
  code: string;
  name: string;
}

export interface DepartmentInfo {
  code: string;
  name: string;
  regionCode: string;
}

export const REGIONS: Record<string, RegionInfo> = {
  ARA: { code: 'ARA', name: 'Auvergne-Rhône-Alpes' },
  BFC: { code: 'BFC', name: 'Bourgogne-Franche-Comté' },
  BRE: { code: 'BRE', name: 'Bretagne' },
  CVL: { code: 'CVL', name: 'Centre-Val de Loire' },
  COR: { code: 'COR', name: 'Corse' },
  GES: { code: 'GES', name: 'Grand Est' },
  HDF: { code: 'HDF', name: 'Hauts-de-France' },
  IDF: { code: 'IDF', name: 'Île-de-France' },
  NAQ: { code: 'NAQ', name: 'Nouvelle-Aquitaine' },
  NOR: { code: 'NOR', name: 'Normandie' },
  OCC: { code: 'OCC', name: 'Occitanie' },
  PDL: { code: 'PDL', name: 'Pays de la Loire' },
  PAC: { code: 'PAC', name: "Provence-Alpes-Côte d'Azur" },
  // Overseas
  GLP: { code: 'GLP', name: 'Guadeloupe' },
  MTQ: { code: 'MTQ', name: 'Martinique' },
  GUF: { code: 'GUF', name: 'Guyane' },
  REU: { code: 'REU', name: 'La Réunion' },
  MYT: { code: 'MYT', name: 'Mayotte' },
};

export const DEPARTMENTS: Record<string, DepartmentInfo> = {
  '01': { code: '01', name: 'Ain',                          regionCode: 'ARA' },
  '02': { code: '02', name: 'Aisne',                        regionCode: 'HDF' },
  '03': { code: '03', name: 'Allier',                       regionCode: 'ARA' },
  '04': { code: '04', name: 'Alpes-de-Haute-Provence',      regionCode: 'PAC' },
  '05': { code: '05', name: 'Hautes-Alpes',                 regionCode: 'PAC' },
  '06': { code: '06', name: 'Alpes-Maritimes',              regionCode: 'PAC' },
  '07': { code: '07', name: 'Ardèche',                      regionCode: 'ARA' },
  '08': { code: '08', name: 'Ardennes',                     regionCode: 'GES' },
  '09': { code: '09', name: 'Ariège',                       regionCode: 'OCC' },
  '10': { code: '10', name: 'Aube',                         regionCode: 'GES' },
  '11': { code: '11', name: 'Aude',                         regionCode: 'OCC' },
  '12': { code: '12', name: 'Aveyron',                      regionCode: 'OCC' },
  '13': { code: '13', name: 'Bouches-du-Rhône',             regionCode: 'PAC' },
  '14': { code: '14', name: 'Calvados',                     regionCode: 'NOR' },
  '15': { code: '15', name: 'Cantal',                       regionCode: 'ARA' },
  '16': { code: '16', name: 'Charente',                     regionCode: 'NAQ' },
  '17': { code: '17', name: 'Charente-Maritime',            regionCode: 'NAQ' },
  '18': { code: '18', name: 'Cher',                         regionCode: 'CVL' },
  '19': { code: '19', name: 'Corrèze',                      regionCode: 'NAQ' },
  '2A': { code: '2A', name: 'Corse-du-Sud',                 regionCode: 'COR' },
  '2B': { code: '2B', name: 'Haute-Corse',                  regionCode: 'COR' },
  '21': { code: '21', name: "Côte-d'Or",                    regionCode: 'BFC' },
  '22': { code: '22', name: "Côtes-d'Armor",                regionCode: 'BRE' },
  '23': { code: '23', name: 'Creuse',                       regionCode: 'NAQ' },
  '24': { code: '24', name: 'Dordogne',                     regionCode: 'NAQ' },
  '25': { code: '25', name: 'Doubs',                        regionCode: 'BFC' },
  '26': { code: '26', name: 'Drôme',                        regionCode: 'ARA' },
  '27': { code: '27', name: 'Eure',                         regionCode: 'NOR' },
  '28': { code: '28', name: 'Eure-et-Loir',                 regionCode: 'CVL' },
  '29': { code: '29', name: 'Finistère',                    regionCode: 'BRE' },
  '30': { code: '30', name: 'Gard',                         regionCode: 'OCC' },
  '31': { code: '31', name: 'Haute-Garonne',                regionCode: 'OCC' },
  '32': { code: '32', name: 'Gers',                         regionCode: 'OCC' },
  '33': { code: '33', name: 'Gironde',                      regionCode: 'NAQ' },
  '34': { code: '34', name: 'Hérault',                      regionCode: 'OCC' },
  '35': { code: '35', name: 'Ille-et-Vilaine',              regionCode: 'BRE' },
  '36': { code: '36', name: 'Indre',                        regionCode: 'CVL' },
  '37': { code: '37', name: 'Indre-et-Loire',               regionCode: 'CVL' },
  '38': { code: '38', name: 'Isère',                        regionCode: 'ARA' },
  '39': { code: '39', name: 'Jura',                         regionCode: 'BFC' },
  '40': { code: '40', name: 'Landes',                       regionCode: 'NAQ' },
  '41': { code: '41', name: 'Loir-et-Cher',                 regionCode: 'CVL' },
  '42': { code: '42', name: 'Loire',                        regionCode: 'ARA' },
  '43': { code: '43', name: 'Haute-Loire',                  regionCode: 'ARA' },
  '44': { code: '44', name: 'Loire-Atlantique',             regionCode: 'PDL' },
  '45': { code: '45', name: 'Loiret',                       regionCode: 'CVL' },
  '46': { code: '46', name: 'Lot',                          regionCode: 'OCC' },
  '47': { code: '47', name: 'Lot-et-Garonne',               regionCode: 'NAQ' },
  '48': { code: '48', name: 'Lozère',                       regionCode: 'OCC' },
  '49': { code: '49', name: 'Maine-et-Loire',               regionCode: 'PDL' },
  '50': { code: '50', name: 'Manche',                       regionCode: 'NOR' },
  '51': { code: '51', name: 'Marne',                        regionCode: 'GES' },
  '52': { code: '52', name: 'Haute-Marne',                  regionCode: 'GES' },
  '53': { code: '53', name: 'Mayenne',                      regionCode: 'PDL' },
  '54': { code: '54', name: 'Meurthe-et-Moselle',           regionCode: 'GES' },
  '55': { code: '55', name: 'Meuse',                        regionCode: 'GES' },
  '56': { code: '56', name: 'Morbihan',                     regionCode: 'BRE' },
  '57': { code: '57', name: 'Moselle',                      regionCode: 'GES' },
  '58': { code: '58', name: 'Nièvre',                       regionCode: 'BFC' },
  '59': { code: '59', name: 'Nord',                         regionCode: 'HDF' },
  '60': { code: '60', name: 'Oise',                         regionCode: 'HDF' },
  '61': { code: '61', name: 'Orne',                         regionCode: 'NOR' },
  '62': { code: '62', name: 'Pas-de-Calais',                regionCode: 'HDF' },
  '63': { code: '63', name: 'Puy-de-Dôme',                  regionCode: 'ARA' },
  '64': { code: '64', name: 'Pyrénées-Atlantiques',         regionCode: 'NAQ' },
  '65': { code: '65', name: 'Hautes-Pyrénées',              regionCode: 'OCC' },
  '66': { code: '66', name: 'Pyrénées-Orientales',          regionCode: 'OCC' },
  '67': { code: '67', name: 'Bas-Rhin',                     regionCode: 'GES' },
  '68': { code: '68', name: 'Haut-Rhin',                    regionCode: 'GES' },
  '69': { code: '69', name: 'Rhône',                        regionCode: 'ARA' },
  '70': { code: '70', name: 'Haute-Saône',                  regionCode: 'BFC' },
  '71': { code: '71', name: 'Saône-et-Loire',               regionCode: 'BFC' },
  '72': { code: '72', name: 'Sarthe',                       regionCode: 'PDL' },
  '73': { code: '73', name: 'Savoie',                       regionCode: 'ARA' },
  '74': { code: '74', name: 'Haute-Savoie',                 regionCode: 'ARA' },
  '75': { code: '75', name: 'Paris',                        regionCode: 'IDF' },
  '76': { code: '76', name: 'Seine-Maritime',               regionCode: 'NOR' },
  '77': { code: '77', name: 'Seine-et-Marne',               regionCode: 'IDF' },
  '78': { code: '78', name: 'Yvelines',                     regionCode: 'IDF' },
  '79': { code: '79', name: 'Deux-Sèvres',                  regionCode: 'NAQ' },
  '80': { code: '80', name: 'Somme',                        regionCode: 'HDF' },
  '81': { code: '81', name: 'Tarn',                         regionCode: 'OCC' },
  '82': { code: '82', name: 'Tarn-et-Garonne',              regionCode: 'OCC' },
  '83': { code: '83', name: 'Var',                          regionCode: 'PAC' },
  '84': { code: '84', name: 'Vaucluse',                     regionCode: 'PAC' },
  '85': { code: '85', name: 'Vendée',                       regionCode: 'PDL' },
  '86': { code: '86', name: 'Vienne',                       regionCode: 'NAQ' },
  '87': { code: '87', name: 'Haute-Vienne',                 regionCode: 'NAQ' },
  '88': { code: '88', name: 'Vosges',                       regionCode: 'GES' },
  '89': { code: '89', name: 'Yonne',                        regionCode: 'BFC' },
  '90': { code: '90', name: 'Territoire de Belfort',        regionCode: 'BFC' },
  '91': { code: '91', name: 'Essonne',                      regionCode: 'IDF' },
  '92': { code: '92', name: 'Hauts-de-Seine',               regionCode: 'IDF' },
  '93': { code: '93', name: 'Seine-Saint-Denis',            regionCode: 'IDF' },
  '94': { code: '94', name: 'Val-de-Marne',                 regionCode: 'IDF' },
  '95': { code: '95', name: "Val-d'Oise",                   regionCode: 'IDF' },
  // Overseas
  '971': { code: '971', name: 'Guadeloupe',                 regionCode: 'GLP' },
  '972': { code: '972', name: 'Martinique',                 regionCode: 'MTQ' },
  '973': { code: '973', name: 'Guyane',                     regionCode: 'GUF' },
  '974': { code: '974', name: 'La Réunion',                 regionCode: 'REU' },
  '976': { code: '976', name: 'Mayotte',                    regionCode: 'MYT' },
};

/**
 * Derive a département code from a French postal code.
 *
 * - Standard metropolitan codes: first 2 digits (e.g. "75001" → "75", "13013" → "13")
 * - Corsica: 200xx and 201xx → "2A"; 202xx → "2B"
 * - Overseas: 971xx → "971", etc.
 *
 * Returns null if the postal code cannot be mapped (e.g. malformed).
 */
export function deptFromPostalCode(cp: string): string | null {
  if (!cp || cp.length < 2) return null;
  const trimmed = cp.trim().padStart(5, '0');

  // Overseas: first three digits 971-976 (no 975)
  const first3 = trimmed.slice(0, 3);
  if (first3 === '971' || first3 === '972' || first3 === '973' || first3 === '974' || first3 === '976') {
    return first3;
  }

  // Corsica: 200xx and 201xx → 2A, 202xx-206xx → 2B
  if (trimmed.startsWith('20')) {
    const sub = parseInt(trimmed.slice(2, 5), 10);
    if (sub <= 199) return '2A';
    return '2B';
  }

  // Metropolitan: first two digits
  const code = trimmed.slice(0, 2);
  return DEPARTMENTS[code] ? code : null;
}
