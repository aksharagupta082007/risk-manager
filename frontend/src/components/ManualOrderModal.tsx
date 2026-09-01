import React, { useState } from 'react';
import { X, Plus, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { createManualOrder } from '../api';
import type { ManualOrderPayload } from '../types';
import { ActionBadge } from './ActionBadge';
import CountUpComponent from 'react-countup';
const CountUp = (CountUpComponent as any).default || CountUpComponent;

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<ManualOrderPayload>({
    customer_id: 'CUST-MAN-101',
    customer_name: 'Rahul Sharma',
    customer_phone: '919876543210',
    customer_email: 'rahul.s@example.com',
    product_id: 'PROD-MAN-505',
    product_name: 'Urban Denim Jeans',
    category: 'Fashion',
    variant: 'Size 32 - Blue',
    amount: 2499.0,
    payment_method: 'COD',
    city: 'Bengaluru',
    pincode: '560001',
    shipping_address: '123 MG Road, Indiranagar',
    customer_total_orders: 8,
    customer_return_count: 5,
    product_return_rate: 0.35,
    is_serial_returner: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await createManualOrder(formData);
      setResult(res);
      onSuccess(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit test order');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setResult(null);
    onClose();
  };

  const renderResult = () => {
    const isSafe = result.recommended_action === 'a0_allow_cod' || result.recommended_action === 'a1_whatsapp_confirmation';
    const colorClasses = isSafe 
      ? 'bg-fintech-safe/10 border-fintech-safe text-fintech-safe'
      : 'bg-fintech-danger/10 border-fintech-danger text-fintech-danger';

    const Icon = isSafe ? ShieldCheck : ShieldAlert;

    return (
      <div className="space-y-6">
        <div className={`p-5 border-2 rounded-2xl flex flex-col items-center justify-center text-center ${colorClasses}`}>
          <Icon className="w-12 h-12 mb-3" />
          <h3 className="text-xl font-bold mb-1">Prediction Complete</h3>
          <p className="text-xs opacity-90 max-w-[280px]">
            {isSafe 
              ? 'This order has a low/moderate risk profile and is safe to process with standard verification.'
              : 'This order exhibits high return risk signals. Sentinel recommends protective action.'}
          </p>
          
          <div className="mt-5 p-4 bg-fintech-bg/50 rounded-xl w-full flex items-center justify-between border border-fintech-border shadow-inner">
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">Risk Score</div>
              <div className="text-2xl font-bold font-mono">
                <CountUp end={result.risk_score} duration={1.5} />%
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">Action</div>
              <ActionBadge action={result.recommended_action} />
            </div>
          </div>
        </div>

        {result.reason_codes && result.reason_codes.length > 0 && (
          <div className="surface-card p-4">
            <div className="text-[10px] uppercase font-bold tracking-wider text-fintech-muted mb-3">Key Risk Drivers</div>
            <div className="space-y-2">
              {result.reason_codes.map((rc: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 bg-fintech-bg p-2 rounded border border-fintech-border text-[11px]">
                  <span className="font-bold text-fintech-primary shrink-0">{rc.code}:</span>
                  <span className="text-fintech-text">{rc.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={resetAndClose}
            className="px-5 py-2 text-sm font-semibold bg-fintech-primary text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
          >
            Close <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="surface-card max-w-2xl w-full p-6 relative my-8">
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-2 text-fintech-muted hover:text-fintech-text rounded-lg hover:bg-fintech-subcard transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {!result && (
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-fintech-primary/10 text-fintech-primary rounded-xl border border-fintech-primary/20">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-fintech-text">Test Single Order Scoring</h2>
              <p className="text-xs text-fintech-muted">Enter order & customer signals to get real-time Sentinel v4 score</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-fintech-danger/10 border border-fintech-danger/30 rounded-lg text-fintech-danger text-sm">
            {error}
          </div>
        )}

        {result ? renderResult() : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-fintech-muted mb-1">Customer Name</label>
                <input
                  type="text"
                  className="w-full bg-fintech-bg border border-fintech-border rounded-lg px-3 py-2 text-sm text-fintech-text focus:outline-none focus:border-fintech-primary"
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fintech-muted mb-1">Phone Number</label>
                <input
                  type="text"
                  className="w-full bg-fintech-bg border border-fintech-border rounded-lg px-3 py-2 text-sm text-fintech-text focus:outline-none focus:border-fintech-primary"
                  value={formData.customer_phone}
                  onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fintech-muted mb-1">Product Name</label>
                <input
                  type="text"
                  className="w-full bg-fintech-bg border border-fintech-border rounded-lg px-3 py-2 text-sm text-fintech-text focus:outline-none focus:border-fintech-primary"
                  value={formData.product_name}
                  onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fintech-muted mb-1">Category</label>
                <select
                  className="w-full bg-fintech-bg border border-fintech-border rounded-lg px-3 py-2 text-sm text-fintech-text focus:outline-none focus:border-fintech-primary"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Fashion">Fashion</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Home">Home</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-fintech-muted mb-1">Order Amount (₹)</label>
                <input
                  type="number"
                  className="w-full bg-fintech-bg border border-fintech-border rounded-lg px-3 py-2 text-sm text-fintech-text focus:outline-none focus:border-fintech-primary"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fintech-muted mb-1">Payment Method</label>
                <select
                  className="w-full bg-fintech-bg border border-fintech-border rounded-lg px-3 py-2 text-sm text-fintech-text focus:outline-none focus:border-fintech-primary"
                  value={formData.payment_method}
                  onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="PREPAID">Prepaid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-fintech-muted mb-1">Customer Historical Orders</label>
                <input
                  type="number"
                  className="w-full bg-fintech-bg border border-fintech-border rounded-lg px-3 py-2 text-sm text-fintech-text focus:outline-none focus:border-fintech-primary"
                  value={formData.customer_total_orders}
                  onChange={e => setFormData({ ...formData, customer_total_orders: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fintech-muted mb-1">Customer Past Return Count</label>
                <input
                  type="number"
                  className="w-full bg-fintech-bg border border-fintech-border rounded-lg px-3 py-2 text-sm text-fintech-text focus:outline-none focus:border-fintech-primary"
                  value={formData.customer_return_count}
                  onChange={e => setFormData({ ...formData, customer_return_count: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="p-3 bg-fintech-bg rounded-xl border border-fintech-border flex items-center justify-between mt-2">
              <span className="text-xs font-medium text-fintech-text">Serial Returner Signal</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_serial_returner}
                  onChange={e => setFormData({ ...formData, is_serial_returner: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-fintech-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fintech-danger"></div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2 text-sm text-fintech-muted hover:text-fintech-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-semibold bg-fintech-primary hover:opacity-90 text-white rounded-xl shadow-lg flex items-center gap-2 transition-all"
              >
                {loading ? 'Evaluating...' : 'Score Order Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
