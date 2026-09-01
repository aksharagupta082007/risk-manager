import urllib.parse
from typing import Dict, Any
from config import settings

class ActionLayer:
    @staticmethod
    def generate_whatsapp_draft(order_id: str, customer_name: str, customer_phone: str, amount: float, product_name: str) -> Dict[str, Any]:
        clean_phone = customer_phone.replace("+", "").replace("-", "").replace(" ", "")
        if not clean_phone.startswith("91") and len(clean_phone) == 10:
            clean_phone = "91" + clean_phone

        text_message = (
            f"Hi {customer_name}! Thank you for placing your order #{order_id} for '{product_name}' (Total: ₹{amount:,.2f}) on {settings.MERCHANT_NAME}.\n\n"
            f"To expedite shipping and confirm your Cash on Delivery delivery address, please reply with YES to confirm your order.\n\n"
            f"Need assistance? Reply to this chat directly."
        )

        encoded_text = urllib.parse.quote(text_message)
        wa_link = f"https://wa.me/{clean_phone}?text={encoded_text}"

        return {
            "order_id": order_id,
            "recipient_phone": clean_phone,
            "recipient_name": customer_name,
            "message_text": text_message,
            "wa_link": wa_link,
            "action_type": "a1_whatsapp_confirmation"
        }

    @staticmethod
    def generate_deposit_link(order_id: str, customer_name: str, customer_phone: str, total_amount: float, deposit_amount: float = 150.0) -> Dict[str, Any]:
        mock_link_id = f"plink_rzp_sentinel_{order_id.replace('-', '_').lower()}"
        razorpay_mock_url = f"https://rzp.io/i/{mock_link_id}"

        deposit_text = (
            f"Hi {customer_name}! To lock in your Cash on Delivery order #{order_id} ({total_amount:,.2f}), "
            f"please pay a small refundable commitment deposit of ₹{deposit_amount:.0f}.\n\n"
            f"Pay deposit via UPI / Card: {razorpay_mock_url}\n"
            f"The remaining ₹{total_amount - deposit_amount:,.2f} will be collected upon delivery."
        )

        clean_phone = customer_phone.replace("+", "").replace("-", "").replace(" ", "")
        if not clean_phone.startswith("91") and len(clean_phone) == 10:
            clean_phone = "91" + clean_phone

        encoded_text = urllib.parse.quote(deposit_text)
        wa_link = f"https://wa.me/{clean_phone}?text={encoded_text}"

        return {
            "order_id": order_id,
            "recipient_name": customer_name,
            "total_amount": total_amount,
            "deposit_amount": deposit_amount,
            "remaining_cod_amount": total_amount - deposit_amount,
            "razorpay_payment_link": razorpay_mock_url,
            "message_text": deposit_text,
            "wa_link": wa_link,
            "action_type": "a2_commitment_deposit"
        }

    @staticmethod
    def recommend_prepaid_or_hold(order_id: str, customer_name: str, risk_score: int, segment: str) -> Dict[str, Any]:
        return {
            "order_id": order_id,
            "customer_name": customer_name,
            "risk_score": risk_score,
            "segment": segment,
            "recommendation": "Hold shipment and convert order to Prepaid Only.",
            "merchant_instruction": "Contact buyer via phone or email to collect full prepayment before fulfillment, or auto-cancel if unconfirmed within 24 hours.",
            "action_type": "a3_prepaid_only_or_hold"
        }
