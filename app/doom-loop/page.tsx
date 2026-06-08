import type { Metadata } from 'next';
import ToolFrame from '@/components/ToolFrame';

export const metadata: Metadata = {
  title: 'The Doom Loop Engine — interactive oil-supply cascade simulator',
  description:
    'Two interactive instruments for the compound-cascade framework: a fragility risk register and a buffer-coupled Monte-Carlo simulator that models when oil supply tips into physical allocation. A reasoning tool, not a forecast — every input is yours to change.',
  alternates: { canonical: 'https://eurooilwatch.com/doom-loop' },
  openGraph: {
    title: 'The Doom Loop Engine — OilWatch',
    description:
      'Interactive compound-cascade tools modelling when global oil supply tips into allocation. Change the assumptions and argue with the result.',
    url: 'https://eurooilwatch.com/doom-loop',
    type: 'website',
  },
};

const LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'The Doom Loop Engine',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web browser',
  isAccessibleForFree: true,
  url: 'https://eurooilwatch.com/doom-loop',
  description:
    'Interactive compound-cascade tools modelling when global oil supply tips into physical allocation: a fragility risk register and a buffer-coupled Monte-Carlo simulator.',
  publisher: { '@type': 'Organization', name: 'EuroOilWatch', url: 'https://eurooilwatch.com' },
};

export default function DoomLoopPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />

      <header className="space-y-3">
        <div className="text-[11px] font-mono font-semibold tracking-[0.3em] text-oil-400 uppercase">
          OilWatch Intelligence · Compound-cascade simulator
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">The Doom Loop Engine</h1>
        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
          Two interactive instruments for thinking about how an oil-supply shock could compound. They are
          reasoning scaffolds, not forecasts: every probability, edge and buffer figure is a subjective input
          you can change. The tools propagate your assumptions — they do not validate them. Their value is that
          a sceptic can sit down, move the sliders, and watch the catastrophe either build or dissolve under
          their own hand.
        </p>
      </header>

      {/* Two tools, two questions */}
      <section className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase mb-2">
          Two tools, two questions
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          The two instruments answer <span className="text-gray-200">different</span> questions and can
          legitimately disagree. The <span className="text-oil-300">Fragility Monitor</span> ranks the
          individual failure modes by expected harm — <em>what to worry about most right now</em>. The{' '}
          <span className="text-oil-300">Doom Loop Engine</span> lets those failure modes interact and draw down
          a finite buffer — <em>whether they compound into allocation, and when</em>. A risk can top the
          first while barely moving the second; that is the difference between a big standalone threat and a
          big <em>systemic</em> one, not a contradiction.
        </p>
      </section>

      {/* Tool 1 — Fragility Monitor */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1 · Systemic Fragility Monitor</h2>
        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
          A node-level risk register. Each failure mode scores <span className="font-mono">P × Impact</span>,
          re-priced by the ceasefire master-variable and ranked by expected harm. The on-ramp: scannable in
          seconds.
        </p>
        <ToolFrame src="/fragility-monitor.html" title="Systemic Fragility Monitor" minHeight={1500} />
      </section>

      {/* Tool 2 — Doom Loop Engine */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2 · The Doom Loop Engine</h2>
        <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
          The dynamic model. The same failure modes become continuous stress levels that interact through a
          feedback graph and draw down the drawable cushion above the allocation floor. It runs thousands of
          trials on every change and reports the probability of allocation, the time-to-allocation, and — via
          the sensitivity sweep — which assumptions actually move the answer.
        </p>
        <ToolFrame src="/doom-loop-engine.html" title="The Doom Loop Engine" minHeight={2200} />
      </section>

      {/* Callout — two numbers do the heavy lifting */}
      <section className="rounded-lg border border-oil-700/60 bg-oil-900/40 px-6 py-5 space-y-3">
        <h2 className="text-base font-bold text-white">Two numbers do the heavy lifting</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          It is tempting to think a compound-cascade model lives in its web of interactions — eight failure
          modes, thirteen feedback edges, a master variable for the war. Run the sensitivity sweep in the engine
          above, though, and something humbling falls out: almost the entire spread in the probability of
          allocation comes from just two numbers — how fast a stressed system draws down the global buffer, and
          how large that buffer is.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          Move any single failure mode&apos;s likelihood, or any edge between them, by half in either direction
          and the headline barely twitches. Move the draw rate or the cushion by the same amount and it swings
          by fifty points.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          That isn&apos;t the cascade being irrelevant — it&apos;s the cascade telling you where its own
          fragility lives. The nodes and edges are the engine that creates the draw in the first place; the
          cushion and the draw rate are the gate the outcome is most sensitive to. And those two are the two we
          can actually measure: the rate the world is drawing on its spare barrels, and how many spare barrels
          remain. The vulnerability was never in the wiring — it&apos;s in the cushion. Pin those two numbers
          down with data, and stop agonising over edge weights you can&apos;t observe — until the scenario
          worsens, the network lights up, and the wiring starts to bite again.
        </p>
        <blockquote className="border-l-2 border-oil-500 pl-4 text-sm italic text-oil-200">
          The vulnerability was never in the wiring — it&apos;s in the cushion.
        </blockquote>
      </section>

      <p className="text-sm text-gray-500">
        The framework behind these tools:{' '}
        <a href="/methodology/compound-cascade" className="text-oil-400 hover:text-white underline underline-offset-2">
          Compound Cascade methodology →
        </a>
      </p>
    </div>
  );
}
