import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.kafka.consumer import start_consumer, stop_consumer
from app.kafka.producer import flush as flush_producer
from app.service import depression_svr

# ──────────────────────────────────────────────
# 로깅 설정
# ──────────────────────────────────────────────
logging.basicConfig(
    level  = logging.INFO,
    format = "%(asctime)s [%(levelname)s] %(name)s | %(message)s",
    datefmt= "%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Lifespan: 서버 시작/종료 시 Kafka 제어
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── 시작 ────────────────────────────────────
    logger.info("bio-ml-service 시작")
    start_consumer()   # Kafka Consumer 백그라운드 스레드 가동
    logger.info("Kafka Consumer 가동 완료")

    yield              # 서버 실행 중

    # ── 종료 ────────────────────────────────────
    logger.info("bio-ml-service 종료 중...")
    stop_consumer()    # Consumer 스레드 정지
    flush_producer()   # 미전송 Kafka 메시지 플러시
    logger.info("bio-ml-service 종료 완료")


# ──────────────────────────────────────────────
# FastAPI 앱
# ──────────────────────────────────────────────
app = FastAPI(
    title   = "bio-ml-service",
    version = "0.1.0",
    lifespan= lifespan,
)


class DepressionSvrPredictRequest(BaseModel):
    features: list[float]


class DepressionSvrPredictResponse(BaseModel):
    score: float


# ──────────────────────────────────────────────
# 헬스체크
# ──────────────────────────────────────────────
@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "bio-ml-service", "status": "ok"}


@app.post("/api/v1/depression/svr/predict", response_model=DepressionSvrPredictResponse)
def predict_depression_score(request: DepressionSvrPredictRequest) -> DepressionSvrPredictResponse:
    try:
        score = depression_svr.predict_score(request.features)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return DepressionSvrPredictResponse(score=score)
