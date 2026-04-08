import type { Metadata } from 'next';

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
    risk: 'elevated',
    riskLabel: 'Elevated — monitoring',
    dailyFlow: '~20',
    euRelevance: 'indirect',
    coords: 'Between Iran and Oman, connecting Persian Gulf to Arabian Sea',
    summary:
      'The world\'s most critical oil chokepoint. Roughly 20 mb/d — about 20% of global oil trade — passes through the strait, including the majority of Gulf exports from Saudi Arabia, Iraq, UAE, Kuwait, and Iran. US-Iran tensions and ceasefire negotiations create ongoing uncertainty.',
    euImpact:
      'Europe imports relatively little Gulf crude directly — the IEA estimates around 600 kb/d of Hormuz flows were routed to Europe in 2025. The primary exposure is indirect: a major Hormuz disruption triggers a global price shock and fierce competition for Atlantic Basin barrels that EU refineries normally rely on. Asian buyers losing Gulf supply immediately bid against European refiners for US, West African, and North Sea crude. Brent prices spike for all buyers regardless of direct dependence.',
    context:
      'Bypass capacity via Saudi Arabia\'s East-West Pipeline and the UAE\'s ADCO pipeline totals only 3.5–5.5 mb/d — far below normal Hormuz flows. A sustained closure would require IEA strategic reserve releases, demand destruction, and significant supply rerouting across all importing regions.',
    lastReviewed: '2026-04-08',
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
      'The Suez Canal carries around 5.5 mb/d of oil and petroleum products plus significant LNG volumes. Houthi attacks on Red Sea shipping since late 2023 have forced widespread rerouting via the Cape of Good Hope, adding 10–14 days of transit time and substantial freight costs.',
    euImpact:
      'Europe is more exposed to Suez disruption than the US because it relies heavily on Middle Eastern and Asian refined products arriving via this route. Diesel and jet fuel imports from Gulf and Asian refineries have been affected by rerouting since late 2023, contributing to tight European diesel markets. Higher freight rates feed directly into import costs for EU refiners and fuel wholesalers. Countries with less domestic refining capacity — including several Eastern European states — are most exposed.',
    context:
      'The Sumed pipeline running parallel through Egypt can carry approximately 2.5 mb/d of crude as a bypass, but not refined products. Several EU member states have adapted sourcing patterns to reduce Red Sea exposure, shifting towards Atlantic Basin, North Sea, and US suppliers — but at higher cost.',
    lastReviewed: '2026-04-08',
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
      'The southern entrance to the Red Sea. Houthi forces have been targeting commercial shipping here since November 2023, forcing widespread rerouting. Around 4.5 mb/d of oil and products normally transits this route. Most major tanker operators now classify the strait as high-risk.',
    euImpact:
      'The effective closure of Bab-el-Mandeb to many commercial tankers has had significant consequences for European fuel supply chains. Cargoes from the Middle East and Asia that would previously have taken 15–20 days to reach ARA (Amsterdam-Rotterdam-Antwerp) now take 30+ days via the Cape of Good Hope. This has tightened European diesel and jet fuel availability and raised import costs. Countries dependent on Middle Eastern diesel imports have been most affected.',
    context:
      'The US-led Operation Prosperity Guardian has provided some naval protection but attacks have continued. Rerouting via the Cape adds approximately 3,500 nautical miles and significant fuel and time costs. Insurance premiums for vessels transiting the area remain highly elevated. No political resolution is in sight.',
    lastReviewed: '2026-04-08',
    sources: [
      { label: 'EIA — Bab-el-Mandeb', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
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
      'The Amsterdam-Rotterdam-Antwerp (ARA) complex is Europe\'s largest refining and oil storage hub, handling around 4 mb/d of crude and products. It acts as the primary pricing and distribution point for Northwest European fuel markets. Rotterdam alone is the world\'s largest port by cargo volume.',
    euImpact:
      'ARA is effectively the clearing hub for European diesel, petrol, and jet fuel. Prices at ARA set the reference for fuel costs across Northwest Europe and significantly influence prices as far east as Poland and the Baltic states. Any disruption to ARA operations — whether from extreme weather, infrastructure failure, or labour action — would affect fuel availability and pricing across the entire region. The EU\'s Diesel benchmark is priced at ARA.',
    context:
      'ARA storage tanks hold significant commercial stocks that act as a buffer for European supply. Tanker arrivals at Rotterdam are a leading indicator for European fuel availability — reduced arrivals typically precede price rises within 2–3 weeks. ARA stock levels are published weekly by Insights Global and monitored closely by energy traders.',
    lastReviewed: '2026-04-08',
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

export default function SupplyPage() {
  const highRisk = CHOKEPOINTS.filter(c => c.risk === 'critical' || c.risk === 'high');
  const elevated = CHOKEPOINTS.filter(c => c.risk === 'elevated');
  const normal   = CHOKEPOINTS.filter(c => c.risk === 'normal');

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
          Current Route Status — {new Date('2026-04-08').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
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

      {/* Editorial note */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 text-xs text-gray-500 space-y-2">
        <p className="font-medium text-gray-400">About this page</p>
        <p>
          This page provides an editorial assessment of key oil supply routes and their current status.
          Flow volumes are approximate figures from IEA and EIA public data. Risk assessments reflect
          publicly available information and are updated periodically — this is not a live or automated feed.
        </p>
        <p>
          For live tanker tracking, see{' '}
          <a href="https://www.marinetraffic.com" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">MarineTraffic</a>
          {' '}or{' '}
          <a href="https://www.vesselfinder.com" target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">VesselFinder</a>.
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
