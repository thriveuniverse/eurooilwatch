import type { Metadata } from 'next';
import FreshnessGuard from '@/components/FreshnessGuard';
import fs from 'fs';
import path from 'path';
import { getGDACSEvents, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '@/lib/gdacs';
import type { GDACSAlertLevel } from '@/lib/gdacs';
import { getUSGSQuakes, magSeverity } from '@/lib/usgs';
import { getFIRMSDetections } from '@/lib/firms';
import RefineryHealthPanel from '@/components/RefineryHealthPanel';
import BunkerHistoryChart from '@/components/BunkerHistoryChart';
import AraStocksCard from '@/components/AraStocksCard';
import SeaStatePanel, { type SeaStateData } from '@/components/SeaStatePanel';
import WarRiskWatchPanel from '@/components/WarRiskWatchPanel';
import ChokepointsMap from '@/components/ChokepointsMap';
import ChokepointTransitPanel, { type PortwatchData } from '@/components/ChokepointTransitPanel';
import HormuzThroughputPanel from '@/components/HormuzThroughputPanel';
import HormuzPosturePanel from '@/components/HormuzPosturePanel';
import PortFlowPanel, { type PortFlowData } from '@/components/PortFlowPanel';
import EuropeBarrelTracker from '@/components/EuropeBarrelTracker';
import CrudeImportSankey from '@/components/CrudeImportSankey';
import TankerActivity from '@/components/TankerActivity';
import { getEuCrudeImports } from '@/lib/data';
import { maradOverrideFor } from '@/lib/marad-risk';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Global Oil Supply Routes | EuroOilWatch',
  description:
    'Status of the key oil and fuel supply chokepoints affecting European energy security. Strait of Hormuz, Suez Canal, Bab-el-Mandeb, Danish Straits, Turkish Straits, and ARA hub.',
  alternates: { canonical: 'https://eurooilwatch.com/supply' },
  openGraph: {
    title: 'Global Oil Supply Routes | EuroOilWatch',
    description: 'Key chokepoints, risk status, and what they mean for EU fuel supply.',
    url: 'https://eurooilwatch.com/supply',
    siteName: 'EuroOilWatch',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EuroOilWatch Supply Routes' }],
  },
};

type RiskLevel = 'normal' | 'elevated' | 'high' | 'critical';

interface Chokepoint {
  id: string;
  name: string;
  region: string;
  risk: RiskLevel;
  riskLabel: string;
  dailyFlow: string;
  euRelevance: string;
  coords: string;
  summary: string;
  euImpact: string;
  context: string;
  lastReviewed: string;
  sources: { label: string; url: string }[];
}

