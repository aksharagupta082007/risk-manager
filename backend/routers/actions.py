from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Order, Action
from schemas import DraftMessageRequest, DepositLinkRequest
from action_layer import ActionLayer

router = APIRouter(prefix="/actions", tags=["Actions"])

@router.post("/draft-message")
def draft_whatsapp_message(payload: DraftMessageRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    cust = order.customer
    prod = order.product

    c_name = cust.name if cust else "Valued Customer"
    c_phone = cust.phone if cust else "919876543210"
    p_name = prod.name if prod else "Order Item"

    draft = ActionLayer.generate_whatsapp_draft(
        order_id=order.order_id,
        customer_name=c_name,
        customer_phone=c_phone,
        amount=order.amount,
        product_name=p_name
    )

    action_record = Action(
        order_id=order.order_id,
        action_type="a1_whatsapp_confirmation",
        action_data=draft,
        status="DRAFTED",
        wa_link=draft["wa_link"]
    )
    db.add(action_record)
    db.commit()

    return draft

@router.post("/create-deposit-link")
def create_deposit_link(payload: DepositLinkRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    cust = order.customer
    c_name = cust.name if cust else "Valued Customer"
    c_phone = cust.phone if cust else "919876543210"

    deposit_res = ActionLayer.generate_deposit_link(
        order_id=order.order_id,
        customer_name=c_name,
        customer_phone=c_phone,
        total_amount=order.amount,
        deposit_amount=payload.deposit_amount
    )

    action_record = Action(
        order_id=order.order_id,
        action_type="a2_commitment_deposit",
        action_data=deposit_res,
        status="CREATED",
        wa_link=deposit_res["wa_link"],
        deposit_link=deposit_res["razorpay_payment_link"]
    )
    db.add(action_record)
    db.commit()

    return deposit_res
