import React, { useState, useEffect } from 'react';
import { BarChart3, Target, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import CountUpComponent from 'react-countup';
const CountUp = (CountUpComponent as any).default || CountUpComponent;
import { getOrders, getModelMetrics, simulatePolicy, getPolicy } from '../api';
import type { Order, ModelMetricsResponse, SimulationResult } from '../types';

export const Reports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [o, m, p] = await Promise.all([getOrders(), getModelMetrics(), getPolicy()]);
      setOrders(o);
      setMetrics(m);
      const sim = await simulatePolicy(p);
      setSimulation(sim);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) {
    return <div className="p-8 text-center text-fintech-muted text-sm">Generating reports...</div>;
  }

  const bench = metrics?.benchmark_metrics;
  const tooltipStyle = { backgroundColor: '#131824', borderColor: '#2a3447', color: '#f1f5f9', borderRadius: '8px', fontSize: '11px' };

  // Precision vs Recall comparison
  const pvr = [
    {
      mode: 'Balanced',
      precision: parseFloat(((bench?.balanced_best_f1.precision || 0) * 100).toFixed(1)),
      recall: parseFloat(((bench?.balanced_best_f1.recall || 0) * 100).toFixed(1)),
      f1: parseFloat(((bench?.balanced_best_f1.f1 || 0) * 100).toFixed(1)),
    },
    {
      mode: 'Aggressive',
      precision: parseFloat(((bench?.aggressive_95r.precision || 0) * 100).toFixed(1)),
      recall: parseFloat(((bench?.aggressive_95r.recall || 0) * 100).toFixed(1)),
      f1: parseFloat(((bench?.aggressive_95r.f1 || 0) * 100).toFixed(1)),
    },
  ];

  // Risk segment distribution
  const segmentDist = [
    { name: 'Low Risk', value: orders.filter(o => o.risk_score < 30).length, color: '#22c55e' },
    { name: 'Medium', value: orders.filter(o => o.risk_score >= 30 && o.risk_score < 55).length, color: '#eab308' },
    { name: 'High', value: orders.filter(o => o.risk_score >= 55 && o.risk_score < 75).length, color: '#f97316' },
    { name: 'Critical', value: orders.filter(o => o.risk_score >= 75).length, color: '#ef4444' },
  ];

  // Action distribution
  const actionDist = [
    { name: 'a0: Allow', value: orders.filter(o => o.recommended_action === 'a0_allow_cod').length, color: '#22c55e' },
    { name: 'a1: WA', value: orders.filter(o => o.recommended_action === 'a1_whatsapp_confirmation').length, color: '#eab308' },
    { name: 'a2: Deposit', value: orders.filter(o => o.recommended_action === 'a2_commitment_deposit').length, color: '#f97316' },
    { name: 'a3: Hold', value: orders.filter(o => o.recommended_action === 'a3_prepaid_only_or_hold').length, color: '#ef4444' },
  ];

  const totalPreventedLoss = orders.reduce((acc, o) => acc + (o.margin_impact || 0), 0);
  const fpCost = orders.filter(o => o.risk_score >= 30 && o.risk_score < 55).length * 15;
  const netSaved = Math.max(0, totalPreventedLoss - fpCost);

  // Radar data for model comparison
  const radarData = [
    { metric: 'AUC', balanced: (bench?.balanced_best_f1.auc || 0) * 100, aggressive: (bench?.aggressive_95r.auc || 0) * 100 },
    { metric: 'Precision', balanced: (bench?.balanced_best_f1.precision || 0) * 100, aggressive: (bench?.aggressive_95r.precision || 0) * 100 },
    { metric: 'Recall', balanced: (bench?.balanced_best_f1.recall || 0) * 100, aggressive: (bench?.aggressive_95r.recall || 0) * 100 },
    { metric: 'F1', balanced: (bench?.balanced_best_f1.f1 || 0) * 100, aggressive: (bench?.aggressive_95r.f1 || 0) * 100 },
    { metric: 'PR-AUC', balanced: (bench?.balanced_best_f1.pr_auc || 0) * 100, aggressive: (bench?.aggressive_95r.pr_auc || 0) * 100 },
  ];

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="surface-card p-5 rounded-2xl">
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          Reports & Model Metrics
        </h1>
        <p className="text-[10px] text-fintech-muted mt-0.5">
          Sentinel v4 benchmark performance, margin simulation, and risk distribution analytics.
        </p>
      </div>

      {/* Model Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'AUC', value: bench?.balanced_best_f1.auc || 0, color: 'text-indigo-400' },
          { label: 'PR-AUC', value: bench?.balanced_best_f1.pr_auc || 0, color: 'text-indigo-400' },
          { label: 'Precision', value: (bench?.balanced_best_f1.precision || 0) * 100, suffix: '%', color: 'text-emerald-400' },
          { label: 'Recall', value: (bench?.balanced_best_f1.recall || 0) * 100, suffix: '%', color: 'text-indigo-400' },
          { label: 'F1 Score', value: (bench?.balanced_best_f1.f1 || 0) * 100, suffix: '%', color: 'text-emerald-400' },
          { label: 'Flag Rate', value: (bench?.balanced_best_f1.flag_rate || 0) * 100, suffix: '%', color: 'text-amber-400' },
        ].map((m, i) => (
          <div key={i} className="surface-card rounded-xl p-3 text-center">
            <div className="text-[9px] uppercase font-bold text-fintech-muted">{m.label}</div>
            <div className={`text-lg font-bold font-mono ${m.color} mt-0.5`}>
              <CountUp end={m.value} duration={1.5} decimals={m.suffix ? 1 : 5} preserveValue />{m.suffix || ''}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 mb-1"><TrendingUp className="w-3.5 h-3.5" /> Net Margin Saved</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">₹<CountUp end={netSaved} duration={1.5} separator="," /></div>
          <div className="text-[10px] text-fintech-muted mt-1">Total prevented loss: ₹{totalPreventedLoss.toLocaleString()}</div>
        </div>
        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-rose-400 mb-1"><Target className="w-3.5 h-3.5" /> False Positive Cost</div>
          <div className="text-2xl font-bold font-mono text-rose-400">₹<CountUp end={fpCost} duration={1.5} separator="," /></div>
          <div className="text-[10px] text-fintech-muted mt-1">Customer friction overhead</div>
        </div>
        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 mb-1"><ShieldCheck className="w-3.5 h-3.5" /> Intervention Rate</div>
          <div className="text-2xl font-bold font-mono text-indigo-400"><CountUp end={simulation?.intervention_rate || 0} duration={1.5} decimals={1} />%</div>
          <div className="text-[10px] text-fintech-muted mt-1">{simulation?.expected_returns_caught || 0} returns caught</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Precision vs Recall */}
        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Balanced vs Aggressive
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pvr} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" vertical={false} />
                <XAxis dataKey="mode" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="precision" name="Precision %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recall" name="Recall %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="f1" name="F1 %" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Radar */}
        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Model Radar Comparison
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#2a3447" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <PolarRadiusAxis tick={{ fontSize: 8, fill: '#64748b' }} domain={[0, 100]} />
                <Radar name="Balanced" dataKey="balanced" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Aggressive" dataKey="aggressive" stroke="#eab308" fill="#eab308" fillOpacity={0.1} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Segment Distribution */}
        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-3">Risk Segment Distribution</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {segmentDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Distribution */}
        <div className="surface-card rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-3">Action Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionDist} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Orders" radius={[4, 4, 0, 0]}>
                  {actionDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
