"""
main.py
───────
Re:Bloom RPi5 BLE Provisioning 진입점.

[동작 흐름]
  부팅
   │
   ├── Wi-Fi 연결됨? ──YES──> BLE 스킵 → 정상 동작 모드 진입
   │
   └── Wi-Fi 미연결 ──────> BLE GATT Server 시작 → Provisioning 대기
                                   │
                           앱에서 Wi-Fi 정보 수신
                                   │
                      ┌────────────┴────────────┐
                    SUCCESS                    FAIL
                      │                          │
                BLE 서버 종료              BLE 유지 (재시도 가능)
                정상 동작 진입              FAIL Notify 전송
"""

import logging
import sys

from wifi_manager import is_wifi_connected, get_connected_ssid
from ble_server import run_ble_server

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def start_normal_operation():
    """
    Wi-Fi 연결 완료 후 진입하는 정상 동작 모드.
    (STT, PIR 센서, 대화 세션 관리 등 — 향후 구현)
    """
    ssid = get_connected_ssid()
    logger.info(f"[Main] 정상 동작 모드 시작. 연결된 Wi-Fi: {ssid}")
    # TODO: PIR 센서, Whisper STT, 세션 관리자 초기화


def main():
    logger.info("=" * 50)
    logger.info("[Main] Re:Bloom 스마트 스피커 시작")
    logger.info("=" * 50)

    if is_wifi_connected():
        logger.info("[Main] Wi-Fi 연결 확인됨 → BLE Provisioning 스킵")
        start_normal_operation()
    else:
        logger.info("[Main] Wi-Fi 미연결 → BLE Provisioning 모드 시작")
        try:
            run_ble_server()
            # BLE 서버가 종료된 시점 = Wi-Fi 연결 성공
            if is_wifi_connected():
                logger.info("[Main] BLE Provisioning 완료 → 정상 동작 모드 전환")
                start_normal_operation()
            else:
                logger.warning("[Main] BLE 서버 종료됐으나 Wi-Fi 미연결. 재시작 필요.")
                sys.exit(1)
        except KeyboardInterrupt:
            logger.info("[Main] 사용자 종료")
        except Exception as e:
            logger.error(f"[Main] 치명적 오류: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
