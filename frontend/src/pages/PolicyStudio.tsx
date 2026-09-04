import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sliders, Sparkles, ShieldCheck, Zap, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import CountUpComponent from 'react-countup';
const CountUp = (CountUpComponent as any).default || CountUpComponent;
import { getPolicy, updatePolicy, simulatePolicy } from '../api';
import type { Policy, SimulationResult } from '../types';

const defaultBalanced: Policy = { mode: 'balanced', a1_threshold: 30, a2_threshold: 55, a3_threshold: 75, active: true };
const defaultFestival: Policy = { mode: 'festival', a1_threshold: 20, a2_threshold: 40, a3_threshold: 60, active: true };

export const PolicyStudio: React.FC = () => {
  const [policy, setPolicy] = useState<Policy>(defaultBalanced);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [baselineSimulation, setBaselineSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => { loadPolicyAndSimulate(); }, []);

  const loadPolicyAndSimulate = async () => {
    try {
      setLoading(true);
      const p = await getPolicy();
      setPolicy(p);
      const sim = await simulatePolicy(p);
      setSimulation(sim);
      setBaselineSimulation(sim);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSimulate = useCallback((p: Policy) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try { const sim = await simulatePolicy(p); setSimulation(sim); }
      catch (e) { console.error(e); }
    }, 400);
  }, []);

  const handleSliderChange = (key: 'a1_threshold' | 'a2_threshold' | 'a3_threshold', val: number) => {
    const updated = { ...policy, [key]: val };
    setPolicy(updated);
    debouncedSimulate(updated);
  };

  const handleModeToggle = async (newMode: 'balanced' | 'festival') => {
    const defaults = newMode === 'festival' ? defaultFestival : defaultBalanced;
    setPolicy(defaults);
    try { const sim = await simulatePolicy(defaults); setSimulation(sim); }
    catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updatePolicy(policy);
      setPolicy(updated);
      const sim = await simulatePolicy(updated);
      setSimulation(sim);
      setBaselineSimulation(sim);
      setSaveMessage('Policy saved and enforced!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="p-8 text-center text-fintech-muted text-sm">Loading Policy Studio...</div>;
  }

  const frictionScore = simulation
    ? Math.round(((simulation.a1_count * 1 + simulation.a2_count * 3 + simulation.a3_count * 5) / Math.max(simulation.total_orders_analyzed, 1)) * 20)
    : 0;

  const actionChart = simulation ? [
    { name: 'a0: Allow', orders: simulation.a0_count, fill: '#22c55e' },
    { name: 'a1: WA', orders: simulation.a1_count, fill: '#eab308' },
    { name: 'a2: Deposit', orders: simulation.a2_count, fill: '#f97316' },
    { name: 'a3: Hold', orders: simulation.a3_count, fill: '#ef4444' },
  ] : [];

  const beforeAfterData = baselineSimulation && simulation ? [
    { metric: 'Intervention', before: baselineSimulation.intervention_rate, after: simulation.intervention_rate },
    { metric: 'Caught', before: baselineSimulation.expected_returns_caught, after: simulation.expected_returns_caught },
    { metric: 'FP Cost', before: Math.round(baselineSimulation.false_positive_cost / 100), after: Math.round(simulation.false_positive_cost / 100) },
    { metric: 'Saved (₹K)', before: Math.round(baselineSimulation.net_margin_saved / 1000), after: Math.round(simulation.net_margin_saved / 1000) },
  ] : [];

  const tooltipStyle = { backgroundColor: '#131824', borderColor: '#2a3447', color: '#f1f5f9', borderRadius: '8px', fontSize: '11px' };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 surface-card p-5 rounded-2xl">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Policy Engine & Threshold Simulator
          </h1>
          <p className="text-[10px] text-fintech-muted mt-0.5">
            Customize action thresholds and simulate intervention rates, margin savings, and customer friction in real-time.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50">
          {saving ? 'Applying...' : 'Save & Enforce'}
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] rounded-xl font-bold flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Mode + Sliders */}
        <div className="surface-card rounded-2xl p-5 space-y-5">
          {/* Mode Toggle */}
          <div>
            <h2 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Operating Mode</h2>
            <div className="grid grid-cols-2 gap-1.5 bg-fintech-subcard/50 p-1 rounded-xl border border-fintech-border/50">
              <button type="button" onClick={() => handleModeToggle('balanced')}
                className={`py-2 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  policy.mode === 'balanced' ? 'bg-indigo-600 text-white shadow' : 'text-fintech-muted hover:text-white'
                }`}>
                <ShieldCheck className="w-3 h-3" /> Balanced @bestF1
              </button>
              <button type="button" onClick={() => handleModeToggle('festival')}
                className={`py-2 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  policy.mode === 'festival' || policy.mode === 'aggressive' ? 'bg-amber-600 text-white shadow' : 'text-fintech-muted hover:text-white'
                }`}>
                <Zap className="w-3 h-3" /> Festival / Aggressive
              </button>
            </div>
          </div>

          <hr className="border-fintech-border/50" />

          {/* Sliders */}
          <div className="space-y-5">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-wider">Action Boundaries</h2>

            {/* a1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="font-semibold text-amber-400">a1: WhatsApp Confirm</span>
                <span className="font-mono font-bold text-white">≥ {policy.a1_threshold}%</span>
              </div>
              <input type="range" min="10" max="50" step="1" className="w-full" value={policy.a1_threshold}
                onChange={e => handleSliderChange('a1_threshold', parseFloat(e.target.value))} />
              <p className="text-[9px] text-fintech-muted">Scores {policy.a1_threshold}% → {policy.a2_threshold}% trigger WhatsApp confirmation.</p>
            </div>

            {/* a2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="font-semibold text-orange-400">a2: Commitment Deposit</span>
                <span className="font-mono font-bold text-white">≥ {policy.a2_threshold}%</span>
              </div>
              <input type="range" min="35" max="70" step="1" className="w-full" value={policy.a2_threshold}
                onChange={e => handleSliderChange('a2_threshold', parseFloat(e.target.value))} />
              <p className="text-[9px] text-fintech-muted">Scores {policy.a2_threshold}% → {policy.a3_threshold}% require ₹150 deposit.</p>
            </div>

            {/* a3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="font-semibold text-rose-400">a3: Prepaid Only / Hold</span>
                <span className="font-mono font-bold text-white">≥ {policy.a3_threshold}%</span>
              </div>
              <input type="range" min="55" max="90" step="1" className="w-full" value={policy.a3_threshold}
                onChange={e => handleSliderChange('a3_threshold', parseFloat(e.target.value))} />
              <p className="text-[9px] text-fintech-muted">Scores ≥ {policy.a3_threshold}% are held or prepaid-only.</p>
            </div>
          </div>
        </div>

        {/* Right: Simulation Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="surface-card rounded-xl p-3">
              <div className="text-[9px] uppercase font-bold text-fintech-muted">Intervention</div>
              <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
                <CountUp end={simulation?.intervention_rate || 0} duration={0.8} decimals={1} preserveValue />%
              </div>
            </div>
            <div className="surface-card rounded-xl p-3">
              <div className="text-[9px] uppercase font-bold text-fintech-muted">Returns Caught</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                <CountUp end={simulation?.expected_returns_caught || 0} duration={0.8} preserveValue />
              </div>
            </div>
            <div className="surface-card rounded-xl p-3">
              <div className="text-[9px] uppercase font-bold text-fintech-muted">FP Cost</div>
              <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                ₹<CountUp end={simulation?.false_positive_cost || 0} duration={0.8} separator="," preserveValue />
              </div>
            </div>
            <div className="surface-card rounded-xl p-3 border-indigo-500/20">
              <div className="text-[9px] uppercase font-bold text-indigo-400">Net Saved</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                ₹<CountUp end={simulation?.net_margin_saved || 0} duration={0.8} separator="," preserveValue />
              </div>
            </div>
            <div className="surface-card rounded-xl p-3">
              <div className="text-[9px] uppercase font-bold text-fintech-muted flex items-center gap-1">
                <Users className="w-3 h-3" /> Friction
              </div>
              <div className={`text-lg font-bold font-mono mt-0.5 ${frictionScore > 60 ? 'text-rose-400' : frictionScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                <CountUp end={frictionScore} duration={0.8} preserveValue />/100
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Breakdown */}
            <div className="surface-card rounded-2xl p-4">
              <h3 className="text-[11px] font-bold text-white mb-3">Simulated Action Breakdown</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={actionChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]}>
                      {actionChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Before/After Comparison */}
            <div className="surface-card rounded-2xl p-4">
              <h3 className="text-[11px] font-bold text-white mb-3">Before vs After Comparison</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={beforeAfterData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" vertical={false} />
                    <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="before" name="Baseline" fill="#3a4760" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" name="Current" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
