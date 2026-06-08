// Portuguese districts (distritos) grouped into NUTS-II-style regions, mirroring
// the shape of italy-geo.ts (REGIONS + PROVINCES) so the country page, directory
// and per-area routes can treat Portugal the same way as Italy/Spain/France.
//
// PROVINCES are keyed by an UPPERCASE slug (e.g. "CASTELO-BRANCO"); the route
// params are the lowercase form. districtCode() maps the DGEG "Distrito" string
// (which may carry accents, or be an island name) onto these codes.

export interface Region {
  code: string;
  name: string;
}
export interface Province {
  code: string; // uppercase slug
  name: string; // display name (with accents)
  regionCode: string;
}

export const REGIONS: Record<string, Region> = {
  N: { code: 'N', name: 'Norte' },
  C: { code: 'C', name: 'Centro' },
  L: { code: 'L', name: 'Lisboa e Vale do Tejo' },
  AL: { code: 'AL', name: 'Alentejo' },
  AG: { code: 'AG', name: 'Algarve' },
};
// Note: DGEG's "Preços dos Combustíveis Online" covers Continental Portugal only —
// the Açores and Madeira archipelagos are not in the feed, so they are excluded.

export const PROVINCES: Record<string, Province> = {
  AVEIRO: { code: 'AVEIRO', name: 'Aveiro', regionCode: 'C' },
  BEJA: { code: 'BEJA', name: 'Beja', regionCode: 'AL' },
  BRAGA: { code: 'BRAGA', name: 'Braga', regionCode: 'N' },
  BRAGANCA: { code: 'BRAGANCA', name: 'Bragança', regionCode: 'N' },
  'CASTELO-BRANCO': { code: 'CASTELO-BRANCO', name: 'Castelo Branco', regionCode: 'C' },
  COIMBRA: { code: 'COIMBRA', name: 'Coimbra', regionCode: 'C' },
  EVORA: { code: 'EVORA', name: 'Évora', regionCode: 'AL' },
  FARO: { code: 'FARO', name: 'Faro', regionCode: 'AG' },
  GUARDA: { code: 'GUARDA', name: 'Guarda', regionCode: 'C' },
  LEIRIA: { code: 'LEIRIA', name: 'Leiria', regionCode: 'C' },
  LISBOA: { code: 'LISBOA', name: 'Lisboa', regionCode: 'L' },
  PORTALEGRE: { code: 'PORTALEGRE', name: 'Portalegre', regionCode: 'AL' },
  PORTO: { code: 'PORTO', name: 'Porto', regionCode: 'N' },
  SANTAREM: { code: 'SANTAREM', name: 'Santarém', regionCode: 'L' },
  SETUBAL: { code: 'SETUBAL', name: 'Setúbal', regionCode: 'L' },
  'VIANA-DO-CASTELO': { code: 'VIANA-DO-CASTELO', name: 'Viana do Castelo', regionCode: 'N' },
  'VILA-REAL': { code: 'VILA-REAL', name: 'Vila Real', regionCode: 'N' },
  VISEU: { code: 'VISEU', name: 'Viseu', regionCode: 'C' },
};

/** strip accents + lowercase */
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Map a DGEG "Distrito" string to a PROVINCES code, bucketing islands. */
export function districtCode(distrito: string | null | undefined): string | null {
  if (!distrito) return null;
  const n = norm(distrito);
  if (!n) return null;
  // Islands: Madeira archipelago vs Azores
  if (n.includes('madeira') || n.includes('porto santo')) return 'MADEIRA';
  const AZORES = ['acores', 'sao miguel', 'terceira', 'faial', 'pico', 'flores', 'corvo', 'graciosa', 'sao jorge', 'santa maria'];
  if (AZORES.some((a) => n.includes(a))) return 'ACORES';
  // Mainland: slug → uppercase, match a known district
  const slug = n.replace(/\s+/g, '-').toUpperCase();
  return PROVINCES[slug] ? slug : null;
}
