# API Reference

Sentinel exposes a RESTful API via FastAPI. All endpoints are available at `http://localhost:8000` (development) with interactive Swagger docs at `/docs`.

**Base URL**: `http://localhost:8000`

---

## Orders

### `GET /orders`

Retrieve all orders with enriched risk data.

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by order status (`PENDING`, `SHIPPED`, `RETURNED`, `DELIVERED`, `CANCELLED`, `ON_HOLD`) |
| `created_after` | string | No | ISO date string — only return orders created after this date |

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "order_id": "ORD-1001",
    "customer_id": "CUST-001",
    "product_id": "PROD-001",
    "amount": 2499.0,
    "payment_method": "COD",
    "status": "PENDING",
    "city": "Mumbai",
    "pincode": "400001",
    "created_at": "2026-09-03T10:00:00",
    "risk_score": 72,
    "risk_probability": 0.72,
    "segment": "high_value_cod",
    "recommended_action": "a2_commitment_deposit",
    "margin_impact": 655.24,
    "mode": "balanced",
    "reason_codes": [
      {
        "code": "HIGH_VALUE_COD_ORDER",
        "description": "Cash on Delivery order exceeding high-risk price band (₹2499.0)",
        "weight": 0.60,
        "impact": "MEDIUM"
      }
    ],
    "customer_name": "Priya Sharma",
    "product_name": "Premium Silk Saree"
  }
]
```

---

### `GET /orders/high-risk`

Retrieve orders above a risk score threshold.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `min_score` | integer | No | 30 | Minimum risk score to include |
| `created_after` | string | No | — | ISO date filter |

**Response:** `200 OK` — Same schema as `GET /orders`

---

### `GET /orders/{order_id}`

Retrieve a single order by its order ID.

**Path Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `order_id` | string | The order identifier (e.g., `ORD-1001`) |

**Response:** `200 OK` — Single order object

---

### `POST /orders/manual`

Create a new order with manual form data and automatically score it.

**Request Body:**
```json
{
  "customer_id": "CUST-NEW-01",
  "customer_name": "Rahul Sharma",
  "customer_phone": "919876543210",
  "customer_email": "rahul@example.com",
  "product_id": "PROD-SHIRT-01",
  "product_name": "Slim Fit Cotton Shirt",
  "category": "Fashion",
  "variant": "Size L - Blue",
  "amount": 1499.0,
  "payment_method": "COD",
  "city": "Bengaluru",
  "pincode": "560001",
  "shipping_address": "123, MG Road, Indiranagar",
  "customer_total_orders": 4,
  "customer_return_count": 2,
  "product_return_rate": 0.28,
  "is_serial_returner": false
}
```

**Response:** `200 OK`
```json
{
  "order_id": "ORD-MAN-a1b2c3",
  "risk_score": 68,
  "risk_probability": 0.68,
  "segment": "high_value_cod",
  "recommended_action": "a2_commitment_deposit",
  "reason_codes": [...],
  "margin_impact": 393.14
}
```

---

### `POST /orders/upload-csv`

Batch upload orders from a CSV file.

**Request:** `multipart/form-data` with a `file` field containing the CSV.

**CSV Columns Expected:**
`order_id`, `customer_id`, `customer_name`, `customer_phone`, `product_id`, `product_name`, `category`, `variant`, `amount`, `payment_method`, `city`, `pincode`

**Response:** `200 OK`
```json
{
  "message": "Successfully processed 25 orders",
  "total": 25,
  "scored": 25
}
```

---

## Scoring

### `POST /score-order`

Score or re-score a single existing order.

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `order_id` | string | Yes | Order ID to score |

**Response:** `200 OK` — Risk score result with reason codes

---

## Metrics

### `GET /metrics/model`

Retrieve Sentinel v4 benchmark metrics.

**Response:** `200 OK`
```json
{
  "version": "v4",
  "last_trained": "2026-08-20",
  "benchmark_metrics": {
    "balanced_best_f1": {
      "mode": "balanced",
      "auc": 0.82024,
      "pr_auc": 0.84932,
      "precision": 0.69948,
      "recall": 0.87026,
      "f1": 0.77558,
      "flag_rate": 0.678
    },
    "aggressive_95r": {
      "mode": "aggressive",
      "auc": 0.82024,
      "pr_auc": 0.84932,
      "precision": 0.63792,
      "recall": 0.95030,
      "f1": 0.76339,
      "flag_rate": 0.811
    }
  }
}
```

---

## Policy

### `GET /policy`

Get the current merchant policy configuration.

**Response:** `200 OK`
```json
{
  "mode": "balanced",
  "a1_threshold": 30.0,
  "a2_threshold": 55.0,
  "a3_threshold": 75.0,
  "active": true
}
```

---

### `POST /policy/update`

Update the merchant policy thresholds.

**Request Body:**
```json
{
  "mode": "festival",
  "a1_threshold": 20.0,
  "a2_threshold": 40.0,
  "a3_threshold": 60.0
}
```

**Response:** `200 OK` — Updated policy object

---

### `POST /policy/simulate`

Simulate a policy configuration against all existing scored orders to preview cost impact.

**Request Body:**
```json
{
  "mode": "balanced",
  "a1_threshold": 25.0,
  "a2_threshold": 50.0,
  "a3_threshold": 70.0
}
```

**Response:** `200 OK`
```json
{
  "total_orders_analyzed": 60,
  "intervention_rate": 45.0,
  "expected_returns_caught": 18,
  "false_positive_count": 9,
  "false_positive_cost": 1350.00,
  "expected_prevented_loss": 12600.00,
  "net_margin_saved": 11250.00,
  "mode": "balanced",
  "a0_count": 33,
  "a1_count": 10,
  "a2_count": 8,
  "a3_count": 9
}
```

---

## Actions

### `POST /actions/draft-message`

Generate a WhatsApp confirmation message draft for an order.

**Request Body:**
```json
{
  "order_id": "ORD-1001",
  "message_type": "whatsapp_confirmation"
}
```

**Response:** `200 OK`
```json
{
  "order_id": "ORD-1001",
  "recipient_phone": "919876543210",
  "message_text": "Hi Rahul! Thank you for placing your order...",
  "wa_link": "https://wa.me/919876543210?text=...",
  "action_type": "a1_whatsapp_confirmation"
}
```

---

### `POST /actions/create-deposit-link`

Generate a Razorpay commitment deposit link for an order.

**Request Body:**
```json
{
  "order_id": "ORD-1001",
  "deposit_amount": 150.0
}
```

**Response:** `200 OK`
```json
{
  "order_id": "ORD-1001",
  "deposit_amount": 150.0,
  "remaining_cod_amount": 1349.0,
  "razorpay_payment_link": "https://rzp.io/i/plink_rzp_sentinel_ord_1001",
  "wa_link": "https://wa.me/919876543210?text=...",
  "action_type": "a2_commitment_deposit"
}
```

---

## Copilot

### `POST /copilot/explain-risk`

Get an AI-generated risk explanation for a specific order.

**Request Body:**
```json
{
  "order_id": "ORD-1001"
}
```

**Response:** `200 OK`
```json
{
  "order_id": "ORD-1001",
  "risk_score": 72,
  "segment": "high_value_cod",
  "explanation": "### Order #ORD-1001 Risk Assessment (72% Risk)...",
  "is_llm_generated": true
}
```

---

### `POST /copilot/daily-brief`

Generate a daily executive risk operations summary.

**Request Body:** `{}` (empty)

**Response:** `200 OK`
```json
{
  "summary": "**Sentinel Operations Brief for Today**...",
  "total_orders": 60,
  "high_risk_count": 18,
  "prevented_loss": 38400.0,
  "is_llm_generated": false
}
```

---

### `POST /copilot/chat`

Interactive copilot chat for merchant questions.

**Request Body:**
```json
{
  "prompt": "What is the riskiest category today?",
  "order_id": null
}
```

**Response:** `200 OK`
```json
{
  "explanation": "**Sentinel Copilot Analysis**...",
  "is_llm_generated": true
}
```

---

## Overrides

### `POST /override-action`

Record a merchant manual override of a recommended action.

**Request Body:**
```json
{
  "order_id": "ORD-1001",
  "new_action": "a0_allow_cod",
  "reason": "Verified customer via phone call",
  "merchant_id": "admin_merchant"
}
```

**Response:** `200 OK`

---

### `GET /overrides`

Retrieve the full merchant override audit trail.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "order_id": "ORD-1001",
    "old_action": "a2_commitment_deposit",
    "new_action": "a0_allow_cod",
    "reason": "Verified customer via phone call",
    "merchant_id": "admin_merchant",
    "created_at": "2026-09-03T12:00:00"
  }
]
```

---

## Duplicate Intent

### `GET /duplicate-intent-cases`

Retrieve all detected duplicate intent cases.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "primary_order_id": "ORD-1005",
    "matched_order_id": "ORD-1006",
    "match_type": "multi_variant_bracket",
    "confidence": 0.92,
    "recommended_action": "a2_commitment_deposit",
    "details": "Buyer ordered size/color variants ('Size M - Red' & 'Size L - Blue') of 'Premium Kurta' within 48h."
  }
]
```

---

## Health & Root

### `GET /`

Application status check.

```json
{
  "status": "online",
  "app": "Sentinel: AI Risk Manager",
  "model_version": "v4",
  "documentation": "/docs"
}
```

### `GET /health`

Lightweight health check for uptime monitors.

```json
{
  "status": "ok"
}
```
