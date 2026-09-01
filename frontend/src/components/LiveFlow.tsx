import React, { useEffect, useRef, useState } from 'react';
import type { Order } from '../types';

interface LiveFlowProps {
  orders: Order[];
}

export const LiveFlow: React.FC<LiveFlowProps> = ({ orders }) => {
  const [dotOffset, setDotOffset] = useState(0);
  const animRef = useRef<number>(0);
  const latestHighRisk = orders.find(o => o.risk_score >= 55);

  const sentinelState: 'normal' | 'alert' | 'critical' =
    latestHighRisk && latestHighRisk.risk_score >= 75 ? 'critical' :
    latestHighRisk && latestHighRisk.risk_score >= 55 ? 'alert' : 'normal';

  useEffect(() => {
    let start: number | null = null;
    const duration = 3000;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = (elapsed % duration) / duration;
      setDotOffset(progress);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const getPointOnCurve = (t: number, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) => {
    const mt = 1 - t;
    return {
      x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
      y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
    };
  };

  // Path 1: Customer → Sentinel
  const p1 = getPointOnCurve(dotOffset, 80, 80, 200, 30, 320, 80);
  // Path 2: Sentinel → Merchant
  const p2 = getPointOnCurve(Math.max(0, (dotOffset - 0.15) / 0.85), 320, 80, 440, 130, 560, 80);

  const sentinelColor = sentinelState === 'critical' ? 'var(--theme-danger)' :
    sentinelState === 'alert' ? 'var(--theme-confirm)' : 'var(--theme-primary)';

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
      {/* SVG Flow Visualization */}
      <div className="xl:col-span-3 surface-card p-5 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-fintech-safe animate-ping-slow" />
          <span className="text-[11px] font-bold text-fintech-muted uppercase tracking-wider">Live Order Flow Pipeline</span>
        </div>

        <svg viewBox="0 0 640 160" className="w-full h-auto" style={{ maxHeight: '180px' }}>
          {/* Curved paths */}
          <path d="M 80 80 Q 200 30 320 80" fill="none" stroke="var(--theme-border)" strokeWidth="2" strokeDasharray="6 4" />
          <path d="M 320 80 Q 440 130 560 80" fill="none" stroke="var(--theme-border)" strokeWidth="2" strokeDasharray="6 4" />

          {/* Animated dots */}
          <circle cx={p1.x} cy={p1.y} r="4" fill="var(--theme-primary)" opacity={dotOffset < 0.95 ? 1 : 0} />
          <circle cx={p2.x} cy={p2.y} r="4" fill={sentinelColor} opacity={dotOffset > 0.15 ? 1 : 0} />

          {/* Node: Customer */}
          <g transform="translate(80, 80)">
            <circle r="28" fill="var(--theme-subcard)" stroke="var(--theme-border)" strokeWidth="2" />
            <circle r="28" fill="none" stroke="var(--theme-primary)" strokeWidth="1" opacity="0.3" />
            <text y="-6" textAnchor="middle" className="fill-fintech-primary" style={{ fontSize: '16px' }}>👤</text>
            <text y="10" textAnchor="middle" className="fill-fintech-muted" style={{ fontSize: '7px', fontWeight: 600 }}>CUSTOMER</text>
          </g>

          {/* Node: Sentinel */}
          <g transform="translate(320, 80)" style={{ transition: 'all 0.5s ease' }}>
            <circle r="34" fill="var(--theme-subcard)" stroke={sentinelColor} strokeWidth="2.5" />
            <text y="-8" textAnchor="middle" style={{ fontSize: '18px' }}>🛡️</text>
            <text y="8" textAnchor="middle" style={{ fontSize: '7px', fontWeight: 800, fill: sentinelColor }}>SENTINEL</text>
            <text y="18" textAnchor="middle" className="fill-fintech-muted" style={{ fontSize: '5px', fontWeight: 600 }}>v4 ENGINE</text>
          </g>

          {/* Node: Merchant */}
          <g transform="translate(560, 80)">
            <circle r="28" fill="var(--theme-subcard)" stroke="var(--theme-border)" strokeWidth="2" />
            <circle r="28" fill="none" stroke="var(--theme-safe)" strokeWidth="1" opacity="0.3" />
            <text y="-6" textAnchor="middle" style={{ fontSize: '16px' }}>🏪</text>
            <text y="10" textAnchor="middle" className="fill-fintech-muted" style={{ fontSize: '7px', fontWeight: 600 }}>MERCHANT</text>
          </g>

          {/* Status labels */}
          <text x="200" y="28" textAnchor="middle" className="fill-fintech-muted" style={{ fontSize: '6px' }}>SCORE & CLASSIFY</text>
          <text x="440" y="140" textAnchor="middle" className="fill-fintech-muted" style={{ fontSize: '6px' }}>ENFORCE ACTION</text>
        </svg>
      </div>

      {/* Live Transaction Feed */}
      <div className="xl:col-span-2 surface-card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-fintech-muted uppercase tracking-wider">Live Transaction Feed</span>
          <span className="text-[10px] font-mono text-fintech-primary">{orders.length} orders</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 max-h-[180px]">
          {recentOrders.map((order, idx) => {
            const riskColor = order.risk_score >= 75 ? 'text-fintech-danger bg-fintech-danger/10 border-fintech-danger/30' :
              order.risk_score >= 55 ? 'text-fintech-deposit bg-fintech-deposit/10 border-fintech-deposit/30' :
              order.risk_score >= 30 ? 'text-fintech-confirm bg-fintech-confirm/10 border-fintech-confirm/30' :
              'text-fintech-safe bg-fintech-safe/10 border-fintech-safe/30';

            return (
              <div
                key={order.order_id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-fintech-subcard border border-fintech-border animate-fade-slide-in hover-lift cursor-default"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-fintech-primary shrink-0">{order.order_id}</span>
                  <span className="text-[10px] text-fintech-muted truncate">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-fintech-text">₹{order.amount.toLocaleString()}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${riskColor}`}>
                    {order.risk_score}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
