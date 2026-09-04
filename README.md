<div align="center">
  <img src="docs/assets/sentinel_banner.jpg" alt="Sentinel — GNN Return/RTO Risk Manager" width="100%" />

  <h1>🛡️ Sentinel v4</h1>
  <h3>Graph-Neural Pre-Shipping Return & RTO Risk Manager for E-Commerce</h3>

  <p>
    <strong>Graph-based return prediction · Cost-aware merchant actions · Explainable risk scoring</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/python-3.10+-blue?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=flat-square&logo=pytorch&logoColor=white" alt="PyTorch" />
    <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  </p>

  <p>
    <a href="#-core-research-idea">Core Idea</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-benchmark-results">Benchmarks</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="docs/API_REFERENCE.md">API Reference</a> •
    <a href="docs/DEPLOYMENT.md">Deployment</a>
  </p>
</div>

---

## The Problem

E-commerce merchants lose **15–40% of COD order value** to returns and Return-to-Origin (RTO) logistics costs. Return risk comes from **relationships** — customer history, product/category behavior, geographic delivery patterns, and basket composition — not just isolated order rows.

**Sentinel is defense-only.** It does not label a customer as a fraudster and it does not make irreversible denial decisions automatically. It predicts return probability, explains the risk, and recommends the **lowest-friction protective action**.

| Risk Band | Action | Merchant Meaning |
|---:|---|---|
| **0–30%** | `a0_allow` | ✅ Allow normal COD/checkout |
| **30–55%** | `a1_soft_confirm` | 💬 Ask for WhatsApp/order confirmation |
| **55–75%** | `a2_commitment_deposit` | 💰 Request a small refundable deposit |
| **75–100%** | `a3_prepaid_or_hold` | 🔒 Prepaid-only or hold for review |

---

## 💡 Core Research Idea

> **Use a graph-neural network to model the relationships between customers, products, and risk-bearing entities, then convert return probability into merchant-controlled actions.**

