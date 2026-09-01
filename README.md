# Sentinel: AI Risk Manager for E-Commerce Merchants

Sentinel predicts whether an e-commerce order is likely to become a return or Return To Origin (RTO) before shipping. It helps merchants apply the lowest-friction protective action:
1. **a0_allow_cod**: Allow Cash on Delivery
2. **a1_whatsapp_confirmation**: Ask for WhatsApp order confirmation
3. **a2_commitment_deposit**: Request a small refundable commitment deposit (e.g. ₹150 via Razorpay)
4. **a3_prepaid_only_or_hold**: Require full prepayment or hold order for manual verification

---

## Key Features

- **Pre-Shipping Return & RTO Risk Prediction**: Sentinel v4 Gradient Boosting architecture scoring orders from 0% to 100%.
- **Single Order Manual Test Form**: Instant single-order entry form to evaluate buyer risk and view real-time score drivers.
- **CSV & Batch Ingestion**: Upload store export CSV files or import mock Razorpay orders.
- **Policy Engine & Live Threshold Simulator**: Drag action threshold boundaries (`a1`, `a2`, `a3`) and switch between **Balanced Mode (@bestF1)** and **Festival / Aggressive Mode (@95R)** with real-time margin saved calculation.
- **WhatsApp Action Layer**: 1-click **`wa.me` deep links** with pre-filled order messages and optional **Twilio WhatsApp API** integration.
- **Razorpay Commitment Deposit Links**: Generate mock deposit links for `a2` actions.
- **Duplicate Intent & Multi-Variant Detector**: Rule-based detection for buyers ordering multiple sizes/colors to try on, cross-account phone sharing, and duplicate order velocity.
- **Risk Copilot**: AI-assisted natural language order risk explanation, daily executive briefs, and message drafting powered by Hugging Face API (with fallback template engine).
- **Merchant Override Audit Trail**: Track and log manual merchant overrides.

---

## Model Benchmark Metrics (Sentinel v4)

| Metric | Balanced Mode (@bestF1) | Aggressive / Festival Mode (@95R) |
|--------|--------------------------|-----------------------------------|
| **AUC** | 0.82024 | 0.82024 |
| **PR-AUC** | 0.84932 | 0.84932 |
| **Precision** | 0.69948 | 0.63792 |
| **Recall** | 0.87026 | 0.95030 |
| **F1 Score** | 0.77558 | 0.76339 |
| **Flag Rate** | 0.678 | 0.811 |

---

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **Database**: SQLite (SQLAlchemy ORM — switchable to PostgreSQL via `DATABASE_URL`)
- **Model Adapter**: `joblib` + `sentinel_metadata.json` loader with deterministic mock fallback
- **Visualizations**: Recharts
- **Icons**: Lucide React

---

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` inside `backend/`:
```bash
cd backend
cp .env.example .env
```

Configuration Options (`backend/.env`):
```env
DATABASE_URL=sqlite:///./sentinel.db
HUGGINGFACE_API_KEY=your_optional_hf_api_key
HUGGINGFACE_MODEL=meta-llama/Llama-3.2-3B-Instruct
MERCHANT_NAME=Apex Commerce
DEFAULT_MODE=balanced
```

### 2. Start Backend Server

```bash
cd backend
pip install -r requirements.txt
python seed.py # Seeds 60 sample orders, customers, and products
python main.py
```
Backend API docs available at: `http://localhost:8000/docs`

### 3. Start Frontend App

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Database Architecture

10 ORM Tables:
1. `orders`: Store order details, payment method, status, pincode
2. `customers`: Historical orders, return count, return rate, serial returner signal
3. `products`: Variant return rates, high-risk variant signals, price
4. `risk_scores`: Calculated score (0-100), segment, recommended action, margin impact
5. `reason_codes`: Weighted risk drivers explaining score
6. `merchant_policies`: Action thresholds and mode configuration
7. `actions`: Generated WhatsApp `wa.me` links & Razorpay deposit links
8. `overrides`: Audit trail for merchant manual overrides
9. `duplicate_intent_cases`: Multi-variant and duplicate order detections
10. `daily_reports`: Executive daily stats

---

## Model Bundle Location

Place trained v4 joblib artifacts in:
- `model_artifacts/sentinel_model_bundle.joblib`
- `model_artifacts/sentinel_metadata.json`

If absent, `SentinelRiskModel` automatically activates the deterministic v4 Mock Adapter so the full application runs smoothly.
