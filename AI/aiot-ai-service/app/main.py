from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="aiot-ai-service", version="0.1.0")


class InferenceRequest(BaseModel):
    user_id: str = Field(..., description="Caller user identifier")
    payload: dict = Field(default_factory=dict, description="Inference input payload")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "aiot-ai-service", "status": "ok"}


@app.post("/api/v1/aiot/infer")
def infer(request: InferenceRequest) -> dict:
    return {
        "service": "aiot-ai-service",
        "status": "ok",
        "result": {
            "message": "Inference placeholder",
            "user_id": request.user_id,
            "received_keys": sorted(request.payload.keys()),
        },
    }
