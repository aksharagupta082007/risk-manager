<div align="center">
  <img src="docs/assets/sentinel_banner.jpg" alt="Sentinel — AI Return/RTO Risk Manager" width="100%" />

  <h1>🛡️ Sentinel v4</h1>
  <h3>AI-Powered Pre-Shipping Return & RTO Risk Manager for E-Commerce</h3>

  <p>
    <strong>Predict returns before shipping · Map risk to protective actions · Simulate cost impact · Explain every decision</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/python-3.10+-blue?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  </p>

  <p>
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-benchmark-results">Benchmarks</a> •
    <a href="#-features">Features</a> •
    <a href="docs/API_REFERENCE.md">API Reference</a> •
    <a href="docs/DEPLOYMENT.md">Deployment</a>
  </p>
</div>

---

## The Problem

E-commerce merchants lose **15–40% of COD order value** to returns and Return-to-Origin (RTO) logistics costs. Most returns are not fraud — they're sizing issues, impulse purchases, or duplicate orders. But the cost of shipping, handling, and restocking hits margins hard.

**Sentinel doesn't label customers as fraudulent.** It predicts whether an order is likely to become a return and applies the **lowest-friction protective action** to save margin while preserving customer experience.

---

## 🎯 How It Works

Every order gets scored from 0–100% risk, mapped to one of four protective actions:

| Risk Band | Action | What Happens |
|---:|---|---|
| **0–30%** | `a0_allow` | ✅ Allow normal COD/checkout |
| **30–55%** | `a1_soft_confirm` | 💬 Ask for WhatsApp/order confirmation |
| **55–75%** | `a2_commitment_deposit` | 💰 Request a small refundable deposit (₹150 via Razorpay) |
| **75–100%** | `a3_prepaid_or_hold` | 🔒 Require full prepayment or hold for review |

### API Response

```json
{
  "risk_score": 82,
  "risk_probability": 0.824,
  "segment": "serial_returner",
  "recommended_action": "a3_prepaid_or_hold",
  "reason_codes": [
    { "code": "SERIAL_RETURNER_PROFILE", "description": "Customer return rate is 65% across historical orders", "impact": "HIGH" },
    { "code": "HIGH_RISK_CATEGORY", "description": "Category inherently experiences high RTO rates", "impact": "MEDIUM" }
  ],
  "mode": "balanced",
  "margin_impact": 471.56
}
```

---

## 🏗️ Architecture

Sentinel v4 is not a single classifier — it's a **multi-layered risk decision system**:

```
Raw order / event data
        │
        ▼
┌─────────────────────────────────────────────┐
│  Leakage-safe Feature Engineering           │
│  13 features: customer history, product     │
│  return rate, category risk, price band,    │
│  COD signal, duplicate intent               │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Historical Priors + Graph-Style Propagation│
│  Customer-product pair risk, serial         │
│  returner detection, cold customer flags    │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  GBDT Experts                               │
│  Compact · Recall-biased · Precision-biased │
│  Deterministic mock fallback for dev        │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Calibration → Risk Score: 0–100%           │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Policy Engine → a0 / a1 / a2 / a3         │
│  Balanced (@bestF1) or Festival (@95R) mode │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Reason Codes + False-Positive Cost         │
│  + Margin-Saved Simulation                  │
└─────────────────────────────────────────────┘
```

### Why This Architecture?

| Advantage | Detail |
|---|---|
| **Graph signals without GNN cost** | Approximates customer-product graph edges via historical priors and pair-risk features — fast inference, no graph DB needed |
| **Validation-guarded routing** | Segment-specific thresholds are only used if they improve validation metrics — prevents overfitting |
| **Two operating modes** | **Balanced** optimizes precision-recall tradeoff; **Festival/Aggressive** catches ~95% of returns for high-risk seasonal periods |
| **Explainable** | Every order returns human-readable reason codes like `SERIAL_RETURNER_PROFILE` or `HIGH_VALUE_COD_ORDER` |
| **Cost-aware** | Quantifies false-positive friction cost and expected margin saved — not just AUC/F1 |

> 📖 **Deep dive**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layer-by-layer walkthrough with Mermaid diagrams and database ER schema

---

## 📊 Benchmark Results

### ASOS GraphReturns (Primary Benchmark)

