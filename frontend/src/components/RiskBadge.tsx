import React from 'react';

interface RiskBadgeProps {
  score: number;
  segment?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, segment, size = 'md' }) => {
  let colorClasses = 'bg-fintech-bg text-fintech-safe border-fintech-border';

  if (score >= 75) {
    colorClasses = 'bg-fintech-danger/10 text-fintech-danger border-fintech-danger/30';
  } else if (score >= 55) {
    colorClasses = 'bg-fintech-deposit/10 text-fintech-deposit border-fintech-deposit/30';
  } else if (score >= 30) {
    colorClasses = 'bg-fintech-confirm/10 text-fintech-confirm border-fintech-confirm/30';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded-md font-semibold',
    md: 'text-xs px-2 py-0.5 rounded-lg font-semibold',
    lg: 'text-sm px-3 py-1 rounded-xl font-bold',
  }[size];

  return (
    <div className={`inline-flex items-center gap-1 border ${colorClasses} ${sizeClasses}`}>
      <span className="font-mono">{score}%</span>
      {segment && <span className="opacity-80 text-[9px] font-normal">({segment.replace(/_/g, ' ')})</span>}
    </div>
  );
};
