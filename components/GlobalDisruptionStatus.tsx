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
    body: 'Hormuz traffic has fallen to its lowest since 7 May: only one oil tanker crossed on Thursday — the New Giant, carrying about 2 million barrels of Iraqi Basrah crude to China — and no other oil tanker entered the strait that day (Reuters), against a ~138/day norm. Every carrier that does cross runs with transponders off, so visible counts understate real movement. JMIC assesses deliberate hostile action as highly likely (SEVERE). The attacks are now sustained: UKMTO reports two tankers abandoned by their crews within 24 hours after projectile strikes off Oman — the latest about eight nautical miles north-east of Limah — while Dynacom confirmed two of its managed vessels were hit off the Omani coast, one of them abandoned. Crews reached lifeboats; no injuries or environmental impact have been reported, and not every vessel has been officially identified. India has barred its seafarers from Hormuz voyages. Over the weekend Hormuz stayed in single digits — about seven commodity vessels crossed Friday, three on Saturday (all dark) and seven on Sunday (Kpler) — so the strait has not meaningfully reopened even as oil futures fall. Traffic then thinned further: Reuters reported just five commodity vessels through the strait on Tuesday 28 July, and Tehran has rejected an Omani proposal for regional management of the waterway. A senior Iranian official confirmed to Reuters on 29 July that Tehran has ruled out Oman’s plan for joint regional management including voluntary transit fees — closing off the main diplomatic route out of an impasse that has choked Gulf trade for months. Tehran called the plan “unreasonable”: a 50-50 arrangement with Oman would not serve its interests, and Iran wants sole control of the inbound route and partial control of the outbound one — a waterway it says it controls and where it aims to collect fees. The IRGC says it retains full control of the strait and claims it struck three tankers attempting to transit by an “unauthorised route”; Washington has been directing ships to hug the Omani shore instead. The human cost is now explicit: recent Hormuz attacks killed one Indian seafarer, injured others and left one missing, and INTERTANKO is advising owners to delay transits where possible, review AIS and LRIT policies in high-risk areas — and to pay transit fees to neither Iranian nor Houthi authorities. A single passage does not equal normalisation: the QatarEnergy-controlled LNG carrier Al Areesh transited the strait overnight into 30 July after being permitted to use an Iran-designated route — the first QatarEnergy-controlled LNG tanker out of Hormuz in almost three weeks. It proves the strait is navigable by permission, not that commercial traffic has returned to anything like its former scale. Thursday’s count was two vessels — both tankers, both in ballast, both ENTERING the Gulf. That is the directional signal we said to watch (empty, load-bound tankers returning) registering for the first time — but at a scale of two it is a flicker, not a recovery, and it is inbound positioning, not exports.',
  },
  {
    sev: 'critical',
    label: 'Middle East conflict — regional retaliation',
    body: 'The war has crossed into US fatalities and Gulf oil infrastructure. An Iranian strike on a base in Jordan killed two US service members (one missing) — the first American deaths since March, taking the toll to 16 killed and 430+ wounded — and a further service member has since reportedly died in Iraq during the controlled detonation of a downed Iranian drone. The US has now run thirteen consecutive nights of strikes on command centres, air defences, coastal surveillance, launch sites and communications networks; Iran has answered with attacks on Bahrain and Kuwait. Iran’s barrage on Kuwait widened to an offshore Kuwait Oil Company drilling platform, border posts and the airport, on top of the KPC oil facility already hit (IRGC: "15th wave of Operation Nasr 2"). Saudi Arabia issued shelter warnings for Al-Kharj and Yanbu — reportedly an Iranian missile, the first on the kingdom in three months, though Riyadh has not confirmed the cause and the danger later passed. No confirmed strike on Yanbu itself — the Red Sea bypass — but its appearance in the target set is the escalation to watch. Through Sunday 26 July the US paused its strikes on Iran after thirteen consecutive nights, and no Iranian attacks on Gulf states were reported over the weekend. Washington says its naval blockade remains in force, and Trump is reportedly holding back while a China-initiated diplomatic effort continues: a political opening, not yet a ceasefire or a reopened route. Into Monday 27 July the pause held for a second consecutive day and Iran said it would hold its fire as long as the US did, with Oman and other intermediaries working to restore the interim ceasefire framework and negotiate Hormuz shipping arrangements — but the nuclear dispute is unresolved, the naval blockade still operates, and Tehran still asserts authority over strait movements. By 28–29 July the lull had broken. Saudi Arabia said its armed forces, coordinating with US Central Command, carried out joint strikes on Iran-backed groups in eastern Iraq after drones launched from Iraqi territory targeted oil facilities in the kingdom’s Eastern Province — Saudi air defences intercepted those drones and no damage to the facilities has been reported (a separate event from the Houthi strikes near Jizan on 24–25 July). CENTCOM said the groups were behind more than 30 drone attacks in 72 hours on US forces and Saudi energy infrastructure; Iraq’s Popular Mobilisation Forces said several of its headquarters were struck, reporting casualties. Iran denied involvement and Iraq ordered an investigation (Reuters). The US military separately said it intercepted Iranian ballistic missiles aimed at American forces, and Tehran rejected an Omani proposal for regional management of the strait. Reuters has since confirmed the detail: Washington and Riyadh both said they jointly struck the Iran-backed groups in retaliation for drone attacks on Saudi oil targets launched from Iraq — the first US airstrikes in the region since Trump suspended the bombing campaign after 13 days, and the first time Saudi Arabia has publicly declared participation in joint strikes, drawing the kingdom into direct combat against Iran’s proxies on a new front. Iraq’s Popular Mobilisation Forces said at least 20 of its members were killed and 32 wounded across several bases; Baghdad called an emergency meeting. Jordan said its air defences shot down five Iranian missiles — three of the four US service members killed this month died in Jordan. The two-day pause was a lull, not a settlement. The threat geography has also widened: Reuters reports regional assessments that some recent attacks on Saudi Arabia — including on oil installations in the Eastern Province, the heartland of Saudi crude production — were launched from Iraq, with Houthi personnel working alongside Iraqi Iran-aligned armed groups. That adds a third launch axis (Iran toward the Gulf, Yemen toward the south-west, now Iraq toward the Eastern Province) and puts Abqaiq, Ras Tanura, Jubail and the East–West pipeline pumping stations inside a wider threat envelope.',
  },
  {
    sev: 'critical',
    label: 'Red Sea & Bab el-Mandeb — Saudi-port embargo declared',
    body: 'Not confirmed closed, but the earlier "armed but not active" reading no longer holds. On 21 July the Houthis emailed shipowners warning that their embargo covers not just Saudi-flagged vessels but all ships calling at Saudi ports, which "may be subject to targeting" anywhere within reach of the Yemeni armed forces (Bloomberg). That directly threatens Yanbu — the Red Sea hub Saudi Arabia has leaned on, via its east–west pipeline, to keep crude moving while Hormuz is near-halted. A simultaneous Hormuz-and-Red-Sea disruption would hit the main Gulf route and its main alternative at once. It is already biting without a physical blockade: Reuters reported that at least three Saudi-crude tankers — the VLCCs Xin Long Yang and New Prime and the tanker Rodos — reversed course on 21 July rather than pass the Yemeni coast, diverting toward Suez, while war-risk insurance for Saudi-port callers repriced within 24 hours (Ambrey rates them high risk). A Saudi-led coalition says it has begun protective measures at Bab el-Mandeb, and Yanbu is still loading ships already inside the Red Sea or arriving via Suez — so this is rerouting and cost, not shutdown. Brokers note it could even push more Yanbu crude toward Europe on the shorter Suez/Med haul while lengthening Asia’s supply lines. JMIC tempers this: over 22–23 July it recorded Bab el-Mandeb traffic largely unchanged (85 transits in 48h) and had not yet observed operational enforcement of the blockade — the diversions so far are Saudi-linked cargoes, not a general halt. Routing is shifting even so: some product tankers are diverting north through Suez, and Saudi Aramco is offering additional crude from the Egyptian Mediterranean terminal of Sidi Kerir to bypass the threatened Red Sea leg (Reuters). Bloomberg adds a telling asymmetry: tankers linked to China and Russia keep crossing Bab el-Mandeb — some carrying Saudi crude — while Western owners increasingly avoid it, transit dark (the Greek Merbabu ran the strait with its transponder off, bound for India) or reroute; and a VLCC has been provisionally booked to load Egyptian crude for South Korea around the Cape of Good Hope, the first such fixture in years. And the campaign has moved onto fixed infrastructure: on 25 July Saudi air defences (Greek-operated Patriots) intercepted two ballistic missiles fired from Yemen at the Yanbu refineries, with alerts around Jizan and the ~400 kb/d Jazan complex, while the Saudi-led coalition struck Houthi military and telecom sites in Hodeidah. On 25 July the Houthis then fired directly at Aramco installations at Jizan and Yanbu: Reuters-verified footage showed a column of smoke from the direction of the ~400 kb/d Jizan refinery and trading sources reported possible damage to fuel and oil storage there, though Aramco has confirmed no outage or production loss; the Yanbu-bound missiles were reportedly intercepted with no confirmed damage. The Houthis have declared a blockade of Saudi Arabia and warned that all its oil facilities could become targets — the war now reaching for the infrastructure built to bypass the war, not only tankers at sea. Then the traffic itself fell hard: only 11 commodity vessels crossed Bab el-Mandeb on Sunday 26 July (seven of them oil tankers), the lowest in months, though several large VLCCs carrying Saudi, Emirati and Russian crude still escaped south toward Asia — compression and selection under military pressure, not closure. A toll regime is now under consideration: regional sources told Reuters on 29 July that the Houthis are weighing fees on most traffic through Bab el-Mandeb, with no timeframe set. Iranian advisers who returned with Houthi officials from Tehran are reported to be helping structure the authority that would levy them, and Chinese ships would be exempted — China, the largest buyer of Saudi crude, has held direct talks with the group to keep its tankers unharmed. The stated aims are to normalise charging for passage through an international waterway and to pressure Washington. A 2024 UN Panel of Experts report described earlier safe-passage payments it could not independently verify, estimated near $180m a month. The alternative is distance: roughly 16 days to Asia via Bab el-Mandeb against about 50 rerouting via Suez and southern Africa. The Jizan question has now resolved — the wrong way: the ~400 kb/d refinery was shut on 27 July after the Houthi attack, having exported more than 200 kb/d of fuels, mostly diesel and gasoil, over the prior three months — converting last week’s “no confirmed outage” into a confirmed product-supply loss. Traffic has improved without normalising: 25 commodity vessels crossed Bab el-Mandeb on Thursday 30 July (18 in, 7 out, including two VLCCs, a Suezmax and five Aframaxes), but the blockade threat stands and the counts are minimums — two Saudi crude tankers bound for India, carrying roughly 1 million and 700,000 barrels, ran the region with AIS off. And the strain is creeping toward the last detour: a drone struck two gas vessels at Egypt’s Damietta port on Wednesday, with no credible claim of responsibility yet, just as Kpler data cited by Reuters (30 July) showed Saudi SUMED loadings from Sidi Kerir at 28.79 million barrels for July, up from 19.52 million in April. Saul Kavonic of MST Marquee told Reuters that as much as ~5 mb/d of oil currently able to bypass Hormuz could be put at risk if the Red Sea/Suez route were also compromised.',
  },
  {
    sev: 'critical',
    label: 'CPC / Kazakhstan — the shock outside the Gulf',
    body: 'The crisis has escaped the Gulf. The CPC terminal on Russia’s Black Sea coast temporarily suspended crude loadings after attacks on vessels, forcing Kazakhstan to curtail production: Reuters reports output at the giant Tengiz field fell from about 925,000 to 406,000 b/d, and national oil-and-gas output dropped from roughly 2.07 to 1.63 million b/d. CPC carries more than two-thirds of Kazakhstan’s exported crude and handles about 2% of world oil supply — a physical loss of barrels on a major non-Gulf route, stacked on top of Hormuz and the Red Sea rather than an alternative to them. Kazakhstan said CPC loading operations resumed on Monday 27 July — but national oil and condensate output had dropped further, to about 1 million b/d on Sunday, less than half June’s ~2.16 million b/d average, so the export route may be restarting even as the production behind it has yet to recover. That restart did not hold: CPC suspended loadings again on Thursday 30 July after a further drone attack on a tanker — the second interruption in a week. The barrels matter to Europe specifically: much of this crude enters the Mediterranean and European refining system, and it is predominantly Kazakh, including volumes produced by Chevron and ExxonMobil, so the shorthand “Russian Black Sea terminal” understates who is actually affected.',
  },
  {
    sev: 'critical',
    label: 'Oil products — tighter than crude',
    body: 'Brent fell more than 6% on Monday 27 July to about $90.58 a barrel (WTI ~$83.51) after the US and Iran held fire for a second consecutive day and Oman pressed to restore a ceasefire framework — down from around $102 on 23 July, roughly $11 of war premium out in four sessions, lifting equities and bonds. But this is market de-escalation, not physical normalisation: physical crude cargoes in the Middle East, Europe and Africa hit two-month highs last week, and traders estimate roughly 10 mb/d of Middle Eastern crude and products is still missing or displaced from normal routes, only partly offset by longer voyages and Suez/SUMED workarounds. Oil is falling because the market believes the disruption can be managed — not because the disrupted barrels have returned. Dated Brent had reached about $105.70 and North Sea Forties $108.77 the week before; global refinery runs remain about 6 mb/d below a year ago (IEA), the deeper stress still in diesel and jet. Two things then changed. The physical premium collapsed rather than persisting: Argus assessments published by the Australian Institute of Petroleum show North Sea Dated falling from about $103/bbl on 24 July to roughly $93 on 27 July and about $86 on 28 July, broadly reconverging with the screen. And the relief proved short — Brent rebounded to about $86.79 and WTI to $81.91 (up roughly 3.3%) on 29 July as the strikes resumed. By 10:30 GMT the move had extended: Brent was up about 4.6% at almost $88 — the first rise since last week, after briefly spiking above $100 and then tumbling into the mid-$80s once the bombing pause emerged. Then it reversed hard again: after a low of $84.09 on Tuesday, Brent gained roughly 8% on Wednesday and added another 1.6% to about $92.22 by Thursday morning, with WTI near $84.89. Note the spread — about $7.3, up from under $5 a day earlier: waterborne Brent carries the Hormuz premium while landlocked WTI does not, so the widening gap is itself a measure of chokepoint risk. One analyst quoted by Reuters expects Brent to keep swinging broadly between $80 and $100 while the conflict repeatedly escalates and de-escalates. By Friday 31 July the screen had eased — Brent about $87.59, WTI near $82, still heading for a monthly gain of roughly 20% — while the product market set new extremes: European diesel refining margins at an all-time record $74.66/bbl, gasoline margins near four-year highs, jet above $80, and US diesel cracks at a record $93.44 (Valero reporting a record second quarter). Reuters’ framing is now the operative one: refining capacity may be as important a problem as crude scarcity.',
  },
  {
    sev: 'elevated',
    label: 'US strategic buffer — thinnest since 1983',
    body: 'The world’s largest emergency reserve is being drawn down while the crisis runs. The US Strategic Petroleum Reserve fell another 3.8 million barrels to 307.7 million in the week ending 24 July (EIA) — the lowest since March 1983, down 95.1 million barrels (23.6%) on a year earlier — under the coordinated response in which Washington agreed to release 172 million barrels. This is not America running out of oil: the SPR is an emergency reserve, not the national supply, and dividing it by daily consumption produces a misleading countdown. It matters because it is the insurance against the NEXT disruption, and it is being spent while the commercial buffer falls too: official EIA data for the same week show commercial crude down 7.2 million barrels to 404.5 million (~6% below the five-year average; the API had suggested only −3.3M), gasoline essentially flat at 211.3 million (~7% below) and distillate up 1.1 million to 110.6 million (~10% below), with refineries at 97.2% of operable capacity (17.34 mb/d of inputs). Commercial plus strategic stocks together fell about 11 million barrels in one week, from 723.1 to 712.2 million. Pump prices show the strain: US regular gasoline about $4.096/gal and highway diesel about $5.313/gal, roughly 97 cents and $1.51 higher than a year ago. Commercial crude at 404.5 million barrels is also the lowest since 2018 — the buffer story now runs through both reserves at once.',
  },
  {
    sev: 'critical',
    label: 'Russian refining — major disruption',
    body: 'Repeated Ukrainian strikes have forced Russian refineries to cut or suspend runs, and the campaign has widened geographically. Ukraine says its drones struck Lukoil’s Filanovsky platform in Russia’s largest Caspian oilfield and a refinery in Siberia’s Tyumen region more than 2,000 km away (regional authorities confirmed a drone-caused fire); no output loss is confirmed at either. The damage is now showing up domestically: Deputy PM Novak called fuel supply “quite difficult” in some regions, especially Siberia, Russia is extending its gasoline-export ban to end-2026 (the diesel ban to lift only as the home market recovers), and Russia is now receiving or arranging fuel from Kazakhstan, Belarus and India — a major crude producer importing fuel. Diesel and gasoil exports had already fallen to about 234,000 b/d in early July, against a 2025 average near 817,000 b/d (Kpler) — shortages, export bans and fuel imports now, not just refinery fires. Late July deepened it: the Ryazan refinery halted crude processing entirely after Wednesday’s drone attack, with industry sources telling Reuters the shutdown is expected to last about two weeks, and a strike on Lukoil’s Perm refinery forced unit CDU-5 offline — about 12,930 tonnes/day, roughly 34% of the plant’s capacity. Moscow’s response measures the severity: restrictions on exports of gasoline, diesel, marine fuel and gasoils have been extended to 31 January 2027 (producer exemptions for diesel, marine fuel and gasoils begin 1 September), citing the need to stabilise domestic supply after refinery attacks.',
  },
  {
    sev: 'critical',
    label: 'Global diesel — immediate transmission',
    body: 'The Russian collapse has pushed US diesel futures sharply higher and driven benchmark European diesel refining margins to an all-time record $74.66/bbl. European diesel stocks are now assessed at their lowest since 2014 (Reuters — superseding the earlier lowest-since-2022 reading), with Russia curbing diesel exports after refinery attacks and China also restricting fuel exports. India has become the emergency swing supplier — Reliance shipped roughly 4.2–5 million barrels of diesel to Europe in July, its highest in ten months — but Energy Aspects estimates Europe still faces a third-quarter middle-distillate shortfall of about 833,000 b/d, and in August Europe must compete with Asia for those Indian cargoes. Part of Kuwait’s 615 kb/d Al-Zour refinery is also down after a power failure. Diesel is the fast transmission channel into trucking, farming, mining, construction, shipping and backup power — product shortages can keep inflation rising even if crude stabilises. And the last mile is tightening too: low water on the Rhine (Kaub near its lowest since 1990) has pushed the cost of barging diesel inland from Rotterdam to its highest since 2009 (Bloomberg), so even landed product is harder to move to German and Swiss demand.',
  },
  {
    sev: 'elevated',
    label: 'European rivers — the internal chokepoint reaches power',
    body: 'Record low water is no longer only a freight story (Reuters, 31 Jul). Hungary’s Paks nuclear plant — nearly half the country’s electricity — shuts on Monday, possibly for weeks, because the Danube is too low to cool it safely; Romania’s Nuclearelectrica has shut one of its two reactors with the second expected to follow (about a fifth of national needs); France has trimmed nuclear output on low, warm rivers. Serbia’s Djerdap 1 hydro plant is at 20% of capacity and low water has also cut its Kostolac coal units, with Belgrade and Budapest importing replacement power at high spot prices. Freight is squeezed in step: Rotterdam–Rhine cargo has fallen every week since early July to about 10% below normal — oil-product and chemical tankers hit hardest because they sit deepest — and Danube grain barges can only reach ports near the Black Sea. The bill is in company accounts: Verbund ~€370m H1 drought cost, EDF 2026 earnings outlook cut ~10%, A2A 3.9 TWh of hydro vs a 4.1 average. One Kpler analyst’s summary: either blackouts, or far more investment. The cascade reaches fuel directly — lost hydro and nuclear is replaced by gas Europe is struggling to store, and lost barge capacity moves to trucks burning the diesel Europe is shortest of.',
  },
  {
    sev: 'elevated',
    label: 'LNG — major supply loss continues',
    body: "The IEA estimates disrupted Hormuz transit has removed more than 300 million cubic metres a day of Qatar and UAE LNG since 1 March — over 2 bcm a week. Qatar's Ras Laffan complex has stayed offline since the 2 March attack, raising power and industrial costs and directly hitting ammonia and nitrogen-fertiliser production. A backlog is now building inside the Gulf: seven laden Qatari carriers were holding about 0.57 million tonnes, and S&P Global puts nearly 1.9 million tonnes of LNG tanker capacity inside the Gulf — roughly eight days of typical pre-war peak exports from the two projects. Production can continue while ships wait; once storage fills, producers may be forced to cut output. That is the next escalation to watch. Meanwhile exports have not stopped so much as gone dark. Bloomberg reports that visible LNG traffic through Hormuz has essentially halted since a Qatari carrier was attacked this month, yet Adnoc is still loading: an empty Adnoc-owned carrier crossed the strait on 29 July with its position broadcasters switched off, three more Adnoc-linked vessels went silent off the UAE coast on 24 July, and Copernicus Sentinel-2 imagery showed a tanker docked at the Das Island export terminal while no vessel was broadcasting nearby. Visible transit counts therefore understate real movement — a reason to treat every headline ship-count, including ours, as a floor rather than a measure. The cost of working around it is now visible in company accounts. QatarEnergy has bought 33 US spot LNG cargoes during 2026, worth roughly $1bn by Reuters estimates (28 delivered, five en route), to serve customers its own closer production cannot reliably reach — the largest LNG exporter buying LNG, the same inversion Russia shows in refined fuel. Italy's Edison, which normally takes about 6.4 bcm a year from QatarEnergy (around a tenth of Italian gas consumption), has had 24 cargoes cancelled or deferred between April and September and has replaced 17 of them, about 1.6 bcm. Europe is not going without; it is outbidding Asia for replacements, and every US cargo Qatar buys is one that cannot also land at Rotterdam or Wilhelmshaven.",
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
  lastUpdated = '2026-07-31',
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

/**
 * Compact one-line variant for the dashboard: a single sentence + link to the
 * full board page. Severity counts derive from ROWS so they cannot go stale.
 */
export function GlobalDisruptionStatusCompact({
  site,
  lastUpdated = '2026-07-31',
  href = '/global-disruption-status',
}: {
  site: 'euro' | 'uk' | 'americas';
  lastUpdated?: string;
  href?: string;
}) {
  const critical = ROWS.filter((r) => r.sev === 'critical').length;
  const elevated = ROWS.length - critical;
  const dateLabel = new Date(lastUpdated).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <a
      href={href}
      aria-label={`Global Disruption Status — full board, updated ${dateLabel}`}
      className="block rounded-lg border border-red-700/50 bg-red-950/30 px-4 py-3 hover:border-red-500 hover:bg-red-950/40 transition group"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
          Global Disruption Status: <span className="text-red-400">SEVERE</span>
        </span>
        <span className="text-[10px] font-mono text-red-300/70 uppercase tracking-widest">
          {dateLabel}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-300 leading-relaxed">
        Energy, shipping and food-security risks are converging &mdash; {critical} critical and{' '}
        {elevated} elevated situations tracked, from the Strait of Hormuz to Europe&rsquo;s rivers.{' '}
        <span className="text-red-300 group-hover:text-white font-medium whitespace-nowrap">
          View the full board &rarr;
        </span>
      </p>
    </a>
  );
}
