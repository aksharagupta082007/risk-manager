import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CopyCheck, AlertTriangle, Sparkles, Clock, IndianRupee } from 'lucide-react';
import { getDuplicateCases } from '../api';
import type { DuplicateCase } from '../types';
import { ActionBadge } from '../components/ActionBadge';

export const DuplicateIntent: React.FC = () => {
  const [cases, setCases] = useState<DuplicateCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCases(); }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getDuplicateCases();
      setCases(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getMatchTypeIcon = (type: string) => {
    if (type.includes('variant') || type.includes('bracket')) return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    if (type.includes('phone') || type.includes('cross')) return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
    return <CopyCheck className="w-3.5 h-3.5 text-indigo-400" />;
  };

  const getMatchTypeColor = (type: string) => {
    if (type.includes('variant') || type.includes('bracket')) return 'border-amber-500/30 bg-amber-500/5';
    if (type.includes('phone') || type.includes('cross')) return 'border-rose-500/30 bg-rose-500/5';
    return 'border-indigo-500/30 bg-indigo-500/5';
  };

  const totalMarginAtRisk = cases.reduce((acc, c) => acc + c.primary_amount + c.matched_amount, 0);

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 surface-card p-5 rounded-2xl">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <CopyCheck className="w-5 h-5 text-indigo-400" />
            Duplicate Intent Detection
          </h1>
          <p className="text-[10px] text-fintech-muted mt-0.5">
            Rule-based detection of multi-variant bracketing, cross-account sharing, and duplicate order velocity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl text-[10px] font-bold font-mono">
            {cases.length} cases
          </span>
          <span className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-bold font-mono flex items-center gap-1">
            <IndianRupee className="w-3 h-3" /> ₹{totalMarginAtRisk.toLocaleString()} at risk
          </span>
        </div>
      </div>

      {/* Pattern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: <Sparkles className="w-4 h-4 text-amber-400" />, title: 'Multi-Variant Bracketing', desc: 'Buyer orders Size M & L. 90%+ probability of returning one.', color: 'text-amber-400' },
          { icon: <AlertTriangle className="w-4 h-4 text-rose-400" />, title: 'Cross-Account Phone Match', desc: 'Same phone/address across multiple customer accounts.', color: 'text-rose-400' },
          { icon: <CopyCheck className="w-4 h-4 text-indigo-400" />, title: 'Duplicate Order Velocity', desc: 'Multiple identical COD orders within minutes.', color: 'text-indigo-400' },
        ].map((p, i) => (
          <div key={i} className="surface-card rounded-xl p-3.5 hover-lift">
            <div className={`flex items-center gap-2 text-[11px] font-bold ${p.color} mb-1`}>{p.icon} {p.title}</div>
            <p className="text-[10px] text-fintech-muted leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Cases */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-fintech-muted text-xs">Scanning for duplicate patterns...</div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-fintech-muted text-xs surface-card rounded-2xl">No duplicate intent cases detected.</div>
        ) : (
          cases.map((c, caseIdx) => {
            const marginAtRisk = c.primary_amount + c.matched_amount;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: caseIdx * 0.08, duration: 0.3 }}
                className={`surface-card rounded-2xl p-5 space-y-4 border ${getMatchTypeColor(c.match_type)} hover-lift`}
              >
                {/* Case Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-fintech-border/40 pb-3">
                  <div className="flex items-center gap-3">
                    {getMatchTypeIcon(c.match_type)}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-fintech-subcard text-fintech-text border border-fintech-border/50 font-mono">
                      {c.match_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-bold text-white">{c.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-fintech-muted">Confidence: <span className="font-bold text-indigo-400">{(c.confidence * 100).toFixed(0)}%</span></span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" /> ₹{marginAtRisk.toLocaleString()} at risk
                    </span>
                    <ActionBadge action={c.recommended_action} compact />
                  </div>
                </div>

                {/* Timeline + Order Cards */}
                <div className="flex items-start gap-4">
                  {/* Simple Timeline */}
                  <div className="flex flex-col items-center gap-1 pt-2 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-indigo-400" />
                    <div className="w-px h-12 bg-fintech-border" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-amber-400" />
                  </div>

                  {/* Order Cards */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-fintech-subcard/60 p-3 rounded-xl border border-fintech-border/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-fintech-muted uppercase font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Primary Order
                        </span>
                        <Link to={`/queue`} className="font-mono text-[10px] font-bold text-indigo-400 hover:underline">{c.primary_order_id}</Link>
                      </div>
                      <div className="text-[11px] font-bold text-white">₹{c.primary_amount.toLocaleString()}</div>
                      <div className="text-[10px] text-fintech-muted">Variant: {c.primary_variant || 'Default'}</div>
                    </div>

                    <div className="bg-fintech-subcard/60 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-amber-400 uppercase font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Matched Duplicate
                        </span>
                        <Link to={`/queue`} className="font-mono text-[10px] font-bold text-indigo-400 hover:underline">{c.matched_order_id}</Link>
                      </div>
                      <div className="text-[11px] font-bold text-white">₹{c.matched_amount.toLocaleString()}</div>
                      <div className="text-[10px] text-amber-300">Variant: {c.matched_variant || 'Default'}</div>
                    </div>
                  </div>
                </div>

                {/* Analysis */}
                <p className="text-[10px] text-fintech-muted bg-fintech-subcard/40 p-2.5 rounded-lg border border-fintech-border/30">
                  <strong className="text-fintech-text">Sentinel Analysis:</strong> {c.details}
                </p>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
