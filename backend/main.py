from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from seed import seed_database
from routers import orders, scoring, metrics, policy, actions, copilot, overrides, duplicates

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Sentinel AI Risk Manager Backend...")
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    print("Shutting down Sentinel Backend...")

app = FastAPI(
    title="Sentinel: AI Risk Manager API",
    description="Pre-shipping return/RTO risk prediction and automated policy enforcement for e-commerce merchants.",
    version="4.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(orders.router)
app.include_router(scoring.router)
app.include_router(metrics.router)
app.include_router(policy.router)
app.include_router(actions.router)
app.include_router(copilot.router)
app.include_router(overrides.router)
app.include_router(duplicates.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Sentinel: AI Risk Manager",
        "model_version": "v4",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
