import React from 'react';
import CountUpComponent from 'react-countup';
const CountUp = (CountUpComponent as any).default || CountUpComponent;
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: 'primary' | 'safe' | 'confirm' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendPositive = true,
  color = 'primary'
}) => {
  const iconColorClasses = {
    primary: 'bg-fintech-bg text-fintech-primary border-fintech-border',
    safe: 'bg-fintech-bg text-fintech-safe border-fintech-border',
    confirm: 'bg-fintech-bg text-fintech-confirm border-fintech-border',
    danger: 'bg-fintech-bg text-fintech-danger border-fintech-border',
  }[color];

  // Parse numeric value for CountUp
  const numericMatch = typeof value === 'string' ? value.match(/[\d,]+/) : null;
  const numericValue = typeof value === 'number' ? value : numericMatch ? parseFloat(numericMatch[0].replace(/,/g, '')) : null;
  const prefix = typeof value === 'string' && numericMatch ? value.substring(0, numericMatch.index) : '';
  const suffix = typeof value === 'string' && numericMatch ? value.substring((numericMatch.index || 0) + numericMatch[0].length) : '';

  return (
    <div className="surface-card p-4 relative overflow-hidden hover-lift transition-all cursor-default group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-fintech-muted">{title}</span>
        <div className={`p-2 rounded-lg border ${iconColorClasses}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2">
        <div className="text-xl font-bold font-mono text-fintech-text">
          {numericValue !== null ? (
            <>
              {prefix}
              <CountUp end={numericValue} duration={1.8} separator="," preserveValue />
              {suffix}
            </>
          ) : (
            value
          )}
        </div>
        {(subtext || trend) && (
          <div className="flex items-center gap-2 mt-1 text-[10px]">
            {trend && (
              <span className={`font-semibold ${trendPositive ? 'text-fintech-safe' : 'text-fintech-danger'}`}>
                {trend}
              </span>
            )}
            {subtext && <span className="text-fintech-muted">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
