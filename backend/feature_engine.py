from typing import Dict, Any

class FeatureEngine:
    @staticmethod
    def extract_features(order_dict: Dict[str, Any], customer_dict: Dict[str, Any] = None, product_dict: Dict[str, Any] = None) -> Dict[str, Any]:
        c_dict = customer_dict or {}
        p_dict = product_dict or {}

        # 1. Customer return history
        cust_total = c_dict.get("total_orders", order_dict.get("customer_total_orders", 1))
        cust_returns = c_dict.get("return_count", order_dict.get("customer_return_count", 0))
        customer_return_rate = cust_returns / max(cust_total, 1)

        # 2. Product/Variant return history
        product_return_rate = p_dict.get("return_rate", order_dict.get("product_return_rate", 0.15))
        
        # 3. Product category risk mapping
        category = p_dict.get("category", order_dict.get("category", "General")).lower()
        category_risk_map = {
            "fashion": 0.35,
            "apparel": 0.38,
            "footwear": 0.40,
            "electronics": 0.22,
            "jewelry": 0.30,
            "beauty": 0.12,
            "home": 0.15
        }
        category_risk = category_risk_map.get(category, 0.20)

        # 4. Price band risk
        amount = order_dict.get("amount", 1000.0)
        if amount < 500:
            price_band_risk = 0.10
        elif amount <= 1500:
            price_band_risk = 0.25
        elif amount <= 3000:
            price_band_risk = 0.45
        else:
            price_band_risk = 0.60

        # 5. Customer-Product Pair risk
        customer_product_pair_risk = min(1.0, customer_return_rate * 1.5 + product_return_rate * 1.2)

        # 6. Cold / Warm Customer signal
        is_cold_customer = (cust_total <= 1)

        # 7. Cold / Warm Variant signal
        is_cold_variant = p_dict.get("total_sold", 10) < 5

        # 8. Serial Returner signal
        is_serial_returner = c_dict.get("is_serial_returner", order_dict.get("is_serial_returner", False)) or (cust_returns >= 2 and customer_return_rate >= 0.40)

        # 9. High Risk Variant signal
        is_high_risk_variant = p_dict.get("is_high_risk_variant", False) or (product_return_rate >= 0.30)

        # 10. COD / Prepaid Signal
        payment_method = str(order_dict.get("payment_method", "COD")).upper()
        cod_signal = 1.0 if payment_method == "COD" else 0.1

        # 11. Duplicate Intent Signal
        duplicate_intent_score = order_dict.get("duplicate_intent_score", 0.0)

        return {
            "customer_return_rate": round(customer_return_rate, 4),
            "product_return_rate": round(product_return_rate, 4),
            "category_risk": round(category_risk, 4),
            "price_band_risk": round(price_band_risk, 4),
            "customer_product_pair_risk": round(customer_product_pair_risk, 4),
            "is_cold_customer": is_cold_customer,
            "is_cold_variant": is_cold_variant,
            "is_serial_returner": is_serial_returner,
            "is_high_risk_variant": is_high_risk_variant,
            "cod_signal": cod_signal,
            "duplicate_intent_score": round(duplicate_intent_score, 4),
            "amount": amount,
            "payment_method": payment_method
        }
