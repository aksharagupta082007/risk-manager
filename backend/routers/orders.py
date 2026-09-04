import io
import pandas as pd
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Order, Customer, Product, RiskScore, ReasonCode, MerchantPolicy
from schemas import ManualOrderCreate, OrderResponseSchema
from feature_engine import FeatureEngine
from model_adapter import sentinel_model
from policy_engine import PolicyEngine

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("", response_model=list)
def get_orders(db: Session = Depends(get_db), limit: int = 100, offset: int = 0, status: str = None, created_after: str = None):
    query = db.query(Order).options(
        joinedload(Order.risk_score).joinedload(RiskScore.reason_codes),
        joinedload(Order.customer),
        joinedload(Order.product)
    )
    if status:
        query = query.filter(Order.status == status)
    if created_after:
        try:
            dt = datetime.datetime.fromisoformat(created_after.replace('Z', '+00:00'))
            query = query.filter(Order.created_at >= dt)
        except ValueError:
            pass
    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for o in orders:
        r = o.risk_score
        c = o.customer
        p = o.product
        result.append({
            "id": o.id,
            "order_id": o.order_id,
            "customer_id": o.customer_id,
            "customer_name": c.name if c else "Customer",
            "customer_phone": c.phone if c else "",
            "customer_email": c.email if c else "",
            "product_id": o.product_id,
            "product_name": p.name if p else "Product",
            "category": p.category if p else "General",
            "variant_info": o.variant_info,
            "amount": o.amount,
            "payment_method": o.payment_method,
            "status": o.status,
            "city": o.city,
            "pincode": o.pincode,
            "created_at": o.created_at,
            "risk_score": r.risk_score if r else 15,
            "risk_probability": r.risk_probability if r else 0.15,
            "segment": r.segment if r else "safe_order",
            "recommended_action": r.recommended_action if r else "a0_allow_cod",
            "margin_impact": r.margin_impact if r else 0.0,
            "reason_codes": [{"code": rc.code, "description": rc.description, "impact": rc.impact} for rc in r.reason_codes] if r else []
        })
    return result

@router.get("/high-risk", response_model=list)
def get_high_risk_orders(db: Session = Depends(get_db), min_score: int = 30, created_after: str = None):
    query = db.query(Order).options(
        joinedload(Order.risk_score).joinedload(RiskScore.reason_codes),
        joinedload(Order.customer),
        joinedload(Order.product)
    ).join(RiskScore).filter(RiskScore.risk_score >= min_score)
    if created_after:
        try:
            dt = datetime.datetime.fromisoformat(created_after.replace('Z', '+00:00'))
            query = query.filter(Order.created_at >= dt)
        except ValueError:
            pass
    orders = query.order_by(RiskScore.risk_score.desc()).all()

    result = []
    for o in orders:
        r = o.risk_score
        c = o.customer
        p = o.product
        result.append({
            "id": o.id,
            "order_id": o.order_id,
            "customer_id": o.customer_id,
            "customer_name": c.name if c else "Customer",
            "customer_phone": c.phone if c else "",
            "product_id": o.product_id,
            "product_name": p.name if p else "Product",
            "category": p.category if p else "General",
            "variant_info": o.variant_info,
            "amount": o.amount,
            "payment_method": o.payment_method,
            "status": o.status,
            "city": o.city,
            "pincode": o.pincode,
            "created_at": o.created_at,
            "risk_score": r.risk_score if r else 15,
            "risk_probability": r.risk_probability if r else 0.15,
            "segment": r.segment if r else "safe_order",
            "recommended_action": r.recommended_action if r else "a0_allow_cod",
            "margin_impact": r.margin_impact if r else 0.0,
            "reason_codes": [{"code": rc.code, "description": rc.description, "impact": rc.impact} for rc in r.reason_codes] if r else []
        })
    return result

