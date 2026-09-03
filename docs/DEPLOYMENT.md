# Deployment Guide

This guide covers deploying Sentinel to production environments.

---

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────┐
│   Frontend (React)  │────▶│  Backend (FastAPI)    │
│   Vercel / Netlify  │     │  Render / Railway     │
│   Static SPA        │     │  Python 3.10+         │
└─────────────────────┘     └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │  Database             │
                            │  SQLite (dev)         │
                            │  PostgreSQL (prod)    │
                            └──────────────────────┘
```

---

## Option 1: Render (Backend) + Vercel (Frontend)

This is the recommended setup for quick deployment.

### Backend on Render

1. **Connect your GitHub repository** to [Render](https://render.com)

2. **Create a Web Service** with these settings:
   | Setting | Value |
   |---|---|
   | Name | `sentinel-backend` |
   | Environment | Python |
   | Region | Ohio (or nearest) |
   | Build Command | `pip install -r backend/requirements.txt` |
   | Start Command | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |
   | Plan | Free / Starter |

3. **Set environment variables** in the Render dashboard:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/sentinel
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=qwen/qwen3.8-27b
   MERCHANT_NAME=Your Store Name
   DEFAULT_MODE=balanced
   ```

4. **Provision a PostgreSQL database** on Render and link the `DATABASE_URL`.

> **Note**: The existing `render.yaml` in the repository root provides a service blueprint for this setup.

### Frontend on Vercel

1. **Import the repository** to [Vercel](https://vercel.com)

2. **Configure the project:**
   | Setting | Value |
   |---|---|
   | Framework Preset | Vite |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

3. **Set environment variables:**
   ```
   VITE_API_BASE_URL=https://sentinel-backend.onrender.com
   ```

4. The existing `frontend/vercel.json` handles SPA routing:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## Option 2: Single-Server Deployment

For self-hosted setups (VPS, EC2, DigitalOcean):

### 1. System Requirements

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (production)
- 1 GB RAM minimum

### 2. Backend Setup

```bash
# Clone and setup
git clone https://github.com/your-org/sentinel.git
cd sentinel/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your production values

# Initialize database
python seed.py

# Run with gunicorn (production)
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### 3. Frontend Build

```bash
cd frontend
npm install
VITE_API_BASE_URL=https://your-api-domain.com npm run build

# Serve the dist/ folder with nginx, caddy, or any static file server
```

### 4. Nginx Configuration (Example)

```nginx
server {
    listen 80;
    server_name sentinel.yourdomain.com;

    # Frontend (static files)
    location / {
        root /var/www/sentinel/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `sqlite:///./sentinel.db` | Database connection string |
| `GROQ_API_KEY` | No | `""` | Groq API key for AI copilot |
| `GROQ_MODEL` | No | `qwen/qwen3.8-27b` | Model ID for copilot inference |
| `MERCHANT_NAME` | No | `Apex Commerce` | Merchant display name in messages |
| `DEFAULT_MODE` | No | `balanced` | Default policy mode |
| `TWILIO_ACCOUNT_SID` | No | `""` | Twilio SID for WhatsApp API |
| `TWILIO_AUTH_TOKEN` | No | `""` | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | No | `""` | Twilio WhatsApp sender number |

### Frontend

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000` | Backend API URL |

---

## Database Migration

### SQLite → PostgreSQL

1. Provision a PostgreSQL database
2. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/sentinel_db
   ```
3. Restart the backend — SQLAlchemy will create tables automatically via `Base.metadata.create_all()`
4. Run `python seed.py` to populate sample data

> **Note**: The ORM models use standard SQLAlchemy types that are compatible with both SQLite and PostgreSQL. No schema changes are needed.

---

## Model Artifacts

For production with the trained GBDT model:

1. Place the trained model bundle at `backend/model_artifacts/sentinel_model_bundle.joblib`
2. Place the metadata at `backend/model_artifacts/sentinel_metadata.json`
3. The `SentinelRiskModel` will automatically detect and load these files on startup

If model artifacts are not present, the system uses the deterministic mock scoring adapter — the full application runs normally.

---

## Production Checklist

- [ ] Set `DATABASE_URL` to PostgreSQL (not SQLite)
- [ ] Set `GROQ_API_KEY` for AI copilot features
- [ ] Update `MERCHANT_NAME` to your store name
- [ ] Restrict CORS origins in `main.py` (replace `allow_origins=["*"]`)
- [ ] Enable HTTPS on both frontend and backend
- [ ] Set `VITE_API_BASE_URL` to your production backend URL
- [ ] Configure a health check monitor on `/health`
- [ ] Set up log aggregation for error tracking