The [ASOS GraphReturns dataset](https://osf.io/c793h/overview) has natural customer-product graph structure — customers interact with product variants, which belong to product families and suppliers. A graph model is the natural fit because it learns from these connected entities instead of treating every order as isolated.

```
ASOS graph
customer ─── interaction ─── variant
                  │
              product family
                  │
              supplier
```

---

## 🏗️ Architecture

```
Raw order / interaction data
    │
    ▼
┌─────────────────────────────────────────────┐
│  Graph Construction                         │
│  Customer → product interaction edges       │
│  Variant → product family → supplier edges  │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Sentinel Heterogeneous GraphSAGE Scorer    │
│  Entity embeddings · Field embeddings       │
│  Attention over linked entities             │
│  Numeric feature projection                 │
│  GraphSAGE message aggregation              │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
       P(return = 1) → Risk Score: 0–100%
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Balanced / Aggressive Operating Threshold  │
│  → a0 / a1 / a2 / a3 Policy Engine         │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Reason Codes + False-Positive Cost         │
│  + Margin-Saved Simulation                  │
└─────────────────────────────────────────────┘
```

### GNN Model Details

| Component | Value |
|---|---:|
| Model | `SentinelHeteroGraphSAGE` |
| Embedding dimension | 48 |
| Hidden dimension | 128 |
| GNN layers | 2 |

### Why This Architecture?

| Advantage | Detail |
|---|---|
| **Targets the right bottleneck** | Returns depend on relationships (customer history, product/category, variant behavior) — a graph model is the natural fit |
| **Two operating modes** | **Balanced** optimizes F1; **Aggressive** catches ~95% of returns for festival/seasonal periods |
| **Explainable** | Every order returns reason codes: `SERIAL_RETURNER_PROFILE`, `HIGH_RISK_CATEGORY`, `HIGH_VALUE_COD_ORDER` |
| **Honest about false positives** | Reports intervention rate, FP cost, margin saved — not just AUC/F1 |

> 📖 **Deep dive**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layer-by-layer walkthrough with Mermaid diagrams and ER schema

---

## 📊 Benchmark Results

### ASOS GraphReturns

[ASOS GraphReturns](https://osf.io/c793h/overview) is the main benchmark — directly aligned with customer-product graph return prediction.

| Model / Mode | AUC | PR-AUC | Precision | Recall | F1 | Flag Rate |
|---|---:|---:|---:|---:|---:|---:|
| **Sentinel Balanced** `@bestF1` | 0.8218 | 0.8493 | 0.6969 | **0.8789** | 0.7774 | 0.6869 |
| **Sentinel Aggressive** `@95R` | 0.8218 | 0.8493 | 0.6380 | **0.9529** | 0.7643 | 0.8135 |
| ASOS GNN (McGowan et al.) | — | — | **0.8160** | 0.7580 | **0.7920** | — |
| Returnformer (Cao et al.) | **0.8442** | — | — | 0.8675 | 0.7887 | — |

**Interpretation**: Sentinel does not beat SOTA on every metric. Returnformer has higher AUC; the ASOS GNN has higher F1. But Sentinel **leads on recall** (0.8789 balanced, 0.9529 aggressive) and adds a complete merchant operations layer that the papers do not address.

### Cost-Aware Policy Simulation

| Policy | Total Saved (£) | FP Cost (£) | Net Saved (£) | Intervention Rate |
|---|---:|---:|---:|---:|
| Global threshold | £2,506,559 | £703,519 | **£1,803,040** | 82.1% |
| Segment threshold | £2,572,665 | £758,703 | **£1,813,962** | 81.1% |

> 📖 **Full analysis**: [docs/BENCHMARKS.md](docs/BENCHMARKS.md) — detailed interpretation and comparison with prior work

---

## 🔬 Comparison with Prior Work

| System | What It Does | Limitation | Sentinel's Gap-Fill |
|---|---|---|---|
| **ASOS GNN** | GNN on customer-product return data | Strong research baseline, not merchant workflow | Same graph-risk idea + operating modes + merchant thresholds + cost simulation |
| **Returnformer** | Graph Transformer for product returns | Stronger metrics, heavier inference, model-centric | Deployable risk operations: fast score, action policy, copilot, cost-aware decisions |

---

## ✅ What To Claim

> Sentinel is a graph-neural return/RTO risk manager. It uses graph construction to model relationships between customers, products, and risk-bearing entities, then converts return probability into merchant-controlled actions. On ASOS GraphReturns it is competitive with graph-return literature and stronger on recall than referenced baselines.

**Safe claims:**
- ✅ Competitive with graph-return research on ASOS GraphReturns
- ✅ Stronger recall than referenced baselines (0.8789 balanced, 0.9529 aggressive)
- ✅ Product gap: risk score → action policy → cost simulation
- ✅ Defense-only, cost-aware, merchant-controlled

**Do not claim:**
- ❌ "We beat SOTA on every metric"
- ❌ "This detects fraudsters"
- ❌ "The model blocks customers automatically"

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **GNN Scorer** | PyTorch · Heterogeneous GraphSAGE |
| **Frontend** | React 19 · TypeScript · Vite 8 · Tailwind CSS v4 |
| **Backend** | FastAPI · Python 3.10+ · SQLAlchemy ORM |
| **Database** | SQLite (dev) · PostgreSQL (prod) |
| **AI Copilot** | Groq API (Qwen 3.8-27B) with template fallback |
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

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev                   # Starts on http://localhost:5173
```

> **Note**: The app runs fully without API keys or model artifacts. The copilot falls back to templates; the scorer uses a deterministic mock adapter.

---

## 📂 Notebooks & Artifacts

| File | Purpose |
|---|---|
| `sentinel_litegraph_router_v4.ipynb` | ASOS benchmark notebook (current metrics) |

---

## 📖 Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design, GNN model, graph construction, policy engine, ER diagrams |
| [Benchmarks](docs/BENCHMARKS.md) | ASOS results, honest interpretation, comparison with prior work |
| [API Reference](docs/API_REFERENCE.md) | All 15+ endpoints with request/response examples |
| [Deployment](docs/DEPLOYMENT.md) | Render, Vercel, self-hosted, environment variables |

---

## 📚 References

- **ASOS GraphReturns Dataset**: [OSF Repository](https://osf.io/c793h/overview)
- **McGowan et al.** — *"A Dataset for Learning Graph Representations to Predict Customer Returns in Fashion Retail"*: [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/10183628/)
- **Cao et al.** — *"Returnformer: A Graph Transformer-Based Model for Predicting Product Returns in E-Commerce"*: [MDPI Entropy](https://www.mdpi.com/1099-4300/28/1/72) | [PubMed](https://pubmed.ncbi.nlm.nih.gov/41593979/)

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🔒 Security

See [SECURITY.md](SECURITY.md) for security policy and responsible disclosure.

---

<div align="center">
  <sub>Built with ❤️ for merchants who want to ship confidently</sub>
</div>
