from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field


MODEL_PATH = Path("model_test/model-store/101/isolation_forest.pkl")

app = FastAPI(title="bio-ml-service", version="0.1.0")


class BioInferenceRequest(BaseModel):
    user_id: str = Field(..., description="Caller user identifier")
    metrics: dict = Field(default_factory=dict, description="Biometric metrics payload")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "bio-ml-service", "status": "ok"}


@app.post("/api/v1/biometric/infer")
def infer(request: BioInferenceRequest) -> dict:
    return {
        "service": "bio-ml-service",
        "status": "ok",
        "result": {
            "message": "Biometric inference placeholder",
            "model_exists": MODEL_PATH.exists(),
            "user_id": request.user_id,
            "received_keys": sorted(request.metrics.keys()),
        },
    }
