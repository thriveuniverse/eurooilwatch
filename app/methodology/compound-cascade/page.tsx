import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Compound Cascade Systems Modelling — Methodology Framework | EuroOilWatch',
  description:
    'A reusable methodology for building probabilistic risk models of systemic crises. The framework underlying the From Hormuz to Hunger and The Fall of The UK ? analyses.',
  alternates: { canonical: 'https://eurooilwatch.com/methodology/compound-cascade' },
  openGraph: {
    title: 'Compound Cascade Systems Modelling — Methodology Framework',
    description:
      'A reusable methodology for building probabilistic risk models of systemic crises.',
    url: 'https://eurooilwatch.com/methodology/compound-cascade',
    siteName: 'EuroOilWatch',
    type: 'article',
  },
};

export default function CompoundCascadePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>

        <p className="mt-6 text-[10px] font-mono font-semibold tracking-widest text-red-400 uppercase">
          Methodology Framework · Version 2.0
        </p>

        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white leading-tight">
          Compound Cascade Systems Modelling
        </h1>

        <p className="mt-2 text-base text-gray-400">
          A reusable methodology for building probabilistic risk models of systemic crises
        </p>

        <p className="mt-4 text-sm text-gray-400">
          By <strong className="text-gray-300">Jonathan Kelly</strong> · May 2026 ·{' '}
          <a
            href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6695618"
            target="_blank"
            rel="noopener noreferrer"
            className="text-oil-400 hover:underline"
          >
            Available on SSRN ↗
          </a>
        </p>
      </header>

      {/* Distribution / context note */}
      <aside className="rounded-lg border border-oil-800 bg-oil-900/40 px-5 py-4 text-xs text-gray-400 leading-relaxed">
        <p className="font-mono uppercase tracking-widest text-[10px] text-gray-500 mb-2">Context</p>
        <p>
          This framework was originally extracted from the <a href="/reports/from-hormuz-to-hunger" className="text-oil-400 hover:underline">From Hormuz to Hunger</a> famine model
          (v3.0, April 2026) and refined through application to a second domain — the
          The Fall of The UK ? structural decline model (v5.0, May 2026). It is presented here as a
          domain-agnostic methodology reference and can be applied to any complex system where multiple risk
          factors interact and compound.
        </p>
      </aside>

      {/* Download card */}
      <a
        href="/methodology/compound-cascade-framework.md"
        download
        className="block rounded-lg border border-oil-700 bg-oil-900/40 px-5 py-4 hover:border-oil-500 hover:bg-oil-900/60 transition group"
      >
        <p className="text-[10px] font-mono font-semibold tracking-widest text-oil-400 uppercase">Download · v2.0</p>
        <p className="mt-2 text-sm font-semibold text-white group-hover:text-oil-300 transition">
          Full Framework Document (Markdown) →
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Complete framework including the full Nine-Step Process detail, all worked examples, and the source
          requirements section. ~10,000 words.
        </p>
      </a>

      {/* Body */}
      <article className="space-y-8 text-[15px] text-gray-300 leading-relaxed">

        {/* Section 0 */}
        <section>
          <h2 className="text-xl font-bold text-white">When to Use This Methodology (and When Not To)</h2>

          <h3 className="mt-4 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">Use compound cascade modelling when:</h3>
          <ul className="mt-2 space-y-2 pl-6 list-disc marker:text-oil-400">
            <li>Multiple risk factors are active simultaneously and at least some of them interact through identifiable causal mechanisms</li>
            <li>Institutional analysis exists but is siloed — different agencies model different aspects of the same system independently</li>
            <li>Feedback loops are plausible — deterioration in one area could worsen another, which worsens the first</li>
            <li>Historical precedent shows that additive assessment underestimated outcomes in comparable situations</li>
            <li>The system has weak circuit-breakers — mechanisms that should contain cascading failure are themselves degraded or absent</li>
          </ul>

          <h3 className="mt-6 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">Do not use compound cascade modelling when:</h3>
          <ul className="mt-2 space-y-2 pl-6 list-disc marker:text-oil-400">
            <li>Risks are genuinely independent — an additive model is appropriate and simpler</li>
            <li>The system has strong, tested circuit-breakers — well-capitalised insurance, automatic stabilisers, redundant systems tested under stress</li>
            <li>Data quality is insufficient to identify causal mechanisms — the methodology requires mechanistic clarity, not just correlation</li>
            <li>A single dominant variable overwhelms all others — single-variable model with sensitivity analysis is more appropriate</li>
            <li>You are modelling a short-duration event (hours) — event-tree or fault-tree analysis is more appropriate</li>
          </ul>

          <div className="mt-6 rounded-lg border border-red-900/40 bg-red-950/15 px-5 py-4">
            <p className="text-[10px] font-mono font-semibold tracking-widest text-red-300 uppercase">The methodology gap: the central finding</p>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              In both applications to date, the compound model produced materially higher risk estimates than the sum
              of individual chain assessments. The Hormuz famine model produced a probability-weighted central estimate
              of 118–225M excess deaths, against institutional projections of 30–50M at risk. The UK structural decline
              model assesses 50–70% probability of Accelerated Decline by 2035, against 10–20% under additive
              assessment. The consistency of this <strong className="text-white">3–5x divergence</strong> across two very different domains —
              a global food system and a single nation-state — suggests it is a structural property of how interactive
              systems behave.
            </p>
          </div>
        </section>

        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-bold text-white">1. The Core Principle</h2>
          <p className="mt-3">
            Institutional risk analysis is typically <strong className="text-white">linear and additive</strong>: identify individual risk
            factors, quantify each one, add the results. This systematically underestimates outcomes in complex systems
            because it misses <strong className="text-white">interaction effects</strong> — where one risk factor triggers, amplifies, or
            accelerates others.
          </p>
          <p>
            Compound cascade modelling captures these interactions. The output is not a single number but a
            scenario-weighted probability distribution with explicit uncertainty ranges, sensitivity analysis, and
            historical calibration.
          </p>

          <h3 className="mt-6 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">Why institutions fail to model interactions</h3>
          <p className="mt-2">
            The institutional silo problem is structural, not accidental. Institutions are mandated to model specific
            domains — fiscal policy (OBR), healthcare (NHS England), demographics (ONS), food security (FAO/WFP). No
            institution is mandated to model the interactions between these domains. The gap between siloed assessment
            and compound interaction modelling is not a limitation of any individual institution — it is a structural
            feature of how institutional analysis is organised.
          </p>

          <h3 className="mt-6 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">The compound cascade hypothesis</h3>
          <p className="mt-2">
            In systems where multiple structural risk factors operate simultaneously and interact through identifiable
            causal mechanisms, the probability-weighted outcome will be materially worse than the sum of individual risk
            assessments, because:
          </p>
          <ol className="mt-3 space-y-2 pl-6 list-decimal marker:text-oil-400">
            <li><strong className="text-white">Interactions amplify individual chains</strong> — a chain manageable in isolation becomes critical when reinforced</li>
            <li><strong className="text-white">Feedback loops create self-sustaining deterioration</strong> — once activated, they worsen without external intervention</li>
            <li><strong className="text-white">Containment mechanisms are shared</strong> — the same fiscal capacity, institutional bandwidth, and political attention is needed simultaneously across multiple chains</li>
            <li><strong className="text-white">Temporal coupling creates simultaneity</strong> — chains that might be individually manageable if sequential become unmanageable when they coincide</li>
          </ol>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-xl font-bold text-white">2. Domain Adaptation: External Shock vs. Endogenous Decline</h2>
          <p className="mt-3">
            The methodology has been applied to two fundamentally different types of system, and the adaptation
            required is instructive.
          </p>

          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-oil-400 uppercase">Type 1 · External Shock</p>
              <p className="mt-2 text-sm font-semibold text-white">Hormuz model</p>
              <ul className="mt-2 space-y-1.5 text-xs text-gray-400">
                <li><strong className="text-gray-300">Trigger:</strong> A specific event (Strait of Hormuz blockade, Feb 28, 2026)</li>
                <li><strong className="text-gray-300">Direction:</strong> Trigger → cascading consequences through pre-existing vulnerabilities</li>
                <li><strong className="text-gray-300">Time horizon:</strong> Months to 5 years</li>
                <li><strong className="text-gray-300">Counterfactual:</strong> Clear — &quot;what if it hadn&apos;t happened?&quot;</li>
                <li><strong className="text-gray-300">Challenge:</strong> Modelling propagation speed and reach</li>
              </ul>
            </div>
            <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-oil-400 uppercase">Type 2 · Endogenous Decline</p>
              <p className="mt-2 text-sm font-semibold text-white">UK model</p>
              <ul className="mt-2 space-y-1.5 text-xs text-gray-400">
                <li><strong className="text-gray-300">Trigger:</strong> No single trigger — accumulating structural weaknesses</li>
                <li><strong className="text-gray-300">Direction:</strong> Multiple simultaneous deteriorations interact and compound</li>
                <li><strong className="text-gray-300">Time horizon:</strong> 5–10 years; roots extend decades back</li>
                <li><strong className="text-gray-300">Counterfactual:</strong> Diffuse — &quot;what if interactions were modelled?&quot;</li>
                <li><strong className="text-gray-300">Challenge:</strong> Distinguishing correlation from causal interaction</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 — summary */}
        <section>
          <h2 className="text-xl font-bold text-white">3. The Nine-Step Process</h2>
          <p className="mt-3 text-gray-400 italic">
            Summarised here. The full step-by-step detail with worked examples is in the downloadable framework
            document above.
          </p>

          <ol className="mt-4 space-y-4 list-decimal pl-6 marker:text-oil-400">
            <li>
              <strong className="text-white">Define the System Boundary.</strong> Establish geographic and temporal scope, outcome metric, what is endogenous vs. exogenous, and time horizon (which determines which chains matter).
            </li>
            <li>
              <strong className="text-white">Identify Causal Chains.</strong> Map every mechanism through which the system produces the outcome. Each chain must be individually sourced, mechanistically clear, quantifiable, and historically observable. Aim for 7–20 chains.
            </li>
            <li>
              <strong className="text-white">Map Chain Interactions.</strong> Build an N×N interaction matrix. Score each cell as Strong (3), Moderate (2), Weak (1), or None (0). Compute matrix diagnostics (interaction density, connectivity per chain, clusters).
            </li>
            <li>
              <strong className="text-white">Identify and Formalise Feedback Loops.</strong> Find cycles where Chain A worsens B which worsens C which worsens A. Classify each as Latent, Active, or Self-sustaining. Identify the weakest link for loop-breaking analysis.
            </li>
            <li>
              <strong className="text-white">Identify Meta-Chains and Temporal Dynamics.</strong> A meta-chain is a chain whose dysfunction propagates across all other domains. Classify chains by temporal class: acute, fast-moving, structural, generational.
            </li>
            <li>
              <strong className="text-white">Build Scenarios.</strong> Construct 4–6 scenarios. Each defined by explicit, falsifiable assumptions, a probability range, and an outcome range. Probabilities sum to ~100%. Include at least one positive pathway.
            </li>
            <li>
              <strong className="text-white">Sensitivity Analysis.</strong> Test each major variable independently. Then test whether the compound finding survives when external shocks or individual chains are removed. If it persists, the finding is structurally robust.
            </li>
            <li>
              <strong className="text-white">Historical Calibration.</strong> Identify 5–10 comparable historical events. Document contemporary projection vs. actual outcome. The systematic finding: institutional assessment underestimated in every comparable case, because compound interactions were not modelled.
            </li>
            <li>
              <strong className="text-white">Impact Conversion Methodology.</strong> Make the conversion from structural risk to human outcome metrics fully transparent: by region/segment, using established metrics, calibrated against historical rates, with direct impact separated from compound effects.
            </li>
          </ol>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-xl font-bold text-white">4. Meta-Chains: When Dysfunction Propagates</h2>
          <p className="mt-3">
            Not every model contains a meta-chain. Meta-chains are most relevant in endogenous decline models where a
            coordinating mechanism has itself become a source of systemic failure.
          </p>

          <p className="mt-3"><strong className="text-white">A chain qualifies as a meta-chain if it meets all three criteria:</strong></p>
          <ol className="mt-2 space-y-2 list-decimal pl-6 marker:text-oil-400">
            <li><strong className="text-white">Highest combined connectivity</strong> — highest combined outgoing + incoming interaction count in the matrix</li>
            <li><strong className="text-white">Propagation function</strong> — its dysfunction does not just add another problem; it prevents effective response to all other problems</li>
            <li><strong className="text-white">Reform leverage</strong> — addressing it would create conditions for addressing multiple other chains</li>
          </ol>

          <div className="mt-5 rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-[10px] font-mono font-semibold tracking-widest text-oil-400 uppercase">Worked example · UK model</p>
            <p className="mt-2 text-sm font-semibold text-white">Chain 10: Political System Failure</p>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              Highest connectivity in the matrix (14 outgoing, 11 incoming from 17 possible sources). FPTP produces
              governments with large majorities from minority vote shares, enabling short-term populist responses while
              preventing structural reform. Every other chain&apos;s trajectory is worsened by this dysfunction.
              Electoral reform would not fix productivity, healthcare, or housing directly — but it would break the
              political paralysis loop and create conditions under which effective policy becomes possible.
            </p>
            <p className="mt-3 text-xs text-gray-500 italic">
              The paradox: the meta-chain is simultaneously the most important to address and the hardest, because the
              system that needs reforming is the system that would have to authorise its own reform.
            </p>
          </div>

          <p className="mt-4 text-sm text-gray-400 italic">
            In the Hormuz model there is no meta-chain — the trigger is exogenous and no single chain plays a
            coordinating role. This is a structural difference between external shock and endogenous decline models.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-xl font-bold text-white">5. How Judgement Becomes Probability</h2>
          <p className="mt-3">
            The most common objection to compound cascade models is: <em className="text-gray-200">&quot;These are just your opinions with numbers attached.&quot;</em>
          </p>

          <h3 className="mt-5 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">The honesty principle</h3>
          <p className="mt-2">
            Compound cascade modelling is not a mathematical model in the sense that a climate model or epidemiological
            model is. It does not solve equations. It uses <strong className="text-white">structured expert judgement</strong> to assess
            chain severity, interaction strength, and scenario probability. This is a limitation, and it should be
            stated explicitly.
          </p>
          <p>However, two things are also true:</p>
          <ol className="mt-3 space-y-2 list-decimal pl-6 marker:text-oil-400">
            <li>
              <strong className="text-white">All risk assessment involves judgement.</strong> Institutional models also rely on assumptions, parameter
              choices, and analytical judgement — they simply embed these choices in equations rather than stating them
              explicitly. A compound cascade model&apos;s advantage is transparency: the judgements are visible and challengeable.
            </li>
            <li>
              <strong className="text-white">The structural finding is robust to individual judgement variation.</strong> If different analysts applying
              the same methodology to the same data would produce different chain scores — but the interaction matrix,
              feedback loops, and compound effects would still produce materially higher risk estimates than additive
              assessment — then the structural finding is not dependent on any individual judgement call.
            </li>
          </ol>

          <h3 className="mt-6 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">Limitations of the approach (state explicitly in every model)</h3>
          <ul className="mt-2 space-y-2 pl-6 list-disc marker:text-oil-400 text-sm">
            <li>The scores represent structured judgement, not mathematical outputs</li>
            <li>Different analysts applying the same methodology might produce different scores</li>
            <li>The interaction weights involve analytical judgement at every stage</li>
            <li>The model&apos;s contribution is structural (forcing consideration of interactions), not mathematical precision</li>
            <li>Even if every individual score were adjusted by ±1, the structural finding (compound &gt; additive) would remain — it derives from the interaction architecture, not from individual scores</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-xl font-bold text-white">6. The Three-Layer Build-Up Architecture</h2>
          <p className="mt-3">Present findings in three layers with explicit confidence ratings:</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-green-800/40 bg-green-950/15 px-5 py-4">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-green-400 uppercase">Layer 1 · Established facts · Confidence: HIGH</p>
              <p className="mt-2 text-sm text-gray-300">What has already happened, is documented, and cannot be reversed.</p>
              <p className="mt-2 text-xs text-gray-500"><strong className="text-gray-400">Hormuz example:</strong> Blockade occurred; fertiliser supply disrupted; price spikes measured.</p>
              <p className="text-xs text-gray-500"><strong className="text-gray-400">UK example:</strong> 17-year productivity stagnation; 7M+ NHS waiting list; housing deficit of 4–4.5M homes.</p>
            </div>
            <div className="rounded-lg border border-amber-800/40 bg-amber-950/15 px-5 py-4">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">Layer 2 · Structural amplification · Confidence: MEDIUM</p>
              <p className="mt-2 text-sm text-gray-300">Compound interactions that are mechanistically likely but not yet fully observed.</p>
              <p className="mt-2 text-xs text-gray-500"><strong className="text-gray-400">Hormuz example:</strong> Export ban contagion; sovereign debt feedback; logistics constraints.</p>
              <p className="text-xs text-gray-500"><strong className="text-gray-400">UK example:</strong> Fiscal-NHS-brain drain spiral; demographic fiscal time bomb; political paralysis preventing reform.</p>
            </div>
            <div className="rounded-lg border border-red-900/40 bg-red-950/15 px-5 py-4">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-red-400 uppercase">Layer 3 · Conditional cascades · Confidence: CONDITIONAL</p>
              <p className="mt-2 text-sm text-gray-300">Effects that depend on binary variables not yet determined.</p>
              <p className="mt-2 text-xs text-gray-500"><strong className="text-gray-400">Hormuz example:</strong> El Niño timing; India export ban; humanitarian access.</p>
              <p className="text-xs text-gray-500"><strong className="text-gray-400">UK example:</strong> Hormuz mass migration; financial shock activation; major climate event.</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-400 leading-relaxed">
            Reviewers can engage with each layer independently. Layer 1 is hard to dispute — documented fact with
            institutional sources. Layer 2 is where the analytical contribution lives. Layer 3 is explicitly
            conditional. A critic who rejects Layer 3 entirely must still engage with Layers 1 and 2, which alone
            produce materially higher risk than additive assessment.
          </p>
        </section>

        {/* Sections 7-10 condensed */}
        <section>
          <h2 className="text-xl font-bold text-white">7–10. Presentation, Validation, Sources, Outputs</h2>
          <p className="mt-3 text-gray-400 italic">Brief summaries — full detail in the downloadable framework.</p>

          <h3 className="mt-5 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">7 · Presentation Architecture</h3>
          <p className="mt-2 text-sm">
            Reports should: open with a &quot;How to Evaluate This Analysis&quot; section addressing readers (including
            automated evaluation systems) directly; lead with the methodology gap, not the headline number; include a
            &quot;What This Report Is Not&quot; section; provide an executive dashboard; embed historical pattern callouts at
            critical junctures; include &quot;Anticipated Objections and Responses&quot; with each objection in its strongest
            form; state explicit limitations covering both overestimation and underestimation risks.
          </p>

          <h3 className="mt-5 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">8 · Validation Framework</h3>
          <p className="mt-2 text-sm">
            Compound cascade models cannot be validated like physical models. They can be validated through internal
            consistency, historical calibration match, out-of-sample prediction (apply to a historical case using only
            contemporary data), cross-domain validation (consistent structural findings across different domains), and
            falsifiability conditions (every model states explicit, time-bound, measurable conditions under which its
            central assessment would be falsified).
          </p>
          <p className="mt-2 text-sm">
            <strong className="text-white">What the model cannot do:</strong> predict timing, predict sequence, capture unknown unknowns, or replace
            institutional analysis. The model&apos;s contribution is the interaction layer; it depends on institutional
            data for chain-level inputs.
          </p>

          <h3 className="mt-5 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">9 · Source Requirements</h3>
          <p className="mt-2 text-sm">
            Minimum 15 primary sources, including 3 institutional datasets, 3 academic / peer-reviewed sources, 5
            historical case studies for calibration, and 2 independent sources per causal chain. The model&apos;s
            credibility depends on using the same source base as institutional analysis — the contribution is the
            methodology, not different data.
          </p>

          <h3 className="mt-5 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">10 · Output Documents</h3>
          <p className="mt-2 text-sm">
            Each project should produce: (1) a Master Model living analytical document, (2) a Policy Brief (15–25
            pages) for policymakers and journalists, (3) a Technical Report (60–120 pages) for academics and analysts,
            and (4) a Framework Document like this one for methodology reference.
          </p>
        </section>

        {/* Section 11 — Quality checklist */}
        <section>
          <h2 className="text-xl font-bold text-white">11. Quality Checklist</h2>
          <p className="mt-3 text-sm text-gray-400">Before publishing, verify:</p>

          <div className="mt-4 space-y-4 text-sm">
            <ChecklistGroup title="Chain quality">
              <li>Every causal chain individually sourced (minimum 2 independent sources per chain)</li>
              <li>Chain independence test passed (each chain defensible on its own evidence base)</li>
              <li>Chain scoring dimensions applied consistently with transparent formula</li>
              <li>Meta-chains identified (if applicable) with justification</li>
            </ChecklistGroup>

            <ChecklistGroup title="Interaction quality">
              <li>Interaction matrix complete — every chain-pair assessed</li>
              <li>Interaction scoring criteria applied consistently (Strong/Moderate/Weak/None)</li>
              <li>Matrix diagnostics computed (interaction density, connectivity per chain, clusters)</li>
              <li>Feedback loops explicitly identified with activation status (latent/active/self-sustaining)</li>
              <li>Loop-breaking analysis completed for each active loop</li>
            </ChecklistGroup>

            <ChecklistGroup title="Scenario quality">
              <li>Scenario probabilities sum to approximately 100%</li>
              <li>Every scenario defined by specific, falsifiable assumptions</li>
              <li>Scenario selectors identified (2–3 binary variables that determine which scenario materialises)</li>
              <li>Positive scenario included with mechanism for how it could occur</li>
              <li>Probability-weighted central estimate calculated and labelled as expected value</li>
            </ChecklistGroup>

            <ChecklistGroup title="Sensitivity quality">
              <li>Variable-level sensitivity covers all major assumptions</li>
              <li>Assumption-set sensitivity demonstrates structural robustness (compound finding persists)</li>
              <li>Individual chain sensitivity confirms no single chain dominates (±1 changes headline by &lt;5%)</li>
              <li>Feedback loop sensitivity identifies which loops matter most for policy</li>
              <li>Non-linear thresholds identified with specific conditions</li>
            </ChecklistGroup>

            <ChecklistGroup title="Calibration quality">
              <li>Historical calibration against 5+ comparable events</li>
              <li>Model output within calibrated range of historical outcomes</li>
              <li>Systematic direction of institutional underestimation documented</li>
              <li>Falsifiability conditions stated (specific, time-bound, measurable)</li>
            </ChecklistGroup>

            <ChecklistGroup title="Impact conversion quality">
              <li>Conversion shown by region/segment, not global aggregate</li>
              <li>Established metrics used and cited</li>
              <li>Calibrated against observed rates in historical events</li>
              <li>Direct impact separated from compound effects</li>
              <li>Methodology gap table included</li>
            </ChecklistGroup>

            <ChecklistGroup title="Presentation quality">
              <li>&quot;How to Evaluate This Analysis&quot; opening section</li>
              <li>&quot;What This Report Is Not&quot; framing</li>
              <li>Executive dashboard (for complex models)</li>
              <li>Three-layer build-up with confidence ratings</li>
              <li>Methodology gap leads the executive summary</li>
              <li>Anticipated objections section</li>
              <li>Explicit limitations (overestimation and underestimation risks)</li>
              <li>Distribution note on front page</li>
              <li>All figures properly attributed with source and date</li>
            </ChecklistGroup>
          </div>
        </section>

        {/* Section 12 — Applications */}
        <section>
          <h2 className="text-xl font-bold text-white">12. Applications and Future Development</h2>

          <h3 className="mt-4 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">Applied to date</h3>
          <div className="mt-3 space-y-3">
            <a
              href="/reports/from-hormuz-to-hunger"
              className="block rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4 hover:border-oil-500 hover:bg-oil-900/60 transition group"
            >
              <p className="text-[10px] font-mono font-semibold tracking-widest text-oil-400 uppercase">External Shock Model</p>
              <p className="mt-2 text-sm font-semibold text-white group-hover:text-oil-300 transition">
                From Hormuz to Hunger (v3.0, April 2026) →
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Global food systems · 9 chains · ~45% interaction density · 3+ feedback loops · Headline:
                118–225M excess deaths vs. institutional estimate of 30–50M at risk
              </p>
            </a>
            <div className="rounded-lg border border-oil-800/60 bg-oil-900/20 px-5 py-4">
              <p className="text-[10px] font-mono font-semibold tracking-widest text-gray-500 uppercase">Endogenous Decline Model · Forthcoming</p>
              <p className="mt-2 text-sm font-semibold text-gray-300">
                The Fall of The UK ? (v5.0, May 2026)
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Single nation-state structural decline · 18 chains · 100 of 306 interactions (33%) ·
                9 feedback loops · Headline: 50–70% Accelerated Decline or worse by 2035 vs. 10–20% under
                additive assessment
              </p>
            </div>
          </div>

          <h3 className="mt-6 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">Potential future applications</h3>
          <ul className="mt-2 space-y-2 pl-6 list-disc marker:text-oil-400 text-sm">
            <li>Climate-economic interaction models — climate impacts interacting with fiscal, political, social systems</li>
            <li>Healthcare system failure — workforce, fiscal, demographic, infrastructure, governance chains</li>
            <li>Financial contagion — sovereign debt, banking, currency, trade, political chains</li>
            <li>Democratic decline — media, institutional, polarisation, economic, external interference chains</li>
            <li>Supply chain vulnerability — logistics, energy, political, financial, climate chains</li>
          </ul>

          <h3 className="mt-6 text-sm font-mono font-semibold tracking-widest text-gray-400 uppercase">Methodology evolution</h3>
          <p className="mt-2 text-sm">
            Areas for development: formal interaction scoring validation (Granger causality testing); probabilistic
            modelling (Monte Carlo simulation using chain scores as distributional inputs); real-time updating
            (dynamic scenario probabilities as data arrives); multi-model comparison (different analysts applying
            the framework to the same system, testing whether the structural finding converges).
          </p>
        </section>
      </article>

      {/* How to cite */}
      <div className="rounded-md border border-oil-800 bg-oil-950/40 px-4 py-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">How to cite</p>
        <p className="text-xs text-gray-400 leading-relaxed font-mono">
          Kelly, J. (2026). <em>Compound Cascade Systems Modelling Framework: A Reusable Methodology for
          Building Probabilistic Risk Models of Systemic Crises</em>. SSRN Working Paper.{' '}
          <a
            href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6695618"
            target="_blank"
            rel="noopener noreferrer"
            className="text-oil-400 hover:underline"
          >
            papers.ssrn.com/abstract_id=6695618
          </a>
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-oil-800/40 pt-6 mt-8 space-y-3 text-xs text-gray-500">
        <p>
          <strong className="text-gray-400">Contact:</strong>{' '}
          <a href="mailto:jon@thethriveclan.com" className="text-oil-400 hover:underline">jon@thethriveclan.com</a>
        </p>
        <p>
          <strong className="text-gray-400">Also published on:</strong>{' '}
          <a href="https://ukoilwatch.com/methodology/compound-cascade" className="text-oil-400 hover:underline">ukoilwatch.com</a>
          {' · '}
          <a href="https://americasoilwatch.com/methodology/compound-cascade" className="text-oil-400 hover:underline">americasoilwatch.com</a>
        </p>
        <p className="italic">Version 2.0 — May 2026 — Developed by Jonathan Kelly</p>
      </footer>
    </div>
  );
}

interface ChecklistGroupProps {
  title: string;
  children: React.ReactNode;
}

function ChecklistGroup({ title, children }: ChecklistGroupProps) {
  return (
    <div>
      <p className="font-mono uppercase tracking-wider text-[10px] text-gray-500 mb-1">{title}</p>
      <ul className="space-y-1 pl-6 list-disc marker:text-oil-400 text-xs text-gray-400">
        {children}
      </ul>
    </div>
  );
}
