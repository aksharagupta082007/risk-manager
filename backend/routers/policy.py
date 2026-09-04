from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Order, RiskScore, MerchantPolicy
from schemas import PolicySchema, PolicyUpdateSchema, SimulationRequestSchema
from policy_engine import PolicyEngine

router = APIRouter(prefix="/policy", tags=["Policy"])

@router.get("", response_model=PolicySchema)
def get_current_policy(db: Session = Depends(get_db)):
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.active == True).first()
    if not policy:
        policy = MerchantPolicy(mode="balanced", a1_threshold=30.0, a2_threshold=55.0, a3_threshold=75.0, active=True)
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return {
        "mode": policy.mode,
        "a1_threshold": policy.a1_threshold,
        "a2_threshold": policy.a2_threshold,
        "a3_threshold": policy.a3_threshold,
        "active": policy.active
    }

@router.post("/update", response_model=PolicySchema)
def update_policy(payload: PolicyUpdateSchema, db: Session = Depends(get_db)):
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.active == True).first()
    if not policy:
        policy = MerchantPolicy()
        db.add(policy)
    
    policy.mode = payload.mode
    policy.a1_threshold = payload.a1_threshold
    policy.a2_threshold = payload.a2_threshold
    policy.a3_threshold = payload.a3_threshold
    db.commit()
    db.refresh(policy)

    # Re-calculate recommended actions for all orders
    orders = db.query(Order).all()
    for o in orders:
        if o.risk_score:
            new_action = PolicyEngine.map_score_to_action(
                o.risk_score.risk_score,
                payload.mode,
                {"a1_threshold": payload.a1_threshold, "a2_threshold": payload.a2_threshold, "a3_threshold": payload.a3_threshold}
            )
            o.risk_score.recommended_action = new_action
            o.risk_score.mode = payload.mode

    db.commit()

    return {
        "mode": policy.mode,
        "a1_threshold": policy.a1_threshold,
        "a2_threshold": policy.a2_threshold,
        "a3_threshold": policy.a3_threshold,
        "active": policy.active
    }

@router.post("/simulate")
def simulate_policy_changes(payload: SimulationRequestSchema, db: Session = Depends(get_db)):
    # Lightweight query: only fetch the 3 columns needed instead of full ORM objects
    rows = (
        db.query(Order.order_id, Order.amount, RiskScore.risk_score)
        .outerjoin(RiskScore, Order.order_id == RiskScore.order_id)
        .all()
    )
    orders_data = [
        {
            "order_id": row.order_id,
            "risk_score": row.risk_score if row.risk_score is not None else 15,
            "amount": row.amount,
            "is_actual_return": ((row.risk_score or 15) >= 45)
        }
        for row in rows
    ]

    result = PolicyEngine.simulate(
        orders=orders_data,
        mode=payload.mode,
        a1=payload.a1_threshold,
        a2=payload.a2_threshold,
        a3=payload.a3_threshold
    )
    return result