The [ASOS GraphReturns dataset](https://osf.io/c793h/overview) is a fashion-retail return prediction dataset directly aligned with graph-based return prediction research.

| Model / Mode | AUC | PR-AUC | Precision | Recall | F1 | Flag Rate |
|---|---:|---:|---:|---:|---:|---:|
| **Sentinel v4 Balanced** `@bestF1` | 0.8218 | 0.8493 | 0.6969 | **0.8789** | 0.7774 | 0.6869 |
| **Sentinel v4 Aggressive** `@95R` | 0.8218 | 0.8493 | 0.6380 | **0.9529** | 0.7643 | 0.8135 |
| ASOS GNN (McGowan et al.) | — | — | **0.8160** | 0.7580 | **0.7920** | — |
| Returnformer (Cao et al.) | **0.8442** | — | — | 0.8675 | 0.7887 | — |


### IBM ReturnPropensity (Robustness Validation)

| Model / Mode | AUC | Recall | Flag Rate |
|---|---:|---:|---:|
| **Sentinel v4 Balanced** | **0.9280** | 0.6899 | 4.74% |
| **Sentinel v4 Aggressive** | **0.9280** | **0.9806** | 58.56% |

Strong ranking under severe distribution shift (test return rate only 1.09%). Proves Sentinel adapts from customer-product graph signals (ASOS) to order-level business signals (IBM).

### Cost-Aware Policy Simulation (ASOS)

| Policy | Total Saved | FP Cost | Net Saved | Intervention Rate |
|---|---:|---:|---:|---:|
| Global threshold | £2,506,559 | £703,519 | **£1,803,040** | 82.1% |
| Segment threshold | £2,572,665 | £758,703 | **£1,813,962** | 81.1% |

> 📖 **Full analysis**: [docs/BENCHMARKS.md](docs/BENCHMARKS.md) — detailed interpretation, IBM dataset analysis, and comparison with prior work

---

## ✨ Features

### Risk Scoring & Intelligence

- 🎯 **Pre-shipping risk prediction** — Sentinel v4 GBDT architecture, 0–100% calibrated scores
- 🔍 **Reason codes** — explainable risk drivers for every order (serial returner, high-risk category, cold customer, etc.)
- 🤖 **AI Risk Copilot** — natural language order explanations, daily briefs, and interactive chat (Groq LLM + template fallback)
- 🔗 **Duplicate intent detection** — multi-variant bracket orders, cross-account phone matches, duplicate item spam

### Merchant Operations

- ⚖️ **Policy Studio** — drag threshold boundaries and switch between Balanced/Festival modes with live cost preview
- 💬 **WhatsApp action layer** — 1-click `wa.me` deep links with pre-filled order confirmation messages
- 💳 **Razorpay commitment deposits** — generate mock deposit payment links for `a2` actions
- ✋ **Merchant override audit trail** — track and log every manual override for compliance
- 📊 **Executive reports** — daily risk posture, margin protection, and false-positive cost summaries

### Data Ingestion

- 📝 **Manual order form** — instant single-order risk scoring
- 📁 **CSV batch upload** — bulk order ingestion from store exports
- 🌱 **Auto-seeded demo data** — 60 sample orders with diverse risk profiles for immediate testing

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite 8 · Tailwind CSS v4 |
| **Backend** | FastAPI · Python 3.10+ · SQLAlchemy ORM |
| **Database** | SQLite (dev) · PostgreSQL (prod) |
| **Visualizations** | Recharts · Framer Motion |
| **AI Copilot** | Groq API (Qwen 3.8-27B) with template fallback |
| **Model** | joblib model bundle with deterministic mock fallback |
| **Deployment** | Render (backend) · Vercel (frontend) |

---

## 🚀 Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/aksharagupta082007/risk-manager.git
cd risk-manager
```

### 2. Start Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # Edit with your API keys (optional)
python seed.py                # Seeds 60 sample orders
python main.py                # Starts on http://localhost:8000
```

API docs → `http://localhost:8000/docs`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev                   # Starts on http://localhost:5173
```

> **Note**: The app works fully without any API keys. The AI copilot falls back to template responses, and the risk scorer uses the deterministic mock adapter.

---

## 🗄️ Database Schema

10 ORM tables covering the full order-to-action lifecycle:

| Table | Purpose |
|---|---|
| `orders` | Order details, payment method, status, pincode |
| `customers` | Historical orders, return count, return rate, serial returner flag |
| `products` | Category, variant return rates, high-risk variant signal |
| `risk_scores` | Calculated score (0–100), segment, recommended action, margin impact |
| `reason_codes` | Weighted risk drivers explaining each score |
| `merchant_policies` | Action thresholds and mode configuration |
| `actions` | Generated WhatsApp links & Razorpay deposit links |
| `overrides` | Merchant manual override audit trail |
| `duplicate_intent_cases` | Multi-variant and duplicate order detections |
| `daily_reports` | Executive daily statistics |

> 📖 **ER diagram**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#database-schema) — full entity-relationship diagram with Mermaid

---

## 📖 Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design, feature engine, model adapter, policy engine, ER diagrams |
| [Benchmarks](docs/BENCHMARKS.md) | Detailed ASOS/IBM results, honest interpretation, comparison with prior work |
| [API Reference](docs/API_REFERENCE.md) | All 15+ endpoints with request/response examples |
| [Deployment](docs/DEPLOYMENT.md) | Render, Vercel, self-hosted, nginx, environment variables |

---

## 🔬 Comparison with Prior Work

| System | Focus | Limitation | Sentinel's Addition |
|---|---|---|---|
| **IBM ReturnPropensity** | Basic return model via Watson ML | Deployment pattern; no cost-aware actions | PR-AUC, recall modes, calibration, reason codes, FP cost, a0–a3 |
| **ASOS GNN** | Graph neural networks on customer-product data | Research baseline, not merchant workflow | Graph-style signals + fast inference + policy simulation |
| **Returnformer** | Graph Transformer with topological embeddings | Heavier inference, model-centric | Lightweight scoring, policy controls, explanations, cost sim |

---

## 📚 References

- **ASOS GraphReturns Dataset**: [OSF Repository](https://osf.io/c793h/overview)
- **McGowan et al.** — *"A Dataset for Learning Graph Representations to Predict Customer Returns in Fashion Retail"*: [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/10183628/)
- **Cao et al.** — *"Returnformer: A Graph Transformer-Based Model for Predicting Product Returns in E-Commerce"*: [MDPI Entropy](https://www.mdpi.com/1099-4300/28/1/72) | [PubMed](https://pubmed.ncbi.nlm.nih.gov/41593979/)
- **IBM ReturnPropensity**: [GitHub Repository](https://github.com/IBM/ReturnPropensity) | [AggregatedOrderData.csv](https://github.com/IBM/ReturnPropensity/blob/master/AggregatedOrderData.csv)

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

## 🔒 Security

For security concerns, see [SECURITY.md](SECURITY.md).

---

<div align="center">
  <sub>Built with ❤️ for merchants who want to ship confidently</sub>
</div>