const CHOKEPOINTS: Chokepoint[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    region: 'Persian Gulf / Gulf of Oman',
    risk: 'critical',
    riskLabel: 'Critical — open on paper, restricted in practice',
    dailyFlow: '~20',
    euRelevance: 'indirect',
    coords: 'Between Iran and Oman, connecting Persian Gulf to Arabian Sea',
    summary:
      'The Strait of Hormuz remains the master variable for global oil. After the conflict that began in late February 2026 effectively closed it, the EIA assumed Hormuz stayed shut into late May, with traffic only beginning to pick up in June. Iran now says the strait will reopen only under new conditions — including possible transit fees set with Oman — which Washington opposes and Oman has reportedly declined to support. Iran describes the strait as open, but in practice only a handful of crude, product and LNG vessels have exited recently — often with AIS gaps or under heightened risk — while overall Gulf flows stay far below normal. Open on paper, restricted in practice.',
    euImpact:
      'Approximately 20% of global seaborne oil and LNG — around 20 mb/d of oil — normally transits Hormuz. The IEA put Gulf output affected by the closure around 14.4 mb/d below pre-war levels, with total supply losses since February of roughly 12.8 mb/d, which it has called the largest disruption on record. Atlantic Basin crude premiums stay elevated as Asian buyers compete for non-Gulf supply, putting direct upward pressure on EU feedstock costs. Crucially, Middle East jet-fuel arrivals into Europe fell from about 330,000 to 60,000 b/d between March and April (IEA) — diesel and jet are where the squeeze reaches EU industry and aviation first.',
    context:
      'Hormuz is Washington\'s top priority and Tehran\'s main leverage in unresolved US–Iran talks, alongside sanctions, frozen funds and nuclear limits. The early-June Israeli strike on Iran\'s Mahshahr petrochemical complex — the first hit on Iranian energy infrastructure since the April ceasefire — put a direct energy-asset risk premium back on top of the chokepoint risk. Even after a reopening, recovery is slow: Kuwait says it could restore about 70% of output within 6–8 weeks, the rest taking roughly another month. The Red Sea/Suez route remains independently disrupted by Houthi attacks.',
    lastReviewed: '2026-06-08',
    sources: [
      { label: 'IEA — Strait of Hormuz', url: 'https://www.iea.org/articles/hormuz-strait' },
      { label: 'EIA — World Oil Transit Chokepoints', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
    ],
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    region: 'Egypt — Red Sea to Mediterranean',
    risk: 'elevated',
    riskLabel: 'Elevated — Red Sea rerouting ongoing',
    dailyFlow: '~5.5',
    euRelevance: 'moderate',
    coords: 'Northeast Egypt, connecting Red Sea (via Gulf of Suez) to Mediterranean',
    summary:
      'The Suez Canal carries around 5.5 mb/d of oil and petroleum products plus significant LNG volumes. Red Sea avoidance by commercial tankers has kept Canal transit volumes far below pre-disruption levels since late 2023. Cape of Good Hope diversion remains the operating norm for Gulf-to-Europe cargoes. With Hormuz still constrained, both primary Gulf-to-Europe export corridors remain under simultaneous pressure.',
    euImpact:
      'Cape routing adds 10–14 days and substantial cost to Middle Eastern cargo journeys, inflating EU import costs. EU refiners in Eastern Europe and the Mediterranean with limited domestic alternatives continue to face higher feedstock costs. The constrained Hormuz corridor compounds the Red Sea disruption — a full recovery in EU supply chains now requires resolution of both.',
    context:
      'The Sumed pipeline can carry approximately 2.5 mb/d of crude as a bypass but not refined products. EU member states have largely adapted sourcing to Atlantic Basin suppliers, but at sustained higher cost. A Houthi ceasefire remains the necessary condition for Red Sea/Suez recovery.',
    lastReviewed: '2026-06-08',
    sources: [
      { label: 'EIA — Suez Canal', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
      { label: 'IEA Oil Market Report', url: 'https://www.iea.org/reports/oil-market-report-april-2026' },
    ],
  },
  {
    id: 'bab-el-mandeb',
    name: 'Bab-el-Mandeb Strait',
    region: 'Yemen / Djibouti — Red Sea entrance',
    risk: 'high',
    riskLabel: 'High — active Houthi threat',
    dailyFlow: '~4.5',
    euRelevance: 'moderate',
    coords: 'Between Yemen and Djibouti/Eritrea, connecting Gulf of Aden to Red Sea',
    summary:
      'The southern entrance to the Red Sea remains actively disrupted by Houthi attacks since November 2023. Around 4.5 mb/d of oil and products normally transits this route; daily traffic through Bab-el-Mandeb and Suez Canal remains far below pre-attack levels. With Hormuz also still constrained, both primary Gulf export corridors remain under simultaneous pressure.',
    euImpact:
      'ARA-bound cargoes from the Middle East continue to route via the Cape of Good Hope, adding 30+ days versus the Red Sea route. Eastern European states with fewer domestic supply alternatives and countries dependent on Middle Eastern diesel remain most acutely affected. With Hormuz constrained at the same time, both disruptions overlapping represent the most severe supply-corridor constraint since the 1973 oil embargo.',
    context:
      'Operation Prosperity Guardian has not restored commercial transit confidence. Insurance premiums for Red Sea passage remain prohibitive. The Houthi threat is geopolitically linked to the broader US-Iran-Israel conflict; renewed Houthi threats in the Red Sea are an active watch-item alongside the constrained Hormuz corridor. Red Sea normalisation requires a separate Houthi ceasefire.',
    lastReviewed: '2026-06-08',
    sources: [
      { label: 'EIA — Bab-el-Mandeb', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
    ],
  },
  {
    id: 'south-china-sea',
    name: 'South China Sea — Scarborough Shoal',
    region: 'West Philippines Sea / South China Sea',
    risk: 'high',
    riskLabel: 'High — blockage disrupting Asian supply flows',
    dailyFlow: '~3.4',
    euRelevance: 'indirect',
    coords: 'Scarborough Shoal, approximately 220km west of the Philippines, within the broader South China Sea corridor',
    summary:
      'Chinese naval and coast guard vessels have established a blockade around Scarborough Shoal, disrupting Philippine maritime access and raising the risk of broader interference with commercial tanker traffic through the South China Sea. The sea lane carries approximately 3.4 mb/d of oil — primarily Middle Eastern crude transiting to China, Japan, and South Korea — along with significant LNG volumes. While the blockade is currently focused on the Shoal itself rather than the main tanker lanes, the escalation introduces material operational risk to one of the world\'s busiest energy corridors.',
    euImpact:
      'The South China Sea does not sit on the primary EU supply route, but its disruption feeds into European fuel markets through displaced demand. If Chinese and East Asian buyers are unable to secure normal Gulf supply volumes via this corridor, they compete more aggressively for Atlantic Basin, West African, and North Sea cargoes — the same pool EU refiners draw on. With Hormuz still constrained, Gulf supply to Asia is already severely limited — a South China Sea escalation would further intensify competition for alternative supply.',
    context:
      'The Scarborough Shoal has been a flashpoint in China-Philippines tensions since China effectively seized control of the feature in 2012. The current blockade escalates well beyond previous stand-offs and has drawn US statements under the Mutual Defense Treaty with the Philippines. A full closure of the broader South China Sea to commercial traffic — while not the current situation — would represent one of the most severe supply shocks in modern history, affecting roughly a third of global seaborne oil trade. The situation is being monitored by the IEA and has been noted in recent IMF growth revisions.',
    lastReviewed: '2026-04-16',
    sources: [
      { label: 'EIA — South China Sea', url: 'https://www.eia.gov/international/analysis/regions-of-interest/South_China_Sea' },
      { label: 'EIA — World Oil Transit Chokepoints', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
    ],
  },
  {
    id: 'danish-straits',
    name: 'Danish Straits',
    region: 'Denmark / Sweden — Baltic Sea access',
    risk: 'normal',
    riskLabel: 'Normal — monitoring Baltic activity',
    dailyFlow: '~3',
    euRelevance: 'moderate',
    coords: 'Between Denmark and Sweden, connecting Baltic Sea to North Sea',
    summary:
      'The only maritime access to the Baltic Sea. Pre-sanctions, around 3 mb/d of Russian crude and products from Baltic ports (Primorsk, Ust-Luga) transited this route. Post-2022 sanctions have reduced Russian flows but shadow fleet tankers continue to carry Russian oil, raising insurance and environmental concerns.',
    euImpact:
      'Russian crude previously supplied a significant share of EU refinery inputs via Baltic ports, particularly for refineries in Poland, Germany, Finland, and the Baltic states. Post-sanctions diversification has been largely achieved, but at higher cost and with some residual dependence on Russian pipeline crude under temporary exemptions. NATO sensitivity around Baltic infrastructure is heightened following submarine cable incidents.',
    context:
      'Denmark and Sweden are both NATO members and have shown willingness to scrutinise shadow fleet tanker transits. The EU has progressively tightened enforcement of price cap rules on Russian oil transiting these waters. Several shadow fleet vessels have been detained or refused port access in the region.',
    lastReviewed: '2026-04-08',
    sources: [
      { label: 'EIA — Danish Straits', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
    ],
  },
  {
    id: 'turkish-straits',
    name: 'Turkish Straits',
    region: 'Turkey — Black Sea to Mediterranean',
    risk: 'normal',
    riskLabel: 'Normal — price cap compliance tension',
    dailyFlow: '~2.4',
    euRelevance: 'moderate',
    coords: 'Bosphorus and Dardanelles, connecting Black Sea to Aegean Sea',
    summary:
      'The Bosphorus and Dardanelles control Black Sea access to the Mediterranean. Around 2.4 mb/d passes through — primarily Kazakhstani crude via the CPC pipeline and residual Russian Black Sea exports. Turkey has periodically restricted passage, citing insurance requirements linked to Western price cap enforcement on Russian oil.',
    euImpact:
      'Kazakhstani crude via the CPC pipeline is an important non-Russian supply source for some Southern European refineries. Periodic delays at the Turkish Straits have tightened Mediterranean crude markets and affected Adriatic and Aegean refinery feedstocks. EU refiners with Mediterranean exposure monitor this route closely. Greek and Italian refiners are most directly affected by transit disruptions.',
    context:
      'Turkey operates transit rights under the 1936 Montreux Convention. The EU price cap on Russian oil has created ongoing legal and commercial friction around insurance requirements for vessels. Turkey has resisted pressure to fully enforce EU-aligned restrictions, creating a persistent compliance gap.',
    lastReviewed: '2026-04-08',
    sources: [
      { label: 'EIA — Turkish Straits', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
    ],
  },
  {
    id: 'ara',
    name: 'ARA Hub',
    region: 'Amsterdam-Rotterdam-Antwerp, Northwest Europe',
    risk: 'normal',
    riskLabel: 'Normal — functioning',
    dailyFlow: '~4',
    euRelevance: 'direct',
    coords: 'Northwest European coast — Netherlands and Belgium',
    summary:
      'The Amsterdam-Rotterdam-Antwerp (ARA) complex is Europe\'s largest refining and oil storage hub, handling around 4 mb/d of crude and products. It acts as the primary pricing and distribution point for Northwest European fuel markets. Rotterdam alone is the world\'s largest port by cargo volume. Note: shipping around Antwerp was partially halted on 10 April 2026 following an oil spill; this is an operational incident under containment rather than a structural supply route disruption.',
    euImpact:
      'ARA is the clearing hub for European diesel, petrol, and jet fuel. Prices at ARA set the reference for fuel costs across Northwest Europe and influence prices as far east as Poland and the Baltic states. The constrained Hormuz corridor sustains Atlantic Basin tightness as Gulf crude supply remains limited and Asian buyers compete for the same alternative supply pool as EU refiners. Red Sea disruption continues to inflate freight costs for Middle Eastern cargoes, and reduced Middle East jet-fuel arrivals into Europe keep distillate balances tight. The Antwerp spill incident (10 April) is an operational matter under containment.',
    context:
      'ARA commercial storage acts as a buffer for European supply disruptions. Tanker arrivals at Rotterdam are a leading indicator of fuel availability. ARA stock levels are published weekly by Insights Global and monitored closely by energy traders. In the current environment, ARA stock drawdown is the key metric to watch for early signs of downstream tightness.',
    lastReviewed: '2026-06-08',
    sources: [
      { label: 'Port of Rotterdam', url: 'https://www.portofrotterdam.com' },
      { label: 'Insights Global — ARA stocks', url: 'https://www.insightsglobal.com' },
    ],
  },
];

const RISK_STYLES: Record<RiskLevel, { badge: string; border: string; dot: string }> = {
  normal:   { badge: 'bg-green-900/40 text-green-300 border-green-800',   border: 'border-green-900/40',   dot: 'bg-green-400' },
  elevated: { badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-800', border: 'border-yellow-900/30', dot: 'bg-yellow-400' },
  high:     { badge: 'bg-orange-900/40 text-orange-300 border-orange-800', border: 'border-orange-900/30', dot: 'bg-orange-400' },
  critical: { badge: 'bg-red-900/40 text-red-300 border-red-800',          border: 'border-red-900/30',     dot: 'bg-red-400' },
};

const RELEVANCE_LABEL: Record<string, string> = {
  direct:   'Direct EU impact',
  moderate: 'Moderate EU impact',
  indirect: 'Indirect / price impact',
};

interface BunkerPort {
  name: string; code: string; region: string; relevance: string;
  vlsfo: number; mgo: number; vlsfoChange: number; mgoChange: number;
}
interface BunkerData {
  lastUpdated: string; brentBasis: number; brentChange: number; note: string;
  ports: BunkerPort[];
}

function readBunker(): BunkerData | null {
  const p = path.join(process.cwd(), 'data', 'bunker.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

interface MaradAdvisory {
  id: string;
  type: 'advisory' | 'alert';
  title: string;
  region: string;
  incident: string;
  severity: 'critical' | 'high' | 'elevated' | 'normal';
  year: number;
  num: number;
  url: string;
}

function readMarad(): { lastUpdated: string; advisories: MaradAdvisory[] } | null {
  const p = path.join(process.cwd(), 'data', 'marad-advisories.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

interface CreaArticle {
  title: string;
  date: string;
  link: string;
  categories: string[];
  tag: string;
}

function readCrea(): { lastUpdated: string; articles: CreaArticle[] } | null {
  const p = path.join(process.cwd(), 'data', 'crea-feed.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

// Live transit override — derive a tracked chokepoint's risk badge from IMF PortWatch
// tanker tonnage vs the 2023 norm, so the status auto-updates with the data (the
// editorial summary/impact/context still provide the "why"). MARAD security advisories
// are layered on top and can escalate further.
const KEY_ALIAS: Record<string, string> = { 'turkish-straits': 'bosporus' };
function portwatchOverrideFor(
  id: string,
  pw: PortwatchData | null,
): { risk: RiskLevel; riskLabel: string; asOf: string } | null {
  const key = KEY_ALIAS[id] || id;
  const cp = pw?.chokepoints?.find((k) => k.key === key);
  if (!cp || cp.pctTankerTonnage == null) return null;
  const p = cp.pctTankerTonnage;
  let risk: RiskLevel, phrase: string;
  if (p < 25) { risk = 'critical'; phrase = `at ${p}% of the 2023 norm`; }
  else if (p < 60) { risk = 'high'; phrase = `down to ${p}% of the 2023 norm`; }
  else if (p < 85) { risk = 'elevated'; phrase = `at ${p}% of the 2023 norm`; }
  else { risk = 'normal'; phrase = `near the 2023 norm (${p}%)`; }
  const cap = risk[0].toUpperCase() + risk.slice(1);
  return { risk, riskLabel: `${cap} — tanker tonnage ${phrase} (live · IMF PortWatch)`, asOf: cp.latestDate };
}

export default async function SupplyPage() {
  const supplyNoteAsOf = '2026-07-14'; // single source: the dateline + the FreshnessGuard below
  const [gdacsEvents, usgsQuakes, firmsResult] = await Promise.all([
    getGDACSEvents(),
    getUSGSQuakes(),
    getFIRMSDetections(),
  ]);

  const bunker = readBunker();
  const marad  = readMarad();
  const crea   = readCrea();
  const euCrude = getEuCrudeImports();

  const chokepoints: Chokepoint[] = (() => {
    const pwPath = path.join(process.cwd(), 'data', 'portwatch-chokepoints.json');
    let pw: PortwatchData | null = null;
    if (fs.existsSync(pwPath)) { try { pw = JSON.parse(fs.readFileSync(pwPath, 'utf-8')); } catch { pw = null; } }
    return CHOKEPOINTS.map(c => {
      let cc = c;
      // 1. live transit (IMF PortWatch) drives the badge from current flow
      const live = portwatchOverrideFor(c.id, pw);
      if (live) cc = { ...cc, risk: live.risk, riskLabel: live.riskLabel, lastReviewed: live.asOf };
      // 2. MARAD security advisories layered on top — can escalate further
      const ovr = marad ? maradOverrideFor(cc.id, marad.advisories, marad.lastUpdated, cc.risk) : null;
      return ovr ? { ...cc, risk: ovr.risk, riskLabel: ovr.riskLabel, lastReviewed: ovr.lastReviewed } : cc;
    });
  })();

  const highRisk = chokepoints.filter(c => c.risk === 'critical' || c.risk === 'high');
  const elevated = chokepoints.filter(c => c.risk === 'elevated');
  const normal   = chokepoints.filter(c => c.risk === 'normal');

  const statusAsOf = marad?.lastUpdated
    ?? chokepoints.map(c => c.lastReviewed).sort().slice(-1)[0]
    ?? new Date().toISOString();

  const bunkerHistoryRaw = (() => {
    const p = path.join(process.cwd(), 'data', 'bunker-history.json');
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
  })();
  const bunkerHistory = bunkerHistoryRaw?.entries?.length >= 2 ? bunkerHistoryRaw.entries : null;

  const seaState = (() => {
    const p = path.join(process.cwd(), 'data', 'sea-state.json');
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as SeaStateData; } catch { return null; }
  })();

  const portwatch = (() => {
    const p = path.join(process.cwd(), 'data', 'portwatch-chokepoints.json');
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as PortwatchData; } catch { return null; }
  })();

  const portFlows = (() => {
    const p = path.join(process.cwd(), 'data', 'port-flows.json');
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as PortFlowData; } catch { return null; }
  })();

  const redEvents    = gdacsEvents.filter(e => e.alertLevel === 'Red');
  const orangeEvents = gdacsEvents.filter(e => e.alertLevel === 'Orange');
  const greenEvents  = gdacsEvents.filter(e => e.alertLevel === 'Green');

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Global Oil Supply Routes</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Status of the key maritime chokepoints and supply routes that affect European fuel security.
          The transit, port-flow and sea-state panels below refresh daily from satellite-AIS and weather feeds; the
          chokepoint risk assessments further down are maintained editorially.
        </p>
        <p className="mt-3 text-sm">
          <a href="/hormuz-timeline" className="text-oil-300 hover:text-white underline underline-offset-2">
            → Strait of Hormuz crisis timeline
          </a>
          <span className="text-gray-500"> — a sourced, filterable chronology of the 2026 crisis.</span>
        </p>
      </div>

      {/* Chokepoints overview map */}
      <ChokepointsMap />

      {/* 13 July 2026 — Iran declares Hormuz closed */}
      <div className="rounded-lg border border-red-800/50 bg-red-950/20 px-5 py-4">
        <p className="text-[10px] font-mono font-semibold tracking-widest text-red-300/90 uppercase">
          {new Date(supplyNoteAsOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — Both powers claim Hormuz: Iran declares it closed; the US reinstates a blockade and floats a 20% toll
        </p>
        <FreshnessGuard lastUpdated={supplyNoteAsOf} maxAgeDays={5} label="This note" className="mt-2" />
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          The US–Iran conflict has escalated sharply since the July ceasefire collapsed. Over the weekend Iran&rsquo;s IRGC declared the Strait of Hormuz <strong className="text-white">closed &ldquo;until further notice&rdquo;</strong> — after its forces struck the Cyprus-flagged container ship <strong className="text-white">GFS Galaxy</strong> (engine-room fire, crew evacuated to a lifeboat, one crew member missing; CENTCOM). The US answered with further rounds of strikes, the latest on Sunday using one-way attack sea drones for the first time, and Iran retaliated across Kuwait, Jordan, Qatar, Bahrain and Oman — including the <strong className="text-white">first strike on Gulf oil infrastructure in weeks</strong>, a Kuwaiti drilling facility. Oil jumped at Monday&rsquo;s open, Brent trading above <strong className="text-white">$79</strong> and WTI near $74; by Tuesday Brent had pushed above <strong className="text-white">$85</strong>, a four-week high, as the war premium returned in force.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          On Monday the <strong className="text-white">US hardened its claim over the strait</strong>: in a Truth Social post President Trump declared Hormuz &ldquo;OPEN&hellip; with or without Iran,&rdquo; reinstated a US <strong className="text-white">blockade of Iranian ships and customers</strong>, styled the United States the &ldquo;<strong className="text-white">Guardian of the Hormuz Strait</strong>,&rdquo; and proposed a <strong className="text-white">20% fee on all cargo</strong> transiting the waterway, the process to &ldquo;begin immediately.&rdquo; Iran&rsquo;s Persian Gulf Strait Authority countered that passage was <strong className="text-white">&ldquo;currently unfeasible&rdquo;</strong> and suspended transit permits. Both powers now assert a right to control &mdash; and charge for &mdash; the chokepoint, days after the <strong className="text-white">IMO Council</strong> ruled that transit through international straits <strong className="text-white">may not be tolled</strong>. No US executive order, legal framework or collection mechanism has been issued &mdash; for now it is a declaration, not a mechanism.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          Iranian officials say a US projectile hit the <strong className="text-white">perimeter area</strong> of the
          Bushehr nuclear power plant, and Reuters has carried the perimeter claim — but there is{' '}
          <strong className="text-white">no independent confirmation that the reactor itself was hit</strong>. Earlier
          IAEA and Reuters reporting on previous Bushehr incidents found no reactor damage or radiological release; no
          fresh IAEA confirmation has yet been seen for this latest strike.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          Reuters ship-tracking found <strong className="text-white">at least four oil and gas tankers reversed
          course</strong> near the strait; others continued to transit. The strait&rsquo;s status is now <strong className="text-white">openly contested</strong> — Iran declares it closed while the US and CENTCOM insist it stays open to lawful transit, and the JMIC says the Oman-coordinated southern lane remains available. The US Navy-led Joint Maritime Information Center has raised the transit threat to{' '}
          <strong className="text-red-300">&ldquo;severe&rdquo;</strong> — up from &ldquo;substantial,&rdquo; its
          highest since mid-June — and the <strong className="text-white">IMO Secretary-General</strong> has urged
          shipowners not to expose crews to unnecessary danger by transiting while safety cannot be assured. Brent spiked about <strong className="text-white">6% to near $80</strong> as the fighting resumed, round-tripped to about <strong className="text-white">$76</strong> by Friday, then jumped back above <strong className="text-white">$79</strong> at Monday&rsquo;s open and above <strong className="text-white">$85</strong> by Tuesday.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          A fresh <strong className="text-white">JMIC advisory (013-26, 10 July)</strong> keeps the threat level at{' '}
          <strong className="text-red-300">&ldquo;severe&rdquo;</strong> but stresses the strait stays open: the
          southern transit route has been <strong className="text-white">expanded and remains available to all
          traffic</strong>, coordination with NAVCENT&rsquo;s NCAGS is offered but not mandatory, and — pointedly —{' '}
          <strong className="text-white">&ldquo;there is no controlling authority regulating passage or fee required
          for any route.&rdquo;</strong> US NAVCENT added that <strong className="text-white">&ldquo;no nation has the
          authority to close or control the Strait of Hormuz,&rdquo;</strong> with US forces prepared to defend
          freedom of navigation. Mariners are warned of a mine-danger area in the traditional traffic-separation
          scheme and to expect VHF hailing from naval forces.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          War-risk insurance underlines the caution. Marsh, the world&rsquo;s largest marine broker, says premiums to
          transit Hormuz now run <strong className="text-white">2–6% of a vessel&rsquo;s value</strong> — up from a
          fraction of a percent before the war, having peaked near <strong className="text-white">10%</strong> at the
          height of the fighting (large no-claim discounts often trim the headline rate). Brokers report{' '}
          <strong className="text-white">fewer requests for quotes</strong> since the ceasefire frayed this week,
          though cover remains available (Bloomberg, 9 Jul). The Lloyd&rsquo;s Joint War Committee has listed the
          whole Gulf as high-risk since March — a listing that adds cost and a notification duty but does not bar
          transit.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          On a second front, Ukraine&rsquo;s drone forces say they hit <strong className="text-white">21 Russian
          vessels</strong> — mostly tankers — in the Sea of Azov over 72 hours, choking fuel supplies to occupied
          Crimea; maritime-security firm <strong className="text-white">Ambrey</strong> calls it the war&rsquo;s
          largest such wave and warns of likely Russian retaliation within days. Eight ships have been named and
          matched on the Equasis registry (Seatrade / Ambrey). It remains Ukraine&rsquo;s count — Russia has
          acknowledged fewer.
        </p>
        <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
          Sources: Reuters, WSJ, Bloomberg, JMIC 013-26, NAVCENT/NCAGS, Lloyd&rsquo;s JWC, IMO, CENTCOM, UKMTO. Available footage and Tier-1 reporting attribute the
          &ldquo;cancer&rdquo; remark to Iran&rsquo;s government and leadership — not the Iranian people, and not a
          call for their eradication.
        </p>
      </div>

      {/* Hormuz recovery tracker — dedicated view of the flagship chokepoint */}
      {portwatch && <HormuzThroughputPanel data={portwatch} />}

      {/* Hormuz force posture — sourced US/Iran order of battle (reported, not live positions) */}
      <HormuzPosturePanel />

      {/* Live chokepoint transit monitor — IMF PortWatch daily transits vs baseline */}
      {portwatch && <ChokepointTransitPanel data={portwatch} />}

      {/* Port oil-flow monitor — IMF PortWatch daily tanker volumes vs baseline */}
      {portFlows && <PortFlowPanel data={portFlows} site="euro" />}

      {/* Europe Replacement Barrel Tracker — EuroOilWatch only */}
      {portFlows && <EuropeBarrelTracker data={portFlows} />}

      {/* Crude import origins — which barrels feed Europe, by supplier (Eurostat) */}
      {euCrude && <CrudeImportSankey data={euCrude} />}

      {/* Tanker activity — Phase 1: live counts, baselines accumulating */}
      <TankerActivity />

      {/* Live sea-state panel — chokepoint conditions from Open-Meteo */}
      {seaState && (
        <SeaStatePanel
          data={seaState}
          only={['hormuz','bab-el-mandeb','suez-approaches','english-channel','skagerrak']}
        />
      )}

      {/* War-Risk Watch — editorial Lloyd's / JWC indicator */}
      <WarRiskWatchPanel />

      {/* Status summary bar */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">
          Current Route Status — {new Date(statusAsOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex flex-wrap gap-3">
          {chokepoints.map(c => {
            const s = RISK_STYLES[c.risk];
            return (
              <a
                key={c.id}
                href={`#${c.id}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition hover:opacity-80 ${s.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                {c.name}
              </a>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Status reflects current editorial assessment based on publicly available information.
          Risk levels: <span className="text-green-400">Normal</span> · <span className="text-yellow-400">Elevated</span> · <span className="text-orange-400">High</span> · <span className="text-red-400">Critical</span>
        </p>
      </div>

      {/* GDACS Live Risk Signals */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase">
              Live Risk Signals — Past 24h
            </h2>
          </div>
          <a
            href="https://www.gdacs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-600 hover:text-gray-400 transition"
          >
            Source: GDACS →
          </a>
        </div>

        {gdacsEvents.length === 0 ? (
          <div className="px-5 py-4 text-xs text-gray-600">
            No significant alerts in the past 24 hours, or feed unavailable.
          </div>
        ) : (
          <div className="divide-y divide-oil-800/40">
            {redEvents.length > 0 && redEvents.map(e => (
              <GDACSEventRow key={e.id} event={e} />
            ))}
            {orangeEvents.length > 0 && orangeEvents.map(e => (
              <GDACSEventRow key={e.id} event={e} />
            ))}
            {greenEvents.length > 0 && (
              <>
                {greenEvents.length > 0 && (redEvents.length > 0 || orangeEvents.length > 0) && (
                  <div className="px-5 py-1.5 bg-oil-900/40">
                    <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
                      Green alerts — oil-relevant regions
                    </p>
                  </div>
                )}
                {greenEvents.map(e => (
                  <GDACSEventRow key={e.id} event={e} />
                ))}
              </>
            )}
          </div>
        )}

        <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
          <p className="text-[10px] text-gray-600">
            GDACS (Global Disaster Alerting Coordination System) — UN/EC automated alerts for geophysical and weather events.
            Red/Orange alerts shown globally. Green alerts shown only for countries with direct relevance to EU oil supply routes.
          </p>
        </div>
      </div>

      {/* USGS Seismic Signals */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌍</span>
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase">
              Seismic Signals — M5.0+ Past 7 Days
            </h2>
          </div>
          <a
            href="https://earthquake.usgs.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-600 hover:text-gray-400 transition"
          >
            Source: USGS →
          </a>
        </div>

        {usgsQuakes.length === 0 ? (
          <div className="px-5 py-4 text-xs text-gray-600">
            No M5.0+ earthquakes in oil-relevant regions in the past 7 days, or feed unavailable.
          </div>
        ) : (
          <div className="divide-y divide-oil-800/40">
            {usgsQuakes.map(q => <USGSQuakeRow key={q.id} quake={q} />)}
          </div>
        )}

        <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
          <p className="text-[10px] text-gray-600">
            M5.0+ earthquakes near oil infrastructure regions: Middle East &amp; Gulf, North Africa, Caspian, Caucasus, North Sea, Southern Europe.
            Shallow quakes (&lt;70km) near refineries or pipelines carry highest operational risk.
          </p>
        </div>
      </div>

      {/* Refinery Health Watch — full panel via shared component */}
      <RefineryHealthPanel
        data={firmsResult}
        mode="full"
        anchorId="refinery-health"
        regionLabel="24 major EU and Gulf refineries / terminals"
      />


      {/* Bunker Fuel Prices */}
      {bunker && (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-oil-800/60">
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
              Bunker Fuel Prices
            </h2>
            <a href="https://shipandbunker.com/prices" target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-gray-600 hover:text-gray-400 transition">
              Ship & Bunker →
            </a>
          </div>
          <div className="divide-y divide-oil-800/40">
            {bunker.ports.map(p => (
              <div key={p.code} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div className="min-w-[130px]">
                  <span className="text-sm font-semibold text-white">{p.name}</span>
                  <span className="ml-2 text-[10px] text-gray-500 font-mono">{p.code}</span>
                  <div className="text-[10px] text-gray-500 mt-0.5">{p.region}</div>
                </div>
                <div className="flex gap-6 flex-1">
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">VLSFO</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-mono font-semibold text-white">${p.vlsfo}</span>
                      <span className="text-[10px] text-gray-500">/mt</span>
                      {p.vlsfoChange !== 0 && (
                        <span className={`text-[10px] font-mono ${p.vlsfoChange > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {p.vlsfoChange > 0 ? '▲' : '▼'} {Math.abs(p.vlsfoChange).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 mb-0.5">MGO</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-mono font-semibold text-white">${p.mgo}</span>
                      <span className="text-[10px] text-gray-500">/mt</span>
                      {p.mgoChange !== 0 && (
                        <span className={`text-[10px] font-mono ${p.mgoChange > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {p.mgoChange > 0 ? '▲' : '▼'} {Math.abs(p.mgoChange).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block flex-1 text-[10px] text-gray-600 leading-relaxed self-center">
                    {p.relevance}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
            <p className="text-[10px] text-gray-600">
              <strong className="text-amber-400/80">Derived from Brent, not live market quotes.</strong> Formula: VLSFO ≈ Brent × 6.5 + 10, MGO ≈ Brent × 6.5 + 130 (basis ${bunker.brentBasis}/bbl).
              During supply disruptions, real physical bunker prices for prompt delivery typically run substantially higher than this — see
              {' '}<a href="https://shipandbunker.com" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:text-oil-300 underline">Ship & Bunker</a> or
              {' '}<a href="https://www.bunkerindex.com" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:text-oil-300 underline">Bunker Index</a> for actual market quotes.
              VLSFO = IMO 2020 compliant very low sulphur fuel oil. MGO = marine gas oil (ECA-grade).
            </p>
          </div>
        </div>
      )}

      {bunkerHistory && <BunkerHistoryChart entries={bunkerHistory} />}

      <AraStocksCard />

      {/* MARAD Maritime Advisories */}
      {marad && marad.advisories.length > 0 && (() => {
        const severityStyles = {
          critical: { bar: 'bg-red-500',    badge: 'bg-red-900/50 border-red-700/50 text-red-300' },
          high:     { bar: 'bg-orange-500', badge: 'bg-orange-900/50 border-orange-700/50 text-orange-300' },
          elevated: { bar: 'bg-amber-500',  badge: 'bg-amber-900/50 border-amber-700/50 text-amber-300' },
          normal:   { bar: 'bg-gray-500',   badge: 'bg-gray-800/50 border-gray-600/50 text-gray-400' },
        };
        const current = marad.advisories.filter(a => a.year >= 2026);
        const older   = marad.advisories.filter(a => a.year < 2026);
        return (
          <div className="rounded-xl border border-oil-700 bg-oil-900/40 overflow-hidden">
            <div className="px-5 py-4 border-b border-oil-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">US Maritime Security Advisories</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  MARAD active advisories relevant to EU supply routes · Updated {new Date(marad.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <a href="https://www.maritime.dot.gov/msci-advisories" target="_blank" rel="noopener noreferrer"
                className="text-xs text-oil-400 hover:text-white transition flex-shrink-0 ml-4">
                All advisories →
              </a>
            </div>
            <div className="divide-y divide-oil-800/40">
              {[...current, ...older].map(a => {
                const s = severityStyles[a.severity];
                return (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-oil-800/30 transition group">
                    <div className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${s.bar}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${s.badge}`}>
                          {a.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-gray-600">{a.id}</span>
                        {a.year >= 2026 && (
                          <span className="text-[10px] bg-oil-800 text-oil-300 px-1.5 py-0.5 rounded border border-oil-700">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-200 group-hover:text-white transition truncate">{a.region}</p>
                      <p className="text-xs text-gray-500 truncate">{a.incident}</p>
                    </div>
                    <span className="text-gray-600 group-hover:text-gray-400 text-xs flex-shrink-0 mt-1">↗</span>
                  </a>
                );
              })}
            </div>
            <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
              <p className="text-[10px] text-gray-600">
                Source: <a href="https://www.maritime.dot.gov/msci-advisories" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">US Maritime Administration (MARAD)</a>.
                Filtered for regions relevant to EU fuel supply. Full advisory text on MARAD site.
              </p>
            </div>
          </div>
        );
      })()}

      {/* CREA Energy Research */}
      {crea && crea.articles.length > 0 && (
        <div className="rounded-xl border border-oil-700 bg-oil-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-oil-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Energy Research — CREA</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Russian fossil fuel exports, Hormuz impacts &amp; EU supply analysis · Updated {new Date(crea.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <a href="https://energyandcleanair.org" target="_blank" rel="noopener noreferrer"
              className="text-xs text-oil-400 hover:text-white transition flex-shrink-0 ml-4">
              All research →
            </a>
          </div>
          <div className="divide-y divide-oil-800/40">
            {crea.articles.map((a, i) => {
              const tagStyles: Record<string, string> = {
                'Hormuz':          'bg-red-900/50 border-red-700/50 text-red-300',
                'Russian Exports': 'bg-orange-900/50 border-orange-700/50 text-orange-300',
                'Sanctions':       'bg-purple-900/50 border-purple-700/50 text-purple-300',
                'LNG':             'bg-blue-900/50 border-blue-700/50 text-blue-300',
                'Analysis':        'bg-oil-800/60 border-oil-600/50 text-gray-400',
              };
              const tagStyle = tagStyles[a.tag] ?? tagStyles['Analysis'];
              return (
                <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-oil-800/30 transition group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tagStyle}`}>
                        {a.tag}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-200 group-hover:text-white transition leading-snug">{a.title}</p>
                  </div>
                  <span className="text-gray-600 group-hover:text-gray-400 text-xs flex-shrink-0 mt-1">↗</span>
                </a>
              );
            })}
          </div>
          <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
            <p className="text-[10px] text-gray-600">
              Source: <a href="https://energyandcleanair.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">Centre for Research on Energy and Clean Air (CREA)</a>.
              Independent research on fossil fuel trade flows, sanctions enforcement, and energy transition.
            </p>
          </div>
        </div>
      )}

      {/* High risk */}
      {highRisk.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Active Disruption Risk</h2>
          {highRisk.map(c => <ChokepointCard key={c.id} chokepoint={c} />)}
        </div>
      )}

      {/* Elevated */}
      {elevated.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Elevated — Worth Monitoring</h2>
          {elevated.map(c => <ChokepointCard key={c.id} chokepoint={c} />)}
        </div>
      )}

      {/* Normal */}
      {normal.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Normal Conditions</h2>
          {normal.map(c => <ChokepointCard key={c.id} chokepoint={c} />)}
        </div>
      )}

      {/* Live tanker map CTA */}
      <a
        href="/supply/map"
        className="flex items-center justify-between gap-4 rounded-lg border border-oil-700 bg-oil-900/40 px-5 py-4 hover:border-oil-500 hover:bg-oil-900/60 transition group"
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-oil-800/60 border border-oil-700 flex items-center justify-center text-xl">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-white group-hover:text-oil-300 transition">
                Live Tanker Map — European Waters
              </p>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 border border-red-800/50">LIVE</span>
            </div>
            <p className="text-xs text-gray-500">
              Real-time AIS positions across the North Sea, Mediterranean, Baltic, and Suez approaches
            </p>
          </div>
        </div>
        <span className="text-oil-400 text-sm flex-shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
      </a>

      {/* Editorial note */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 text-xs text-gray-500 space-y-2">
        <p className="font-medium text-gray-400">About this page</p>
        <p>
          This page provides an editorial assessment of key oil supply routes and their current status.
          Flow volumes are approximate figures from IEA and EIA public data. Risk assessments reflect
          publicly available information and are updated periodically — this is not a live or automated feed.
        </p>
        <p>
          For authoritative data, see the{' '}
          <a href="https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">EIA World Oil Transit Chokepoints</a>
          {' '}and the{' '}
          <a href="https://www.iea.org" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">IEA</a>.
        </p>
        <p>For UK-specific fuel reserve data, see <a href="https://ukoilwatch.com" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">UKOilWatch →</a></p>
      </div>

    </div>
  );
}

function ChokepointCard({ chokepoint: c }: { chokepoint: Chokepoint }) {
  const s = RISK_STYLES[c.risk];

  return (
    <div id={c.id} className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-oil-800/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
              <h3 className="text-base font-semibold text-white">{c.name}</h3>
            </div>
            <p className="text-xs text-gray-500">{c.region}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${s.badge}`}>
              {c.riskLabel}
            </span>
            <span className="text-xs px-2 py-0.5 rounded border border-oil-800 text-gray-400 bg-oil-900/40">
              {RELEVANCE_LABEL[c.euRelevance]}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Daily flow</p>
            <p className="text-lg font-bold text-white font-mono">{c.dailyFlow} <span className="text-xs font-normal text-gray-400">mb/d</span></p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Location</p>
            <p className="text-xs text-gray-400 max-w-xs">{c.coords}</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">{c.summary}</p>

        <div className="rounded bg-oil-900/50 border border-oil-800/50 px-4 py-3">
          <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider mb-1">EU Impact</p>
          <p className="text-xs text-gray-300 leading-relaxed">{c.euImpact}</p>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">{c.context}</p>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-oil-800/40">
          <div className="flex flex-wrap gap-3">
            {c.sources.map(src => (
              <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs text-oil-400 hover:underline">
                {src.label} →
              </a>
            ))}
          </div>
          <p className="text-[10px] text-gray-600">
            Reviewed {new Date(c.lastReviewed).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

function GDACSEventRow({ event: e }: { event: import('@/lib/gdacs').GDACSEvent }) {
  const ALERT_STYLES: Record<GDACSAlertLevel, string> = {
    Red:    'bg-red-900/30 text-red-300 border-red-800/60',
    Orange: 'bg-orange-900/30 text-orange-300 border-orange-800/60',
    Green:  'bg-green-900/30 text-green-300 border-green-800/60',
  };

  const icon = EVENT_TYPE_ICONS[e.eventType] ?? '⚠️';
  const typeLabel = EVENT_TYPE_LABELS[e.eventType] ?? e.eventType;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(e.date).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'just now';
    if (h === 1) return '1h ago';
    return `${h}h ago`;
  })();

  return (
    <a
      href={e.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-5 py-3 hover:bg-oil-800/20 transition group"
    >
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${ALERT_STYLES[e.alertLevel]}`}>
            {e.alertLevel}
          </span>
          <span className="text-[10px] text-gray-500">{typeLabel}</span>
          {e.country && (
            <span className="text-[10px] text-gray-500">· {e.country}</span>
          )}
          <span className="text-[10px] text-gray-600">{timeAgo}</span>
        </div>
        <p className="text-xs text-gray-300 group-hover:text-white transition leading-snug">{e.title}</p>
        {e.severity && (
          <p className="text-[10px] text-gray-600 mt-0.5">{e.severity}</p>
        )}
      </div>
      <span className="text-gray-600 text-xs flex-shrink-0 group-hover:text-oil-400 transition">→</span>
    </a>
  );
}


function USGSQuakeRow({ quake: q }: { quake: import('@/lib/usgs').USGSQuake }) {
  const severity = q.alert ?? magSeverity(q.magnitude);
  const SEVERITY_STYLES: Record<string, string> = {
    red:    'bg-red-900/30 text-red-300 border-red-800/60',
    orange: 'bg-orange-900/30 text-orange-300 border-orange-800/60',
    yellow: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/60',
    green:  'bg-green-900/30 text-green-300 border-green-800/60',
    gray:   'bg-oil-800/40 text-gray-400 border-oil-700/60',
  };

  const depth = q.coordinates[2];
  const depthNote = depth < 70 ? `${Math.round(depth)}km shallow` : `${Math.round(depth)}km deep`;

  const timeAgo = (() => {
    const diff = Date.now() - q.time;
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(h / 24);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    if (d === 1) return '1d ago';
    return `${d}d ago`;
  })();

  return (
    <a
      href={q.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-5 py-3 hover:bg-oil-800/20 transition group"
    >
      <span className={`flex-shrink-0 mt-0.5 text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${SEVERITY_STYLES[severity]}`}>
        M{q.magnitude.toFixed(1)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="text-[10px] text-gray-400">{q.region}</span>
          <span className="text-[10px] text-gray-600">· {depthNote} · {timeAgo}</span>
          {q.tsunami && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-blue-900/30 text-blue-300 border-blue-800/60">
              tsunami
            </span>
          )}
        </div>
        <p className="text-xs text-gray-300 group-hover:text-white transition leading-snug">{q.place}</p>
      </div>
      <span className="text-gray-600 text-xs flex-shrink-0 group-hover:text-oil-400 transition">→</span>
    </a>
  );
}
