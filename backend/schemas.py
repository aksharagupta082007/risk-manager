from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class CustomerSchema(BaseModel):
    customer_id: str
    name: str
    phone: str
    email: Optional[str] = None
    total_orders: int = 1
    return_count: int = 0
    return_rate: float = 0.0
    is_serial_returner: bool = False

class ProductSchema(BaseModel):
    product_id: str
    name: str
    category: str
    variant: Optional[str] = None
    price: float
    return_rate: float = 0.0
    is_high_risk_variant: bool = False

class ManualOrderCreate(BaseModel):
    order_id: Optional[str] = None
    customer_id: str = "CUST-NEW-01"
    customer_name: str = "Rahul Sharma"
    customer_phone: str = "919876543210"
    customer_email: Optional[str] = "rahul@example.com"
    product_id: str = "PROD-SHIRT-01"
    product_name: str = "Slim Fit Cotton Shirt"
    category: str = "Fashion"
    variant: Optional[str] = "Size L - Blue"
    amount: float = 1499.0
    payment_method: str = "COD" # COD or PREPAID
    city: str = "Bengaluru"
    pincode: str = "560001"
    shipping_address: Optional[str] = "123, MG Road, Indiranagar"
    customer_total_orders: int = 4
    customer_return_count: int = 2
    product_return_rate: float = 0.28
    is_serial_returner: bool = False

class ReasonCodeSchema(BaseModel):
    code: str
    description: str
    weight: float
    impact: str = "HIGH"

class RiskScoreSchema(BaseModel):
    risk_score: int
    risk_probability: float
    segment: str
    recommended_action: str
    mode: str
    margin_impact: float
    reason_codes: List[ReasonCodeSchema]
    scored_at: Optional[datetime] = None

class OrderResponseSchema(BaseModel):
    id: int
    order_id: str
    customer_id: str
    product_id: str
    amount: float
    payment_method: str
    status: str
    city: Optional[str]
    pincode: Optional[str]
    shipping_address: Optional[str]
    variant_info: Optional[str]
    created_at: datetime
    customer: Optional[CustomerSchema] = None
    product: Optional[ProductSchema] = None
    risk_score: Optional[RiskScoreSchema] = None

class PolicySchema(BaseModel):
    mode: str
    a1_threshold: float
    a2_threshold: float
    a3_threshold: float
    active: bool = True

class PolicyUpdateSchema(BaseModel):
    mode: str
    a1_threshold: float
    a2_threshold: float
    a3_threshold: float

class SimulationRequestSchema(BaseModel):
    mode: str
    a1_threshold: float
    a2_threshold: float
    a3_threshold: float

class SimulationResultSchema(BaseModel):
    total_orders_analyzed: int
    intervention_rate: float
    expected_returns_caught: int
    false_positive_count: int
    false_positive_cost: float
    expected_prevented_loss: float
    net_margin_saved: float
    mode: str
    a0_count: int
    a1_count: int
    a2_count: int
    a3_count: int

class DraftMessageRequest(BaseModel):
    order_id: str
    message_type: str = "whatsapp_confirmation" # whatsapp_confirmation or deposit_link

class DepositLinkRequest(BaseModel):
    order_id: str
    deposit_amount: float = 150.0

class CopilotExplainRequest(BaseModel):
    order_id: str

class CopilotDailyBriefRequest(BaseModel):
    date: Optional[str] = None

class CopilotChatRequest(BaseModel):
    prompt: str
    order_id: Optional[str] = None

class OverrideRequest(BaseModel):
    order_id: str
    new_action: str
    reason: str
    merchant_id: str = "admin_merchant"

class BenchmarkMetricsSchema(BaseModel):
    mode: str
    auc: float
    pr_auc: float
    precision: float
    recall: float
    f1: float
    flag_rate: float

class ModelMetricsResponse(BaseModel):
    version: str = "v4"
    benchmark_metrics: Dict[str, BenchmarkMetricsSchema]
    last_trained: str = "2026-08-20"
