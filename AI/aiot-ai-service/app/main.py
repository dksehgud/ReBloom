"""
Re:Bloom LLM Server - FastAPI 애플리케이션 진입점.

Raspberry Pi 5 기반 AIoT 스마트 스피커와 통신하는 LLM 서버.
- STT 텍스트 입력 → LLM 응답 생성 → Streaming 출력
- WebSocket / SSE / REST 세 가지 인터페이스 제공
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.utils.logger import setup_logging
from app.routers import health, chat


# ─────────────────────────────────────────────
# 앱 시작/종료 수명주기
# ─────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작 시 로깅 초기화, 종료 시 리소스 정리."""
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info(
        f"Re:Bloom LLM Server 시작 | 환경={settings.APP_ENV} | "
        f"Mock모드={settings.USE_MOCK_LLM} | 모델={settings.LLM_MODEL}"
    )
    yield
    logger.info("Re:Bloom LLM Server 종료")


# ─────────────────────────────────────────────
# FastAPI 앱 생성
# ─────────────────────────────────────────────

app = FastAPI(
    title="Re:Bloom LLM Server",
    description=(
        "청소년 정신건강 AIoT 스마트 스피커를 위한 LLM 스트리밍 서버. "
        "WebSocket / SSE / REST 인터페이스를 통해 Raspberry Pi와 통신한다."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────
# CORS 미들웨어
# (개발 환경에서는 모든 origin 허용, 운영에서는 제한 필요)
# ─────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# 라우터 등록
# ─────────────────────────────────────────────

app.include_router(health.router)
app.include_router(chat.router)
