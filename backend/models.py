import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.product_id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(20), nullable=False) # COD or PREPAID
    status = Column(String(30), default="PENDING") # PENDING, SHIPPED, RETURNED, DELIVERED, CANCELLED, ON_HOLD
    city = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    shipping_address = Column(Text, nullable=True)
    variant_info = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    product = relationship("Product", back_populates="orders")
    risk_score = relationship("RiskScore", back_populates="order", uselist=False)
    actions = relationship("Action", back_populates="order")
    overrides = relationship("Override", back_populates="order")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    total_orders = Column(Integer, default=1)
    return_count = Column(Integer, default=0)
    return_rate = Column(Float, default=0.0)
    is_serial_returner = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    orders = relationship("Order", back_populates="customer")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    variant = Column(String(50), nullable=True)
    price = Column(Float, nullable=False)
    total_sold = Column(Integer, default=1)
    return_count = Column(Integer, default=0)
    return_rate = Column(Float, default=0.0)
    is_high_risk_variant = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    orders = relationship("Order", back_populates="product")

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.order_id"), unique=True, nullable=False)
    risk_score = Column(Integer, nullable=False) # 0 to 100
    risk_probability = Column(Float, nullable=False) # 0.0 to 1.0
    segment = Column(String(50), nullable=False) # e.g. low_risk, serial_returner, high_value_cod, duplicate_buyer
    recommended_action = Column(String(50), nullable=False) # a0_allow_cod, a1_whatsapp_confirmation, a2_commitment_deposit, a3_prepaid_only_or_hold
    mode = Column(String(20), default="balanced") # balanced or festival
    margin_impact = Column(Float, default=0.0)
    scored_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="risk_score")
    reason_codes = relationship("ReasonCode", back_populates="risk_score_rel")

class ReasonCode(Base):
    __tablename__ = "reason_codes"

    id = Column(Integer, primary_key=True, index=True)
    risk_score_id = Column(Integer, ForeignKey("risk_scores.id"), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    weight = Column(Float, default=1.0)
    impact = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH

    risk_score_rel = relationship("RiskScore", back_populates="reason_codes")

class MerchantPolicy(Base):
    __tablename__ = "merchant_policies"

    id = Column(Integer, primary_key=True, index=True)
    mode = Column(String(20), default="balanced") # balanced or festival
    a1_threshold = Column(Float, default=30.0)
    a2_threshold = Column(Float, default=55.0)
    a3_threshold = Column(Float, default=75.0)
    active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.order_id"), nullable=False)
    action_type = Column(String(50), nullable=False)
    action_data = Column(JSON, nullable=True)
    status = Column(String(30), default="CREATED") # CREATED, SENT, CONFIRMED, OVERRIDDEN, EXPIRED
    wa_link = Column(Text, nullable=True)
    deposit_link = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="actions")

class Override(Base):
    __tablename__ = "overrides"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.order_id"), nullable=False)
    old_action = Column(String(50), nullable=False)
    new_action = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    merchant_id = Column(String(50), default="admin_merchant")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="overrides")

class DuplicateIntentCase(Base):
    __tablename__ = "duplicate_intent_cases"

    id = Column(Integer, primary_key=True, index=True)
    primary_order_id = Column(String(50), nullable=False)
    matched_order_id = Column(String(50), nullable=False)
    match_type = Column(String(50), nullable=False) # multi_variant, same_address_different_phone, repeat_cancelled
    confidence = Column(Float, default=0.85)
    recommended_action = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(20), nullable=False)
    total_orders = Column(Integer, default=0)
    high_risk_count = Column(Integer, default=0)
    expected_prevented_loss = Column(Float, default=0.0)
    false_positive_cost = Column(Float, default=0.0)
    net_margin_saved = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
