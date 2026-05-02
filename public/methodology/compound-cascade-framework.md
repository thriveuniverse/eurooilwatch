# Compound Cascade Systems Modelling Framework

**A reusable methodology for building probabilistic risk models of systemic crises**

**Version 2.0 | May 2026**

**Cite as:** Kelly, J. (2026). *Compound Cascade Systems Modelling Framework: A Reusable Methodology for Building Probabilistic Risk Models of Systemic Crises*. SSRN Working Paper. Available at: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6695618

Developed by Jonathan Kelly. Originally extracted from the "From Hormuz to Hunger" famine model (v3.0, April 2026). Validated through application to the "The Fall of The UK ?" structural decline model (v5.0, May 2026). This framework can be applied to any complex system where multiple risk factors interact and compound.

---

## 0. When to Use This Methodology (and When Not To)

### Use compound cascade modelling when:

- **Multiple risk factors are active simultaneously** and at least some of them interact through identifiable causal mechanisms
- **Institutional analysis exists but is siloed** — different agencies or departments model different aspects of the same system independently
- **Feedback loops are plausible** — deterioration in one area could worsen another, which worsens the first
- **Historical precedent shows that additive assessment underestimated outcomes** in comparable situations
- **The system has weak circuit-breakers** — mechanisms that should contain cascading failure are themselves degraded or absent

### Do not use compound cascade modelling when:

- **Risks are genuinely independent** — if the risk factors do not interact through causal mechanisms, an additive model is appropriate and simpler
- **The system has strong, tested circuit-breakers** — well-capitalised insurance mechanisms, automatic stabilisers, redundant systems that have been tested under stress
- **Data quality is insufficient to identify causal mechanisms** — compound cascade modelling requires mechanistic clarity, not just correlation. If you cannot explain *how* Chain A triggers or amplifies Chain B, do not model the interaction
- **A single dominant variable overwhelms all others** — if one risk factor is so large that interactions with other factors are second-order, a single-variable model with sensitivity analysis is more appropriate
- **You are modelling a short-duration event** — compound cascades operate over weeks to decades; for events measured in hours (e.g., a single infrastructure failure), event-tree or fault-tree analysis is more appropriate

### The methodology gap: the central finding

The gap between compound and additive assessment is not just a methodological curiosity — it is itself a finding. In both applications to date, the compound model produced materially higher risk estimates than the sum of individual chain assessments:

- **Hormuz famine model:** Institutional projections (WFP, FAO) estimated 30–50 million at risk of acute food insecurity. The compound cascade model, using the same source data but modelling chain interactions, produced a probability-weighted central estimate of 118–225 million excess deaths over 5 years. The divergence factor was approximately 3–5x.
- **UK structural decline model:** Institutional assessments (OBR, IFS, BoE) each flag individual risks as concerning but manageable. The compound cascade model, using the same institutional data sources, assesses a 50–70% probability of Accelerated Decline or worse by 2035, compared to 10–20% under additive assessment. The divergence factor was approximately 3–4x.

The consistency of this divergence across two very different domains — a global food system crisis and a single nation-state's structural decline — suggests it is a structural property of how interactive systems behave, not an artefact of either specific model.

---

## 1. The Core Principle

Institutional risk analysis is typically **linear and additive**: identify individual risk factors, quantify each one, add the results. This systematically underestimates outcomes in complex systems because it misses **interaction effects** — where one risk factor triggers, amplifies, or accelerates others.

Compound cascade modelling captures these interactions. The output is not a single number but a **scenario-weighted probability distribution** with explicit uncertainty ranges, sensitivity analysis, and historical calibration.

### Why institutions fail to model interactions

The institutional silo problem is structural, not accidental. Institutions are mandated to model specific domains:

| Domain | Institution (UK example) | What they model | What they miss |
|---|---|---|---|
| Fiscal policy | OBR | Debt trajectory, tax revenue | How fiscal pressure interacts with NHS collapse, brain drain, housing |
| Healthcare | NHS England | Waiting lists, workforce | How health system failure drives emigration, reduces productivity |
| Demographics | ONS | Population projections | How demographic decline interacts with fiscal trap, political paralysis |
| Food security | FAO/WFP | Caloric availability, supply | How food price spikes interact with sovereign debt, political instability |

No institution is mandated to model the interactions between these domains. The gap between siloed assessment and compound interaction modelling is not a limitation of any individual institution — it is a structural feature of how institutional analysis is organised.

### The compound cascade hypothesis

