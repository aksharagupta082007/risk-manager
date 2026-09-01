import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, ShieldAlert, Filter } from 'lucide-react';
import { getOrders } from '../api';
import type { Order } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { ActionBadge } from '../components/ActionBadge';
import { ThreatDrawer } from '../components/ThreatDrawer';

type FilterType = 'all' | 'high_risk' | 'critical' | 'cod' | 'prepaid' | 'a1' | 'a2' | 'a3';

export const HighRiskQueue: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('high_risk');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'risk_score' | 'amount' | 'created_at'>('risk_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, [timeFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let createdAfter: string | undefined;
      const now = new Date();
      if (timeFilter === '5m') {
        createdAfter = new Date(now.getTime() - 5 * 60000).toISOString();
      } else if (timeFilter === '1h') {
        createdAfter = new Date(now.getTime() - 60 * 60000).toISOString();
      } else if (timeFilter === '24h') {
        createdAfter = new Date(now.getTime() - 24 * 60 * 60000).toISOString();
      }
      const data = await getOrders(undefined, createdAfter);
      setOrders(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      o.order_id.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.product_name.toLowerCase().includes(term) ||
      (o.city && o.city.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case 'high_risk': return o.risk_score >= 30;
      case 'critical': return o.risk_score >= 75;
      case 'cod': return o.payment_method === 'COD';
      case 'prepaid': return o.payment_method === 'PREPAID';
      case 'a1': return o.recommended_action === 'a1_whatsapp_confirmation';
      case 'a2': return o.recommended_action === 'a2_commitment_deposit';
      case 'a3': return o.recommended_action === 'a3_prepaid_only_or_hold';
      default: return true;
    }
  }).sort((a, b) => {
    let valA: any = a[sortField] || 0;
    let valB: any = b[sortField] || 0;
    if (typeof valA === 'string') valA = new Date(valA).getTime();
    if (typeof valB === 'string') valB = new Date(valB).getTime();
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field: 'risk_score' | 'amount' | 'created_at') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'high_risk', label: 'High Risk (≥30%)' },
    { id: 'critical', label: 'Critical (≥75%)' },
    { id: 'a1', label: 'a1: WhatsApp' },
    { id: 'a2', label: 'a2: Deposit' },
    { id: 'a3', label: 'a3: Prepaid' },
    { id: 'cod', label: 'COD' },
    { id: 'prepaid', label: 'Prepaid' },
    { id: 'all', label: 'All Orders' },
  ];

  const getRowBorderColor = (score: number) => {
    if (score >= 75) return 'border-l-rose-500/60';
    if (score >= 55) return 'border-l-orange-500/60';
    if (score >= 30) return 'border-l-amber-500/60';
    return 'border-l-emerald-500/40';
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 surface-card p-5 rounded-2xl">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Risk Queue — Pre-Shipping Review
          </h1>
          <p className="text-[10px] text-fintech-muted mt-0.5">
            Inspect flagged orders. Click any row to open the threat assessment drawer.
          </p>
        </div>
        <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-bold font-mono">
          {filteredOrders.length} orders match
        </span>
      </div>

      {/* Controls */}
      <div className="surface-card rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-fintech-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order, customer, product..."
            className="w-full bg-fintech-subcard border border-fintech-border rounded-xl pl-8 pr-3 py-2 text-[11px] text-fintech-text placeholder-fintech-muted focus:outline-none focus:border-fintech-primary"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-fintech-subcard border border-fintech-border rounded-xl px-3 py-2 text-[11px] font-semibold text-fintech-text focus:outline-none focus:border-fintech-primary cursor-pointer transition-all"
          >
            <option value="all">All Time</option>
            <option value="5m">Last 5 Minutes</option>
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Today</option>
          </select>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-3 h-3 text-fintech-muted shrink-0 mr-1" />
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                selectedFilter === f.id
                  ? 'bg-fintech-primary text-white shadow-md'
                  : 'bg-fintech-subcard/80 text-fintech-muted hover:text-fintech-text border border-fintech-border/50'
              }`}
            >
              {f.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="surface-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-fintech-muted text-xs font-medium">Loading queue...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-fintech-muted text-xs">No orders match the filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-fintech-subcard/50 text-fintech-muted uppercase font-bold text-[9px] tracking-wider border-b border-fintech-border">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Product</th>
                  <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('amount')}>
                    <span className="inline-flex items-center gap-1">Amount <ArrowUpDown className="w-2.5 h-2.5" /></span>
                  </th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('risk_score')}>
                    <span className="inline-flex items-center gap-1">Risk <ArrowUpDown className="w-2.5 h-2.5" /></span>
                  </th>
                  <th className="p-3">Segment</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fintech-border/30 font-medium">
                {filteredOrders.map(o => (
                  <tr
                    key={o.order_id}
                    onClick={() => setSelectedOrderId(o.order_id)}
                    className={`cursor-pointer transition-all hover:bg-fintech-subcard/40 border-l-2 ${getRowBorderColor(o.risk_score)}`}
                  >
                    <td className="p-3 font-mono font-bold text-indigo-400">{o.order_id}</td>
                    <td className="p-3">
                      <div className="font-semibold text-fintech-text">{o.customer_name}</div>
                      <div className="text-[9px] text-fintech-muted">{o.city || 'India'}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-fintech-text">{o.product_name}</div>
                      <div className="text-[9px] text-fintech-muted">{o.variant_info}</div>
                    </td>
                    <td className="p-3 font-mono font-bold">₹{o.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        o.payment_method === 'COD'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}>{o.payment_method}</span>
                    </td>
                    <td className="p-3"><RiskBadge score={o.risk_score} size="sm" /></td>
                    <td className="p-3 capitalize text-fintech-muted font-mono text-[10px]">{o.segment.replace(/_/g, ' ')}</td>
                    <td className="p-3"><ActionBadge action={o.recommended_action} compact /></td>
                    <td className="p-3 font-mono font-bold text-emerald-400 text-[10px]">+₹{o.margin_impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Threat Drawer */}
      <ThreatDrawer orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </div>
  );
};
