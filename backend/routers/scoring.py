from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Order, RiskScore, ReasonCode, MerchantPolicy
from model_adapter import sentinel_model

router = APIRouter(prefix="", tags=["Scoring"])

@router.post("/score-order")
def score_single_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    cust = order.customer
    prod = order.product
    active_policy = db.query(MerchantPolicy).filter(MerchantPolicy.active == True).first()
    mode = active_policy.mode if active_policy else "balanced"

    score_res = sentinel_model.score_order(
        order_dict={"order_id": order.order_id, "amount": order.amount, "payment_method": order.payment_method},
        customer_dict={"total_orders": cust.total_orders, "return_count": cust.return_count, "is_serial_returner": cust.is_serial_returner} if cust else None,
        product_dict={"category": prod.category, "return_rate": prod.return_rate, "is_high_risk_variant": prod.is_high_risk_variant} if prod else None,
        mode=mode
    )

    existing_score = db.query(RiskScore).filter(RiskScore.order_id == order_id).first()
    if existing_score:
        existing_score.risk_score = score_res["risk_score"]
        existing_score.risk_probability = score_res["risk_probability"]
        existing_score.segment = score_res["segment"]
        existing_score.recommended_action = score_res["recommended_action"]
        existing_score.mode = mode
        existing_score.margin_impact = score_res["margin_impact"]
    else:
        existing_score = RiskScore(
            order_id=order_id,
            risk_score=score_res["risk_score"],
            risk_probability=score_res["risk_probability"],
            segment=score_res["segment"],
            recommended_action=score_res["recommended_action"],
            mode=mode,
            margin_impact=score_res["margin_impact"]
        )
        db.add(existing_score)
        db.flush()

    # Clear old reason codes
    db.query(ReasonCode).filter(ReasonCode.risk_score_id == existing_score.id).delete()
    for rc in score_res["reason_codes"]:
        db.add(ReasonCode(
            risk_score_id=existing_score.id,
            code=rc["code"],
            description=rc["description"],
            weight=rc["weight"],
            impact=rc["impact"]
        ))

    db.commit()

    return {
        "order_id": order_id,
        "score_result": score_res
    }

@router.post("/batch-score")
def batch_score_unscored(db: Session = Depends(get_db)):
    unscored = db.query(Order).outerjoin(RiskScore).filter(RiskScore.id == None).all()
    active_policy = db.query(MerchantPolicy).filter(MerchantPolicy.active == True).first()
    mode = active_policy.mode if active_policy else "balanced"

    scored_count = 0
    for order in unscored:
        cust = order.customer
        prod = order.product
        score_res = sentinel_model.score_order(
            order_dict={"order_id": order.order_id, "amount": order.amount, "payment_method": order.payment_method},
            customer_dict={"total_orders": cust.total_orders, "return_count": cust.return_count, "is_serial_returner": cust.is_serial_returner} if cust else None,
            product_dict={"category": prod.category, "return_rate": prod.return_rate, "is_high_risk_variant": prod.is_high_risk_variant} if prod else None,
            mode=mode
        )
        r_obj = RiskScore(
            order_id=order.order_id,
            risk_score=score_res["risk_score"],
            risk_probability=score_res["risk_probability"],
            segment=score_res["segment"],
            recommended_action=score_res["recommended_action"],
            mode=mode,
            margin_impact=score_res["margin_impact"]
        )
        db.add(r_obj)
        db.flush()
        for rc in score_res["reason_codes"]:
            db.add(ReasonCode(
                risk_score_id=r_obj.id,
                code=rc["code"],
                description=rc["description"],
                weight=rc["weight"],
                impact=rc["impact"]
            ))
        scored_count += 1

    db.commit()
    return {"message": f"Successfully batch scored {scored_count} orders."}