**Hypothesis:** In systems where multiple structural risk factors operate simultaneously and interact through identifiable causal mechanisms, the probability-weighted outcome will be materially worse than the sum of individual risk assessments, because:

1. **Interactions amplify individual chains** — a chain that would be manageable in isolation becomes critical when reinforced by other chains
2. **Feedback loops create self-sustaining deterioration** — once activated, they worsen without external intervention
3. **Containment mechanisms are shared** — the same fiscal capacity, institutional bandwidth, and political attention is needed to address multiple chains simultaneously, creating competition for scarce response resources
4. **Temporal coupling creates simultaneity** — chains that might be individually manageable if they occurred sequentially become unmanageable when they coincide

This hypothesis has been tested against historical cases (see Section 8) and found to hold consistently: in every case of systemic crisis examined, the actual outcome was worse than contemporaneous additive assessment predicted.

---

## 2. Domain Adaptation: External Shock vs. Endogenous Decline

The methodology has been applied to two fundamentally different types of system, and the adaptation required is instructive.

### Type 1: External Shock Model (Hormuz)

- **Trigger:** A specific, identifiable event (Strait of Hormuz blockade, February 28, 2026)
- **Causal direction:** Trigger → cascading consequences through pre-existing vulnerabilities
- **Chain structure:** Each chain traces a different transmission pathway from the triggering event to the outcome (famine deaths)
- **Time horizon:** Relatively short (months to 5 years)
- **Counterfactual:** Clear — "what if the blockade hadn't happened?"
- **Key analytical challenge:** Modelling how quickly and how far the shock propagates through interconnected systems

### Type 2: Endogenous Decline Model (UK)

- **Trigger:** No single trigger — multiple structural weaknesses accumulating over decades
- **Causal direction:** Multiple simultaneous deteriorations interact and compound
- **Chain structure:** Each chain is an independent structural decline vector with its own evidence base; chains interact but no single chain "causes" the others
- **Time horizon:** Longer (5–10 years for projection, but roots extend decades into the past)
- **Counterfactual:** Diffuse — "what if institutions modelled the interactions?"
- **Key analytical challenge:** Distinguishing between correlation and interaction; identifying which interactions are causal

### Implications for methodology

| Methodological step | External shock adaptation | Endogenous decline adaptation |
|---|---|---|
| Chain identification | Follow transmission pathways from trigger | Identify independent decline vectors with institutional evidence bases |
| Interaction matrix | Focus on amplification and constraint | Focus on feedback loops and bidirectional interactions |
| Scenario construction | Vary trigger intensity and duration | Vary which external shocks materialise and which feedback loops activate |
| Historical calibration | Compare to past crises with similar triggers | Compare to past state-decline episodes with similar structural profiles |
| Sensitivity analysis | Identify the single most powerful variable (usually the trigger) | Test whether the compound finding holds without any single chain or external shock |
| Meta-chains | Less relevant — trigger is exogenous | Critical — identify chains whose dysfunction propagates across all other domains |

---

## 3. The Nine-Step Process

### Step 1: Define the System Boundary

Define the system under analysis, its geographic and temporal scope, and what outcome you are measuring. Decide what counts as inside vs. exogenous; whether to use single or multiple outcome metrics; and the time horizon (which determines which chains are relevant).

### Step 2: Identify Causal Chains

Map every mechanism through which the system produces the outcome. Each chain must be individually sourced, mechanistically clear, quantifiable, and historically observable.

Start with first-order effects, then ask: what does this trigger? What amplifies it? What containment mechanism is itself degraded? What external variable could couple otherwise independent chains? Is there a chain whose dysfunction propagates across all other domains (a meta-chain)? Aim for 7–20 chains.

### Step 3: Map Chain Interactions

Build an N×N interaction matrix. Score each interaction as Strong (3), Moderate (2), Weak (1), or None (0). Classify by type: triggers, amplifies, constrains, couples, feedback. Compute matrix diagnostics: interaction density, outgoing/incoming connections per chain, strong-interaction clusters.

### Step 4: Identify and Formalise Feedback Loops

A feedback loop is identified when a cycle of three or more chains creates a self-reinforcing dynamic. Verify causal direction at every link. Classify each loop's status: Latent, Active, or Self-sustaining. For each active or self-sustaining loop, identify the weakest link, the cost of breaking the loop there, and what happens if the loop is broken.

### Step 5: Identify Meta-Chains and Temporal Dynamics

