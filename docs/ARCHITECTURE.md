# System Architecture

Sentinel v4 is a graph-neural risk decision system. The core idea: **use the same GNN scorer across datasets, but change the graph builder** according to the fields each dataset exposes.

## Core Research Idea

The ASOS GraphReturns dataset has natural customer-product graph structure, which Sentinel uses to model complex return relationships.

```mermaid
flowchart LR
    subgraph ASOS["ASOS Graph"]
        C1((Customer)) -->|interaction| V1(Variant)
        V1 -->|belongs to| P1(Product Family)
        P1 -->|supplied by| S1(Supplier)
    end

    style C1 fill:#252019,stroke:#8FD6C8,color:#F8F1E7
    style V1 fill:#252019,stroke:#8FD6C8,color:#F8F1E7
    style P1 fill:#252019,stroke:#E3B16F,color:#F8F1E7
    style S1 fill:#252019,stroke:#E3B16F,color:#F8F1E7
```

## High-Level Pipeline

```mermaid
flowchart TD
    A["📦 Raw Dataset"] --> B["🔀 Dataset-Specific\nGraph Adapter"]
    B --> C["🕸️ Order/Interaction Node +\nLinked Entity Nodes"]
    C --> D["🧠 Sentinel Heterogeneous\nGraphSAGE Scorer"]
    D --> E["📐 P(return=1) →\nRisk Score: 0–100%"]
    E --> F["⚖️ Balanced / Aggressive\nOperating Threshold"]
    F --> G["🏛️ Policy Engine\na0 / a1 / a2 / a3"]
    G --> H["📋 Reason Codes +\nFP Cost + Margin Simulation"]

    style A fill:#252019,stroke:#8FD6C8,color:#F8F1E7
    style B fill:#252019,stroke:#8FD6C8,color:#F8F1E7
    style C fill:#252019,stroke:#E3B16F,color:#F8F1E7
    style D fill:#252019,stroke:#E3B16F,color:#F8F1E7
    style E fill:#252019,stroke:#8BCB91,color:#F8F1E7
    style F fill:#252019,stroke:#8BCB91,color:#F8F1E7
    style G fill:#252019,stroke:#E99A6C,color:#F8F1E7
    style H fill:#252019,stroke:#E66F6F,color:#F8F1E7
```

### GNN Model Configuration

| Component | Value |
|---|---:|
| Model | `SentinelHeteroGraphSAGE` |
| Embedding dimension | 48 |
| Hidden dimension | 128 |
| GNN layers | 2 |

---

## Layer-by-Layer Breakdown

### 1. Feature Engine (`feature_engine.py`)

Extracts 13 leakage-safe features from raw order, customer, and product data:

| # | Feature | Source | Type |
|---|---|---|---|
| 1 | `customer_return_rate` | Customer history | Float 0–1 |
| 2 | `product_return_rate` | Product history | Float 0–1 |
| 3 | `category_risk` | Category lookup table | Float 0–1 |
| 4 | `price_band_risk` | Order amount buckets | Float 0–1 |
| 5 | `customer_product_pair_risk` | Composite signal | Float 0–1 |
| 6 | `is_cold_customer` | First-time buyer flag | Boolean |
| 7 | `is_cold_variant` | Low-sale product flag | Boolean |
| 8 | `is_serial_returner` | ≥40% return rate + ≥2 returns | Boolean |
| 9 | `is_high_risk_variant` | ≥30% product return rate | Boolean |
| 10 | `cod_signal` | Payment method | Float |
| 11 | `duplicate_intent_score` | Duplicate detector output | Float 0–1 |
| 12 | `amount` | Order value (₹) | Float |
| 13 | `payment_method` | COD or PREPAID | Categorical |

**Design choices:**
- Category risk uses a static lookup map (fashion: 0.35, footwear: 0.40, etc.) that can be replaced with learned category priors from production data
- Price banding uses four tiers (<₹500, ₹500–1500, ₹1500–3000, >₹3000) to avoid overfitting on exact amounts
- `customer_product_pair_risk` is a weighted composite that approximates customer-product graph edge signals without full GNN inference

### 2. Model Adapter (`model_adapter.py`)

The `SentinelRiskModel` class supports two inference modes:

```mermaid
flowchart LR
    A["Order Features"] --> B{"joblib Model\nPresent?"}
    B -- Yes --> C["Real GBDT\nInference"]
    B -- No --> D["Deterministic\nMock Scoring"]
    C --> E["Risk Score\n0–100"]
    D --> E

    style B fill:#252019,stroke:#E3B16F,color:#F8F1E7
    style C fill:#252019,stroke:#8BCB91,color:#F8F1E7
    style D fill:#252019,stroke:#E99A6C,color:#F8F1E7
```

- **Production mode**: Loads `sentinel_model_bundle.joblib` and `sentinel_metadata.json` from `model_artifacts/`
- **Development mode**: Uses a deterministic weighted formula that mimics the GBDT feature importance weights

The mock scorer uses this weighted formula:
- Baseline: 15 points
- Serial returner: +35 points (or customer return rate × 25)
- High-risk variant: +20 points (or product return rate × 15)
- Category risk: × 15 weight
- Price band risk: × 12 weight
- COD payment: +15 points
- Duplicate intent: × 30 weight
- Cold customer: +8 points

### 3. Policy Engine (`policy_engine.py`)

Maps continuous risk scores to discrete merchant actions:

