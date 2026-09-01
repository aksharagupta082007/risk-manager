import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUpComponent from 'react-countup';
const CountUp = (CountUpComponent as any).default || CountUpComponent;
import {
  X, ShieldAlert, MessageSquare, CreditCard, ExternalLink,
  User, Package, History, Sparkles, CheckCircle2
} from 'lucide-react';
import {
  getOrderById, draftWhatsAppMessage, createDepositLink,
  copilotExplainOrder, recordOverride
} from '../api';
import type { Order } from '../types';
import { RiskGauge } from './RiskGauge';
import { ActionBadge } from './ActionBadge';

interface ThreatDrawerProps {
  orderId: string | null;
  onClose: () => void;
}

export const ThreatDrawer: React.FC<ThreatDrawerProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [waDraft, setWaDraft] = useState<any | null>(null);
  const [depositLinkData, setDepositLinkData] = useState<any | null>(null);
  const [overrideAction, setOverrideAction] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    } else {
      setOrder(null);
      setExplanation(null);
      setWaDraft(null);
      setDepositLinkData(null);
      setOverrideSuccess(null);
    }
  }, [orderId]);

  const loadOrder = async (id: string) => {
    setLoading(true);
    setExplanation(null);
    setWaDraft(null);
    setDepositLinkData(null);
    setOverrideSuccess(null);
    try {
      const data = await getOrderById(id);
      setOrder(data);
      setOverrideAction(data.recommended_action);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!orderId) return;
    setExplaining(true);
    try {
      const res = await copilotExplainOrder(orderId);
      setExplanation(res.explanation);
    } catch (e) { console.error(e); }
    finally { setExplaining(false); }
  };

  const handleWhatsApp = async () => {
    if (!orderId) return;
    try { const res = await draftWhatsAppMessage(orderId); setWaDraft(res); }
    catch (e) { console.error(e); }
  };

  const handleDeposit = async () => {
    if (!orderId) return;
    try { const res = await createDepositLink(orderId, 150); setDepositLinkData(res); }
    catch (e) { console.error(e); }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !overrideReason) return;
    try {
      await recordOverride(orderId, overrideAction, overrideReason);
      setOverrideSuccess(`Action overridden to '${overrideAction}'`);
      loadOrder(orderId);
    } catch (err) { console.error(err); }
  };

  const actionDescriptions: Record<string, string> = {
    a0_allow_cod: 'Low return risk. Safe for Cash on Delivery fulfillment.',
    a1_whatsapp_confirmation: 'Moderate risk detected. Send a WhatsApp confirmation to verify buyer intent before shipping.',
    a2_commitment_deposit: 'Elevated return risk. Request a ₹150 refundable commitment deposit to reduce RTO likelihood.',
    a3_prepaid_only_or_hold: 'High return risk. Convert to prepaid-only or hold shipment for manual review.',
  };

  const expectedLoss = order ? Math.round(order.amount * (order.risk_score / 100) * 0.3) : 0;
  const fpCost = order && order.risk_score < 55 ? 15 : order && order.risk_score < 75 ? 25 : 0;

  return (
    <AnimatePresence>
      {orderId && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 drawer-overlay"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[520px] z-50 surface-drawer overflow-y-auto"
          >
            {loading || !order ? (
              <div className="flex items-center justify-center h-full text-fintech-muted text-sm">
                Loading threat assessment...
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-fintech-muted tracking-widest">Threat Assessment</div>
                    <h2 className="text-lg font-extrabold font-mono text-fintech-primary">{order.order_id}</h2>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-fintech-subcard text-fintech-muted hover:text-fintech-text transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Risk Gauge + Score */}
                <div className="flex flex-col items-center surface-card p-4">
                  <RiskGauge score={order.risk_score} />
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-fintech-muted">Segment:</span>
                    <span className="text-xs font-mono text-fintech-text capitalize">{order.segment.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="surface-card p-4 space-y-2">
                  <div className="text-[10px] font-bold uppercase text-fintech-muted tracking-wider">Recommended Action</div>
                  <div className="flex items-center justify-between">
                    <ActionBadge action={order.recommended_action} />
                    <span className="text-[11px] font-mono font-bold text-fintech-safe">+₹{order.margin_impact} margin protected</span>
                  </div>
                  <p className="text-[11px] text-fintech-muted leading-relaxed">{actionDescriptions[order.recommended_action]}</p>
                </div>

                {/* Risk Economics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="surface-card p-3">
                    <div className="text-[9px] font-bold text-fintech-muted uppercase">Expected Loss if Ignored</div>
                    <div className="text-base font-bold font-mono text-fintech-danger mt-1">
                      ₹<CountUp end={expectedLoss} duration={1.2} separator="," />
                    </div>
                  </div>
                  <div className="surface-card p-3">
                    <div className="text-[9px] font-bold text-fintech-muted uppercase">Customer Friction Cost</div>
                    <div className="text-base font-bold font-mono text-fintech-confirm mt-1">
                      ₹<CountUp end={fpCost} duration={1.2} />
                    </div>
                  </div>
                </div>

                {/* Reason Codes - staggered */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase text-fintech-muted tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-fintech-primary" />
                    Risk Drivers
                  </div>
                  {order.reason_codes.map((rc, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.08, duration: 0.3 }}
                      className="p-3 bg-fintech-subcard border border-fintech-border rounded-lg flex items-start justify-between gap-3 hover-lift"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-fintech-primary">{rc.code}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            rc.impact === 'HIGH' ? 'bg-fintech-danger/10 text-fintech-danger' : 'bg-fintech-deposit/10 text-fintech-deposit'
                          }`}>{rc.impact || 'HIGH'}</span>
                        </div>
                        <p className="text-[11px] text-fintech-text leading-snug">{rc.description}</p>
                      </div>
                      <span className="text-[10px] font-mono text-fintech-muted shrink-0">w:{rc.weight || 1.0}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase text-fintech-muted tracking-wider">Execute Action</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleWhatsApp} className="py-2 px-3 bg-fintech-safe text-white font-semibold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all hover:opacity-90">
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Confirm
                    </button>
                    <button onClick={handleDeposit} className="py-2 px-3 bg-fintech-deposit text-white font-semibold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all hover:opacity-90">
                      <CreditCard className="w-3.5 h-3.5" /> Request Deposit
                    </button>
                    <button className="py-2 px-3 bg-fintech-subcard hover:bg-fintech-border text-fintech-text font-semibold text-[11px] rounded-xl border border-fintech-border flex items-center justify-center gap-1.5 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-fintech-safe" /> Allow COD
                    </button>
                    <button className="py-2 px-3 bg-fintech-danger text-white font-semibold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all hover:opacity-90">
                      <ShieldAlert className="w-3.5 h-3.5" /> Prepaid Only
                    </button>
                  </div>
                </div>

                {/* WhatsApp result */}
                {waDraft && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-fintech-safe/10 border border-fintech-safe/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-fintech-safe">WhatsApp Message Ready</span>
                      <a href={waDraft.wa_link} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-fintech-safe text-white text-[10px] font-bold rounded-lg hover:opacity-90 flex items-center gap-1">
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="bg-fintech-bg p-2.5 rounded-lg text-[10px] font-mono text-fintech-text whitespace-pre-wrap border border-fintech-border">{waDraft.message_text}</div>
                  </motion.div>
                )}

                {/* Deposit result */}
                {depositLinkData && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-fintech-deposit/10 border border-fintech-deposit/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-fintech-deposit">Razorpay Deposit Link</span>
                      <a href={depositLinkData.wa_link} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-fintech-deposit text-white text-[10px] font-bold rounded-lg hover:opacity-90 flex items-center gap-1">
                        Send via WA <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="bg-fintech-bg p-2 rounded-lg text-[10px] font-mono text-fintech-primary select-all border border-fintech-border truncate">{depositLinkData.razorpay_payment_link}</div>
                  </motion.div>
                )}

                {/* AI Copilot Explanation */}
                <div className="surface-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-fintech-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-fintech-primary" /> Risk Copilot
                    </span>
                    <button onClick={handleExplain} disabled={explaining} className="px-3 py-1 bg-fintech-primary hover:opacity-90 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 disabled:opacity-50 transition-all">
                      {explaining ? 'Analyzing...' : 'Explain Risk'}
                    </button>
                  </div>
                  {explanation ? (
                    <div className="p-3 bg-fintech-subcard rounded-lg border border-fintech-border text-[11px] text-fintech-text whitespace-pre-wrap leading-relaxed">{explanation}</div>
                  ) : (
                    <div className="text-[10px] text-fintech-muted italic">Click "Explain Risk" for a natural language assessment.</div>
                  )}
                </div>

                {/* Customer & Product Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="surface-card p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-fintech-primary">
                      <User className="w-3 h-3" /> Customer
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-fintech-muted">Name</span><span className="text-fintech-text font-semibold">{order.customer_name}</span></div>
                      <div className="flex justify-between"><span className="text-fintech-muted">Returns</span><span className={`font-bold ${(order.customer_return_rate || 0) > 0.4 ? 'text-fintech-danger' : 'text-fintech-safe'}`}>{((order.customer_return_rate || 0) * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span className="text-fintech-muted">Serial?</span><span className={order.is_serial_returner ? 'text-fintech-danger font-bold' : 'text-fintech-safe'}>{order.is_serial_returner ? 'YES' : 'NO'}</span></div>
                    </div>
                  </div>
                  <div className="surface-card p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-fintech-primary">
                      <Package className="w-3 h-3" /> Product
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="text-fintech-text font-semibold truncate">{order.product_name}</div>
                      <div className="flex justify-between"><span className="text-fintech-muted">Category</span><span className="text-fintech-text">{order.category}</span></div>
                      <div className="flex justify-between"><span className="text-fintech-muted">Var. RR</span><span className={`font-bold ${(order.product_return_rate || 0) > 0.25 ? 'text-fintech-danger' : 'text-fintech-safe'}`}>{((order.product_return_rate || 0) * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                </div>

                {/* Override */}
                <div className="surface-card p-4 space-y-3">
                  <div className="text-[10px] font-bold uppercase text-fintech-muted tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-fintech-primary" /> Merchant Override
                  </div>
                  {overrideSuccess && (
                    <div className="p-2 bg-fintech-safe/10 border border-fintech-safe/30 text-fintech-safe text-[10px] rounded-lg font-bold">{overrideSuccess}</div>
                  )}
                  <form onSubmit={handleOverride} className="space-y-2">
                    <select
                      className="w-full bg-fintech-subcard border border-fintech-border rounded-lg px-3 py-1.5 text-[11px] text-fintech-text focus:outline-none focus:border-fintech-primary"
                      value={overrideAction} onChange={e => setOverrideAction(e.target.value)}
                    >
                      <option value="a0_allow_cod">a0: Allow COD</option>
                      <option value="a1_whatsapp_confirmation">a1: WhatsApp Confirmation</option>
                      <option value="a2_commitment_deposit">a2: Commitment Deposit</option>
                      <option value="a3_prepaid_only_or_hold">a3: Prepaid Only / Hold</option>
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="text" placeholder="Reason for override..."
                        className="flex-1 bg-fintech-bg border border-fintech-border rounded-lg px-3 py-1.5 text-[11px] text-fintech-text focus:outline-none focus:border-fintech-primary placeholder-fintech-muted"
                        value={overrideReason} onChange={e => setOverrideReason(e.target.value)} required
                      />
                      <button type="submit" className="px-3 py-1.5 bg-fintech-primary hover:opacity-90 text-white font-bold text-[10px] rounded-lg whitespace-nowrap transition-all">Save</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