A meta-chain has the highest combined connectivity, propagates dysfunction across all other chains, and creates conditions for addressing multiple chains if reformed. Classify chains by temporal class: acute (days–weeks), fast-moving (months–2 years), structural (2–10 years), generational (10–20+ years).

### Step 6: Build Scenarios

Construct 4–6 scenarios. Each is defined by explicit, falsifiable assumptions, a probability range, an outcome range, and the number/status of feedback loops under that scenario's conditions. Probabilities sum to ~100%. Include at least one positive pathway. Identify 2–3 scenario-selector variables whose binary resolution determines which scenario materialises.

### Step 7: Sensitivity Analysis

Test each major variable independently. Then run the critical assumption-set sensitivity: does the compound finding survive when external shocks are removed? When individual chains are removed? In both the Hormuz and UK models, the structural finding survives every individual-chain or external-shock removal — confirming it is a property of the interaction architecture, not any single input.

### Step 8: Historical Calibration

Identify 5–10 historical events with comparable initial conditions. For each, document the contemporary institutional projection, the actual outcome, the ratio between them, and the mechanisms that were missed. The systematic finding across both applications: institutional assessment underestimated outcomes in every comparable case, and the cause was always the same — compound interactions were not modelled.

### Step 9: Impact Conversion Methodology

Make the conversion from structural risk to human outcome metrics fully transparent: by region/segment, using established metrics, calibrated against observed historical rates, expressed as ranges, with direct impact separated from compound effects. The gap between additive total and compound total is the methodology gap — the central analytical contribution.

---

## 4. Meta-Chains: When Dysfunction Propagates

Not every model will contain a meta-chain. Meta-chains are most relevant in endogenous decline models where a coordinating mechanism has itself become a source of systemic failure.

### Identifying a meta-chain

A chain qualifies as a meta-chain if it meets all three criteria:

1. **Highest combined connectivity** — highest combined outgoing + incoming interaction count in the matrix
2. **Propagation function** — its dysfunction does not just add one more problem; it prevents effective response to all other problems
3. **Reform leverage** — addressing it would create conditions for addressing multiple other chains, even if it does not directly fix any of them

### The UK model's meta-chain: Political System Failure (Chain 10)

- **Connectivity:** 14 outgoing, 11 incoming (from 17 possible sources) — highest in the matrix
- **Propagation:** FPTP produces governments with large majorities from minority vote shares, enabling short-term populist responses while preventing structural reform. Every other chain's trajectory is worsened by this dysfunction.
- **Reform leverage:** Electoral reform (FPTP to PR) would not fix productivity, healthcare, housing, or demographics directly — but it would break the political paralysis loop and create conditions under which effective policy on all chains becomes possible.
- **The paradox:** The meta-chain is simultaneously the most important chain to address and the hardest, because the system that needs reforming is the system that would have to authorise its own reform.

In the Hormuz model there is no meta-chain — the trigger is exogenous and no single chain plays a coordinating role. This is a structural difference between external shock and endogenous decline models.

---

## 5. How Judgement Becomes Probability

The most common objection to compound cascade models is: "These are just your opinions with numbers attached." This section addresses that objection by making the scoring methodology fully transparent.

### The honesty principle

Compound cascade modelling is not a mathematical model in the sense that a climate model or epidemiological model is. It does not solve equations. It uses **structured expert judgement** to assess chain severity, interaction strength, and scenario probability. This is a limitation, and it should be stated explicitly.

However, two things are also true:

1. **All risk assessment involves judgement.** Institutional models also rely on assumptions, parameter choices, and analytical judgement — they simply embed these choices in equations rather than stating them explicitly. A compound cascade model's advantage is transparency: the judgements are visible and challengeable.
2. **The structural finding is robust to individual judgement variation.** If different analysts applying the same methodology to the same data would produce different chain scores — but the interaction matrix, feedback loops, and compound effects would still produce materially higher risk estimates than additive assessment — then the structural finding is not dependent on any individual judgement call.

### Chain scoring methodology

Each chain is assessed across standardised dimensions:

| Dimension | Scale | Definition |
|---|---|---|
| Severity | 0–5 | Magnitude of impact on system outcomes if chain operates at assessed level |
| Velocity | 0–5 | Speed at which deterioration is occurring or could accelerate |
| Evidence confidence | 0–5 | Quality and quantity of source data supporting the chain assessment |
| Interaction density | Count | Number of significant interactions with other chains (from the matrix) |
| Resilience offset | 0 to -3 | Degree to which identified resilience factors mitigate chain severity |

