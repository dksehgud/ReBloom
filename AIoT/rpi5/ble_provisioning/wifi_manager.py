import logging
import subprocess
import time

logger = logging.getLogger(__name__)


def is_wifi_radio_enabled() -> bool:
    try:
        result = subprocess.run(
            ["nmcli", "radio", "wifi"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return result.stdout.strip().lower() == "enabled"
    except Exception as e:
        logger.error(f"[WiFiManager] Wi-Fi radio 상태 확인 실패: {e}")
        return False


def ensure_wifi_enabled() -> bool:
    if is_wifi_radio_enabled():
        return True

    logger.info("[WiFiManager] Wi-Fi radio 비활성 상태 → 활성화 시도")
    try:
        result = subprocess.run(
            ["nmcli", "radio", "wifi", "on"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode != 0:
            logger.error(f"[WiFiManager] Wi-Fi radio 활성화 실패: {result.stderr.strip()}")
            return False

        time.sleep(2)
        return is_wifi_radio_enabled()
    except Exception as e:
        logger.error(f"[WiFiManager] Wi-Fi radio 활성화 중 예외 발생: {e}")
        return False


def is_wifi_connected() -> bool:
    try:
        result = subprocess.run(
            ["nmcli", "-t", "-f", "TYPE,STATE", "device"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        for line in result.stdout.splitlines():
            parts = line.split(":")
            if len(parts) >= 2 and parts[0] == "wifi" and parts[1] == "connected":
                return True
        return False
    except Exception as e:
        logger.error(f"[WiFiManager] 연결 상태 확인 실패: {e}")
        return False


def get_connected_ssid() -> str | None:
    try:
        result = subprocess.run(
            ["nmcli", "-t", "-f", "ACTIVE,SSID", "device", "wifi"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        for line in result.stdout.splitlines():
            parts = line.split(":")
            if len(parts) >= 2 and parts[0] == "yes":
                return parts[1]
        return None
    except Exception as e:
        logger.error(f"[WiFiManager] SSID 조회 실패: {e}")
        return None


def connect_wifi(ssid: str, password: str, timeout: int = 30) -> bool:
    logger.info(f"[WiFiManager] Wi-Fi 연결 시도: SSID={ssid}")

    if get_connected_ssid() == ssid:
        logger.info(f"[WiFiManager] 이미 연결됨: {ssid}")
        return True

    _delete_existing_connection(ssid)

    try:
        result = subprocess.run(
            [
                "nmcli",
                "device",
                "wifi",
                "connect",
                ssid,
                "password",
                password,
            ],
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        if result.returncode == 0:
            logger.info(f"[WiFiManager] 연결 성공: {ssid}")
            return True
        else:
            logger.error(f"[WiFiManager] 연결 실패 (nmcli): {result.stderr.strip()}")
            return False

    except subprocess.TimeoutExpired:
        logger.error(f"[WiFiManager] 연결 타임아웃 ({timeout}초 초과)")
        return False
    except Exception as e:
        logger.error(f"[WiFiManager] 예외 발생: {e}")
        return False


def _delete_existing_connection(ssid: str) -> None:
    try:
        subprocess.run(
            ["nmcli", "connection", "delete", ssid],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except Exception:
        pass
