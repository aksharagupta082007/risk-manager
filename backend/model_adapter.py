import os
import json
import joblib
from typing import Dict, Any, List
from feature_engine import FeatureEngine
from policy_engine import PolicyEngine

class SentinelRiskModel:
    def __init__(self, artifact_dir: str = "../model_artifacts"):
        self.artifact_dir = artifact_dir
        self.joblib_path = os.path.join(artifact_dir, "sentinel_model_bundle.joblib")
        self.json_path = os.path.join(artifact_dir, "sentinel_metadata.json")
        self.is_loaded = False
        self.model_bundle = None
        self.metadata = None

        self._load_artifacts()

    def _load_artifacts(self):
        if os.path.exists(self.joblib_path) and os.path.exists(self.json_path):
            try:
                self.model_bundle = joblib.load(self.joblib_path)
                with open(self.json_path, "r") as f:
                    self.metadata = json.load(f)
                self.is_loaded = True
                print("Sentinel v4 Model Bundle loaded successfully from joblib!")
            except Exception as e:
                print(f"Failed to load joblib bundle: {e}. Falling back to deterministic mock scoring.")
                self.is_loaded = False
        else:
            print(f"Model artifacts not found at '{self.artifact_dir}'. Using deterministic Sentinel v4 Mock Adapter.")

    def score_order(self, order_dict: Dict[str, Any], customer_dict: Dict[str, Any] = None, product_dict: Dict[str, Any] = None, mode: str = "balanced") -> Dict[str, Any]:
        features = FeatureEngine.extract_features(order_dict, customer_dict, product_dict)

        if self.is_loaded and self.model_bundle:
            # Inference using real joblib model bundle if present
            try:
                prob = float(self.model_bundle.predict_proba([list(features.values())])[0][1])
                risk_score = int(round(prob * 100))
            except Exception:
                risk_score, prob = self._compute_mock_score(features)
        else:
            risk_score, prob = self._compute_mock_score(features)

        # Generate Reason Codes & Segment
        segment, reason_codes = self._derive_segment_and_reasons(features, risk_score)

        # Map to recommended action via PolicyEngine
        policy_action = PolicyEngine.map_score_to_action(risk_score, mode)

        # Calculate estimated margin impact (prevented loss or friction cost)
        amount = features.get("amount", 1000.0)
        # Average RTO shipping + handling loss is ~30% of order value
        potential_rto_loss = amount * 0.35
        if policy_action == "a0_allow_cod":
            margin_impact = 0.0
        elif policy_action == "a1_whatsapp_confirmation":
            margin_impact = round(potential_rto_loss * 0.40, 2)
        elif policy_action == "a2_commitment_deposit":
            margin_impact = round(potential_rto_loss * 0.75, 2)
        else: # a3_prepaid_only_or_hold
            margin_impact = round(potential_rto_loss * 0.90, 2)

        return {
            "risk_score": risk_score,
            "risk_probability": round(prob, 4),
            "segment": segment,
            "recommended_action": policy_action,
            "reason_codes": reason_codes,
            "mode": mode,
            "margin_impact": margin_impact,
            "features": features
        }

    def _compute_mock_score(self, f: Dict[str, Any]) -> (int, float):
        # Deterministic weighted formula mimicking Sentinel v4 Gradient Boosting weights
        score = 15.0 # baseline

        if f["is_serial_returner"]:
            score += 35.0
        else:
            score += f["customer_return_rate"] * 25.0

        if f["is_high_risk_variant"]:
            score += 20.0
        else:
            score += f["product_return_rate"] * 15.0

        score += f["category_risk"] * 15.0
        score += f["price_band_risk"] * 12.0
        
        if f["payment_method"] == "COD":
            score += 15.0
        
        if f["duplicate_intent_score"] > 0:
            score += f["duplicate_intent_score"] * 30.0

        if f["is_cold_customer"]:
            score += 8.0

        # Cap between 5 and 98
        risk_score = int(min(98, max(5, round(score))))
        prob = round(risk_score / 100.0, 4)
        return risk_score, prob

    def _derive_segment_and_reasons(self, f: Dict[str, Any], score: int) -> (str, List[Dict[str, Any]]):
        reasons = []

        if f["duplicate_intent_score"] > 0.5:
            reasons.append({
                "code": "DUPLICATE_INTENT_FLAGGED",
                "description": "Customer placed multiple identical/variant orders within a short time frame",
                "weight": 0.85,
                "impact": "HIGH"
            })
            segment = "duplicate_intent"
        elif f["is_serial_returner"]:
            reasons.append({
                "code": "SERIAL_RETURNER_PROFILE",
                "description": f"Customer return rate is {int(f['customer_return_rate']*100)}% across historical orders",
                "weight": 0.90,
                "impact": "HIGH"
            })
            segment = "serial_returner"
        elif f["is_high_risk_variant"]:
            reasons.append({
                "code": "HIGH_RTO_PRODUCT_VARIANT",
                "description": f"Product variant return rate is {int(f['product_return_rate']*100)}% (above store average)",
                "weight": 0.70,
                "impact": "HIGH"
            })
            segment = "high_risk_variant"
        elif f["payment_method"] == "COD" and score >= 40:
            reasons.append({
                "code": "HIGH_VALUE_COD_ORDER",
                "description": f"Cash on Delivery order exceeding high-risk price band (₹{f['amount']})",
                "weight": 0.60,
                "impact": "MEDIUM"
            })
            segment = "high_value_cod"
        elif f["is_cold_customer"] and score >= 30:
            reasons.append({
                "code": "COLD_CUSTOMER_UNVERIFIED",
                "description": "First-time customer ordering via Cash on Delivery with no purchase history",
                "weight": 0.40,
                "impact": "MEDIUM"
            })
            segment = "cold_customer"
        else:
            reasons.append({
                "code": "LOW_RISK_VERIFIED_ORDER",
                "description": "Order history and buyer signals fall within safe operational parameters",
                "weight": 0.10,
                "impact": "LOW"
            })
            segment = "safe_order"

        if f["category_risk"] >= 0.30:
            reasons.append({
                "code": "HIGH_RISK_CATEGORY",
                "description": f"Category inherently experiences high RTO rates (Category risk index: {f['category_risk']})",
                "weight": 0.45,
                "impact": "MEDIUM"
            })

        return segment, reasons

sentinel_model = SentinelRiskModel()
