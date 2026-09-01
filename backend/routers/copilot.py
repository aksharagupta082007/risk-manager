from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Order, RiskScore
from schemas import CopilotExplainRequest, CopilotDailyBriefRequest, CopilotChatRequest
from copilot import RiskCopilot

router = APIRouter(prefix="/copilot", tags=["Copilot"])

@router.post("/explain-risk")
def explain_order_risk(payload: CopilotExplainRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    r = order.risk_score
    c = order.customer
    p = order.product

    order_dict = {
        "order_id": order.order_id,
        "amount": order.amount,
        "payment_method": order.payment_method,
        "customer_name": c.name if c else "Customer",
        "product_name": p.name if p else "Product",
        "risk_score": r.risk_score if r else 15,
        "segment": r.segment if r else "safe_order",
        "reason_codes": [{"code": rc.code, "description": rc.description} for rc in r.reason_codes] if r else []
    }

    return RiskCopilot.explain_order_risk(order_dict)

@router.post("/daily-brief")
def get_daily_brief(payload: CopilotDailyBriefRequest, db: Session = Depends(get_db)):
    total_orders = db.query(Order).count()
    high_risk_count = db.query(Order).join(RiskScore).filter(RiskScore.risk_score >= 30).count()
    
    total_amount = sum([o.amount for o in db.query(Order).all()])
    prevented_loss = sum([o.risk_score.margin_impact for o in db.query(Order).join(RiskScore).all() if o.risk_score])

    return RiskCopilot.generate_daily_brief(total_orders, high_risk_count, total_amount, prevented_loss)

@router.post("/chat")
def copilot_chat(payload: CopilotChatRequest, db: Session = Depends(get_db)):
    context_order = None
    if payload.order_id:
        o = db.query(Order).filter(Order.order_id == payload.order_id).first()
        if o:
            r = o.risk_score
            c = o.customer
            p = o.product
            context_order = {
                "order_id": o.order_id,
                "amount": o.amount,
                "payment_method": o.payment_method,
                "customer_name": c.name if c else "Customer",
                "customer_phone": c.phone if c else "",
                "product_name": p.name if p else "Product",
                "risk_score": r.risk_score if r else 15,
                "segment": r.segment if r else "safe_order",
                "reason_codes": [{"code": rc.code, "description": rc.description} for rc in r.reason_codes] if r else []
            }

    return RiskCopilot.handle_chat_prompt(payload.prompt, context_order)
