# Contributing to Sentinel

Thank you for your interest in contributing to Sentinel! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your feature or fix: `git checkout -b feature/your-feature-name`
4. **Make changes** and test thoroughly
5. **Commit** with clear, descriptive messages
6. **Push** to your fork and open a **Pull Request**

## 📋 Development Setup

### Backend (FastAPI + Python)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Configure environment variables
python seed.py             # Seed sample data
python main.py             # Start dev server on :8000
```

### Frontend (React + Vite + TypeScript)

```bash
cd frontend
npm install
npm run dev                # Start dev server on :5173
```

## 🏗️ Project Structure

```
backend/
├── main.py                # FastAPI application entry point
├── models.py              # SQLAlchemy ORM models (10 tables)
├── schemas.py             # Pydantic request/response schemas
├── model_adapter.py       # Sentinel v4 model inference adapter
├── feature_engine.py      # Leakage-safe feature extraction
├── policy_engine.py       # a0/a1/a2/a3 action mapping + simulation
├── action_layer.py        # WhatsApp & Razorpay link generation
├── copilot.py             # AI risk copilot (Groq LLM + fallback)
├── duplicate_detector.py  # Multi-variant & duplicate order detection
├── routers/               # API route modules
└── config.py              # Environment configuration

frontend/src/
├── pages/                 # Route-level page components
├── components/            # Reusable UI components
├── api.ts                 # Axios API client
├── types.ts               # TypeScript interfaces
└── index.css              # Theme system (light/dark modes)
```

## 📝 Coding Guidelines

### Python (Backend)
- Follow PEP 8 style conventions
- Use type hints for function signatures
- Add docstrings to public methods
- Keep route handlers thin — delegate logic to engine classes

### TypeScript (Frontend)
- Use TypeScript strict mode
- Define interfaces in `types.ts` for shared types
- Keep components focused and composable
- Use the existing theme CSS variables — avoid hardcoded colors

## 🧪 Testing

- Test your changes against both light and dark themes
- Verify API endpoints via `/docs` (Swagger UI)
- Test with both `balanced` and `festival` policy modes
- Ensure the mock scoring adapter works when no model artifacts are present

## 🔀 Pull Request Guidelines

- **Title**: Use a clear, descriptive title (e.g., "Add ZIP-code risk prior to feature engine")
- **Description**: Explain what changed and why
- **Scope**: Keep PRs focused — one feature or fix per PR
- **Breaking changes**: Flag clearly in the PR description

## 🐛 Reporting Issues

When filing an issue, please include:
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, Python version, Node version)
- Relevant logs or screenshots

## 💡 Feature Requests

We welcome ideas! When proposing a feature:
- Describe the use case from a merchant's perspective
- Explain how it fits within the risk scoring → action pipeline
- Note whether it affects the scoring model, policy engine, or frontend

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