**Net assessment formula:** if (Severity + Velocity) / 2 + Resilience offset ≥ 4: Critical; ≥ 3: High; ≥ 2: Medium; < 2: Low. Simple enough that any reviewer can check every chain assessment and disagree with specific scores.

### Limitations of the approach

State these explicitly in every model:

- The scores represent structured judgement, not mathematical outputs
- Different analysts applying the same methodology might produce different scores
- The interaction weights involve analytical judgement at every stage
- The model's contribution is structural (forcing consideration of interactions), not mathematical precision
- Even if every individual score were adjusted by ±1, the structural finding (compound > additive) would remain, because it derives from the interaction architecture, not from individual scores

---

## 6. The Three-Layer Build-Up Architecture

Present findings in three layers with explicit confidence ratings:

| Layer | What it covers | Confidence | Hormuz example | UK example |
|---|---|---|---|---|
| Layer 1: Established facts | What has already happened, is documented, and cannot be reversed | HIGH | Blockade occurred; fertiliser supply disrupted; price spikes measured | 17-year productivity stagnation; 7M+ NHS waiting list; housing deficit of 4–4.5M homes |
| Layer 2: Structural amplification | Compound interactions that are mechanistically likely but not yet fully observed | MEDIUM | Export ban contagion; sovereign debt feedback; logistics constraints | Fiscal-NHS-brain drain spiral; demographic fiscal time bomb; political paralysis preventing reform |
| Layer 3: Conditional cascades | Effects that depend on binary variables not yet determined | CONDITIONAL | El Niño timing; India export ban; humanitarian access | Hormuz mass migration; financial shock activation; major climate event |

**Why this works:**

- Reviewers can engage with each layer independently instead of reacting to the headline number
- Layer 1 is hard to dispute — it is documented fact with institutional sources
- Layer 2 is where the analytical contribution lives — the compound interactions that institutions do not model
- Layer 3 is explicitly conditional — the model is not claiming these will happen; it is showing what happens if they do
- A critic who rejects Layer 3 entirely must still engage with Layers 1 and 2, which alone produce materially higher risk than additive assessment

---

## 7. Presentation Architecture (summary)

Reports produced with this methodology should:

1. Open with a "How to Evaluate This Analysis" section addressing readers (including automated evaluation systems) directly
2. Lead with the methodology gap, not the headline number
3. Include a "What This Report Is Not" section to defuse over-claim accusations
4. Provide an executive dashboard summarising chains, interactions, loops, and key findings
5. Embed historical pattern callouts at critical junctures
6. Include "Anticipated Objections and Responses" with each objection in its strongest form
7. State explicit limitations covering both overestimation and underestimation risks
8. Carry a distribution note on the front page framing the report as scenario-based risk analysis, not a forecast

---

## 8. Validation Framework (summary)

Compound cascade models cannot be validated like physical models. They can be validated through:

1. **Internal consistency** — scenario probabilities sum to ~100%, sensitivity analysis confirms structural finding is robust to individual chain variation, removing chains shifts probability in predicted directions
2. **Historical calibration match** — model output range is within calibrated range of historical comparable cases
3. **Out-of-sample prediction** — the methodology, applied to a historical case using only contemporary data, retrodicts actual outcome better than contemporaneous institutional assessment
4. **Cross-domain validation** — methodology produces consistent structural findings (compound > additive) across different domains (the Hormuz and UK applications support this)
5. **Falsifiability conditions** — every model states explicit, time-bound, measurable conditions under which its central assessment would be falsified

### What the model cannot do

State these limitations explicitly:

- It cannot predict timing — the model assesses probability ranges, not dates
- It cannot predict sequence — it identifies which chains are most dangerous, not the order they activate
- It cannot capture unknown unknowns — only interactions between identified chains
- It cannot replace institutional analysis — its contribution is the interaction layer, depending on institutional data for chain-level inputs

---

## 9. Source Requirements

Minimum 15 primary sources, including at least 3 institutional datasets, 3 academic or peer-reviewed sources, 5 historical case studies for calibration, and 2 independent sources per causal chain.

**Source hierarchy:**

1. Institutional data (FAO, World Bank, OECD, ONS, OBR, BoE) — for quantitative inputs
2. Academic research (peer-reviewed journals, working papers) — for mechanisms and causal relationships
3. Think tank analysis (Chatham House, CSIS, Carnegie, IFS, Resolution Foundation) — for policy context
4. Historical case studies (books, retrospective analyses, post-mortem reports) — for calibration
5. Journalism (Reuters, FT, specialist outlets) — for real-time data points