```mermaid
flowchart LR
    subgraph Balanced["Balanced Mode (@bestF1)"]
        B0["0–30%\na0_allow_cod"]
        B1["30–55%\na1_whatsapp"]
        B2["55–75%\na2_deposit"]
        B3["75–100%\na3_prepaid"]
    end
    
    subgraph Festival["Festival Mode (@95R)"]
        F0["0–20%\na0_allow_cod"]
        F1["20–40%\na1_whatsapp"]
        F2["40–60%\na2_deposit"]
        F3["60–100%\na3_prepaid"]
    end

    style B0 fill:#1a3a2a,stroke:#8BCB91,color:#F8F1E7
    style B1 fill:#3a3019,stroke:#E3B16F,color:#F8F1E7
    style B2 fill:#3a2519,stroke:#E99A6C,color:#F8F1E7
    style B3 fill:#3a1919,stroke:#E66F6F,color:#F8F1E7
    style F0 fill:#1a3a2a,stroke:#8BCB91,color:#F8F1E7
    style F1 fill:#3a3019,stroke:#E3B16F,color:#F8F1E7
    style F2 fill:#3a2519,stroke:#E99A6C,color:#F8F1E7
    style F3 fill:#3a1919,stroke:#E66F6F,color:#F8F1E7
```

**Simulation engine**: The `simulate()` method runs cost-aware policy evaluation:
- WhatsApp confirmation catches ~50% of returns at ₹15 friction cost
- Commitment deposit catches ~80% at 5% order-value friction cost
- Prepaid/hold catches ~95% at 12% order-value friction cost

### 4. Action Layer (`action_layer.py`)

Generates ready-to-use protective actions:

| Action | Output |
|---|---|
| `a1_whatsapp_confirmation` | `wa.me` deep link with pre-filled order confirmation message |
| `a2_commitment_deposit` | Mock Razorpay payment link (`rzp.io/i/...`) + WhatsApp message with deposit instructions |
| `a3_prepaid_only_or_hold` | Hold instruction for merchant + buyer contact recommendation |

### 5. Duplicate Intent Detector (`duplicate_detector.py`)

Three detection heuristics:

| Pattern | Confidence | Action |
|---|---|---|
| Multi-variant bracket (same product, different size/color) | 0.92 | a2_commitment_deposit |
| Cross-account phone match (same phone, different customer IDs) | 0.88 | a3_prepaid_only_or_hold |
| Duplicate item spam (same product ordered twice) | 0.85 | a1_whatsapp_confirmation |

### 6. Risk Copilot (`copilot.py`)

AI-powered assistant with three capabilities:

1. **Order risk explanation** — generates natural language risk assessment for any order
2. **Daily executive brief** — summarizes risk posture, margin protection, and priority actions
3. **Interactive chat** — answers merchant questions about risk, policy, and actions

Uses Groq API (Qwen 3.8-27B) with automatic fallback to template-based responses.

---

## Database Schema

```mermaid
erDiagram
    CUSTOMERS ||--o{ ORDERS : places
    PRODUCTS ||--o{ ORDERS : contains
    ORDERS ||--o| RISK_SCORES : has
    RISK_SCORES ||--o{ REASON_CODES : explains
    ORDERS ||--o{ ACTIONS : triggers
    ORDERS ||--o{ OVERRIDES : receives

    CUSTOMERS {
        string customer_id PK
        string name
        string phone
        int total_orders
        int return_count
        float return_rate
        bool is_serial_returner
    }

    ORDERS {
        string order_id PK
        string customer_id FK
        string product_id FK
        float amount
        string payment_method
        string status
        string pincode
    }

    PRODUCTS {
        string product_id PK
        string name
        string category
        float price
        float return_rate
        bool is_high_risk_variant
    }

    RISK_SCORES {
        string order_id FK
        int risk_score
        float risk_probability
        string segment
        string recommended_action
        string mode
        float margin_impact
    }

    REASON_CODES {
        int risk_score_id FK
        string code
        string description
        float weight
        string impact
    }

    ACTIONS {
        string order_id FK
        string action_type
        string wa_link
        string deposit_link
        string status
    }

    OVERRIDES {
        string order_id FK
        string old_action
        string new_action
        string reason
        string merchant_id
    }

    MERCHANT_POLICIES {
        string mode
        float a1_threshold
        float a2_threshold
        float a3_threshold
        bool active
    }

    DUPLICATE_INTENT_CASES {
        string primary_order_id
        string matched_order_id
        string match_type
        float confidence
    }

    DAILY_REPORTS {
        string date
        int total_orders
        int high_risk_count
        float net_margin_saved
    }
```

---

## Frontend Architecture

The React frontend is structured as a single-page application with six route-level pages:

| Page | Route | Purpose |
|---|---|---|
| Command Center | `/` | KPI dashboard with risk distribution, margin trends, benchmark metrics |
| Risk Queue | `/queue` | Filterable high-risk order list with expandable risk details |
| Policy Studio | `/policy` | Live threshold simulator with drag controls and cost preview |
| Duplicate Intent | `/duplicates` | Multi-variant and duplicate order detection cases |
| Reports | `/reports` | Daily executive summaries and historical analytics |
| Audit Log | `/overrides` | Merchant override history for compliance |

**Design system**: Dual-theme (warm porcelain light / charcoal cocoa dark) using CSS custom properties, with consistent `surface-card`, `surface-sidebar`, and `hover-lift` utility classes.
