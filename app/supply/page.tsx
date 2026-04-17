import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { getGDACSEvents, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '@/lib/gdacs';
import type { GDACSAlertLevel } from '@/lib/gdacs';
import { getUSGSQuakes, magSeverity } from '@/lib/usgs';
import { getFIRMSDetections, frpSeverity } from '@/lib/firms';

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
    riskLabel: 'Critical — near-standstill traffic',
    dailyFlow: '~20',
    euRelevance: 'indirect',
    coords: 'Between Iran and Oman, connecting Persian Gulf to Arabian Sea',
    summary:
      'The world\'s most critical oil chokepoint is in active disruption. Traffic has fallen to a small fraction of normal levels, with only a handful of vessels transiting and major operators suspending Gulf loadings. Iran is effectively controlling passage conditions. The ~20 mb/d that normally flows through the strait — around 20% of global oil trade — is severely constrained.',
    euImpact:
      'The global price shock from Hormuz disruption is actively under way. Asian buyers displaced from Gulf supply are competing directly with EU refiners for Atlantic Basin, North Sea, and West African barrels, driving record crude premiums. EU refiners dependent on Middle Eastern feedstocks face immediate cost increases. The disruption is compounding the existing Red Sea crisis, simultaneously closing the two routes that carry the majority of EU-bound crude from the Gulf.',
    context:
      'Bypass routes no longer provide meaningful relief. Saudi Arabia\'s East-West Pipeline capacity has been reduced by attacks on Saudi output; the UAE\'s ADCO pipeline cannot absorb displaced volumes at scale. IEA coordinated strategic reserve releases are under active consideration. The disruption is geopolitically linked to the Houthi/Red Sea crisis — both stem from the same regional conflict, creating a compound supply shock.',
    lastReviewed: '2026-04-10',
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
      'The Suez Canal carries around 5.5 mb/d of oil and petroleum products plus significant LNG volumes. Red Sea avoidance by commercial tankers has kept Canal transit volumes far below pre-disruption levels since late 2023. Cape of Good Hope diversion is now the operating norm for Gulf-to-Europe cargoes, and simultaneous Hormuz disruption has compounded the pressure on European supply chains.',
    euImpact:
      'Europe\'s exposure is now acute: Cape routing adds 10–14 days and substantial cost to Middle Eastern cargo journeys, while Hormuz disruption has simultaneously constrained the volume of Gulf crude and products available for export. EU refiners in Eastern Europe and the Mediterranean with limited domestic alternatives are facing the sharpest margin and availability pressure. The compound effect of these two simultaneous disruptions is unlike any previous supply shock.',
    context:
      'The Sumed pipeline can carry approximately 2.5 mb/d of crude as a bypass but not refined products. EU member states have largely adapted sourcing to Atlantic Basin suppliers, but at sustained higher cost. A Houthi ceasefire is the necessary condition for Red Sea/Suez recovery; Hormuz normalisation requires a separate political resolution.',
    lastReviewed: '2026-04-10',
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
      'The southern entrance to the Red Sea remains actively disrupted by Houthi attacks since November 2023. Around 4.5 mb/d of oil and products normally transits this route; daily traffic through Bab-el-Mandeb and Suez Canal remains far below pre-attack levels. This disruption now forms part of a wider compound crisis alongside the Hormuz near-standstill — both geopolitically linked.',
    euImpact:
      'ARA-bound cargoes from the Middle East continue to route via the Cape of Good Hope, adding 30+ days versus the Red Sea route. The simultaneous Hormuz disruption has compounded the effect: two of the three most important tanker corridors for EU crude and product supply are now simultaneously impaired. Eastern European states with fewer domestic supply alternatives and countries dependent on Middle Eastern diesel are most acutely affected.',
    context:
      'Operation Prosperity Guardian has not restored commercial transit confidence. Insurance premiums for Red Sea passage remain prohibitive. The Houthi threat and Hormuz disruption share geopolitical roots in the same regional conflict, making a coordinated resolution difficult. Compound supply shocks of this kind are unprecedented in the post-2000 era.',
    lastReviewed: '2026-04-10',
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
      'The South China Sea does not sit on the primary EU supply route, but its disruption feeds into European fuel markets through displaced demand. If Chinese and East Asian buyers are unable to secure normal Gulf supply volumes via this corridor, they compete more aggressively for Atlantic Basin, West African, and North Sea cargoes — the same pool EU refiners draw on. This demand displacement mechanism is already active via the Hormuz disruption; a simultaneous South China Sea constraint compounds the squeeze on Atlantic Basin crude availability and supports higher prices for European buyers.',
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
      'ARA is the clearing hub for European diesel, petrol, and jet fuel. Prices at ARA set the reference for fuel costs across Northwest Europe and influence prices as far east as Poland and the Baltic states. Reduced tanker arrivals at ARA — a likely consequence of both Hormuz and Red Sea disruptions tightening Atlantic Basin cargo availability — typically precede price rises within 2–3 weeks. The Antwerp spill incident (10 April) may cause short-term delays; the structural supply picture depends on incoming cargo volumes.',
    context:
      'ARA commercial storage acts as a buffer for European supply disruptions. Tanker arrivals at Rotterdam are a leading indicator of fuel availability. ARA stock levels are published weekly by Insights Global and monitored closely by energy traders. In the current environment, ARA stock drawdown is the key metric to watch for early signs of downstream tightness.',
    lastReviewed: '2026-04-10',
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

export default async function SupplyPage() {
  const highRisk = CHOKEPOINTS.filter(c => c.risk === 'critical' || c.risk === 'high');
  const elevated = CHOKEPOINTS.filter(c => c.risk === 'elevated');
  const normal   = CHOKEPOINTS.filter(c => c.risk === 'normal');

  const [gdacsEvents, usgsQuakes, firmsResult] = await Promise.all([
    getGDACSEvents(),
    getUSGSQuakes(),
    getFIRMSDetections(),
  ]);

  const bunker = readBunker();
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
          Updated editorially — not a live tracker.
        </p>
      </div>

      {/* Status summary bar */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">
          Current Route Status — {new Date('2026-04-16').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex flex-wrap gap-3">
          {CHOKEPOINTS.map(c => {
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

      {/* FIRMS Thermal Anomalies */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔥</span>
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase">
              Thermal Anomalies — Major Refineries &amp; Terminals
            </h2>
          </div>
          <a
            href="https://firms.modaps.eosdis.nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-600 hover:text-gray-400 transition"
          >
            Source: NASA FIRMS →
          </a>
        </div>

        {firmsResult.status === 'no_key' ? (
          <div className="px-5 py-4 space-y-1">
            <p className="text-xs text-gray-500">FIRMS API key not configured.</p>
            <p className="text-[10px] text-gray-600">
              Register free at{' '}
              <a href="https://firms.modaps.eosdis.nasa.gov/api/area/" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">
                firms.modaps.eosdis.nasa.gov/api/area
              </a>
              {' '}— set <span className="font-mono">FIRMS_MAP_KEY</span> in <span className="font-mono">.env.local</span> and in GitHub secrets.
            </p>
          </div>
        ) : firmsResult.status === 'error' ? (
          <div className="px-5 py-4 text-xs text-gray-600">Feed temporarily unavailable.</div>
        ) : firmsResult.detections.length === 0 ? (
          <div className="px-5 py-4 text-xs text-gray-600">
            No thermal anomalies detected near major refineries or terminals in the past 24 hours.
          </div>
        ) : (
          <div className="divide-y divide-oil-800/40">
            {firmsResult.detections.map(d => <FIRMSDetectionRow key={d.id} detection={d} />)}
          </div>
        )}

        <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
          <p className="text-[10px] text-gray-600">
            NASA FIRMS VIIRS satellite detections within ~15km of 24 major EU and Gulf refineries/terminals. Past 24h.
            FRP (Fire Radiative Power) indicates intensity — high FRP near a facility may indicate flaring, fire, or process incident.
            Not all detections indicate incidents; flaring is routine.
          </p>
        </div>
      </div>

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
              Estimated from Brent crude benchmark (${bunker.brentBasis}/bbl). VLSFO = IMO 2020 compliant very low sulphur fuel oil. MGO = marine gas oil (ECA-grade).
              For exact market prices: <a href="https://shipandbunker.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">Ship & Bunker</a>, Platts.
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

function FIRMSDetectionRow({ detection: d }: { detection: import('@/lib/firms').FIRMSDetection }) {
  const severity = frpSeverity(d.frp);
  const SEVERITY_STYLES: Record<string, string> = {
    red:    'bg-red-900/30 text-red-300 border-red-800/60',
    orange: 'bg-orange-900/30 text-orange-300 border-orange-800/60',
    yellow: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/60',
    gray:   'bg-oil-800/40 text-gray-400 border-oil-700/60',
  };

  const timeLabel = (() => {
    const [h, m] = [d.acqTime.slice(0, 2), d.acqTime.slice(2)];
    return `${d.acqDate} ${h}:${m} UTC`;
  })();

  return (
    <a
      href={`https://firms.modaps.eosdis.nasa.gov/map/#d:${d.acqDate};@${d.longitude},${d.latitude},10z`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-5 py-3 hover:bg-oil-800/20 transition group"
    >
      <span className={`flex-shrink-0 mt-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${SEVERITY_STYLES[severity]}`}>
        {d.frp.toFixed(0)} MW
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="text-[10px] text-gray-400">{d.refinery}</span>
          <span className="text-[10px] text-gray-600">
            · {d.confidence === 'h' ? 'high confidence' : 'nominal'} · {d.daynight === 'D' ? 'daytime' : 'night'} · {timeLabel}
          </span>
        </div>
        <p className="text-xs text-gray-500 group-hover:text-gray-300 transition">
          {d.latitude.toFixed(3)}°, {d.longitude.toFixed(3)}°
        </p>
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
