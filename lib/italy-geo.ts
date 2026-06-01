/**
 * Italy geographic lookup tables.
 *
 * - 20 regioni
 * - 107 provincial-level units (province + città metropolitane + provincia
 *   autonoma Trento/Bolzano)
 *
 * Italian postal codes (CAP) do NOT cleanly map to province (unlike FR/ES),
 * so we use the 2-letter `Provincia` field directly from the MIMIT
 * anagrafica data.
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
  ABR: { code: 'ABR', name: 'Abruzzo' },
  BAS: { code: 'BAS', name: 'Basilicata' },
  CAL: { code: 'CAL', name: 'Calabria' },
  CAM: { code: 'CAM', name: 'Campania' },
  EMR: { code: 'EMR', name: 'Emilia-Romagna' },
  FVG: { code: 'FVG', name: 'Friuli-Venezia Giulia' },
  LAZ: { code: 'LAZ', name: 'Lazio' },
  LIG: { code: 'LIG', name: 'Liguria' },
  LOM: { code: 'LOM', name: 'Lombardia' },
  MAR: { code: 'MAR', name: 'Marche' },
  MOL: { code: 'MOL', name: 'Molise' },
  PIE: { code: 'PIE', name: 'Piemonte' },
  PUG: { code: 'PUG', name: 'Puglia' },
  SAR: { code: 'SAR', name: 'Sardegna' },
  SIC: { code: 'SIC', name: 'Sicilia' },
  TOS: { code: 'TOS', name: 'Toscana' },
  TAA: { code: 'TAA', name: 'Trentino-Alto Adige' },
  UMB: { code: 'UMB', name: 'Umbria' },
  VDA: { code: 'VDA', name: "Valle d'Aosta" },
  VEN: { code: 'VEN', name: 'Veneto' },
};

export const PROVINCES: Record<string, ProvinceInfo> = {
  // Abruzzo
  CH: { code: 'CH', name: 'Chieti',                regionCode: 'ABR' },
  AQ: { code: 'AQ', name: "L'Aquila",              regionCode: 'ABR' },
  PE: { code: 'PE', name: 'Pescara',               regionCode: 'ABR' },
  TE: { code: 'TE', name: 'Teramo',                regionCode: 'ABR' },
  // Basilicata
  MT: { code: 'MT', name: 'Matera',                regionCode: 'BAS' },
  PZ: { code: 'PZ', name: 'Potenza',               regionCode: 'BAS' },
  // Calabria
  CZ: { code: 'CZ', name: 'Catanzaro',             regionCode: 'CAL' },
  CS: { code: 'CS', name: 'Cosenza',               regionCode: 'CAL' },
  KR: { code: 'KR', name: 'Crotone',               regionCode: 'CAL' },
  RC: { code: 'RC', name: 'Reggio Calabria',       regionCode: 'CAL' },
  VV: { code: 'VV', name: 'Vibo Valentia',         regionCode: 'CAL' },
  // Campania
  AV: { code: 'AV', name: 'Avellino',              regionCode: 'CAM' },
  BN: { code: 'BN', name: 'Benevento',             regionCode: 'CAM' },
  CE: { code: 'CE', name: 'Caserta',               regionCode: 'CAM' },
  NA: { code: 'NA', name: 'Napoli',                regionCode: 'CAM' },
  SA: { code: 'SA', name: 'Salerno',               regionCode: 'CAM' },
  // Emilia-Romagna
  BO: { code: 'BO', name: 'Bologna',               regionCode: 'EMR' },
  FE: { code: 'FE', name: 'Ferrara',               regionCode: 'EMR' },
  FC: { code: 'FC', name: 'Forlì-Cesena',          regionCode: 'EMR' },
  MO: { code: 'MO', name: 'Modena',                regionCode: 'EMR' },
  PR: { code: 'PR', name: 'Parma',                 regionCode: 'EMR' },
  PC: { code: 'PC', name: 'Piacenza',              regionCode: 'EMR' },
  RA: { code: 'RA', name: 'Ravenna',               regionCode: 'EMR' },
  RE: { code: 'RE', name: 'Reggio Emilia',         regionCode: 'EMR' },
  RN: { code: 'RN', name: 'Rimini',                regionCode: 'EMR' },
  // Friuli-Venezia Giulia
  GO: { code: 'GO', name: 'Gorizia',               regionCode: 'FVG' },
  PN: { code: 'PN', name: 'Pordenone',             regionCode: 'FVG' },
  TS: { code: 'TS', name: 'Trieste',               regionCode: 'FVG' },
  UD: { code: 'UD', name: 'Udine',                 regionCode: 'FVG' },
  // Lazio
  FR: { code: 'FR', name: 'Frosinone',             regionCode: 'LAZ' },
  LT: { code: 'LT', name: 'Latina',                regionCode: 'LAZ' },
  RI: { code: 'RI', name: 'Rieti',                 regionCode: 'LAZ' },
  RM: { code: 'RM', name: 'Roma',                  regionCode: 'LAZ' },
  VT: { code: 'VT', name: 'Viterbo',               regionCode: 'LAZ' },
  // Liguria
  GE: { code: 'GE', name: 'Genova',                regionCode: 'LIG' },
  IM: { code: 'IM', name: 'Imperia',               regionCode: 'LIG' },
  SP: { code: 'SP', name: 'La Spezia',             regionCode: 'LIG' },
  SV: { code: 'SV', name: 'Savona',                regionCode: 'LIG' },
  // Lombardia
  BG: { code: 'BG', name: 'Bergamo',               regionCode: 'LOM' },
  BS: { code: 'BS', name: 'Brescia',               regionCode: 'LOM' },
  CO: { code: 'CO', name: 'Como',                  regionCode: 'LOM' },
  CR: { code: 'CR', name: 'Cremona',               regionCode: 'LOM' },
  LC: { code: 'LC', name: 'Lecco',                 regionCode: 'LOM' },
  LO: { code: 'LO', name: 'Lodi',                  regionCode: 'LOM' },
  MN: { code: 'MN', name: 'Mantova',               regionCode: 'LOM' },
  MI: { code: 'MI', name: 'Milano',                regionCode: 'LOM' },
  MB: { code: 'MB', name: 'Monza e Brianza',       regionCode: 'LOM' },
  PV: { code: 'PV', name: 'Pavia',                 regionCode: 'LOM' },
  SO: { code: 'SO', name: 'Sondrio',               regionCode: 'LOM' },
  VA: { code: 'VA', name: 'Varese',                regionCode: 'LOM' },
  // Marche
  AN: { code: 'AN', name: 'Ancona',                regionCode: 'MAR' },
  AP: { code: 'AP', name: 'Ascoli Piceno',         regionCode: 'MAR' },
  FM: { code: 'FM', name: 'Fermo',                 regionCode: 'MAR' },
  MC: { code: 'MC', name: 'Macerata',              regionCode: 'MAR' },
  PU: { code: 'PU', name: 'Pesaro e Urbino',       regionCode: 'MAR' },
  // Molise
  CB: { code: 'CB', name: 'Campobasso',            regionCode: 'MOL' },
  IS: { code: 'IS', name: 'Isernia',               regionCode: 'MOL' },
  // Piemonte
  AL: { code: 'AL', name: 'Alessandria',           regionCode: 'PIE' },
  AT: { code: 'AT', name: 'Asti',                  regionCode: 'PIE' },
  BI: { code: 'BI', name: 'Biella',                regionCode: 'PIE' },
  CN: { code: 'CN', name: 'Cuneo',                 regionCode: 'PIE' },
  NO: { code: 'NO', name: 'Novara',                regionCode: 'PIE' },
  TO: { code: 'TO', name: 'Torino',                regionCode: 'PIE' },
  VC: { code: 'VC', name: 'Vercelli',              regionCode: 'PIE' },
  VB: { code: 'VB', name: 'Verbano-Cusio-Ossola',  regionCode: 'PIE' },
  // Puglia
  BA: { code: 'BA', name: 'Bari',                  regionCode: 'PUG' },
  BT: { code: 'BT', name: 'Barletta-Andria-Trani', regionCode: 'PUG' },
  BR: { code: 'BR', name: 'Brindisi',              regionCode: 'PUG' },
  FG: { code: 'FG', name: 'Foggia',                regionCode: 'PUG' },
  LE: { code: 'LE', name: 'Lecce',                 regionCode: 'PUG' },
  TA: { code: 'TA', name: 'Taranto',               regionCode: 'PUG' },
  // Sardegna
  CA: { code: 'CA', name: 'Cagliari',              regionCode: 'SAR' },
  NU: { code: 'NU', name: 'Nuoro',                 regionCode: 'SAR' },
  OR: { code: 'OR', name: 'Oristano',              regionCode: 'SAR' },
  SS: { code: 'SS', name: 'Sassari',               regionCode: 'SAR' },
  SU: { code: 'SU', name: 'Sud Sardegna',          regionCode: 'SAR' },
  // Sicilia
  AG: { code: 'AG', name: 'Agrigento',             regionCode: 'SIC' },
  CL: { code: 'CL', name: 'Caltanissetta',         regionCode: 'SIC' },
  CT: { code: 'CT', name: 'Catania',               regionCode: 'SIC' },
  EN: { code: 'EN', name: 'Enna',                  regionCode: 'SIC' },
  ME: { code: 'ME', name: 'Messina',               regionCode: 'SIC' },
  PA: { code: 'PA', name: 'Palermo',               regionCode: 'SIC' },
  RG: { code: 'RG', name: 'Ragusa',                regionCode: 'SIC' },
  SR: { code: 'SR', name: 'Siracusa',              regionCode: 'SIC' },
  TP: { code: 'TP', name: 'Trapani',               regionCode: 'SIC' },
  // Toscana
  AR: { code: 'AR', name: 'Arezzo',                regionCode: 'TOS' },
  FI: { code: 'FI', name: 'Firenze',               regionCode: 'TOS' },
  GR: { code: 'GR', name: 'Grosseto',              regionCode: 'TOS' },
  LI: { code: 'LI', name: 'Livorno',               regionCode: 'TOS' },
  LU: { code: 'LU', name: 'Lucca',                 regionCode: 'TOS' },
  MS: { code: 'MS', name: 'Massa-Carrara',         regionCode: 'TOS' },
  PI: { code: 'PI', name: 'Pisa',                  regionCode: 'TOS' },
  PT: { code: 'PT', name: 'Pistoia',               regionCode: 'TOS' },
  PO: { code: 'PO', name: 'Prato',                 regionCode: 'TOS' },
  SI: { code: 'SI', name: 'Siena',                 regionCode: 'TOS' },
  // Trentino-Alto Adige
  BZ: { code: 'BZ', name: 'Bolzano',               regionCode: 'TAA' },
  TN: { code: 'TN', name: 'Trento',                regionCode: 'TAA' },
  // Umbria
  PG: { code: 'PG', name: 'Perugia',               regionCode: 'UMB' },
  TR: { code: 'TR', name: 'Terni',                 regionCode: 'UMB' },
  // Valle d'Aosta
  AO: { code: 'AO', name: 'Aosta',                 regionCode: 'VDA' },
  // Veneto
  BL: { code: 'BL', name: 'Belluno',               regionCode: 'VEN' },
  PD: { code: 'PD', name: 'Padova',                regionCode: 'VEN' },
  RO: { code: 'RO', name: 'Rovigo',                regionCode: 'VEN' },
  TV: { code: 'TV', name: 'Treviso',               regionCode: 'VEN' },
  VE: { code: 'VE', name: 'Venezia',               regionCode: 'VEN' },
  VR: { code: 'VR', name: 'Verona',                regionCode: 'VEN' },
  VI: { code: 'VI', name: 'Vicenza',               regionCode: 'VEN' },
};
