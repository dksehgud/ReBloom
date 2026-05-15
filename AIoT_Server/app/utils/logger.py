"""
로거 설정 유틸리티.

애플리케이션 전반에서 일관된 로그 포맷을 사용하도록
uvicorn access log와 앱 로그를 함께 설정한다.
"""

import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    """
    앱 기동 시 한 번 호출해 로깅 설정을 초기화한다.

    - development: DEBUG 레벨, 상세 포맷
    - production: INFO 레벨, 간결 포맷
    """
    is_dev = settings.APP_ENV.lower() == "development"
    level = logging.DEBUG if is_dev else logging.INFO

    log_format = (
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        if is_dev
        else "%(asctime)s [%(levelname)s] %(message)s"
    )

    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
        force=True,  # 이미 설정된 핸들러가 있어도 재설정
    )

    # uvicorn 내부 로거도 동일 레벨로 설정
    for uvicorn_logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uvicorn_logger = logging.getLogger(uvicorn_logger_name)
        uvicorn_logger.setLevel(level)

    logger = logging.getLogger(__name__)
    logger.info(
        f"로깅 초기화 완료 | 환경={settings.APP_ENV} | 레벨={'DEBUG' if is_dev else 'INFO'}"
    )
