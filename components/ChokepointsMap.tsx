type RiskLevel = 'normal' | 'elevated' | 'high' | 'critical';

const RISK_FILL: Record<RiskLevel, string> = {
  normal:   '#22c55e',
  elevated: '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

interface Props {
  title?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export default function ChokepointsMap({
  title = 'Global Supply Chokepoints — Risk Overview',
  imageSrc = '/img/china-energy-infrastructure.webp',
  imageAlt = 'World map showing maritime supply chokepoints affecting UK and European fuel security',
}: Props) {
  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          {title}
        </h2>
      </div>

      <div className="bg-[#08111e]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={imageAlt} className="w-full h-auto block" />
      </div>

      <div className="px-5 py-2 border-t border-oil-800/40 bg-oil-900/30">
        <div className="flex items-center gap-4 flex-wrap text-[10px] text-gray-500">
          <span className="font-mono uppercase tracking-wider text-gray-600">Risk:</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: RISK_FILL.normal }} />Normal</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: RISK_FILL.elevated }} />Elevated</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: RISK_FILL.high }} />High</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: RISK_FILL.critical }} />Critical</span>
        </div>
      </div>
    </div>
  );
}
