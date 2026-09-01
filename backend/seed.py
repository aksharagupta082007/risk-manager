import datetime
import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Order, Customer, Product, RiskScore, ReasonCode, MerchantPolicy, Action, Override, DuplicateIntentCase, DailyReport
from feature_engine import FeatureEngine
from model_adapter import sentinel_model
from duplicate_detector import DuplicateDetector

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Order).count() > 0:
            print("Database already contains seed data.")
            return

        print("Seeding Sentinel AI Risk Manager database...")

        # 1. Create Merchant Policy
        policy_balanced = MerchantPolicy(
            mode="balanced",
            a1_threshold=30.0,
            a2_threshold=55.0,
            a3_threshold=75.0,
            active=True
        )
        db.add(policy_balanced)

        # 2. Customers
        customers_data = [
            # High return rate serial returners
            {"id": "CUST-101", "name": "Rahul Verma", "phone": "919876543210", "email": "rahul.v@gmail.com", "total_orders": 12, "return_count": 8, "return_rate": 0.67, "is_serial_returner": True},
            {"id": "CUST-102", "name": "Priya Sharma", "phone": "919812345678", "email": "priya.s@yahoo.com", "total_orders": 15, "return_count": 9, "return_rate": 0.60, "is_serial_returner": True},
            {"id": "CUST-103", "name": "Amit Patel", "phone": "919765432109", "email": "amit.p@outlook.com", "total_orders": 8, "return_count": 5, "return_rate": 0.625, "is_serial_returner": True},
            {"id": "CUST-104", "name": "Sneha Gupta", "phone": "919988776655", "email": "sneha.g@gmail.com", "total_orders": 10, "return_count": 6, "return_rate": 0.60, "is_serial_returner": True},
            
            # Moderate returners
            {"id": "CUST-105", "name": "Vikram Singh", "phone": "919898989898", "email": "vikram.s@gmail.com", "total_orders": 6, "return_count": 2, "return_rate": 0.33, "is_serial_returner": False},
            {"id": "CUST-106", "name": "Ananya Roy", "phone": "919777666555", "email": "ananya.r@gmail.com", "total_orders": 5, "return_count": 2, "return_rate": 0.40, "is_serial_returner": False},
            {"id": "CUST-107", "name": "Rohan Mehta", "phone": "919666555444", "email": "rohan.m@gmail.com", "total_orders": 7, "return_count": 2, "return_rate": 0.28, "is_serial_returner": False},

            # First-time / Cold customers
            {"id": "CUST-108", "name": "Karan Malhotra", "phone": "919555444333", "email": "karan.m@gmail.com", "total_orders": 1, "return_count": 0, "return_rate": 0.0, "is_serial_returner": False},
            {"id": "CUST-109", "name": "Divya Joshi", "phone": "919444333222", "email": "divya.j@gmail.com", "total_orders": 1, "return_count": 0, "return_rate": 0.0, "is_serial_returner": False},
            {"id": "CUST-110", "name": "Siddharth Kumar", "phone": "919333222111", "email": "siddharth.k@gmail.com", "total_orders": 1, "return_count": 0, "return_rate": 0.0, "is_serial_returner": False},

            # Reliable Buyers
            {"id": "CUST-111", "name": "Deepak Reddy", "phone": "919222111000", "email": "deepak.r@gmail.com", "total_orders": 20, "return_count": 1, "return_rate": 0.05, "is_serial_returner": False},
            {"id": "CUST-112", "name": "Meera Nair", "phone": "919111000999", "email": "meera.n@gmail.com", "total_orders": 18, "return_count": 0, "return_rate": 0.0, "is_serial_returner": False},
            {"id": "CUST-113", "name": "Aditya Rao", "phone": "919000999888", "email": "aditya.r@gmail.com", "total_orders": 14, "return_count": 1, "return_rate": 0.07, "is_serial_returner": False},
            {"id": "CUST-114", "name": "Pooja Banerjee", "phone": "919888777666", "email": "pooja.b@gmail.com", "total_orders": 12, "return_count": 0, "return_rate": 0.0, "is_serial_returner": False},
            {"id": "CUST-115", "name": "Varun Agarwal", "phone": "919777888999", "email": "varun.a@gmail.com", "total_orders": 9, "return_count": 1, "return_rate": 0.11, "is_serial_returner": False},
        ]

        cust_objs = {}
        for cd in customers_data:
            c = Customer(
                customer_id=cd["id"],
                name=cd["name"],
                phone=cd["phone"],
                email=cd["email"],
                total_orders=cd["total_orders"],
                return_count=cd["return_count"],
                return_rate=cd["return_rate"],
                is_serial_returner=cd["is_serial_returner"]
            )
            db.add(c)
            cust_objs[cd["id"]] = cd

        # 3. Products
        products_data = [
            # High-risk variants
            {"id": "PROD-FASH-01", "name": "Urban Slim Fit Denim Jeans", "category": "Fashion", "variant": "Size 32 - Dark Blue", "price": 2499.0, "total_sold": 150, "return_count": 52, "return_rate": 0.35, "is_high_risk": True},
            {"id": "PROD-FOOT-02", "name": "AirStride Pro Running Shoes", "category": "Footwear", "variant": "Size 9 - Black/Red", "price": 4299.0, "total_sold": 120, "return_count": 48, "return_rate": 0.40, "is_high_risk": True},
            {"id": "PROD-FASH-03", "name": "Designer Embroidered Kurti Set", "category": "Fashion", "variant": "Size L - Maroon", "price": 3199.0, "total_sold": 90, "return_count": 34, "return_rate": 0.38, "is_high_risk": True},
            {"id": "PROD-FASH-04", "name": "Leather Biker Jacket", "category": "Fashion", "variant": "Size XL - Black", "price": 6499.0, "total_sold": 40, "return_count": 18, "return_rate": 0.45, "is_high_risk": True},
            
            # Normal Products
            {"id": "PROD-ELEC-05", "name": "Wireless Noise Cancelling Earbuds", "category": "Electronics", "variant": "Matte Black", "price": 2999.0, "total_sold": 310, "return_count": 31, "return_rate": 0.10, "is_high_risk": False},
            {"id": "PROD-ELEC-06", "name": "Smart Fitness Watch Ultra", "category": "Electronics", "variant": "Silver Strap", "price": 4999.0, "total_sold": 220, "return_count": 26, "return_rate": 0.12, "is_high_risk": False},
            {"id": "PROD-BEAU-07", "name": "Hydrating Face Serum 50ml", "category": "Beauty", "variant": "Standard Pack", "price": 899.0, "total_sold": 500, "return_count": 25, "return_rate": 0.05, "is_high_risk": False},
            {"id": "PROD-HOME-08", "name": "Memory Foam Orthopedic Pillow", "category": "Home", "variant": "King Size", "price": 1799.0, "total_sold": 180, "return_count": 18, "return_rate": 0.10, "is_high_risk": False},
            {"id": "PROD-FASH-09", "name": "Classic Oxford Cotton Shirt", "category": "Fashion", "variant": "Size M - White", "price": 1499.0, "total_sold": 420, "return_count": 63, "return_rate": 0.15, "is_high_risk": False},
            {"id": "PROD-FASH-10", "name": "Classic Oxford Cotton Shirt", "category": "Fashion", "variant": "Size L - White", "price": 1499.0, "total_sold": 410, "return_count": 61, "return_rate": 0.15, "is_high_risk": False},
        ]

        prod_objs = {}
        for pd in products_data:
            p = Product(
                product_id=pd["id"],
                name=pd["name"],
                category=pd["category"],
                variant=pd["variant"],
                price=pd["price"],
                total_sold=pd["total_sold"],
                return_count=pd["return_count"],
                return_rate=pd["return_rate"],
                is_high_risk_variant=pd["is_high_risk"]
            )
            db.add(p)
            prod_objs[pd["id"]] = pd

        db.commit()

        # 4. Generate 60 realistic orders
        cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Kolkata", "Surat", "Chandigarh"]
        pincodes = ["560001", "400001", "110001", "500001", "411001", "380001", "302001", "700001", "395001", "160001"]

        orders_list = []
        now = datetime.datetime.utcnow()

        # Special test orders for duplicate intent
        orders_list.append({
            "order_id": "ORD-8901",
            "customer_id": "CUST-101",
            "product_id": "PROD-FASH-09",
            "amount": 1499.0,
            "payment_method": "COD",
            "status": "PENDING",
            "city": "Bengaluru",
            "pincode": "560001",
            "shipping_address": "Flat 402, Green Glen Layout, Bellandur",
            "variant_info": "Size M - White",
            "duplicate_intent_score": 0.90,
            "created_at": now - datetime.timedelta(hours=2)
        })
        orders_list.append({
            "order_id": "ORD-8902",
            "customer_id": "CUST-101",
            "product_id": "PROD-FASH-10",
            "amount": 1499.0,
            "payment_method": "COD",
            "status": "PENDING",
            "city": "Bengaluru",
            "pincode": "560001",
            "shipping_address": "Flat 402, Green Glen Layout, Bellandur",
            "variant_info": "Size L - White",
            "duplicate_intent_score": 0.95,
            "created_at": now - datetime.timedelta(hours=1)
        })

        # High risk serial returner order
        orders_list.append({
            "order_id": "ORD-8903",
            "customer_id": "CUST-102",
            "product_id": "PROD-FOOT-02",
            "amount": 4299.0,
            "payment_method": "COD",
            "status": "PENDING",
            "city": "Delhi",
            "pincode": "110001",
            "shipping_address": "House 54, Block C, Vasant Vihar",
            "variant_info": "Size 9 - Black/Red",
            "duplicate_intent_score": 0.0,
            "created_at": now - datetime.timedelta(hours=3)
        })

        # Additional 57 generated orders
        for idx in range(4, 61):
            oid = f"ORD-{8900 + idx}"
            c_data = random.choice(customers_data)
            p_data = random.choice(products_data)
            
            # Payment method preference (COD for high returners)
            if c_data["is_serial_returner"]:
                pm = "COD" if random.random() < 0.85 else "PREPAID"
            else:
                pm = "COD" if random.random() < 0.35 else "PREPAID"

            city_idx = random.randint(0, len(cities) - 1)
            created_time = now - datetime.timedelta(hours=random.randint(1, 120))

            orders_list.append({
                "order_id": oid,
                "customer_id": c_data["id"],
                "product_id": p_data["id"],
                "amount": p_data["price"],
                "payment_method": pm,
                "status": "PENDING",
                "city": cities[city_idx],
                "pincode": pincodes[city_idx],
                "shipping_address": f"Building {random.randint(1, 100)}, Street {random.randint(1, 20)}, {cities[city_idx]}",
                "variant_info": p_data["variant"],
                "duplicate_intent_score": 0.0,
                "created_at": created_time
            })

        # Insert orders and calculate Sentinel scores
        raw_order_dicts = []
        for o_dict in orders_list:
            order_obj = Order(
                order_id=o_dict["order_id"],
                customer_id=o_dict["customer_id"],
                product_id=o_dict["product_id"],
                amount=o_dict["amount"],
                payment_method=o_dict["payment_method"],
                status=o_dict["status"],
                city=o_dict["city"],
                pincode=o_dict["pincode"],
                shipping_address=o_dict["shipping_address"],
                variant_info=o_dict["variant_info"],
                created_at=o_dict["created_at"]
            )
            db.add(order_obj)

            c_info = cust_objs[o_dict["customer_id"]]
            p_info = prod_objs[o_dict["product_id"]]

            score_res = sentinel_model.score_order(
                order_dict=o_dict,
                customer_dict=c_info,
                product_dict=p_info,
                mode="balanced"
            )

            risk_obj = RiskScore(
                order_id=o_dict["order_id"],
                risk_score=score_res["risk_score"],
                risk_probability=score_res["risk_probability"],
                segment=score_res["segment"],
                recommended_action=score_res["recommended_action"],
                mode="balanced",
                margin_impact=score_res["margin_impact"],
                scored_at=o_dict["created_at"]
            )
            db.add(risk_obj)
            db.flush()

            for rc in score_res["reason_codes"]:
                reason_obj = ReasonCode(
                    risk_score_id=risk_obj.id,
                    code=rc["code"],
                    description=rc["description"],
                    weight=rc["weight"],
                    impact=rc["impact"]
                )
                db.add(reason_obj)

            raw_order_dicts.append({
                "order_id": o_dict["order_id"],
                "customer_id": o_dict["customer_id"],
                "customer_name": c_info["name"],
                "customer_phone": c_info["phone"],
                "product_id": o_dict["product_id"],
                "product_name": p_info["name"],
                "variant_info": o_dict["variant_info"],
                "risk_score": score_res["risk_score"],
                "amount": o_dict["amount"]
            })

        db.commit()

        # 5. Seed Duplicate Intent Cases
        dup_cases = DuplicateDetector.detect_cases(raw_order_dicts)
        for dc in dup_cases:
            dup_obj = DuplicateIntentCase(
                primary_order_id=dc["primary_order_id"],
                matched_order_id=dc["matched_order_id"],
                match_type=dc["match_type"],
                confidence=dc["confidence"],
                recommended_action=dc["recommended_action"],
                details=dc["details"]
            )
            db.add(dup_obj)

        # 6. Seed Sample Overrides
        overrides_sample = [
            Override(order_id="ORD-8902", old_action="a3_prepaid_only_or_hold", new_action="a1_whatsapp_confirmation", reason="Customer called support and verified address & size preference.", merchant_id="admin_merchant"),
            Override(order_id="ORD-8915", old_action="a2_commitment_deposit", new_action="a0_allow_cod", reason="VIP corporate buyer exception.", merchant_id="admin_merchant")
        ]
        for ov in overrides_sample:
            db.add(ov)

        # 7. Seed Daily Report
        daily = DailyReport(
            date=datetime.date.today().strftime("%Y-%m-%d"),
            total_orders=len(orders_list),
            high_risk_count=18,
            expected_prevented_loss=42800.0,
            false_positive_cost=3200.0,
            net_margin_saved=39600.0
        )
        db.add(daily)

        db.commit()
        print("Sentinel database successfully seeded with 60 orders!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
