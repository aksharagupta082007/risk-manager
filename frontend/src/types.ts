export interface ReasonCode {
  code: string;
  description: string;
  weight?: number;
  impact?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Customer {
  customer_id: string;
  name: string;
  phone: string;
  email?: string;
  total_orders: number;
  return_count: number;
  return_rate: number;
  is_serial_returner: boolean;
}

export interface Product {
  product_id: string;
  name: string;
  category: string;
  variant?: string;
  price: number;
  return_rate: number;
  is_high_risk_variant?: boolean;
}

export interface Order {
  id: number;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_total_orders?: number;
  customer_return_count?: number;
  customer_return_rate?: number;
  is_serial_returner?: boolean;
  product_id: string;
  product_name: string;
  category: string;
  variant_info?: string;
  product_return_rate?: number;
  amount: number;
  payment_method: 'COD' | 'PREPAID';
  status: string;
  city?: string;
  pincode?: string;
  shipping_address?: string;
  created_at: string;
  risk_score: number;
  risk_probability: number;
  segment: string;
  recommended_action: 'a0_allow_cod' | 'a1_whatsapp_confirmation' | 'a2_commitment_deposit' | 'a3_prepaid_only_or_hold';
  margin_impact: number;
  mode?: string;
  reason_codes: ReasonCode[];
}

export interface BenchmarkMetrics {
  mode: string;
  auc: number;
  pr_auc: number;
  precision: number;
  recall: number;
  f1: number;
  flag_rate: number;
}

export interface ModelMetricsResponse {
  version: string;
  last_trained: string;
  benchmark_metrics: {
    aggressive_95r: BenchmarkMetrics;
    balanced_best_f1: BenchmarkMetrics;
  };
}

export interface Policy {
  mode: 'balanced' | 'festival' | 'aggressive';
  a1_threshold: number;
  a2_threshold: number;
  a3_threshold: number;
  active: boolean;
}

export interface SimulationResult {
  total_orders_analyzed: number;
  intervention_rate: number;
  expected_returns_caught: number;
  false_positive_count: number;
  false_positive_cost: number;
  expected_prevented_loss: number;
  net_margin_saved: number;
  mode: string;
  a0_count: number;
  a1_count: number;
  a2_count: number;
  a3_count: number;
}

export interface DuplicateCase {
  id: number;
  primary_order_id: string;
  matched_order_id: string;
  match_type: string;
  confidence: number;
  recommended_action: string;
  details: string;
  created_at: string;
  customer_name: string;
  primary_amount: number;
  matched_amount: number;
  primary_variant?: string;
  matched_variant?: string;
}

export interface OverrideLogItem {
  id: number;
  order_id: string;
  customer_name: string;
  old_action: string;
  new_action: string;
  reason: string;
  merchant_id: string;
  created_at: string;
}

export interface ManualOrderPayload {
  order_id?: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  product_id: string;
  product_name: string;
  category: string;
  variant?: string;
  amount: number;
  payment_method: string;
  city: string;
  pincode: string;
  shipping_address?: string;
  customer_total_orders: number;
  customer_return_count: number;
  product_return_rate: number;
  is_serial_returner: boolean;
}
