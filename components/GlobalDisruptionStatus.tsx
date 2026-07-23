/**
 * GlobalDisruptionStatus — prominent top-of-dashboard status board.
 *
 * Replaces the single-headline DisruptionBanner with the full convergent picture:
 * energy, shipping and food-security risks colour-coded by severity. Figures are
 * verified/attributed; the Hormuz count uses JMIC's 12–15 July advisory (not an
 * unverified daily tally). Pairs with the "From Hormuz to the Checkout" analysis below.
 */

type Severity = 'critical' | 'elevated';

interface Row {
  sev: Severity;
  label: string;
  body: string;
}

const ROWS: Row[] = [
  {
    sev: 'critical',
    label: 'Strait of Hormuz — severe disruption',
    body: 'Kpler recorded only about four commodity-vessel crossings on Monday, with no visible VLCC or LNG-carrier passage; JMIC logged 4–13 a day between 12 and 15 July against a ~138 norm, and every carrier that crosses now runs with transponders off, so visible counts understate real movement. JMIC assesses deliberate hostile action as highly likely (SEVERE). The attacks are now sustained: UKMTO reports two tankers abandoned by their crews within 24 hours after projectile strikes off Oman — the latest about eight nautical miles north-east of Limah — while Dynacom confirmed two of its managed vessels were hit off the Omani coast, one of them abandoned. Crews reached lifeboats; no injuries or environmental impact have been reported, and not every vessel has been officially identified. India has barred its seafarers from Hormuz voyages.',
  },
  {
    sev: 'critical',
    label: 'Middle East conflict — regional retaliation',
    body: 'The war has crossed into US fatalities and Gulf oil infrastructure. An Iranian strike on a base in Jordan killed two US service members (one missing) — the first American deaths since March, taking the toll to 16 killed and 430+ wounded — and a further service member has since reportedly died in Iraq during the controlled detonation of a downed Iranian drone. The US has now run twelve consecutive nights of strikes on command centres, air defences, coastal surveillance, launch sites and communications networks; Iran has answered with attacks on Bahrain and Kuwait. Iran’s barrage on Kuwait widened to an offshore Kuwait Oil Company drilling platform, border posts and the airport, on top of the KPC oil facility already hit (IRGC: "15th wave of Operation Nasr 2"). Saudi Arabia issued shelter warnings for Al-Kharj and Yanbu — reportedly an Iranian missile, the first on the kingdom in three months, though Riyadh has not confirmed the cause and the danger later passed. No confirmed strike on Yanbu itself — the Red Sea bypass — but its appearance in the target set is the escalation to watch.',
  },
  {
    sev: 'critical',
    label: 'Red Sea & Bab el-Mandeb — Saudi-port embargo declared',
    body: 'Not confirmed closed, but the earlier "armed but not active" reading no longer holds. On 21 July the Houthis emailed shipowners warning that their embargo covers not just Saudi-flagged vessels but all ships calling at Saudi ports, which "may be subject to targeting" anywhere within reach of the Yemeni armed forces (Bloomberg). That directly threatens Yanbu — the Red Sea hub Saudi Arabia has leaned on, via its east–west pipeline, to keep crude moving while Hormuz is near-halted. A simultaneous Hormuz-and-Red-Sea disruption would hit the main Gulf route and its main alternative at once. It is already biting without a physical blockade: Reuters reported that at least three Saudi-crude tankers — the VLCCs Xin Long Yang and New Prime and the tanker Rodos — reversed course on 21 July rather than pass the Yemeni coast, diverting toward Suez, while war-risk insurance for Saudi-port callers repriced within 24 hours (Ambrey rates them high risk). A Saudi-led coalition says it has begun protective measures at Bab el-Mandeb, and Yanbu is still loading ships already inside the Red Sea or arriving via Suez — so this is rerouting and cost, not shutdown. Brokers note it could even push more Yanbu crude toward Europe on the shorter Suez/Med haul while lengthening Asia’s supply lines.',
  },
  {
    sev: 'critical',
    label: 'Oil products — tighter than crude',
    body: 'Brent is trading near $96 (about $95.93, up ~2%; Reuters had $96.49 at 06:40 GMT) — up more than 30% this month — as the two-chokepoint escalation across Hormuz and the Red Sea builds; WTI is above $88. The deeper stress is still in diesel and jet. One analyst quoted by Reuters cautioned that a prolonged closure and wider war could ultimately require prices near $150 to destroy enough demand to match lost supply — explicitly not his base case. Global refinery runs are about 6 mb/d below a year ago (IEA), with Gulf export refineries slow to restart, Russian throughput damaged and Asian plants below normal rates.',
  },
  {
    sev: 'critical',
    label: 'Russian refining — major disruption',
    body: 'Repeated Ukrainian strikes have forced Russian refineries to cut or suspend runs. Russia has banned diesel exports (8–31 July). Diesel and gasoil exports fell to about 234,000 b/d in early July, against a 2025 average near 817,000 b/d (Kpler).',
  },
  {
    sev: 'critical',
    label: 'Global diesel — immediate transmission',
    body: 'The Russian collapse has pushed US diesel futures sharply higher and driven benchmark European diesel refining margins above $60/bbl. Diesel is the fast transmission channel into trucking, farming, mining, construction, shipping and backup power — product shortages can keep inflation rising even if crude stabilises.',
  },
  {
    sev: 'elevated',
    label: 'LNG — major supply loss continues',
    body: "The IEA estimates disrupted Hormuz transit has removed more than 300 million cubic metres a day of Qatar and UAE LNG since 1 March — over 2 bcm a week. Qatar's Ras Laffan complex has stayed offline since the 2 March attack, raising power and industrial costs and directly hitting ammonia and nitrogen-fertiliser production. A backlog is now building inside the Gulf: seven laden Qatari carriers were holding about 0.57 million tonnes, and S&P Global puts nearly 1.9 million tonnes of LNG tanker capacity inside the Gulf — roughly eight days of typical pre-war peak exports from the two projects. Production can continue while ships wait; once storage fills, producers may be forced to cut output. That is the next escalation to watch.",
  },
  {
    sev: 'critical',
    label: 'Sulphur & phosphate fertiliser — physical bottleneck',
    body: 'The sulphur spike has moved from the trading screen into factory operations. Sulphur is needed to make sulphuric acid and phosphate fertilisers; high prices and tight availability have pushed phosphate producers to curtail output, notably Mosaic in Brazil. This is now a supply-volume risk, not just a price rise.',
  },
  {
    sev: 'elevated',
    label: 'Chinese fertiliser controls — supply retained',
    body: 'China has tightened restrictions and customs controls on fertiliser exports to protect domestic availability. It also depends on Middle East sulphur imports, so Hormuz raises both Chinese production costs and how much Beijing is willing to release abroad.',
  },
  {
    sev: 'elevated',
    label: 'Brazil — high fertiliser exposure',
    body: 'Brazil imports about 85% of all the fertiliser it consumes and covered effectively 100% of its urea needs by imports in 2025 — around 41% of those urea imports (nearly 3 million tonnes) routed through Hormuz. It also faces high sulphur costs and phosphate curtailments; its September soybean planting is the key test of whether input disruption becomes reduced production.',
  },
  {
    sev: 'elevated',
    label: 'Mexico — US food-system transmission point',
    body: 'Higher fertiliser, diesel and agrochemical costs meet rising dependence on imported corn. Lower Mexican output could hit the US from two sides — less Mexican fruit and veg moving north, more US corn moving south — pressuring US produce prices and animal-feed costs at once.',
  },
  {
    sev: 'elevated',
    label: 'Global grain balance — margin shrinking',
    body: 'USDA projects both wheat and corn below consumption in 2026/27, with global corn ending stocks about 275 Mt — the lowest since 2013/14. Not yet a shortage, but less room to absorb another crop, trade or shipping shock.',
  },
  {
    sev: 'elevated',
    label: 'Financial transmission — leveraged equity retreating',
    body: "The first rupture marker has fired. Thirty-year US Treasury yields are back above 5% (10-year near 4.55%) as the oil shock revives inflation fears, and futures have swung toward pricing a September Fed hike as near-certain, from roughly two-thirds probability a week earlier. Bonds and equities are therefore falling together — the loss of the traditional safe haven that our pressure-cooker analysis names as the first of three markers of systemic rupture — though so far this reflects inflation repricing the rate path rather than a liquidation overwhelming the safe-haven bid. Equity stress is broadening: South Korea's chip-heavy market fell 4.1% after nearly 9% the week before, and the Philadelphia semiconductor index sits ~20% below its June record. The second marker has not fired: the yen is still near a 40-year low around 162 to the dollar, so the yen-funded carry trade has not entered forced repayment. Energy is now actively driving rate expectations while leveraged positions weaken — dangerous, but not yet global liquidation.",
  },
  {
    sev: 'critical',
    label: 'European maize — weather + input shock',
    body: 'Heat and drought have pushed French maize conditions to their lowest in at least 15 years; Coceral has cut its EU maize forecast about 8% to 52.7 Mt, potentially the smallest harvest since 2007. High fertiliser and energy costs had already trimmed planted area.',
  },
];

