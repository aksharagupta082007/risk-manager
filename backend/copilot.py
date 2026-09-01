import requests
from typing import Dict, Any, Optional
from config import settings
from action_layer import ActionLayer

class RiskCopilot:
    @classmethod
    def explain_order_risk(cls, order_data: Dict[str, Any]) -> Dict[str, Any]:
        order_id = order_data.get("order_id", "ORD-1001")
        risk_score = order_data.get("risk_score", 75)
        segment = order_data.get("segment", "serial_returner")
        reasons = order_data.get("reason_codes", [])
        amount = order_data.get("amount", 1499)
        customer_name = order_data.get("customer_name", "Customer")
        payment_method = order_data.get("payment_method", "COD")

        prompt = f"""You are Sentinel AI Risk Copilot for an e-commerce merchant.
Explain the RTO return risk for Order #{order_id}.
Details:
- Customer: {customer_name}
- Order Amount: ₹{amount} ({payment_method})
- Risk Score: {risk_score}/100
- Risk Segment: {segment}
- Key Risk Signals: {[r.get('description') for r in reasons]}

Provide a concise, 3-bullet-point explanation focusing on margin protection and recommended protective action. Do NOT label the customer as a fraudster."""

        hf_response = cls._query_huggingface(prompt)
        if hf_response:
            explanation = hf_response
        else:
            explanation = cls._generate_fallback_explanation(order_id, risk_score, segment, reasons, amount, payment_method)

        return {
            "order_id": order_id,
            "risk_score": risk_score,
            "segment": segment,
            "explanation": explanation,
            "is_llm_generated": bool(hf_response)
        }

    @classmethod
    def generate_daily_brief(cls, total_orders: int, high_risk_count: int, total_amount: float, prevented_loss: float) -> Dict[str, Any]:
        prompt = f"""Provide a executive daily risk summary for e-commerce operations.
Stats: Total Orders = {total_orders}, High-Risk Orders = {high_risk_count}, Total Volume = ₹{total_amount:,.2f}, Expected Prevented Loss = ₹{prevented_loss:,.2f}.
Format into 3 key merchant takeaways: 1. Risk posture, 2. Priority actions required, 3. Revenue margin protected."""

        hf_response = cls._query_huggingface(prompt)
        if hf_response:
            summary = hf_response
        else:
            summary = (
                f"**Sentinel Operations Brief for Today**\n\n"
                f"• **Risk Posture**: Analyzed {total_orders} incoming orders today with {high_risk_count} orders flagged as elevated return/RTO risk ({round(high_risk_count/max(total_orders,1)*100, 1)}% flag rate).\n"
                f"• **Margin Protection**: Sentinel protective policies are projected to prevent **₹{prevented_loss:,.2f}** in net RTO logistics losses.\n"
                f"• **Recommended Priority**: Review the {high_risk_count} flagged orders in the High-Risk Queue and initiate WhatsApp confirmation or commitment deposit links."
            )

        return {
            "summary": summary,
            "total_orders": total_orders,
            "high_risk_count": high_risk_count,
            "prevented_loss": prevented_loss,
            "is_llm_generated": bool(hf_response)
        }

    @classmethod
    def handle_chat_prompt(cls, prompt_text: str, context_order: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        lower_p = prompt_text.lower()
        
        if "explain" in lower_p and context_order:
            return cls.explain_order_risk(context_order)

        if "brief" in lower_p or "summary" in lower_p or "today" in lower_p:
            return cls.generate_daily_brief(60, 18, 142500.0, 38400.0)

        if "draft" in lower_p and "whatsapp" in lower_p and context_order:
            draft = ActionLayer.generate_whatsapp_draft(
                context_order.get("order_id", "ORD-1001"),
                context_order.get("customer_name", "Valued Customer"),
                context_order.get("customer_phone", "919876543210"),
                context_order.get("amount", 1499.0),
                context_order.get("product_name", "Item")
            )
            return {
                "explanation": f"Here is the drafted WhatsApp confirmation message for Order #{context_order.get('order_id')}:\n\n```{draft['message_text']}```\n\n[Click here to open in WhatsApp]({draft['wa_link']})",
                "wa_link": draft['wa_link'],
                "is_llm_generated": False
            }

        if "deposit" in lower_p and context_order:
            draft = ActionLayer.generate_deposit_link(
                context_order.get("order_id", "ORD-1001"),
                context_order.get("customer_name", "Valued Customer"),
                context_order.get("customer_phone", "919876543210"),
                context_order.get("amount", 1499.0)
            )
            return {
                "explanation": f"Here is the ₹150 commitment deposit link draft for Order #{context_order.get('order_id')}:\n\n```{draft['message_text']}```\n\nRazorpay Mock Link: {draft['razorpay_payment_link']}",
                "deposit_link": draft['razorpay_payment_link'],
                "is_llm_generated": False
            }

        # General LLM query / fallback
        sys_prompt = f"You are Sentinel AI Risk Copilot. Assist the merchant with: '{prompt_text}'. Keep response focused on pre-shipping RTO risk, margin protection, precision/recall trade-offs, and protective action selection."
        hf_response = cls._query_huggingface(sys_prompt)

        if hf_response:
            ans = hf_response
        else:
            ans = (
                f"**Sentinel Copilot Analysis**\n\n"
                f"Regarding: *\"{prompt_text}\"*\n\n"
                f"1. **Risk Signal Impact**: Sentinel evaluates customer historical return velocity, category baseline RTO rates, and payment friction.\n"
                f"2. **Policy Guidance**: Under Balanced mode, orders with risk score > 30% trigger WhatsApp verification, while > 75% trigger Prepaid-only rules to maximize margin saved while keeping customer friction low.\n"
                f"3. **Suggested Action**: Select an order from the High-Risk Queue to generate customized protective actions or inspect reason codes."
            )

        return {
            "explanation": ans,
            "is_llm_generated": bool(hf_response)
        }

    @classmethod
    def _query_huggingface(cls, prompt: str) -> Optional[str]:
        api_key = settings.HUGGINGFACE_API_KEY
        if not api_key:
            return None

        try:
            headers = {"Authorization": f"Bearer {api_key}"}
            url = f"https://api-inference.huggingface.co/models/{settings.HUGGINGFACE_MODEL}"
            payload = {
                "inputs": prompt,
                "parameters": {"max_new_tokens": 250, "temperature": 0.3}
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=5)
            if resp.status_code == 200:
                result = resp.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get("generated_text", "").replace(prompt, "").strip()
        except Exception:
            pass
        return None

    @classmethod
    def _generate_fallback_explanation(cls, order_id: str, risk_score: int, segment: str, reasons: list, amount: float, payment_method: str) -> str:
        reasons_text = "\n".join([f"  • **{r.get('code', 'RISK')}**: {r.get('description')}" for r in reasons])
        if not reasons_text:
            reasons_text = "  • High price-band COD order from unverified customer profile."

        return (
            f"### Order #{order_id} Risk Assessment ({risk_score}% Risk)\n\n"
            f"**Key Risk Factors:**\n{reasons_text}\n\n"
            f"**Margin Impact Analysis:**\n"
            f"Allowing this ₹{amount:,.2f} {payment_method} order to ship unverified carries an estimated ₹{amount*0.35:,.2f} RTO logistics loss risk.\n\n"
            f"**Recommended Low-Friction Action:**\n"
            f"{'Request ₹150 Commitment Deposit (a2)' if risk_score >= 55 else 'Send WhatsApp Address Confirmation (a1)'} to verify buyer intent before dispatching shipment."
        )
