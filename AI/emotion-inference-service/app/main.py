from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="emotion-inference-service", version="0.1.0")


class EmotionInferenceRequest(BaseModel):
    user_id: str = Field(..., description="Caller user identifier")
    text: str = Field(..., description="Input text for inference")
    source: str = Field(..., description="diary or conversation")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "emotion-inference-service", "status": "ok"}


@app.post("/api/v1/emotion/infer")
def infer(request: EmotionInferenceRequest) -> dict:
    return {
        "service": "emotion-inference-service",
        "status": "ok",
        "result": {
            "message": "Emotion inference placeholder",
            "user_id": request.user_id,
            "source": request.source,
            "text_length": len(request.text),
        },
    }
