import React from 'react';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const RiskBadge: React.FC<{ level: RiskLevel | string }> = ({ level }) => {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    low: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)', text: '#34d399' },
    medium: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
    high: { bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.3)', text: '#fb923c' },
    critical: { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
  };
  
  const s = styles[level] || styles.low;
  return (
    <span style={{ background: s.bg, border: `0.5px solid ${s.border}`, color: s.text }} className="px-2 py-0.5 rounded-full text-xs font-bold uppercase whitespace-nowrap">
      {level}
    </span>
  );
};
