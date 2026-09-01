import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, DollarSign, AlertTriangle, Award, ArrowUpRight,
  BarChart2, Target, ShieldCheck, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { getOrders, getModelMetrics } from '../api';
import type { Order, ModelMetricsResponse } from '../types';
import { MetricCard } from '../components/MetricCard';
import { RiskBadge } from '../components/RiskBadge';
import { ActionBadge } from '../components/ActionBadge';
import { LiveFlow } from '../components/LiveFlow';

export const CommandCenter: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [oData, mData] = await Promise.all([getOrders(), getModelMetrics()]);
      setOrders(oData);
      setMetrics(mData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm text-fintech-muted font-medium">Initializing Sentinel v4 Command Center...</div>
        </div>
      </div>
    );
  }

  const totalOrders = orders.length;
  const highRiskOrders = orders.filter(o => o.risk_score >= 30);
  const totalPreventedLoss = orders.reduce((acc, o) => acc + (o.margin_impact || 0), 0);
  const totalFpCost = orders.filter(o => o.risk_score >= 30 && o.risk_score < 55).length * 15.0;
  const netMarginSaved = Math.max(0, totalPreventedLoss - totalFpCost);

  const bench = metrics?.benchmark_metrics;
  const currentF1 = bench?.balanced_best_f1?.f1 || 0.77558;
  const currentPrecision = bench?.balanced_best_f1?.precision || 0.69948;
  const currentRecall = bench?.balanced_best_f1?.recall || 0.87026;

  const riskBands = [
    { name: 'Low (0-30%)', count: orders.filter(o => o.risk_score < 30).length, fill: '#22c55e' },
    { name: 'Medium (30-55%)', count: orders.filter(o => o.risk_score >= 30 && o.risk_score < 55).length, fill: '#eab308' },
    { name: 'High (55-75%)', count: orders.filter(o => o.risk_score >= 55 && o.risk_score < 75).length, fill: '#f97316' },
    { name: 'Critical (75-100%)', count: orders.filter(o => o.risk_score >= 75).length, fill: '#ef4444' },
  ];

  const actionDist = [
    { name: 'Allow COD', value: orders.filter(o => o.recommended_action === 'a0_allow_cod').length, color: '#22c55e' },
    { name: 'WhatsApp', value: orders.filter(o => o.recommended_action === 'a1_whatsapp_confirmation').length, color: '#eab308' },
    { name: 'Deposit', value: orders.filter(o => o.recommended_action === 'a2_commitment_deposit').length, color: '#f97316' },
    { name: 'Prepaid/Hold', value: orders.filter(o => o.recommended_action === 'a3_prepaid_only_or_hold').length, color: '#ef4444' },
  ];

  const marginTrendData = [
    { day: 'Mon', prevented: 5400, netSaved: 4950 },
    { day: 'Tue', prevented: 7200, netSaved: 6600 },
    { day: 'Wed', prevented: 6100, netSaved: 5580 },
    { day: 'Thu', prevented: 8900, netSaved: 8190 },
    { day: 'Fri', prevented: 9800, netSaved: 8970 },
    { day: 'Sat', prevented: 11200, netSaved: 10250 },
    { day: 'Sun', prevented: 12500, netSaved: 11450 },
  ];

  const categoryRiskData = [
    { category: 'Footwear', avgRisk: 68 },
    { category: 'Fashion', avgRisk: 58 },
    { category: 'Jewelry', avgRisk: 42 },
    { category: 'Electronics', avgRisk: 28 },
    { category: 'Beauty', avgRisk: 14 },
  ];

  const tooltipStyle = { backgroundColor: '#131824', borderColor: '#2a3447', color: '#f1f5f9', borderRadius: '8px', fontSize: '11px' };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <MetricCard title="Total Orders" value={totalOrders} subtext="Processed today" icon={BarChart2} color="primary" />
        <MetricCard title="High-Risk" value={highRiskOrders.length} subtext={`${((highRiskOrders.length / Math.max(totalOrders, 1)) * 100).toFixed(1)}% flagged`} icon={AlertTriangle} color="confirm" />
        <MetricCard title="Prevented Loss" value={`₹${totalPreventedLoss.toLocaleString()}`} subtext="RTO logistics" icon={TrendingUp} color="safe" />
        <MetricCard title="FP Cost" value={`₹${totalFpCost.toLocaleString()}`} subtext="Customer friction" icon={DollarSign} color="danger" />
        <MetricCard title="Net Saved" value={`₹${netMarginSaved.toLocaleString()}`} subtext="Net margin" icon={Award} color="safe" trend="+18.4%" />
        <MetricCard title="Precision" value={`${(currentPrecision * 100).toFixed(1)}%`} subtext="True positive rate" icon={Target} color="primary" />
        <MetricCard title="F1 Score" value={(currentF1).toFixed(4)} subtext={`Recall: ${(currentRecall * 100).toFixed(1)}%`} icon={ShieldCheck} color="primary" />
      </div>

      {/* Live Flow Section */}
      <LiveFlow orders={orders} />

      {/* Sentinel v4 Benchmark Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Balanced */}
        <div className="surface-card rounded-2xl p-5 space-y-3 relative overflow-hidden hover-lift">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Balanced @bestF1</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold">Recommended</span>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-center">
            {[
              { label: 'AUC', val: bench?.balanced_best_f1.auc, color: 'text-fintech-text' },
              { label: 'Precision', val: `${((bench?.balanced_best_f1.precision || 0) * 100).toFixed(1)}%`, color: 'text-emerald-400' },
              { label: 'Recall', val: `${((bench?.balanced_best_f1.recall || 0) * 100).toFixed(1)}%`, color: 'text-indigo-400' },
              { label: 'F1', val: bench?.balanced_best_f1.f1, color: 'text-emerald-400' },
              { label: 'PR-AUC', val: bench?.balanced_best_f1.pr_auc, color: 'text-fintech-text' },
              { label: 'Flag Rate', val: `${((bench?.balanced_best_f1.flag_rate || 0) * 100).toFixed(1)}%`, color: 'text-amber-400' },
            ].map((m, i) => (
              <div key={i} className="bg-fintech-subcard/50 p-2 rounded-lg border border-fintech-border/50">
                <div className="text-[9px] text-fintech-muted">{m.label}</div>
                <div className={`text-xs font-bold mt-0.5 ${m.color}`}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Aggressive */}
        <div className="surface-card rounded-2xl p-5 space-y-3 relative overflow-hidden hover-lift">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Aggressive @95R / Festival</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">High Defense</span>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-center">
            {[
              { label: 'AUC', val: bench?.aggressive_95r.auc, color: 'text-fintech-text' },
              { label: 'Precision', val: `${((bench?.aggressive_95r.precision || 0) * 100).toFixed(1)}%`, color: 'text-amber-400' },
              { label: 'Recall', val: `${((bench?.aggressive_95r.recall || 0) * 100).toFixed(1)}%`, color: 'text-emerald-400' },
              { label: 'F1', val: bench?.aggressive_95r.f1, color: 'text-fintech-text' },
              { label: 'PR-AUC', val: bench?.aggressive_95r.pr_auc, color: 'text-fintech-text' },
              { label: 'Flag Rate', val: `${((bench?.aggressive_95r.flag_rate || 0) * 100).toFixed(1)}%`, color: 'text-rose-400' },
            ].map((m, i) => (
              <div key={i} className="bg-fintech-subcard/50 p-2 rounded-lg border border-fintech-border/50">
                <div className="text-[9px] text-fintech-muted">{m.label}</div>
                <div className={`text-xs font-bold mt-0.5 ${m.color}`}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Distribution */}
        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-3">Risk Score Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBands} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskBands.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Distribution */}
        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-3">Policy Action Distribution</h3>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={actionDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {actionDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Margin Trend */}
        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-3">Weekly Margin Protection Trend (₹)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginTrendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="prevented" name="Prevented Loss" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="netSaved" name="Net Saved" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Risk */}
        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-3">Category RTO Risk Baseline (%)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={categoryRiskData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={65} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgRisk" name="Avg Risk %" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Preview Table */}
      <div className="surface-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white">Recent High-Risk Orders</h3>
          <Link to="/queue" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View All ({highRiskOrders.length}) <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-fintech-subcard/50 text-fintech-muted uppercase font-bold text-[9px] tracking-wider">
              <tr>
                <th className="p-2.5">Order</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Amount</th>
                <th className="p-2.5">Payment</th>
                <th className="p-2.5">Risk</th>
                <th className="p-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/30 font-medium">
              {highRiskOrders.slice(0, 5).map(o => (
                <tr key={o.order_id} className="hover:bg-fintech-subcard/30 transition-all">
                  <td className="p-2.5 font-mono font-bold text-indigo-400">
                    <Link to="/queue">{o.order_id}</Link>
                  </td>
                  <td className="p-2.5">{o.customer_name}</td>
                  <td className="p-2.5 font-mono font-bold">₹{o.amount.toLocaleString()}</td>
                  <td className="p-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${o.payment_method === 'COD' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {o.payment_method}
                    </span>
                  </td>
                  <td className="p-2.5"><RiskBadge score={o.risk_score} size="sm" /></td>
                  <td className="p-2.5"><ActionBadge action={o.recommended_action} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