The model's credibility depends on using the same source base as institutional analysis — the contribution is the methodology (modelling interactions), not different data.

---

## 10. Output Documents

Each project should produce:

1. **Master Model** (.md) — the living analytical document, updated as new data arrives. Authoritative version.
2. **Policy Brief** (.docx, 15–25 pages) — compressed case for policymakers, journalists, and general audience.
3. **Technical Report** (.docx, 60–120 pages) — full methodology for academics, researchers, and institutional analysts.
4. **This Framework Document** (.md) — domain-agnostic methodology reference.

---

## 11. Quality Checklist

Before publishing, verify:

**Chain quality:**
- Every causal chain individually sourced (minimum 2 independent sources per chain)
- Chain independence test passed (each chain defensible on its own evidence base)
- Chain scoring dimensions applied consistently with transparent formula
- Meta-chains identified (if applicable) with justification

**Interaction quality:**
- Interaction matrix complete — every chain-pair assessed
- Interaction scoring criteria applied consistently (Strong/Moderate/Weak/None)
- Matrix diagnostics computed (interaction density, connectivity per chain, clusters)
- Feedback loops explicitly identified with activation status (latent/active/self-sustaining)
- Loop-breaking analysis completed for each active loop

**Scenario quality:**
- Scenario probabilities sum to approximately 100%
- Every scenario defined by specific, falsifiable assumptions
- Scenario selectors identified (2–3 binary variables that determine which scenario materialises)
- Positive scenario included with mechanism for how it could occur
- Probability-weighted central estimate calculated and labelled as expected value

**Sensitivity quality:**
- Variable-level sensitivity covers all major assumptions
- Assumption-set sensitivity demonstrates structural robustness (compound finding persists across assumption sets)
- Individual chain sensitivity confirms no single chain dominates (adjustment of ±1 changes headline by <5%)
- Feedback loop sensitivity identifies which loops matter most for policy
- Non-linear thresholds identified with specific conditions

**Calibration quality:**
- Historical calibration against 5+ comparable events
- Model output within calibrated range of historical outcomes
- Systematic direction of institutional underestimation documented
- Falsifiability conditions stated (specific, time-bound, measurable)

**Impact conversion quality:**
- Conversion shown by region/segment, not global aggregate
- Established metrics used and cited
- Calibrated against observed rates in historical events
- Direct impact separated from compound effects
- Methodology gap table included

**Presentation quality:**
- "How to Evaluate This Analysis" opening section
- "What This Report Is Not" framing
- Executive dashboard (for complex models)
- Three-layer build-up with confidence ratings
- Methodology gap leads the executive summary
- Anticipated objections section
- Explicit limitations (overestimation and underestimation risks)
- Distribution note on front page
- All figures properly attributed with source and date

---

## 12. Applications and Future Development

### Completed applications

| Application | Domain | Chains | Interactions | Feedback loops | Headline finding |
|---|---|---|---|---|---|
| From Hormuz to Hunger (v3.0, 2026) | Global food systems | 9 | ~45% density | 3+ identified | 118–225M excess deaths vs. institutional estimate of 30–50M at risk |
| The The Fall of The UK ? (v5.0, 2026) | Single nation-state structural decline | 18 | 100 of 306 (33%) | 9 identified | 50–70% Accelerated Decline or worse vs. 10–20% under additive assessment |

### Potential future applications

The methodology is domain-agnostic by design. Potential applications:

- Climate-economic interaction models — how climate impacts interact with fiscal, political, and social systems
- Healthcare system failure — how workforce, fiscal, demographic, infrastructure, and governance chains interact
- Financial contagion — how sovereign debt, banking, currency, trade, and political chains interact
- Democratic decline — how media degradation, institutional erosion, polarisation, and external interference interact
- Supply chain vulnerability — how logistics, energy, political, financial, and climate chains interact

### Methodology evolution

Specific areas for development:

- Formal interaction scoring validation — Granger causality testing on time-series data for each chain pair
- Probabilistic modelling — Monte Carlo simulation using chain scores and interaction weights as distributional inputs
- Real-time updating — model architecture supporting dynamic updating as new data arrives
- Multi-model comparison — different analysts applying the framework to the same system; testing whether the structural finding converges even if individual chain scores differ

---

*Version 2.0 — May 2026*
*Developed by Jonathan Kelly*
*Contact: jon@thethriveclan.com*
