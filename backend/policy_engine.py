from typing import Dict, Any, List

class PolicyEngine:
    DEFAULT_BALANCED_THRESHOLDS = {
        "a1_threshold": 30.0,
        "a2_threshold": 55.0,
        "a3_threshold": 75.0,
    }

    DEFAULT_FESTIVAL_THRESHOLDS = {
        "a1_threshold": 20.0,
        "a2_threshold": 40.0,
        "a3_threshold": 60.0,
    }

    @classmethod
    def map_score_to_action(cls, score: float, mode: str = "balanced", custom_thresholds: Dict[str, float] = None) -> str:
        if custom_thresholds:
            a1 = custom_thresholds.get("a1_threshold", 30.0)
            a2 = custom_thresholds.get("a2_threshold", 55.0)
            a3 = custom_thresholds.get("a3_threshold", 75.0)
        elif mode.lower() == "festival" or mode.lower() == "aggressive":
            a1 = cls.DEFAULT_FESTIVAL_THRESHOLDS["a1_threshold"]
            a2 = cls.DEFAULT_FESTIVAL_THRESHOLDS["a2_threshold"]
            a3 = cls.DEFAULT_FESTIVAL_THRESHOLDS["a3_threshold"]
        else:
            a1 = cls.DEFAULT_BALANCED_THRESHOLDS["a1_threshold"]
            a2 = cls.DEFAULT_BALANCED_THRESHOLDS["a2_threshold"]
            a3 = cls.DEFAULT_BALANCED_THRESHOLDS["a3_threshold"]

        if score < a1:
            return "a0_allow_cod"
        elif score < a2:
            return "a1_whatsapp_confirmation"
        elif score < a3:
            return "a2_commitment_deposit"
        else:
            return "a3_prepaid_only_or_hold"

    @classmethod
    def simulate(cls, orders: List[Dict[str, Any]], mode: str, a1: float, a2: float, a3: float) -> Dict[str, Any]:
        total_orders = len(orders)
        if total_orders == 0:
            return {
                "total_orders_analyzed": 0,
                "intervention_rate": 0.0,
                "expected_returns_caught": 0,
                "false_positive_count": 0,
                "false_positive_cost": 0.0,
                "expected_prevented_loss": 0.0,
                "net_margin_saved": 0.0,
                "mode": mode,
                "a0_count": 0,
                "a1_count": 0,
                "a2_count": 0,
                "a3_count": 0
            }

        custom_thresholds = {"a1_threshold": a1, "a2_threshold": a2, "a3_threshold": a3}

        a0_count = 0
        a1_count = 0
        a2_count = 0
        a3_count = 0

        total_prevented_loss = 0.0
        total_fp_cost = 0.0
        returns_caught = 0
        fp_count = 0

        for order in orders:
            score = order.get("risk_score", 15)
            amount = order.get("amount", 1200.0)
            is_actual_return = order.get("is_actual_return", (score >= 45))

            action = cls.map_score_to_action(score, mode, custom_thresholds)

            if action == "a0_allow_cod":
                a0_count += 1
            elif action == "a1_whatsapp_confirmation":
                a1_count += 1
                if is_actual_return:
                    returns_caught += 1
                    total_prevented_loss += (amount * 0.35) * 0.50 # 50% caught by WhatsApp confirmation
                else:
                    fp_count += 1
                    total_fp_cost += 15.0 # friction cost of message
            elif action == "a2_commitment_deposit":
                a2_count += 1
                if is_actual_return:
                    returns_caught += 1
                    total_prevented_loss += (amount * 0.35) * 0.80 # 80% caught by deposit requirement
                else:
                    fp_count += 1
                    total_fp_cost += (amount * 0.05) # 5% friction drop-off on honest customers
            elif action == "a3_prepaid_only_or_hold":
                a3_count += 1
                if is_actual_return:
                    returns_caught += 1
                    total_prevented_loss += (amount * 0.35) * 0.95 # 95% caught by hold/prepaid
                else:
                    fp_count += 1
                    total_fp_cost += (amount * 0.12) # 12% lost conversion friction on honest customers

        interventions = a1_count + a2_count + a3_count
        intervention_rate = round((interventions / total_orders) * 100, 1)
        net_margin_saved = round(total_prevented_loss - total_fp_cost, 2)

        return {
            "total_orders_analyzed": total_orders,
            "intervention_rate": intervention_rate,
            "expected_returns_caught": returns_caught,
            "false_positive_count": fp_count,
            "false_positive_cost": round(total_fp_cost, 2),
            "expected_prevented_loss": round(total_prevented_loss, 2),
            "net_margin_saved": net_margin_saved,
            "mode": mode,
            "a0_count": a0_count,
            "a1_count": a1_count,
            "a2_count": a2_count,
            "a3_count": a3_count
        }
