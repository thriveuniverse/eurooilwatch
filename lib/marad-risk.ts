export type RiskLevel = 'normal' | 'elevated' | 'high' | 'critical';

export interface MaradAdvisory {
  id: string;
  type: 'advisory' | 'alert';
  title: string;
  region: string;
  incident: string;
  severity: RiskLevel;
  year: number;
  num: number;
  url: string;
}

export interface MaradFile {
  lastUpdated: string;
  advisories: MaradAdvisory[];
}

export interface MaradOverride {
  risk: RiskLevel;
  riskLabel: string;
  lastReviewed: string;
  sourceId: string;
  sourceUrl: string;
}

const RISK_RANK: Record<RiskLevel, number> = { normal: 0, elevated: 1, high: 2, critical: 3 };

const SEVERITY_WORD: Record<RiskLevel, string> = {
  critical: 'Critical',
  high: 'High',
  elevated: 'Elevated',
  normal: 'Normal',
};

// Map our chokepoint ids to the MARAD region phrases that imply them.
// Only chokepoints MARAD directly covers are listed; others stay editorial.
const REGION_PATTERN: Record<string, RegExp> = {
  'hormuz':        /\b(hormuz|persian gulf|gulf of oman)\b/i,
  'bab-el-mandeb': /\b(bab\s*el\s*mandeb|red sea|gulf of aden)\b/i,
};

export function maradOverrideFor(
  chokepointId: string,
  advisories: MaradAdvisory[],
  lastUpdated: string,
  currentRisk?: RiskLevel,
): MaradOverride | null {
  const re = REGION_PATTERN[chokepointId];
  if (!re) return null;
  const matches = advisories.filter(a => re.test(a.region));
  if (matches.length === 0) return null;

  const maxYear = Math.max(...matches.map(a => a.year));
  const recent = matches.filter(a => a.year === maxYear);
  const top = recent.reduce((acc, a) => (RISK_RANK[a.severity] > RISK_RANK[acc.severity] ? a : acc));

  // MARAD only escalates — never downgrades editorial judgement.
  // If MARAD's severity isn't strictly higher than the current editorial level,
  // leave the chokepoint alone.
  if (currentRisk && RISK_RANK[top.severity] <= RISK_RANK[currentRisk]) return null;

  return {
    risk: top.severity,
    riskLabel: `${SEVERITY_WORD[top.severity]} — MARAD ${top.id}: ${top.incident}`,
    lastReviewed: (lastUpdated || '').slice(0, 10),
    sourceId: top.id,
    sourceUrl: top.url,
  };
}
