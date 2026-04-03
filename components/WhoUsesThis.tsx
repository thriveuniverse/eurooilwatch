export default function WhoUsesThis() {
  const segments = [
    {
      label: 'Fleet & Logistics',
      desc: 'Track diesel reserve pressure across your operating countries',
      icon: '🚛',
    },
    {
      label: 'Procurement',
      desc: 'Monitor price trends to time fuel contract negotiations',
      icon: '📋',
    },
    {
      label: 'Research & Analysis',
      desc: '18-month trend data across 27 countries, one dashboard',
      icon: '📊',
    },
    {
      label: 'Journalism',
      desc: 'Source-linked data for energy and supply-chain reporting',
      icon: '📰',
    },
    {
      label: 'Policy',
      desc: 'Country-by-country reserve compliance monitoring',
      icon: '🏛️',
    },
  ];

  return (
    <section aria-label="Who uses EuroOilWatch" className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-5">
      <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-4">
        Who Uses EuroOilWatch
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {segments.map((seg) => (
          <div key={seg.label} className="rounded-lg bg-oil-900/40 border border-oil-800/50 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{seg.icon}</span>
              <span className="text-sm font-medium text-white">{seg.label}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{seg.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
