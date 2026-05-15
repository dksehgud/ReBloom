import asyncio
import logging
import threading
import time

logger = logging.getLogger(__name__)


class IRSensorMonitor:
    """IR 센서를 백그라운드 스레드로 폴링하고 동작 감지 여부를 제공한다."""

    def __init__(self, gpio_pin: int = 23, poll_interval: float = 0.3) -> None:
        self._gpio_pin = gpio_pin
        self._poll_interval = poll_interval
        self._last_motion_time: float = 0.0
        self._lock = threading.Lock()
        self._running = False
        self._thread: threading.Thread | None = None
        self._sensor = None

    def start(self) -> None:
        try:
            from gpiozero import DigitalInputDevice  # noqa: PLC0415

            self._sensor = DigitalInputDevice(self._gpio_pin)
        except Exception as exc:
            logger.warning(
                "IR 센서 초기화 실패 (GPIO %d): %s — IR 센서 체크를 비활성화합니다.",
                self._gpio_pin,
                exc,
            )
            return

        self._running = True
        self._thread = threading.Thread(
            target=self._poll_loop,
            daemon=True,
            name="ir-sensor-monitor",
        )
        self._thread.start()
        logger.info("IR 센서 모니터 시작: GPIO %d", self._gpio_pin)

    def stop(self) -> None:
        self._running = False
        if self._thread is not None:
            self._thread.join(timeout=2)
        if self._sensor is not None:
            try:
                self._sensor.close()
            except Exception:
                pass
        logger.info("IR 센서 모니터 종료")

    async def wait_for_motion(self, timeout_seconds: float = 30.0) -> bool:
        """움직임이 감지될 때까지 최대 timeout_seconds 초 동안 대기한다.

        MQTT 수신 시점 이후의 새로운 감지만 인정한다.
        센서 초기화에 실패한 경우 즉시 True를 반환해 항상 대화를 허용한다.
        """
        if self._sensor is None:
            return True

        wait_start = time.monotonic()
        deadline = wait_start + timeout_seconds

        while time.monotonic() < deadline:
            with self._lock:
                if self._last_motion_time >= wait_start:
                    return True
            await asyncio.sleep(self._poll_interval)

        return False

    def _poll_loop(self) -> None:
        while self._running:
            try:
                if self._sensor is not None and self._sensor.value == 1:
                    with self._lock:
                        self._last_motion_time = time.monotonic()
            except Exception:
                logger.exception("IR 센서 폴링 중 오류 발생")
            time.sleep(self._poll_interval)
