"""
wifi_manager.py
───────────────
nmcli를 통해 Wi-Fi 연결을 수행하고, 현재 연결 상태를 확인한다.

의존 패키지: 없음 (subprocess 표준 라이브러리만 사용)
실행 환경: NetworkManager가 활성화된 Raspberry Pi OS / Ubuntu
"""

import subprocess
import logging

logger = logging.getLogger(__name__)


def is_wifi_connected() -> bool:
    """
    현재 Wi-Fi가 연결된 상태인지 확인한다.

    nmcli -t -f TYPE,STATE device 출력 예시:
        wifi:connected
        lo:unmanaged
    """
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
    """현재 연결된 Wi-Fi SSID 반환. 미연결 시 None."""
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
    """
    nmcli로 Wi-Fi 연결을 시도한다.

    Args:
        ssid:     대상 Wi-Fi SSID
        password: Wi-Fi 비밀번호
        timeout:  연결 대기 최대 시간(초)

    Returns:
        True  — 연결 성공
        False — 연결 실패 또는 타임아웃
    """
    logger.info(f"[WiFiManager] Wi-Fi 연결 시도: SSID={ssid}")

    # 이미 같은 SSID에 연결되어 있으면 스킵
    if get_connected_ssid() == ssid:
        logger.info(f"[WiFiManager] 이미 연결됨: {ssid}")
        return True

    # 기존 동일 SSID 프로필이 있으면 먼저 삭제 (재연결 오류 방지)
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
    """동일 SSID의 기존 NetworkManager 프로필 삭제 (충돌 방지)."""
    try:
        subprocess.run(
            ["nmcli", "connection", "delete", ssid],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except Exception:
        pass  # 프로필이 없으면 무시
