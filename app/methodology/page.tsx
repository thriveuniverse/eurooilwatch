import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology | EuroOilWatch',
  description:
    'How EuroOilWatch collects, processes, and presents European fuel-price, stock, and reserve data. Source hierarchy, fuel-grade conventions, calculation methods, and citation guidelines.',
  alternates: { canonical: 'https://eurooilwatch.com/methodology' },
};

interface TierProps {
  num: string;
  label: string;
  desc: string;
}

function Tier({ num, label, desc }: TierProps) {
  return (
    <div className="grid grid-cols-[40px_1fr] gap-4 py-3 border-t border-oil-700/40 first:border-t-0 items-baseline">
      <div className="text-2xl font-mono text-amber-400/80 leading-none">{num}</div>
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-1 text-xs text-gray-400 leading-snug">{desc}</div>
      </div>
    </div>
  );
}

interface SourceRowProps {
  scope: string;
  source: string;
  flag: 'live' | 'planned';
  granularity: string;
}

function SourceRow({ scope, source, flag, granularity }: SourceRowProps) {
  return (
    <tr className="border-t border-oil-800/40">
      <td className="px-4 py-3 align-top">
        <span className="text-sm font-semibold text-white">{scope}</span>
      </td>
      <td className="px-4 py-3 align-top text-xs text-gray-400 font-mono">{source}</td>
      <td className="px-4 py-3 align-top">
        {flag === 'live' ? (
          <span className="inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-700/50 bg-emerald-950/30 text-emerald-300">
            Live
          </span>
        ) : (
          <span className="inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-amber-700/50 bg-amber-950/20 text-amber-300">
            Roadmap
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-top text-xs text-gray-400">{granularity}</td>
    </tr>
  );
}

interface SectionProps {
  idx: string;
  title: string;
  children: React.ReactNode;
}

function Section({ idx, title, children }: SectionProps) {
  return (
    <section className="space-y-4 pt-2">
      <h2 className="flex items-baseline gap-3 text-2xl font-bold text-white">
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-400/80 uppercase border border-amber-700/50 rounded px-2 py-0.5 flex-shrink-0">
          {idx}
        </span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}

interface FaqProps {
  q: string;
  children: React.ReactNode;
}

function Faq({ q, children }: FaqProps) {
  return (
    <details className="group border-b border-oil-800/40 last:border-b-0">
      <summary className="cursor-pointer py-4 text-sm font-semibold text-white flex justify-between items-center list-none">
        <span>{q}</span>
        <span className="text-amber-400 text-xl font-light group-open:rotate-45 transition">+</span>
      </summary>
      <div className="pb-4 text-sm text-gray-400 leading-relaxed space-y-2">{children}</div>
    </details>
  );
}

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-12">
      <header className="space-y-4">
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400 uppercase">
          EuroOilWatch · Methodology
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          How we measure European fuel prices, stocks, and reserves
        </h1>
        <p className="text-lg text-gray-300 leading-relaxed italic max-w-3xl">
          Every number we publish carries a source, a perimeter, and a timestamp. This page sets out exactly which
          data enters each calculation — so our figures can be questioned, reproduced, and cited with confidence.
        </p>
        <div className="flex flex-wrap gap-6 pt-4 text-xs text-gray-500 font-mono uppercase tracking-wider">
          <span><span className="text-gray-300">Coverage</span> · EU-27</span>
          <span><span className="text-gray-300">Fuel-price cadence</span> · Weekly</span>
          <span><span className="text-gray-300">Stocks cadence</span> · Monthly (~2-month lag)</span>
        </div>
      </header>

      {/* Source hierarchy block */}
      <section className="rounded-lg border border-amber-800/40 bg-oil-950/60 px-7 py-6">
        <h2 className="text-[10px] font-mono font-semibold tracking-widest text-amber-400/80 uppercase mb-4">
          Source hierarchy — highest authority first
        </h2>
        <Tier
          num="01"
          label="European Commission Weekly Oil Bulletin"
          desc="Harmonised weekly consumer prices across EU member states. The backbone of every cross-border comparison and country ranking."
        />
        <Tier
          num="02"
          label="Eurostat oil-stock and consumption datasets"
          desc="Monthly closing stocks (nrg_stk_oilm) and gross inland consumption (nrg_cb_oilm). Source for reserve days-of-supply."
        />
        <Tier
          num="03"
          label="EIA Europe Brent Spot Price"
          desc="Daily Brent reference series back to May 1987. The authoritative crude price for analytical work."
        />
        <Tier
          num="04"
          label="Stooq Brent futures (cb.f)"
          desc="Front-month Brent futures, intraday refresh, used for the live dashboard tile only."
        />
        <Tier
          num="05"
          label="Editorial panels"
          desc="Physical NWE Crude, War-Risk Watch, Fertilizer Watch — synthesised from publicly-cited trade-press sources. Marked as editorial estimates."
        />
      </section>

      <article className="text-[15px] text-gray-300 leading-relaxed space-y-4">
        <p>
          No single dataset describes European fuel security well. The European Commission&apos;s harmonised price
          bulletin is consistent but slow and national-only. Eurostat&apos;s stock series is authoritative but lags by
          months. Crude prices respond intraday but tell you nothing about pump-side transmission. So we stack these
          sources rather than pick one.
        </p>
        <p className="border-l-2 border-amber-700/60 pl-5 italic text-gray-200">
          The honest question is not &ldquo;what formula did you use?&rdquo; — it is &ldquo;which observations actually
          entered this number?&rdquo;
        </p>
        <p>
          Two analysts can apply an identical average and still diverge, because they quietly included different
          countries, fuel grades, weeks, or even definitions of price. The sections below document the inputs precisely
          so that ours can be reconstructed.
        </p>
      </article>

      <Section idx="01" title="Fuel prices — what we use today">
        <div className="space-y-4 text-[15px] text-gray-300 leading-relaxed">
          <p>
            All EU-27 retail fuel prices on EuroOilWatch come from the <strong className="text-white">European
            Commission DG Energy Weekly Oil Bulletin</strong>. The Commission collects national average consumer
            prices, including all taxes, from official authorities in each member state every Wednesday and
            publishes on Thursdays. We refresh our country table the same day.
          </p>
          <p>
            The Bulletin is harmonised across countries, which makes it the only sound foundation for cross-border
            comparison. We use it for every country ranking, EU-wide average, and weekly historical series.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-oil-800 mt-4">
          <table className="w-full text-left">
            <thead className="bg-oil-900/50">
              <tr>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-amber-400/80">Scope</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-amber-400/80">Source</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-amber-400/80">Status</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-amber-400/80">Granularity</th>
              </tr>
            </thead>
            <tbody>
              <SourceRow scope="All 27 EU member states" source="EC Weekly Oil Bulletin" flag="live" granularity="National weekly average" />
              <SourceRow scope="France — granular detail" source="prix-carburants.gouv.fr open feed" flag="live" granularity="Station-level → département + région rollups (daily)" />
              <SourceRow scope="Germany — granular detail" source="MTS-K market-transparency feeds" flag="planned" granularity="Station-level (planned: Land rollups)" />
              <SourceRow scope="Spain — granular detail" source="Geoportal de Hidrocarburos" flag="planned" granularity="Station-level (planned: autonomous communities)" />
              <SourceRow scope="Italy — granular detail" source="MIMIT carburanti datasets" flag="planned" granularity="Station-level (planned: regions)" />
              <SourceRow scope="UK — non-EU comparison" source="DESNZ weekly road-fuel statistics" flag="planned" granularity="National weekly average (handled separately)" />
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Roadmap rows describe national open datasets we plan to integrate as a second granularity layer beneath the
          EC bulletin. Until they go live the only layer visible on the site is the harmonised national bulletin —
          and rows are not silently mixed: a country&apos;s price always carries its source label.
        </p>
      </Section>

      <Section idx="02" title="Oil stocks and consumption — Eurostat">
        <div className="space-y-4 text-[15px] text-gray-300 leading-relaxed">
          <p>
            Monthly closing oil-stock levels for each EU member state come from Eurostat&apos;s{' '}
            <code className="bg-oil-800/60 px-1.5 py-0.5 rounded text-xs text-oil-200">nrg_stk_oilm</code>{' '}
            dataset, in thousand tonnes on national territory. Gross inland consumption comes from{' '}
            <code className="bg-oil-800/60 px-1.5 py-0.5 rounded text-xs text-oil-200">nrg_cb_oilm</code>.
          </p>
          <p>
            We track three fuel categories: motor gasoline (petrol), gas/diesel oil, and kerosene-type jet fuel.
            Both Eurostat series publish monthly with an approximate <strong className="text-white">two-month
            lag</strong> — the figure on the site today reflects the most recent fully-reported period, not real-time
            inventories.
          </p>
        </div>
      </Section>

      <Section idx="03" title="Crude oil prices — two Brent series">
        <div className="space-y-4 text-[15px] text-gray-300 leading-relaxed">
          <p>
            We use two different Brent series for two different jobs, and disclose both because they can diverge
            sharply during volatile markets.
          </p>
          <p>
            The <strong className="text-white">live dashboard card</strong> tracks Stooq&apos;s{' '}
            <code className="bg-oil-800/60 px-1.5 py-0.5 rounded text-xs text-oil-200">cb.f</code>{' '}
            front-month Brent futures — intraday, freely available, refreshes client-side. Front-month futures price
            expected near-term delivery and roll between contracts as months expire.
          </p>
          <p>
            The <strong className="text-white">&ldquo;Brent in historical context&rdquo; chart on{' '}
            <a href="/prices" className="text-oil-400 hover:underline">/prices</a></strong> draws from the U.S. Energy
            Information Administration&apos;s Europe Brent Spot Price FOB daily series (RBRTE), which goes back to
            20 May 1987. EIA spot is the more authoritative reference for analytical work — it is what most press
            and policy citations mean by &ldquo;Brent.&rdquo;
          </p>
          <p>
            In normal markets the spread between the two is about $1–3/bbl. During the Iran-war period of early 2026
            it widened past $25/bbl as the futures curve discounted a near-term ceasefire. Both numbers are real and
            sourced — they answer different questions. EUR conversion uses the current EUR/USD exchange rate.
          </p>
        </div>
      </Section>

      <Section idx="04" title="Days-of-supply calculation">
        <div className="space-y-3 text-[15px] text-gray-300 leading-relaxed">
          <p>&ldquo;Days of supply&rdquo; is calculated as:</p>
          <div className="p-4 bg-oil-950/80 rounded font-mono text-sm text-amber-200">
            Days = (Stock in kt / Monthly Consumption in kt) × 30
          </div>
          <p>
            This is an estimate. The EU&apos;s Oil Stocks Directive (2009/119/EC) requires member states to maintain
            emergency stocks equal to at least <strong className="text-white">90 days of net imports</strong> or{' '}
            <strong className="text-white">61 days of consumption</strong>, whichever is higher. We use 90 days as
            the reference threshold because most EU member states are significant net importers, so it is the
            binding constraint for the majority of countries.
          </p>
        </div>
      </Section>

      <Section idx="05" title="Reserve-status classification">
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5 space-y-2 text-sm text-gray-300">
          <p>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 align-middle" />
            <strong className="text-emerald-300">Safe</strong> — reserves exceed 110% of the 90-day minimum
          </p>
          <p>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2 align-middle" />
            <strong className="text-yellow-300">Watch</strong> — reserves at 95–110% of minimum (adequate but thinning)
          </p>
          <p>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 mr-2 align-middle" />
            <strong className="text-orange-300">Warning</strong> — reserves at 85–95% of minimum (approaching threshold)
          </p>
          <p>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2 align-middle" />
            <strong className="text-red-300">Critical</strong> — reserves below 85% of minimum
          </p>
        </div>
      </Section>

      <Section idx="06" title="Why not all prices mean the same thing">
        <div className="space-y-4 text-[15px] text-gray-300 leading-relaxed">
          <p>
            This is the caveat that most fuel-price comparisons skip — and the one most likely to mislead. A
            &ldquo;price&rdquo; from one source is not interchangeable with a &ldquo;price&rdquo; from another, even
            when both are sourced from the same Bulletin.
          </p>
          <p>
            The clearest trap is <strong className="text-white">Belgium</strong>. Belgian retail fuel pricing is
            regulated via a maximum-price ceiling published daily by FPS Economy. The figure that enters the EC
            Weekly Oil Bulletin reflects that <em>maximum permitted</em> price, not necessarily what motorists
            actually pay at the pump. Retailers may sell below it, so the published number is a ceiling, not an
            observed average. We display Belgium prices with that context, and any future granular-data integration
            for Belgium will distinguish observed prices from regulatory ceilings.
          </p>
          <p>
            The broader principle: each price is stored with its own source label and methodology flag, and
            comparisons across countries are drawn only after normalising fuel grade, unit, tax treatment, week,
            and geography.
          </p>
        </div>
      </Section>

      <Section idx="07" title="The four things that change a result">
        <div className="space-y-4 text-[15px] text-gray-300 leading-relaxed">
          <p>
            When two reproductions of one of our figures disagree, the cause is almost always one of the four below
            — not the arithmetic:
          </p>
          <ul className="space-y-2 text-sm text-gray-300 pl-1">
            <li className="flex gap-3">
              <span className="text-amber-400/70 font-mono text-xs mt-1">→</span>
              <span>
                The <strong className="text-white">fuel grade</strong> differs (E10 vs E5 vs B7 diesel; jet A vs
                jet A1).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400/70 font-mono text-xs mt-1">→</span>
              <span>
                The <strong className="text-white">cadence window</strong> differs — we report the latest weekly
                bulletin and the rolling 4-week trend; using a single day or a single month produces a different
                number.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400/70 font-mono text-xs mt-1">→</span>
              <span>
                The <strong className="text-white">geographic perimeter</strong> differs (single country vs
                EU-27 average vs euro-area subset).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400/70 font-mono text-xs mt-1">→</span>
              <span>
                The <strong className="text-white">tax treatment</strong> differs (consumer price including all
                taxes vs net-of-tax product price; we always quote the consumer figure unless explicitly noted).
              </span>
            </li>
          </ul>
          <p>
            State all four and any two analysts will converge. Omit one and they will not, however identical the
            formula looks.
          </p>
        </div>
      </Section>

      <Section idx="08" title="AI analysis">
        <div className="space-y-3 text-[15px] text-gray-300 leading-relaxed">
          <p>
            The AI analysis is generated by Claude (Anthropic) using the latest stock, price, and crude data. It
            provides a plain-English interpretation of the numbers and highlights notable trends or risks. The
            analysis is regenerated whenever the underlying data updates.
          </p>
          <p className="text-xs text-gray-500 italic">
            Analysis is AI-assisted and provided for informational purposes only. For important decisions, users
            should verify the underlying figures against official primary sources.
          </p>
        </div>
      </Section>

      <Section idx="09" title="Limitations">
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 p-5 space-y-3 text-sm text-gray-300">
          <p>
            <strong className="text-white">Data lag.</strong> Eurostat oil-stock data is published with an
            approximate two-month delay. The dashboard shows the most recent available period, not real-time stock
            levels.
          </p>
          <p>
            <strong className="text-white">Estimation.</strong> Days-of-supply is a calculated estimate, not a direct
            measurement. Actual reserve adequacy depends on import flows, refinery output, and demand patterns that
            vary day-to-day.
          </p>
          <p>
            <strong className="text-white">Coverage gaps.</strong> Not all member states report all fuel categories
            every period. Missing values are marked, not imputed.
          </p>
          <p>
            <strong className="text-white">National-only fuel pricing.</strong> Until our roadmap granular-data
            integrations go live, fuel prices on EuroOilWatch are national weekly averages from the EC Bulletin —
            we do not yet display sub-national variation.
          </p>
          <p>
            <strong className="text-white">Not affiliated with any government.</strong> EuroOilWatch is an
            independent fuel-monitoring platform built on publicly available EU data.
          </p>
        </div>
      </Section>

      {/* Citation block */}
      <section className="rounded-lg border-2 border-amber-700/60 bg-amber-950/10 p-7 space-y-4">
        <p className="text-[10px] font-mono font-semibold tracking-widest text-amber-400/80 uppercase">
          Citing a EuroOilWatch figure
        </p>
        <p className="text-[15px] text-gray-200 leading-relaxed">
          If you reference one of our numbers in an article, briefing, or dataset, please quote four things so
          readers can place it precisely:
        </p>
        <div className="flex flex-wrap gap-2">
          {['Fuel grade', 'Country / perimeter', 'Bulletin week', 'Link to /methodology'].map((field) => (
            <span
              key={field}
              className="text-xs font-mono font-semibold px-3 py-1.5 bg-oil-950/80 border border-amber-700/40 rounded-full text-amber-200"
            >
              {field}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-400 italic border-l-2 border-amber-700/40 pl-4">
          &ldquo;French E10 averaged €1.84 in the week to 25 May 2026 (EuroOilWatch, national weekly bulletin) —
          eurooilwatch.com/methodology.&rdquo;
        </p>
      </section>

      {/* FAQ */}
      <Section idx="10" title="Frequently asked">
        <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5">
          <Faq q="Can I reproduce your national averages myself?">
            <p>
              Yes — that is the point of this page. The EC Weekly Oil Bulletin is the reference dataset; download
              the matching week, filter for the country and fuel grade, and your figure should reproduce ours to
              the cent.
            </p>
          </Faq>
          <Faq q="Why might your figure differ slightly from another tracker's?">
            <p>
              Almost always because of a different fuel grade, week, perimeter, or tax treatment — not different
              arithmetic. A tracker using a single-day rather than a weekly figure, or comparing
              tax-inclusive against net-of-tax prices, will land somewhere else from the same underlying data.
            </p>
          </Faq>
          <Faq q="Is the UK part of your EU averages?">
            <p>
              No. UK data, when published, comes from DESNZ as a separate non-EU comparison series and is never
              blended into the EU-27 harmonised figures.
            </p>
          </Faq>
          <Faq q="When will sub-national pricing go live?">
            <p>
              The granular open datasets we plan to integrate — French prix-carburants, German MTS-K, Spanish
              Geoportal, Italian MIMIT — are listed in section 01 as roadmap items. We will announce each one as
              it goes live, and the source table here will flip the row from &ldquo;Roadmap&rdquo; to
              &ldquo;Live.&rdquo;
            </p>
          </Faq>
          <Faq q="May I cite this page?">
            <p>
              Yes. Reuse and verification are exactly what it exists for. Please include the fuel grade,
              country / perimeter, bulletin week, and a link as set out above.
            </p>
          </Faq>
        </div>
      </Section>

      <footer className="border-t border-oil-800/40 pt-6 mt-4 space-y-3 text-xs text-gray-500 leading-relaxed">
        <p>
          <strong className="text-gray-400">Network:</strong> EuroOilWatch is part of the OilWatch network alongside{' '}
          <a href="https://ukoilwatch.com" className="text-oil-400 hover:underline">UKOilWatch</a> and{' '}
          <a href="https://americasoilwatch.com" className="text-oil-400 hover:underline">AmericasOilWatch</a>.
        </p>
        <p>
          <strong className="text-gray-400">Sources:</strong> European Commission Weekly Oil Bulletin (DG ENER);
          Eurostat (nrg_stk_oilm, nrg_cb_oilm); U.S. EIA (RBRTE); Stooq (cb.f). Methodology last reviewed{' '}
          {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.
        </p>
      </footer>
    </div>
  );
}
