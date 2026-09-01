import React from 'react';

interface RiskGaugeProps {
  score: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));

  let colorClass = 'var(--theme-safe)';
  if (normalizedScore >= 75) { colorClass = 'var(--theme-danger)'; }
  else if (normalizedScore >= 55) { colorClass = 'var(--theme-deposit)'; }
  else if (normalizedScore >= 30) { colorClass = 'var(--theme-confirm)'; }

  return (
    <div className="flex flex-col items-center justify-center relative py-2">
      <svg className="w-44 h-26 overflow-visible" viewBox="0 0 100 55">
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="var(--theme-border)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Color filled arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={colorClass}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="126"
          strokeDashoffset={126 - (normalizedScore / 100) * 126}
          className="transition-all duration-1000 ease-out"
        />
        {/* Center score text */}
        <text x="50" y="42" textAnchor="middle" className="fill-fintech-text font-mono" style={{ fontSize: '18px', fontWeight: 800 }}>
          {score}%
        </text>
        <text x="50" y="53" textAnchor="middle" className="fill-fintech-muted" style={{ fontSize: '5.5px', fontWeight: 600, letterSpacing: '0.5px' }}>
          RTO RETURN RISK
        </text>
      </svg>
    </div>
  );
};
