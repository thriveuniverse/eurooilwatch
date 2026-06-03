// Static, server-rendered directory of every département / provincia as plain
// <a> links, grouped by region. The interactive regional views use client-side
// navigation (router.push / dropdowns), which Googlebot can't follow — this
// gives crawlers a real internal-link path to every area page and spreads link
// authority from the country hub. Pure presentational; no client JS.

export interface DirectoryArea {
  code: string;
  name: string;
  group: string; // region / autonomous-community name, used for grouping
}

interface AreaDirectoryProps {
  heading: string;
  blurb: string;
  basePath: string; // e.g. "/country/fr/dept"
  areas: DirectoryArea[];
}

export default function AreaDirectory({ heading, blurb, basePath, areas }: AreaDirectoryProps) {
  const groups = new Map<string, DirectoryArea[]>();
  for (const a of areas) {
    if (!groups.has(a.group)) groups.set(a.group, []);
    groups.get(a.group)!.push(a);
  }
  const sortedGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [, list] of sortedGroups) list.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section aria-label={heading} className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4">
      <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase">{heading}</h2>
      <p className="mt-1 text-xs text-gray-500">{blurb}</p>
      <div className="mt-4 space-y-4">
        {sortedGroups.map(([group, list]) => (
          <div key={group}>
            <h3 className="text-[11px] font-semibold text-gray-300 mb-1.5">{group}</h3>
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
              {list.map((a) => (
                <li key={a.code}>
                  <a
                    href={`${basePath}/${a.code.toLowerCase()}`}
                    className="text-xs text-oil-400 hover:text-oil-300 hover:underline"
                  >
                    {a.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