const LOCAL: Record<'euro' | 'uk' | 'americas', string> = {
  euro:
    'For Europe specifically: the tightest diesel balance in the system, heavy import reliance for fertiliser after losing domestic ammonia capacity, and a failing home maize crop — three exposures stacking at once.',
  uk:
    'For the UK specifically: close to half its food imported, almost no domestic fertiliser production left, and a net importer of the diesel that moves its farms, lorries and food — exposed at every link in the chain.',
  americas:
    'For the Americas specifically: the US is the system’s swing supplier, but its diesel balance is tightening and its fresh-produce and feed exposure runs directly through Mexico.',
};

const BRAND: Record<'euro' | 'uk' | 'americas', string> = {
  euro: 'EuroOilWatch',
  uk: 'UKOilWatch',
  americas: 'AmericasOilWatch',
};

export default function GlobalDisruptionStatus({
  site,
  lastUpdated = '2026-07-23',
}: {
  site: 'euro' | 'uk' | 'americas';
  lastUpdated?: string;
}) {
  const dateLabel = new Date(lastUpdated).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section
      aria-label="Global disruption status"
      className="rounded-lg border border-red-700/50 bg-red-950/20 overflow-hidden"
    >
      {/* Header band */}
      <div className="px-5 py-3.5 border-b border-red-700/40 bg-red-950/40">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-mono font-bold tracking-widest text-white uppercase">
            Global Disruption Status: <span className="text-red-400">SEVERE</span>
          </h2>
          <span className="text-[10px] font-mono text-red-300/70 uppercase tracking-widest">
            Updated {dateLabel}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-300">
          Energy, shipping and food-security risks are now converging.
        </p>
      </div>

      {/* Status rows — 2-up on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-oil-800/40">
        {ROWS.map((r) => {
          const dot = r.sev === 'critical' ? 'bg-red-500' : 'bg-amber-500';
          const labelColor = r.sev === 'critical' ? 'text-red-300' : 'text-amber-300';
          return (
            <div key={r.label} className="bg-oil-950/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${dot} shrink-0`} aria-hidden />
                <span className={`text-[11px] font-mono font-semibold uppercase tracking-wide ${labelColor}`}>
                  {r.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400 leading-relaxed">{r.body}</p>
            </div>
          );
        })}
      </div>

      {/* Assessment footer */}
      <div className="px-5 py-3.5 border-t border-red-700/40 bg-red-950/30">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="font-mono font-semibold uppercase tracking-widest text-red-300">
            {BRAND[site]} assessment —
          </span>{' '}
          This is not one isolated shortage but the convergence of war, chokepoint disruption,
          refinery damage, diesel scarcity, fertiliser restrictions, drought and narrowing grain
          reserves. Inventories, alternative routes and replacement suppliers are still preventing a
          generalised crisis — but those buffers are being consumed faster than the disrupted
          systems are being restored. {LOCAL[site]}
        </p>
      </div>
    </section>
  );
}
