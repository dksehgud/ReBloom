import logging
import sys


def setup_logger(level: int | str = logging.WARNING) -> logging.Logger:
    """앱 전체에서 사용할 기본 로거를 초기화한다."""

    if isinstance(level, str):
        level = getattr(logging, level.upper(), logging.WARNING)

    logging.basicConfig(
        level=level,
        format="[%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )
    return logging.getLogger("rpi_client")
