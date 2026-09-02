import axios from 'axios';
import type {
  Order,
  ModelMetricsResponse,
  Policy,
  SimulationResult,
  DuplicateCase,
  OverrideLogItem,
  ManualOrderPayload
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getOrders = async (status?: string, createdAfter?
  : string): Promise<Order[]> => {
  const params: any = {};
  if (status) params.status = status;
  if (createdAfter) params.created_after = createdAfter;
  const res = await api.get('/orders', { params });
  return res.data;
};

export const getHighRiskOrders = async (minScore: number = 30, createdAfter?: string): Promise<Order[]> => {
  const params: any = { min_score: minScore };
  if (createdAfter) params.created_after = createdAfter;
  const res = await api.get('/orders/high-risk', { params });
  return res.data;
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
};

export const createManualOrder = async (payload: ManualOrderPayload): Promise<any> => {
  const res = await api.post('/orders/manual', payload);
  return res.data;
};

export const uploadOrdersCSV = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/orders/upload-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const scoreSingleOrder = async (orderId: string): Promise<any> => {
  const res = await api.post(`/score-order?order_id=${orderId}`);
  return res.data;
};

export const getModelMetrics = async (): Promise<ModelMetricsResponse> => {
  const res = await api.get('/metrics/model');
  return res.data;
};

export const getPolicy = async (): Promise<Policy> => {
  const res = await api.get('/policy');
  return res.data;
};

export const updatePolicy = async (payload: { mode: string; a1_threshold: number; a2_threshold: number; a3_threshold: number }): Promise<Policy> => {
  const res = await api.post('/policy/update', payload);
  return res.data;
};

export const simulatePolicy = async (payload: { mode: string; a1_threshold: number; a2_threshold: number; a3_threshold: number }): Promise<SimulationResult> => {
  const res = await api.post('/policy/simulate', payload);
  return res.data;
};

export const draftWhatsAppMessage = async (orderId: string): Promise<any> => {
  const res = await api.post('/actions/draft-message', { order_id: orderId });
  return res.data;
};

export const createDepositLink = async (orderId: string, depositAmount: number = 150): Promise<any> => {
  const res = await api.post('/actions/create-deposit-link', { order_id: orderId, deposit_amount: depositAmount });
  return res.data;
};

export const copilotExplainOrder = async (orderId: string): Promise<any> => {
  const res = await api.post('/copilot/explain-risk', { order_id: orderId });
  return res.data;
};

export const copilotDailyBrief = async (): Promise<any> => {
  const res = await api.post('/copilot/daily-brief', {});
  return res.data;
};

export const copilotChat = async (prompt: string, orderId?: string): Promise<any> => {
  const res = await api.post('/copilot/chat', { prompt, order_id: orderId });
  return res.data;
};

export const recordOverride = async (orderId: string, newAction: string, reason: string): Promise<any> => {
  const res = await api.post('/override-action', { order_id: orderId, new_action: newAction, reason });
  return res.data;
};

export const getOverrides = async (): Promise<OverrideLogItem[]> => {
  const res = await api.get('/overrides');
  return res.data;
};

export const getDuplicateCases = async (): Promise<DuplicateCase[]> => {
  const res = await api.get('/duplicate-intent-cases');
  return res.data;
};

export default api;
