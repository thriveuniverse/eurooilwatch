// Unique, data-driven lead sentence for each département / provincia page:
// the cheapest station today vs the area average, per fuel. Purely
// presentational — each page computes the lines from its own typed data and
// passes plain values in. This turns otherwise-templated area pages into
// genuinely unique, daily-changing content (helps them cross from
// "Discovered – currently not indexed" to Indexed when Google crawls them).

export interface FuelSummaryLine {
  label: string; // e.g. "Gasóleo A" / "Gazole" / "Gasolio"
  cheapest: number; // lowest station price, €/litre
  where: string; // cheapest station location, e.g. "Repsol, Madrid" or "Lyon"
  average: number; // area mean, €/litre
  count: number; // stations reporting this fuel
}

interface Props {
  areaName: string;
  areaKind: string; // "département" | "provincia"
  asOf?: string;
  lines: FuelSummaryLine[]; // ordered; first is the headline fuel
}

export default function AreaPriceSummary({ areaName, areaKind, asOf, lines }: Props) {
  if (lines.length === 0) return null;
  const head = lines[0];
  const saving = head.average - head.cheapest;
  const rest = lines.slice(1);

  return (
    <section
      aria-label={`Cheapest fuel in ${areaName}`}
      className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4"
    >
      <p className="text-sm text-gray-200 leading-relaxed">
        The cheapest <strong>{head.label.toLowerCase()}</strong> in {areaName} right now is{' '}
        <strong className="text-white">€{head.cheapest.toFixed(3)}</strong>/litre at {head.where}
        {saving > 0.005 ? (
          <>
            {' '}
            — about <strong>€{saving.toFixed(2)}</strong> below the {areaKind} average of €
            {head.average.toFixed(3)} across {head.count} stations
          </>
        ) : null}
        .
        {rest.length > 0 ? (
          <>
            {' '}
            {rest
              .map((r) => `${r.label} starts at €${r.cheapest.toFixed(3)}/l (average €${r.average.toFixed(3)})`)
              .join('; ')}
            .
          </>
        ) : null}
      </p>
      {asOf ? (
        <p className="mt-1 text-[10px] text-gray-500">
          Live station data, updated{' '}
          {new Date(asOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
        </p>
      ) : null}
    </section>
  );
}