@router.get("/{order_id}")
def get_order_by_id(order_id: str, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.order_id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

    r = o.risk_score
    c = o.customer
    p = o.product

    return {
        "id": o.id,
        "order_id": o.order_id,
        "customer_id": o.customer_id,
        "customer_name": c.name if c else "Customer",
        "customer_phone": c.phone if c else "",
        "customer_email": c.email if c else "",
        "customer_total_orders": c.total_orders if c else 1,
        "customer_return_count": c.return_count if c else 0,
        "customer_return_rate": c.return_rate if c else 0.0,
        "is_serial_returner": c.is_serial_returner if c else False,
        "product_id": o.product_id,
        "product_name": p.name if p else "Product",
        "category": p.category if p else "General",
        "variant_info": o.variant_info,
        "product_return_rate": p.return_rate if p else 0.15,
        "amount": o.amount,
        "payment_method": o.payment_method,
        "status": o.status,
        "city": o.city,
        "pincode": o.pincode,
        "shipping_address": o.shipping_address,
        "created_at": o.created_at,
        "risk_score": r.risk_score if r else 15,
        "risk_probability": r.risk_probability if r else 0.15,
        "segment": r.segment if r else "safe_order",
        "recommended_action": r.recommended_action if r else "a0_allow_cod",
        "margin_impact": r.margin_impact if r else 0.0,
        "mode": r.mode if r else "balanced",
        "reason_codes": [{"code": rc.code, "description": rc.description, "weight": rc.weight, "impact": rc.impact} for rc in r.reason_codes] if r else []
    }

@router.post("/manual")
def create_manual_order(payload: ManualOrderCreate, db: Session = Depends(get_db)):
    # Create or update customer
    cust = db.query(Customer).filter(Customer.customer_id == payload.customer_id).first()
    if not cust:
        cust = Customer(
            customer_id=payload.customer_id,
            name=payload.customer_name,
            phone=payload.customer_phone,
            email=payload.customer_email,
            total_orders=payload.customer_total_orders,
            return_count=payload.customer_return_count,
            return_rate=payload.customer_return_count / max(payload.customer_total_orders, 1),
            is_serial_returner=payload.is_serial_returner
        )
        db.add(cust)
        db.flush()
    else:
        # Update existing customer with latest input
        cust.name = payload.customer_name
        cust.phone = payload.customer_phone
        cust.email = payload.customer_email
        cust.total_orders = payload.customer_total_orders
        cust.return_count = payload.customer_return_count
        cust.return_rate = payload.customer_return_count / max(payload.customer_total_orders, 1)
        cust.is_serial_returner = payload.is_serial_returner
        db.flush()

    # Create or get product
    prod = db.query(Product).filter(Product.product_id == payload.product_id).first()
    if not prod:
        prod = Product(
            product_id=payload.product_id,
            name=payload.product_name,
            category=payload.category,
            variant=payload.variant,
            price=payload.amount,
            return_rate=payload.product_return_rate
        )
        db.add(prod)
        db.flush()

    order_id = payload.order_id or f"ORD-MAN-{int(datetime.datetime.now().timestamp())}"
    
    order = Order(
        order_id=order_id,
        customer_id=cust.customer_id,
        product_id=prod.product_id,
        amount=payload.amount,
        payment_method=payload.payment_method.upper(),
        status="PENDING",
        city=payload.city,
        pincode=payload.pincode,
        shipping_address=payload.shipping_address,
        variant_info=payload.variant
    )
    db.add(order)
    db.flush()

    # Score order using Sentinel model adapter
    active_policy = db.query(MerchantPolicy).filter(MerchantPolicy.active == True).first()
    mode = active_policy.mode if active_policy else "balanced"

    score_res = sentinel_model.score_order(
        order_dict={
            "order_id": order_id,
            "amount": payload.amount,
            "payment_method": payload.payment_method,
            "category": payload.category
        },
        customer_dict={
            "total_orders": cust.total_orders,
            "return_count": cust.return_count,
            "is_serial_returner": cust.is_serial_returner
        },
        product_dict={
            "category": prod.category,
            "return_rate": prod.return_rate,
            "is_high_risk_variant": prod.is_high_risk_variant
        },
        mode=mode
    )

    risk_obj = RiskScore(
        order_id=order_id,
        risk_score=score_res["risk_score"],
        risk_probability=score_res["risk_probability"],
        segment=score_res["segment"],
        recommended_action=score_res["recommended_action"],
        mode=mode,
        margin_impact=score_res["margin_impact"]
    )
    db.add(risk_obj)
    db.flush()

    for rc in score_res["reason_codes"]:
        db.add(ReasonCode(
            risk_score_id=risk_obj.id,
            code=rc["code"],
            description=rc["description"],
            weight=rc["weight"],
            impact=rc["impact"]
        ))

    db.commit()

    return {
        "message": "Order created and scored successfully",
        "order_id": order_id,
        "risk_score": score_res["risk_score"],
        "recommended_action": score_res["recommended_action"],
        "segment": score_res["segment"],
        "reason_codes": score_res["reason_codes"]
    }

@router.post("/upload-csv")
async def upload_orders_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))

    required_cols = ["order_id", "customer_name", "customer_phone", "product_name", "amount", "payment_method"]
    for col in required_cols:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Missing required CSV column: '{col}'")

    created_count = 0
    active_policy = db.query(MerchantPolicy).filter(MerchantPolicy.active == True).first()
    mode = active_policy.mode if active_policy else "balanced"

    risk_scores = []
    actions = []
    reason_summaries = []

    for idx, row in df.iterrows():
        oid = str(row["order_id"])
        if db.query(Order).filter(Order.order_id == oid).first():
            continue

        cid = f"CUST-CSV-{idx+1}"
        pid = f"PROD-CSV-{idx+1}"
        
        cust = Customer(
            customer_id=cid,
            name=str(row["customer_name"]),
            phone=str(row["customer_phone"]),
            email=str(row.get("customer_email", "buyer@example.com")),
            total_orders=int(row.get("customer_total_orders", 2)),
            return_count=int(row.get("customer_return_count", 0)),
            return_rate=float(row.get("customer_return_rate", 0.1)),
            is_serial_returner=bool(row.get("is_serial_returner", False))
        )
        db.add(cust)

        prod = Product(
            product_id=pid,
            name=str(row["product_name"]),
            category=str(row.get("category", "General")),
            variant=str(row.get("variant", "Standard")),
            price=float(row["amount"]),
            return_rate=float(row.get("product_return_rate", 0.15))
        )
        db.add(prod)
        db.flush()

        order = Order(
            order_id=oid,
            customer_id=cid,
            product_id=pid,
            amount=float(row["amount"]),
            payment_method=str(row["payment_method"]).upper(),
            status="PENDING",
            city=str(row.get("city", "Bengaluru")),
            pincode=str(row.get("pincode", "560001")),
            variant_info=str(row.get("variant", "Standard"))
        )
        db.add(order)
        db.flush()

        score_res = sentinel_model.score_order(
            order_dict={"order_id": oid, "amount": float(row["amount"]), "payment_method": str(row["payment_method"])},
            customer_dict={"total_orders": cust.total_orders, "return_count": cust.return_count, "is_serial_returner": cust.is_serial_returner},
            product_dict={"category": prod.category, "return_rate": prod.return_rate},
            mode=mode
        )

        risk_obj = RiskScore(
            order_id=oid,
            risk_score=score_res["risk_score"],
            risk_probability=score_res["risk_probability"],
            segment=score_res["segment"],
            recommended_action=score_res["recommended_action"],
            mode=mode,
            margin_impact=score_res["margin_impact"]
        )
        db.add(risk_obj)
        db.flush()

        for rc in score_res["reason_codes"]:
            db.add(ReasonCode(
                risk_score_id=risk_obj.id,
                code=rc["code"],
                description=rc["description"],
                weight=rc["weight"],
                impact=rc["impact"]
            ))

        risk_scores.append(score_res["risk_score"])
        actions.append(score_res["recommended_action"])
        reason_summaries.append(" | ".join([rc["code"] for rc in score_res["reason_codes"]]))

        created_count += 1

    db.commit()
    
    # Append predictions to dataframe
    df["predicted_risk_score"] = risk_scores
    df["recommended_action"] = actions
    df["risk_drivers"] = reason_summaries

    # Convert to CSV string
    csv_string = df.to_csv(index=False)
    
    return {
        "message": f"Successfully imported and scored {created_count} orders from CSV.",
        "downloadable_csv": csv_string
    }
