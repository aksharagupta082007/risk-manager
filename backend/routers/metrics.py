from fastapi import APIRouter
from fastapi.responses import JSONResponse
from schemas import ModelMetricsResponse

router = APIRouter(prefix="/metrics", tags=["Metrics"])

_cached_metrics = {
    "version": "v4",
    "last_trained": "2026-08-20",
    "benchmark_metrics": {
        "aggressive_95r": {
            "mode": "Aggressive @95R",
            "auc": 0.82024, "pr_auc": 0.84932,
            "precision": 0.63792, "recall": 0.95030,
            "f1": 0.76339, "flag_rate": 0.811
        },
        "balanced_best_f1": {
            "mode": "Balanced @bestF1",
            "auc": 0.82024, "pr_auc": 0.84932,
            "precision": 0.69948, "recall": 0.87026,
            "f1": 0.77558, "flag_rate": 0.678
        }
    }
}

@router.get("/model")
def get_model_benchmark_metrics():
    return JSONResponse(
        content=_cached_metrics,
        headers={"Cache-Control": "public, max-age=3600"}
    )
