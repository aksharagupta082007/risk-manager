import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowRight } from 'lucide-react';
import { getOverrides } from '../api';
import type { OverrideLogItem } from '../types';
import { ActionBadge } from '../components/ActionBadge';

export const OverrideLog: React.FC = () => {
  const [overrides, setOverrides] = useState<OverrideLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOverrides(); }, []);

  const fetchOverrides = async () => {
    try {
      setLoading(true);
      const data = await getOverrides();
      setOverrides(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 surface-card p-5 rounded-2xl">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Merchant Override Audit Log
          </h1>
          <p className="text-[10px] text-fintech-muted mt-0.5">
            Audit trail of manual actions overriding the Sentinel model's recommendation.
          </p>
        </div>
        <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl text-[10px] font-bold font-mono">
          {overrides.length} Overrides
        </span>
      </div>

      {/* Table */}
      <div className="surface-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-fintech-muted text-xs">Loading audit history...</div>
        ) : overrides.length === 0 ? (
          <div className="p-12 text-center text-fintech-muted text-xs">No overrides recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-fintech-subcard/50 text-fintech-muted uppercase font-bold text-[9px] tracking-wider border-b border-fintech-border">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Action Shift</th>
                  <th className="p-3">Override Reason</th>
                  <th className="p-3">Merchant ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fintech-border/30 font-medium">
                {overrides.map(ov => (
                  <tr key={ov.id} className="hover:bg-fintech-subcard/40 transition-all">
                    <td className="p-3">
                      <div className="font-mono text-[10px] text-fintech-muted">{timeAgo(ov.created_at)}</div>
                      <div className="text-[9px] text-fintech-border-light">{new Date(ov.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-400">
                      <Link to={`/queue`} className="hover:underline">{ov.order_id}</Link>
                    </td>
                    <td className="p-3 text-fintech-text font-semibold">{ov.customer_name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-50"><ActionBadge action={ov.old_action} compact /></span>
                        <ArrowRight className="w-3 h-3 text-fintech-muted" />
                        <ActionBadge action={ov.new_action} compact />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="bg-fintech-subcard/50 border border-fintech-border/30 px-2 py-1.5 rounded-lg text-fintech-text text-[10px]">
                        {ov.reason}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-fintech-muted">{ov.merchant_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
