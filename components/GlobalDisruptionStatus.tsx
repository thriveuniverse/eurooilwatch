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
    body: 'Hormuz traffic has fallen to its lowest since 7 May: only one oil tanker crossed on Thursday — the New Giant, carrying about 2 million barrels of Iraqi Basrah crude to China — and no other oil tanker entered the strait that day (Reuters), against a ~138/day norm. Every carrier that does cross runs with transponders off, so visible counts understate real movement. JMIC assesses deliberate hostile action as highly likely (SEVERE). The attacks are now sustained: UKMTO reports two tankers abandoned by their crews within 24 hours after projectile strikes off Oman — the latest about eight nautical miles north-east of Limah — while Dynacom confirmed two of its managed vessels were hit off the Omani coast, one of them abandoned. Crews reached lifeboats; no injuries or environmental impact have been reported, and not every vessel has been officially identified. India has barred its seafarers from Hormuz voyages. Over the weekend Hormuz stayed in single digits — about seven commodity vessels crossed Friday, three on Saturday (all dark) and seven on Sunday (Kpler) — so the strait has not meaningfully reopened even as oil futures fall. Traffic then thinned further: Reuters reported just five commodity vessels through the strait on Tuesday 28 July, and Tehran has rejected an Omani proposal for regional management of the waterway. A senior Iranian official confirmed to Reuters on 29 July that Tehran has ruled out Oman’s plan for joint regional management including voluntary transit fees — closing off the main diplomatic route out of an impasse that has choked Gulf trade for months. Tehran called the plan “unreasonable”: a 50-50 arrangement with Oman would not serve its interests, and Iran wants sole control of the inbound route and partial control of the outbound one — a waterway it says it controls and where it aims to collect fees. The IRGC says it retains full control of the strait and claims it struck three tankers attempting to transit by an “unauthorised route”; Washington has been directing ships to hug the Omani shore instead. The human cost is now explicit: recent Hormuz attacks killed one Indian seafarer, injured others and left one missing, and INTERTANKO is advising owners to delay transits where possible, review AIS and LRIT policies in high-risk areas — and to pay transit fees to neither Iranian nor Houthi authorities. A single passage does not equal normalisation: the QatarEnergy-controlled LNG carrier Al Areesh transited the strait overnight into 30 July after being permitted to use an Iran-designated route — the first QatarEnergy-controlled LNG tanker out of Hormuz in almost three weeks. It proves the strait is navigable by permission, not that commercial traffic has returned to anything like its former scale. Thursday’s count was two vessels — both tankers, both in ballast, both ENTERING the Gulf. That is the directional signal we said to watch (empty, load-bound tankers returning) registering for the first time — but at a scale of two it is a flicker, not a recovery, and it is inbound positioning, not exports. Early Saturday 1 August a tanker was disabled by an unknown projectile about 11 nautical miles north-east of Limah, Oman, near the strait’s entrance — engine room damaged, the vessel “not under command”, with no casualties or pollution initially reported (UKMTO); its identity, cargo and the party responsible have not been disclosed, and we do not attribute the attack. The IRGC claimed on Friday it had hit or stopped two tankers and turned four back — claims Reuters could not independently confirm — while tracking data showed two laden VLCCs and two other commodity vessels transiting successfully. The honest framing: Hormuz is permitting, or failing to prevent, individual passages. It has not returned to normal commercial navigation. A second weekend incident underlines it: on Saturday the master of another tanker reported a large splash and explosion close to the vessel about 21 nautical miles north-west of Khasab (UKMTO) — no damage or casualties, attacker and weapon unidentified. A diplomatic pause can stop a bombing campaign; it does not immediately remove mines, projectiles, armed boats or insurer reluctance from the water. Movement without normalisation continues: two laden VLCCs carrying Saudi and Iraqi crude exited the Gulf late last week. Some barrels are finding passage; the route has not returned to reliable pre-war capacity. Physical evidence that the US blockade is biting arrived Wednesday: some 50 laden Iranian tankers — mostly crude, plus fuels and LPG — were idling along Iran’s coast in the Gulf and Gulf of Oman as of Tuesday, according to advocacy group United Against Nuclear Iran, up from 45 a week earlier and 36 when the blockade was renewed on 14 July. UANI says it has tracked no laden Iranian crude tanker successfully exiting the Gulf of Oman without encountering US enforcement since then — though transponder-off departures are possible — and the blockade also stops empty ships returning for fresh loadings, while LPG and product cargoes continue to load on smaller vessels that may try to run it. Traders told Bloomberg fresh Iranian crude offers have gone scarce, with sellers holding cargoes and Iranian Light offered around $4 under ICE Brent, narrowed from about $5. Iranian crude in floating storage has climbed 14% in a month to 135 million barrels (Vortexa), swelling in the Yellow Sea, off peninsular Malaysia and near Sri Lanka — a finite pool outside the Gulf that matters more the longer the blockade holds, while the Shandong teapot refiners who buy most of it run at about 48% of capacity against a roughly 60% seasonal norm (Mysteel OilChem).',
  },
  {
    sev: 'critical',
    label: 'Middle East conflict — regional retaliation',
    body: 'The war has crossed into US fatalities and Gulf oil infrastructure. An Iranian strike on a base in Jordan killed two US service members (one missing) — the first American deaths since March, taking the toll to 16 killed and 430+ wounded — and a further service member has since reportedly died in Iraq during the controlled detonation of a downed Iranian drone. The US has now run thirteen consecutive nights of strikes on command centres, air defences, coastal surveillance, launch sites and communications networks; Iran has answered with attacks on Bahrain and Kuwait. Iran’s barrage on Kuwait widened to an offshore Kuwait Oil Company drilling platform, border posts and the airport, on top of the KPC oil facility already hit (IRGC: "15th wave of Operation Nasr 2"). Saudi Arabia issued shelter warnings for Al-Kharj and Yanbu — reportedly an Iranian missile, the first on the kingdom in three months, though Riyadh has not confirmed the cause and the danger later passed. No confirmed strike on Yanbu itself — the Red Sea bypass — but its appearance in the target set is the escalation to watch. Through Sunday 26 July the US paused its strikes on Iran after thirteen consecutive nights, and no Iranian attacks on Gulf states were reported over the weekend. Washington says its naval blockade remains in force, and Trump is reportedly holding back while a China-initiated diplomatic effort continues: a political opening, not yet a ceasefire or a reopened route. Into Monday 27 July the pause held for a second consecutive day and Iran said it would hold its fire as long as the US did, with Oman and other intermediaries working to restore the interim ceasefire framework and negotiate Hormuz shipping arrangements — but the nuclear dispute is unresolved, the naval blockade still operates, and Tehran still asserts authority over strait movements. By 28–29 July the lull had broken. Saudi Arabia said its armed forces, coordinating with US Central Command, carried out joint strikes on Iran-backed groups in eastern Iraq after drones launched from Iraqi territory targeted oil facilities in the kingdom’s Eastern Province — Saudi air defences intercepted those drones and no damage to the facilities has been reported (a separate event from the Houthi strikes near Jizan on 24–25 July). CENTCOM said the groups were behind more than 30 drone attacks in 72 hours on US forces and Saudi energy infrastructure; Iraq’s Popular Mobilisation Forces said several of its headquarters were struck, reporting casualties. Iran denied involvement and Iraq ordered an investigation (Reuters). The US military separately said it intercepted Iranian ballistic missiles aimed at American forces, and Tehran rejected an Omani proposal for regional management of the strait. Reuters has since confirmed the detail: Washington and Riyadh both said they jointly struck the Iran-backed groups in retaliation for drone attacks on Saudi oil targets launched from Iraq — the first US airstrikes in the region since Trump suspended the bombing campaign after 13 days, and the first time Saudi Arabia has publicly declared participation in joint strikes, drawing the kingdom into direct combat against Iran’s proxies on a new front. Iraq’s Popular Mobilisation Forces said at least 20 of its members were killed and 32 wounded across several bases; Baghdad called an emergency meeting. Jordan said its air defences shot down five Iranian missiles — three of the four US service members killed this month died in Jordan. The two-day pause was a lull, not a settlement. The threat geography has also widened: Reuters reports regional assessments that some recent attacks on Saudi Arabia — including on oil installations in the Eastern Province, the heartland of Saudi crude production — were launched from Iraq, with Houthi personnel working alongside Iraqi Iran-aligned armed groups. That adds a third launch axis (Iran toward the Gulf, Yemen toward the south-west, now Iraq toward the Eastern Province) and puts Abqaiq, Ras Tanura, Jubail and the East–West pipeline pumping stations inside a wider threat envelope. Late Friday, Reuters — citing a CBS News report — said the United States and Israel are planning a possible bombing campaign against energy-related targets inside Iran, potentially this weekend and with discussion of completing it before financial markets reopen on Monday. President Trump had NOT given final approval when the report was published, and which targets “energy-related” covers is unspecified. This is reported planning, not a completed operation — but it would be the most consequential escalation since the renewed attacks began, and no new Iranian fixed energy facility has been verified hit as of Saturday morning. It then did not happen: President Trump says he has cancelled or postponed the planned attack while Middle Eastern governments try to complete a deal covering Iran’s nuclear programme and the “immediate, complete and total” reopening of the Strait of Hormuz. Israel is said to have joined the commitment; Iran has not publicly accepted the terms — a negotiating pause, not yet a ceasefire or a reopened strait. Gulf capitals reportedly pressed Washington not to escalate, fearing retaliation against Saudi and Emirati oilfields and Qatar’s gas installations — a threat Iranian security-linked media made explicitly on Saturday, though it remains a threat, not an attack. Iranian drones did reach Kuwait: Kuwait says it destroyed drones targeting “vital facilities”, with material damage to a government facility in the north and company property on Bubiyan Island and no casualties — the nature of the installations has not been disclosed, and we do not describe them as oil or gas sites. Monday brought the contradiction: Trump said negotiations would take place that day, but Iran’s Foreign Ministry said no negotiations with the United States are taking place. Tehran confirmed only discussions with Oman over temporary safe passage through Hormuz, insisting the strait cannot return to normal while US military action continues. Oil fell nearly 6% anyway — the market pricing talks that one side says are not happening. Tuesday added the material constraint beneath the diplomacy: Reuters reports, citing three people familiar with internal data, that the US Army has used ‘virtually all’ of its long-range ATACMS and Precision Strike Missiles in five months of war — CENTCOM has been able to reload from US stocks elsewhere in the world — that roughly 65% of Patriot interceptors and at least 38% of THAAD interceptors have been expended (CSIS estimates that two sources say match internal figures), and that a little under half the global Tomahawk supply has been used (one source; Reuters could not independently verify that number). The White House says the US has ‘far more munitions than anyone in the world’ and the Pentagon disputes any readiness gap. Two explanations now circulate for why the next offensive was shelved — stockpile warnings from military advisers, per several outlets, or Gulf-state pressure, per a US official — and they are not mutually exclusive. The depletion cuts both ways for oil: it pushes Washington toward de-escalation, but it also thins the Patriot and THAAD shield that Gulf oil infrastructure has sheltered behind for five months. By Wednesday 5 August the diplomacy had firmed a notch: Qatar said a draft proposal for an interim deal to free up shipping through Hormuz had been prepared, and Bloomberg reported both US and Iranian officials sounding optimistic about reopening the waterway — a drafted text, not a signed one, and it comes a day after Tehran denied that any US–Iran negotiations were under way. Oil extended its slide on the news, with WTI below $75 and Brent below $79 by Wednesday morning.',
  },
  {
    sev: 'critical',
    label: 'Red Sea & Bab el-Mandeb — Saudi-port embargo declared',
    body: 'Not confirmed closed, but the earlier "armed but not active" reading no longer holds. On 21 July the Houthis emailed shipowners warning that their embargo covers not just Saudi-flagged vessels but all ships calling at Saudi ports, which "may be subject to targeting" anywhere within reach of the Yemeni armed forces (Bloomberg). That directly threatens Yanbu — the Red Sea hub Saudi Arabia has leaned on, via its east–west pipeline, to keep crude moving while Hormuz is near-halted. A simultaneous Hormuz-and-Red-Sea disruption would hit the main Gulf route and its main alternative at once. It is already biting without a physical blockade: Reuters reported that at least three Saudi-crude tankers — the VLCCs Xin Long Yang and New Prime and the tanker Rodos — reversed course on 21 July rather than pass the Yemeni coast, diverting toward Suez, while war-risk insurance for Saudi-port callers repriced within 24 hours (Ambrey rates them high risk). A Saudi-led coalition says it has begun protective measures at Bab el-Mandeb, and Yanbu is still loading ships already inside the Red Sea or arriving via Suez — so this is rerouting and cost, not shutdown. Brokers note it could even push more Yanbu crude toward Europe on the shorter Suez/Med haul while lengthening Asia’s supply lines. JMIC tempers this: over 22–23 July it recorded Bab el-Mandeb traffic largely unchanged (85 transits in 48h) and had not yet observed operational enforcement of the blockade — the diversions so far are Saudi-linked cargoes, not a general halt. Routing is shifting even so: some product tankers are diverting north through Suez, and Saudi Aramco is offering additional crude from the Egyptian Mediterranean terminal of Sidi Kerir to bypass the threatened Red Sea leg (Reuters). Bloomberg adds a telling asymmetry: tankers linked to China and Russia keep crossing Bab el-Mandeb — some carrying Saudi crude — while Western owners increasingly avoid it, transit dark (the Greek Merbabu ran the strait with its transponder off, bound for India) or reroute; and a VLCC has been provisionally booked to load Egyptian crude for South Korea around the Cape of Good Hope, the first such fixture in years. And the campaign has moved onto fixed infrastructure: on 25 July Saudi air defences (Greek-operated Patriots) intercepted two ballistic missiles fired from Yemen at the Yanbu refineries, with alerts around Jizan and the ~400 kb/d Jazan complex, while the Saudi-led coalition struck Houthi military and telecom sites in Hodeidah. On 25 July the Houthis then fired directly at Aramco installations at Jizan and Yanbu: Reuters-verified footage showed a column of smoke from the direction of the ~400 kb/d Jizan refinery and trading sources reported possible damage to fuel and oil storage there, though Aramco has confirmed no outage or production loss; the Yanbu-bound missiles were reportedly intercepted with no confirmed damage. The Houthis have declared a blockade of Saudi Arabia and warned that all its oil facilities could become targets — the war now reaching for the infrastructure built to bypass the war, not only tankers at sea. Then the traffic itself fell hard: only 11 commodity vessels crossed Bab el-Mandeb on Sunday 26 July (seven of them oil tankers), the lowest in months, though several large VLCCs carrying Saudi, Emirati and Russian crude still escaped south toward Asia — compression and selection under military pressure, not closure. A toll regime is now under consideration: regional sources told Reuters on 29 July that the Houthis are weighing fees on most traffic through Bab el-Mandeb, with no timeframe set — though on 31 July the Houthi-run maritime authority publicly denied plans to impose charges, describing its transit-coordination service as voluntary and free. The fee reports remain source-attributed and officially denied. Iranian advisers who returned with Houthi officials from Tehran are reported to be helping structure the authority that would levy them, and Chinese ships would be exempted — China, the largest buyer of Saudi crude, has held direct talks with the group to keep its tankers unharmed. The stated aims are to normalise charging for passage through an international waterway and to pressure Washington. A 2024 UN Panel of Experts report described earlier safe-passage payments it could not independently verify, estimated near $180m a month. The alternative is distance: roughly 16 days to Asia via Bab el-Mandeb against about 50 rerouting via Suez and southern Africa. The Jizan question has now resolved — the wrong way: the ~400 kb/d refinery was shut on 27 July after the Houthi attack, having exported more than 200 kb/d of fuels, mostly diesel and gasoil, over the prior three months — converting last week’s “no confirmed outage” into a confirmed product-supply loss. Traffic has improved without normalising: 25 commodity vessels crossed Bab el-Mandeb on Thursday 30 July (18 in, 7 out, including two VLCCs, a Suezmax and five Aframaxes), but the blockade threat stands and the counts are minimums — two Saudi crude tankers bound for India, carrying roughly 1 million and 700,000 barrels, ran the region with AIS off. And the strain is creeping toward the last detour: a drone struck two gas vessels at Egypt’s Damietta port on Wednesday, with no credible claim of responsibility yet, just as Kpler data cited by Reuters (30 July) showed Saudi SUMED loadings from Sidi Kerir at 28.79 million barrels for July, up from 19.52 million in April. Saul Kavonic of MST Marquee told Reuters that as much as ~5 mb/d of oil currently able to bypass Hormuz could be put at risk if the Red Sea/Suez route were also compromised. Two Saudi crude tankers moved through Bab el-Mandeb as the new week opened — positive for west-coast exports, but it neither removes the Houthi threat nor shows that insurers and shipowners regard the route as normal.',
  },
  {
    sev: 'critical',
    label: 'CPC / Kazakhstan — the shock outside the Gulf',
    body: 'The crisis has escaped the Gulf. The CPC terminal on Russia’s Black Sea coast temporarily suspended crude loadings after attacks on vessels, forcing Kazakhstan to curtail production: Reuters reports output at the giant Tengiz field fell from about 925,000 to 406,000 b/d, and national oil-and-gas output dropped from roughly 2.07 to 1.63 million b/d. CPC carries more than two-thirds of Kazakhstan’s exported crude and handles about 2% of world oil supply — a physical loss of barrels on a major non-Gulf route, stacked on top of Hormuz and the Red Sea rather than an alternative to them. Kazakhstan said CPC loading operations resumed on Monday 27 July — but national oil and condensate output had dropped further, to about 1 million b/d on Sunday, less than half June’s ~2.16 million b/d average, so the export route may be restarting even as the production behind it has yet to recover. That restart did not hold: CPC suspended loadings again on Thursday 30 July after a further drone attack on a tanker — the second interruption in a week. The barrels matter to Europe specifically: much of this crude enters the Mediterranean and European refining system, and it is predominantly Kazakh, including volumes produced by Chevron and ExxonMobil, so the shorthand “Russian Black Sea terminal” understates who is actually affected.',
  },
  {
    sev: 'elevated',
    label: 'Arctic / Northern Sea Route — the escape corridor, on a timer',
    body: 'Russia has assembled an unprecedented Arctic oil convoy: vessels carrying roughly 8 million barrels of crude were transiting the Northern Sea Route or staged to enter it on 3 August — about 60% of the ~13.1 million barrels moved across the whole of last year’s four-month season, just weeks into this one (gCaptain, MagicPort data). More than a dozen Suezmax, Aframax and MR tankers are involved, the largest group staging in the Kara Sea — likely awaiting nuclear-icebreaker escort or better ice — with three nuclear icebreakers (Sibir, Yakutiya and Ural) deployed along the route, Ural stationed at the recurring Wrangel Island bottleneck. This is the detours thesis in action: the NSR’s risks — ice, season, escort capacity — are largely uncorrelated with Hormuz, the Red Sea or Ukraine’s reach, and Moscow is maximising the window before ice closes much of the route in the autumn (the seasonal minimum comes in late September). The caveats sit in the row’s title: the corridor is seasonal, icebreaker-dependent, and now carries a concentration of value that did not exist a month ago.',
  },
  {
    sev: 'critical',
    label: 'Oil products — tighter than crude',
    body: 'Brent fell more than 6% on Monday 27 July to about $90.58 a barrel (WTI ~$83.51) after the US and Iran held fire for a second consecutive day and Oman pressed to restore a ceasefire framework — down from around $102 on 23 July, roughly $11 of war premium out in four sessions, lifting equities and bonds. But this is market de-escalation, not physical normalisation: physical crude cargoes in the Middle East, Europe and Africa hit two-month highs last week, and traders estimate roughly 10 mb/d of Middle Eastern crude and products is still missing or displaced from normal routes, only partly offset by longer voyages and Suez/SUMED workarounds. Oil is falling because the market believes the disruption can be managed — not because the disrupted barrels have returned. Dated Brent had reached about $105.70 and North Sea Forties $108.77 the week before; global refinery runs remain about 6 mb/d below a year ago (IEA), the deeper stress still in diesel and jet. Two things then changed. The physical premium collapsed rather than persisting: Argus assessments published by the Australian Institute of Petroleum show North Sea Dated falling from about $103/bbl on 24 July to roughly $93 on 27 July and about $86 on 28 July, broadly reconverging with the screen. And the relief proved short — Brent rebounded to about $86.79 and WTI to $81.91 (up roughly 3.3%) on 29 July as the strikes resumed. By 10:30 GMT the move had extended: Brent was up about 4.6% at almost $88 — the first rise since last week, after briefly spiking above $100 and then tumbling into the mid-$80s once the bombing pause emerged. Then it reversed hard again: after a low of $84.09 on Tuesday, Brent gained roughly 8% on Wednesday and added another 1.6% to about $92.22 by Thursday morning, with WTI near $84.89. Note the spread — about $7.3, up from under $5 a day earlier: waterborne Brent carries the Hormuz premium while landlocked WTI does not, so the widening gap is itself a measure of chokepoint risk. One analyst quoted by Reuters expects Brent to keep swinging broadly between $80 and $100 while the conflict repeatedly escalates and de-escalates. By Friday 31 July the screen had eased — Brent about $87.59, WTI near $82, still heading for a monthly gain of roughly 20% — while the product market set new extremes: European diesel refining margins at an all-time record $74.66/bbl, gasoline margins near four-year highs, jet above $80, and US diesel cracks at a record $93.44 (Valero reporting a record second quarter). Reuters’ framing is now the operative one: refining capacity may be as important a problem as crude scarcity. July closed with the war premium rebuilt: Brent settled Friday at $90.12 (up 1.2%) and WTI at $84.67 (up 1.3%) — monthly gains of 24% and 21% respectively, the sharpest of the crisis so far. The negotiating turn then took a large bite back: Brent fell about $4.65 to $83.28 and WTI roughly $5.20 to $79.47 on Monday morning, 3 August — a fall driven by expectations of talks, not by any physical restoration of Gulf exports. OPEC+ formally approved a ~188,000 b/d September increase for its eight core members, completing the rollback of the 1.65 mb/d voluntary-cut layer introduced in 2023 (an older ~2 mb/d cut runs to end-2026) — largely theoretical for now, since several producers sit below quota because war and shipping disruption stop available barrels reaching buyers.',
  },
  {
    sev: 'elevated',
    label: 'US strategic buffer — thinnest since 1983',
    body: 'The world’s largest emergency reserve is being drawn down while the crisis runs. The US Strategic Petroleum Reserve fell another 3.8 million barrels to 307.7 million in the week ending 24 July (EIA) — the lowest since March 1983, down 95.1 million barrels (23.6%) on a year earlier — under the coordinated response in which Washington agreed to release 172 million barrels. This is not America running out of oil: the SPR is an emergency reserve, not the national supply, and dividing it by daily consumption produces a misleading countdown. It matters because it is the insurance against the NEXT disruption, and it is being spent while the commercial buffer falls too: official EIA data for the same week show commercial crude down 7.2 million barrels to 404.5 million (~6% below the five-year average; the API had suggested only −3.3M), gasoline essentially flat at 211.3 million (~7% below) and distillate up 1.1 million to 110.6 million (~10% below), with refineries at 97.2% of operable capacity (17.34 mb/d of inputs). Commercial plus strategic stocks together fell about 11 million barrels in one week, from 723.1 to 712.2 million. Pump prices show the strain: US regular gasoline about $4.096/gal and highway diesel about $5.313/gal, roughly 97 cents and $1.51 higher than a year ago. Commercial crude at 404.5 million barrels is also the lowest since 2018 — the buffer story now runs through both reserves at once. The refiners themselves say the squeeze lasts: ExxonMobil and Chevron warned late Friday that diesel and refined-product supplies are likely to stay tight through the second half of 2026 — even as Exxon reported record second-quarter diesel production and Chevron ran more than 1 million b/d through its US refineries, a company record. Running flat out is not the same as catching up, and plants cannot hold maximum utilisation indefinitely without maintenance.',
  },
  {
    sev: 'critical',
    label: 'Russian refining — major disruption',
    body: 'Repeated Ukrainian strikes have forced Russian refineries to cut or suspend runs, and the campaign has widened geographically. Ukraine says its drones struck Lukoil’s Filanovsky platform in Russia’s largest Caspian oilfield and a refinery in Siberia’s Tyumen region more than 2,000 km away (regional authorities confirmed a drone-caused fire); no output loss is confirmed at either. The damage is now showing up domestically: Deputy PM Novak called fuel supply “quite difficult” in some regions, especially Siberia, Russia is extending its gasoline-export ban to end-2026 (the diesel ban to lift only as the home market recovers), and Russia is now receiving or arranging fuel from Kazakhstan, Belarus and India — a major crude producer importing fuel. Diesel and gasoil exports had already fallen to about 234,000 b/d in early July, against a 2025 average near 817,000 b/d (Kpler) — shortages, export bans and fuel imports now, not just refinery fires. Late July deepened it: the Ryazan refinery halted crude processing entirely after Wednesday’s drone attack, with industry sources telling Reuters the shutdown is expected to last about two weeks, and a strike on Lukoil’s Perm refinery forced unit CDU-5 offline — about 12,930 tonnes/day, roughly 34% of the plant’s capacity. Moscow’s response measures the severity: restrictions on exports of gasoline, diesel, marine fuel and gasoils have been extended to 31 January 2027 (producer exemptions for diesel, marine fuel and gasoils begin 1 September), citing the need to stabilise domestic supply after refinery attacks. A further drone attack set an unidentified energy facility and warehouses ablaze in the Volgograd region — Reuters has not confirmed that the refinery itself was struck (corrected 1 Aug from an earlier ‘refinery’ description). And the import map has widened again: Russia has taken delivery of roughly 30,000 tonnes of AI-92 petrol from Morocco, unloading at Murmansk, alongside supplies from India, Belarus and Kazakhstan, with petrol production at about 65% of normal summer consumption by early July (Reuters). One of the world’s largest oil producers is now importing petrol across four borders. Overnight into Sunday, Russia says it intercepted 635 Ukrainian drones; confirmed impacts include a distribution warehouse in Samara and civil infrastructure in Saratov and Engels, where two people were killed. Saratov hosts a major refinery, but Reuters has not confirmed the refinery itself was struck, and we do not conflate the city with the plant. Separately, President Zelensky said Ukrainian forces struck infrastructure at three refineries in Bashkortostan — Reuters reported the statement, and independent plant-by-plant damage assessments are still awaited. We do not report those refineries as stopped. Fuller reporting on that wave: Ukraine says its targets included the Saratov refinery, the Engels strategic-bomber airbase and a Kaluga oil depot, with fires reported around industrial facilities in Bashkortostan and at least eight deaths across several regions. Still no confirmed refinery shutdown or quantified processing loss from this wave — Saratov does not join the refinery-loss list until there is one. The campaign ran straight through the Middle East’s diplomatic opening.',
  },
  {
    sev: 'critical',
    label: 'Global diesel — immediate transmission',
    body: 'The Russian collapse has pushed US diesel futures sharply higher and driven benchmark European diesel refining margins to an all-time record $74.66/bbl. European diesel inventories are at their thinnest since 2022, and total independently held product stocks in the Amsterdam–Rotterdam–Antwerp hub recently fell to their lowest since 2014 (corrected 1 Aug: an earlier version conflated the two measures), with Russia curbing diesel exports after refinery attacks and China also restricting fuel exports. India has become the emergency swing supplier — Reliance shipped roughly 4.2–5 million barrels of diesel to Europe in July, its highest in ten months — and in August Europe must compete with Asia for those Indian cargoes. Part of Kuwait’s 615 kb/d Al-Zour refinery is also down after a power failure. Diesel is the fast transmission channel into trucking, farming, mining, construction, shipping and backup power — product shortages can keep inflation rising even if crude stabilises. And the last mile is tightening too: low water on the Rhine (Kaub near its lowest since 1990) has pushed the cost of barging diesel inland from Rotterdam to its highest since 2009 (Bloomberg), so even landed product is harder to move to German and Swiss demand.',
  },
  {
    sev: 'elevated',
    label: 'European rivers — the internal chokepoint reaches power',
    body: 'Record low water is no longer only a freight story (Reuters, 31 Jul). Hungary’s Paks nuclear plant — nearly half the country’s electricity — shuts on Monday, possibly for weeks, because the Danube is too low to cool it safely; Romania’s Nuclearelectrica has shut one of its two Cernavodă reactors and is funding emergency water-routing work to keep the second online (the pair supply about a fifth of national needs); France has trimmed nuclear output on low, warm rivers. Serbia’s Djerdap 1 hydro plant is at 20% of capacity and low water has also cut its Kostolac coal units, with Belgrade and Budapest importing replacement power at high spot prices. Freight is squeezed in step: Rotterdam–Rhine cargo has fallen every week since early July to about 10% below normal — oil-product and chemical tankers hit hardest because they sit deepest — and Danube grain barges can only reach ports near the Black Sea. The bill is in company accounts: Verbund ~€370m H1 drought cost, EDF 2026 earnings outlook cut ~10%, A2A 3.9 TWh of hydro vs a 4.1 average. One Kpler analyst’s summary: either blackouts, or far more investment. The cascade reaches fuel directly — lost hydro and nuclear is replaced by gas Europe is struggling to store, and lost barge capacity moves to trucks burning the diesel Europe is shortest of. The escalation arrived within days: Hungary is shutting down the ENTIRE Paks plant — nearly half the country’s electricity, its first complete shutdown in 44 years — because the Danube can no longer supply enough cooling water, with PM Peter Magyar warning it could stay offline for weeks. Budapest is preparing voluntary and potentially mandatory cuts for large users, possible temporary disconnection of some industrial consumers, suspension of rail freight in peak evening hours, public-sector home-working, reduced public lighting and increased imports; Slovakia has offered help, and replacement power is estimated to cost hundreds of millions of dollars. By Tuesday 4 August the Rhine had fallen to its lowest level since records began in 1880: the barge clearance at Kaub touched 21cm overnight, forecasts point to 17cm by Saturday, and the river usually bottoms out later in the summer. The cost of shipping diesel from Rotterdam to Karlsruhe is the highest since Bloomberg began compiling the data in 2009; Shell has shifted deliveries from its Rhineland refinery to rail and truck, BASF reports supply bottlenecks, Evonik says production at its Marl chemical park is affected, and the Kiel Institute estimates a 0.1–0.2% hit to German GDP between July and September. Romania has gone beyond workarounds: its military detonated a rock formation in the Danube on Monday to redirect water toward the Cernavodă nuclear plant — the level at the plant rose 2cm instead of falling 2cm, the defence minister said. Scattered thunderstorms are possible, but dry soils will absorb much of any rain before it reaches the river; no lasting relief is in sight.',
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
  lastUpdated = '2026-08-05',
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
  lastUpdated = '2026-08-05',
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
