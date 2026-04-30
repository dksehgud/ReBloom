import logging
import sys
import time

from wifi_manager import ensure_wifi_enabled, is_wifi_connected, get_connected_ssid

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

CHECK_INTERVAL_SECONDS = 30


def start_normal_operation():
    ssid = get_connected_ssid()
    logger.info(f"[Main] 정상 동작 모드 시작. 연결된 Wi-Fi: {ssid}")


def start_provisioning_mode():
    from ble_server import run_ble_server

    logger.info("[Main] Wi-Fi 미연결 → BLE Provisioning 모드 시작")
    if not ensure_wifi_enabled():
        logger.warning("[Main] Wi-Fi radio 활성화 실패. BLE Provisioning은 계속 시도합니다.")

    run_ble_server()


def main():
    logger.info("=" * 50)
    logger.info("[Main] Re:Bloom 스마트 스피커 시작")
    logger.info("=" * 50)

    while True:
        try:
            if is_wifi_connected():
                logger.info("[Main] Wi-Fi 연결 확인됨 → BLE Provisioning 대기")
                start_normal_operation()
                time.sleep(CHECK_INTERVAL_SECONDS)
                continue

            start_provisioning_mode()

            if is_wifi_connected():
                logger.info("[Main] BLE Provisioning 완료 → 정상 동작 모드 전환")
                start_normal_operation()
            else:
                logger.warning("[Main] BLE 서버 종료됐으나 Wi-Fi 미연결. 잠시 후 재시도.")

            time.sleep(CHECK_INTERVAL_SECONDS)
        except KeyboardInterrupt:
            logger.info("[Main] 사용자 종료")
            break
        except Exception as e:
            logger.error(f"[Main] 치명적 오류: {e}")
            time.sleep(CHECK_INTERVAL_SECONDS)

    sys.exit(0)


if __name__ == "__main__":
    main()
