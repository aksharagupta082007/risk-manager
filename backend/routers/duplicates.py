from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import DuplicateIntentCase, Order
from duplicate_detector import DuplicateDetector

router = APIRouter(prefix="", tags=["Duplicates"])

@router.get("/duplicate-intent-cases")
def get_duplicate_intent_cases(db: Session = Depends(get_db)):
    cases = db.query(DuplicateIntentCase).order_by(DuplicateIntentCase.created_at.desc()).all()
    
    if len(cases) == 0:
        # Re-run detector dynamically on current orders if DB table empty
        orders = db.query(Order).all()
        order_dicts = []
        for o in orders:
            c = o.customer
            p = o.product
            order_dicts.append({
                "order_id": o.order_id,
                "customer_id": o.customer_id,
                "customer_name": c.name if c else "Customer",
                "customer_phone": c.phone if c else "",
                "product_id": o.product_id,
                "product_name": p.name if p else "Product",
                "variant_info": o.variant_info,
                "risk_score": o.risk_score.risk_score if o.risk_score else 15,
                "amount": o.amount
            })
        detected = DuplicateDetector.detect_cases(order_dicts)
        for dc in detected:
            dup_obj = DuplicateIntentCase(
                primary_order_id=dc["primary_order_id"],
                matched_order_id=dc["matched_order_id"],
                match_type=dc["match_type"],
                confidence=dc["confidence"],
                recommended_action=dc["recommended_action"],
                details=dc["details"]
            )
            db.add(dup_obj)
        db.commit()
        cases = db.query(DuplicateIntentCase).order_by(DuplicateIntentCase.created_at.desc()).all()

    result = []
    for c in cases:
        po = db.query(Order).filter(Order.order_id == c.primary_order_id).first()
        mo = db.query(Order).filter(Order.order_id == c.matched_order_id).first()
        cust = po.customer if po else None

        result.append({
            "id": c.id,
            "primary_order_id": c.primary_order_id,
            "matched_order_id": c.matched_order_id,
            "match_type": c.match_type,
            "confidence": c.confidence,
            "recommended_action": c.recommended_action,
            "details": c.details,
            "created_at": c.created_at,
            "customer_name": cust.name if cust else "Customer",
            "primary_amount": po.amount if po else 0.0,
            "matched_amount": mo.amount if mo else 0.0,
            "primary_variant": po.variant_info if po else "",
            "matched_variant": mo.variant_info if mo else ""
        })
    return result
