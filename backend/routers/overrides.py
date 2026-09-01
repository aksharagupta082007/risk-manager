from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Order, RiskScore, Override
from schemas import OverrideRequest

router = APIRouter(prefix="", tags=["Overrides"])

@router.post("/override-action")
def record_override(payload: OverrideRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    r = order.risk_score
    old_act = r.recommended_action if r else "a0_allow_cod"

    override = Override(
        order_id=payload.order_id,
        old_action=old_act,
        new_action=payload.new_action,
        reason=payload.reason,
        merchant_id=payload.merchant_id
    )
    db.add(override)

    if r:
        r.recommended_action = payload.new_action

    db.commit()

    return {
        "message": "Action override recorded successfully",
        "order_id": payload.order_id,
        "old_action": old_act,
        "new_action": payload.new_action,
        "reason": payload.reason
    }

@router.get("/overrides")
def list_overrides(db: Session = Depends(get_db)):
    overrides = db.query(Override).order_by(Override.created_at.desc()).all()
    result = []
    for ov in overrides:
        o = ov.order
        c = o.customer if o else None
        result.append({
            "id": ov.id,
            "order_id": ov.order_id,
            "customer_name": c.name if c else "Customer",
            "old_action": ov.old_action,
            "new_action": ov.new_action,
            "reason": ov.reason,
            "merchant_id": ov.merchant_id,
            "created_at": ov.created_at
        })
    return result
