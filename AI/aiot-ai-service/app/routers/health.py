"""
헬스체크 라우터.

GET /health
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """
    서버 상태 확인 엔드포인트.
    라즈베리파이 및 모니터링 시스템에서 주기적으로 호출한다.
    """
    return {"status": "ok", "service": "rebloom-llm-server"}
