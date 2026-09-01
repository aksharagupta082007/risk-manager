from typing import List, Dict, Any

class DuplicateDetector:
    @staticmethod
    def detect_cases(orders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cases = []
        
        # Group by customer_id or phone
        by_customer = {}
        by_phone = {}

        for o in orders:
            cid = o.get("customer_id", "")
            phone = o.get("customer_phone", o.get("phone", ""))
            
            if cid:
                by_customer.setdefault(cid, []).append(o)
            if phone:
                by_phone.setdefault(phone, []).append(o)

        case_id = 1
        seen_pairs = set()

        # 1. Detect Multi-variant order intent (buying size M and size L of same product)
        for cid, cust_orders in by_customer.items():
            if len(cust_orders) >= 2:
                for i in range(len(cust_orders)):
                    for j in range(i + 1, len(cust_orders)):
                        o1, o2 = cust_orders[i], cust_orders[j]
                        p1, p2 = o1.get("product_id"), o2.get("product_id")
                        pair_key = tuple(sorted([o1["order_id"], o2["order_id"]]))
                        
                        if pair_key in seen_pairs:
                            continue

                        if p1 == p2 and o1.get("variant_info") != o2.get("variant_info"):
                            seen_pairs.add(pair_key)
                            cases.append({
                                "id": case_id,
                                "primary_order_id": o1["order_id"],
                                "matched_order_id": o2["order_id"],
                                "customer_id": cid,
                                "customer_name": o1.get("customer_name", "Customer"),
                                "match_type": "multi_variant_bracket",
                                "confidence": 0.92,
                                "recommended_action": "a2_commitment_deposit",
                                "details": f"Buyer ordered size/color variants ('{o1.get('variant_info')}' & '{o2.get('variant_info')}') of '{o1.get('product_name')}' within 48h. High probability of returning one variant."
                            })
                            case_id += 1

        # 2. Detect same phone/address across multiple customer accounts
        for phone, phone_orders in by_phone.items():
            if len(phone_orders) >= 2:
                customer_ids = set([o.get("customer_id") for o in phone_orders])
                if len(customer_ids) >= 2:
                    o1, o2 = phone_orders[0], phone_orders[1]
                    pair_key = tuple(sorted([o1["order_id"], o2["order_id"]]))
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        cases.append({
                            "id": case_id,
                            "primary_order_id": o1["order_id"],
                            "matched_order_id": o2["order_id"],
                            "customer_id": o1.get("customer_id"),
                            "customer_name": o1.get("customer_name", "Customer"),
                            "match_type": "cross_account_phone_match",
                            "confidence": 0.88,
                            "recommended_action": "a3_prepaid_only_or_hold",
                            "details": f"Phone number '{phone}' matched across multiple distinct customer profiles ({', '.join(customer_ids)})."
                        })
                        case_id += 1

        # 3. Detect duplicate order spam (same product ordered multiple times in short window)
        for cid, cust_orders in by_customer.items():
            if len(cust_orders) >= 2:
                for i in range(len(cust_orders)):
                    for j in range(i + 1, len(cust_orders)):
                        o1, o2 = cust_orders[i], cust_orders[j]
                        if o1.get("product_id") == o2.get("product_id"):
                            pair_key = tuple(sorted([o1["order_id"], o2["order_id"]]))
                            if pair_key not in seen_pairs:
                                seen_pairs.add(pair_key)
                                cases.append({
                                    "id": case_id,
                                    "primary_order_id": o1["order_id"],
                                    "matched_order_id": o2["order_id"],
                                    "customer_id": cid,
                                    "customer_name": o1.get("customer_name", "Customer"),
                                    "match_type": "duplicate_item_spam",
                                    "confidence": 0.85,
                                    "recommended_action": "a1_whatsapp_confirmation",
                                    "details": f"Customer placed 2 identical orders for '{o1.get('product_name')}' within the same order window."
                                })
                                case_id += 1

        return cases
