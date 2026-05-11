import asyncio
import logging
import re
import subprocess
import sys
import threading
from pathlib import Path
from typing import Optional

from rpi_client.core.config import Settings

logger = logging.getLogger(__name__)


class OpenWakeWordDetector:
    """openWakeWord 모델로 호출어를 감지한다."""

    SAMPLE_RATE = 16000
    FRAME_MS = 80
    FRAME_SAMPLES = int(SAMPLE_RATE * FRAME_MS / 1000)
    FRAME_BYTES = FRAME_SAMPLES * 2

    def __init__(self, config: Settings) -> None:
        self.config = config
        self._stop_event = threading.Event()
        self._process: Optional[subprocess.Popen[bytes]] = None
        self._model = None
        self._wake_module = self._load_wake_module()

    async def wait_for_wake(self) -> bool:
        return await asyncio.to_thread(self._wait_for_wake_blocking)

    def stop(self) -> None:
        self._stop_event.set()
        process = self._process
        if process is not None and process.poll() is None:
            process.terminate()

    def _wait_for_wake_blocking(self) -> bool:
        self._stop_event.clear()
        model = self._load_model()
        audio_device = self._resolve_audio_device()
        command = [
            "arecord",
            "-q",
            "-f",
            "S16_LE",
            "-r",
            str(self.SAMPLE_RATE),
            "-c",
            "1",
            "-t",
            "raw",
        ]
        if audio_device:
            command.extend(["-D", audio_device])

        logger.info("openWakeWord 대기 시작: device=%s", audio_device or "default")
        self._process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            while not self._stop_event.is_set():
                frame = self._process.stdout.read(self.FRAME_BYTES) if self._process.stdout else b""
                if len(frame) < self.FRAME_BYTES:
                    if self._stop_event.is_set():
                        return False
                    detail = self._process.stderr.read().decode("utf-8", errors="replace").strip() if self._process.stderr else ""
                    raise RuntimeError(f"마이크 입력을 읽지 못했습니다.\narecord output:\n{detail}")

                import numpy as np

                audio = np.frombuffer(frame, dtype=np.int16)
                prediction = model.predict(audio)
                wake_name, score = self._wake_module.prediction_score(prediction)
                if self.config.openwakeword_debug and wake_name:
                    print(f"[wake-debug] {wake_name}={score:.6f}", flush=True)
                if score >= self.config.openwakeword_threshold:
                    print(f"[wake] 감지됨: {wake_name} ({score:.3f})", flush=True)
                    self._wake_module.reset_wake_model(model)
                    self._model = None
                    return True
            return False
        finally:
            self._stop_process()

    def _load_model(self):
        if self._model is None:
            self._model = self._wake_module.load_model(list(self.config.openwakeword_model_paths))
        return self._model

    def _resolve_audio_device(self) -> str:
        if self.config.audio_device != "auto":
            return self.config.audio_device

        candidates = self._record_device_candidates()
        if not candidates:
            raise RuntimeError("자동 선택 가능한 마이크 입력 장치를 찾지 못했습니다.")
        selected = candidates[0]
        print(f"[wake] 입력 장치 자동 선택: {selected}", flush=True)
        return selected

    def flush_audio_buffer(self, seconds: float = 0.5) -> None:
        if seconds <= 0:
            return
        audio_device = self._resolve_audio_device()
        command = [
            "arecord",
            "-q",
            "-f",
            "S16_LE",
            "-r",
            str(self.SAMPLE_RATE),
            "-c",
            "1",
            "-d",
            str(seconds),
            "-t",
            "raw",
        ]
        if audio_device:
            command.extend(["-D", audio_device])
        command.append("/dev/null")
        subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)

    def _record_device_candidates(self) -> list[str]:
        candidates: list[str] = []
        candidates.extend(self._list_arecord_capture_devices())
        candidates.extend(self._list_arecord_named_capture_devices())
        return self._dedupe(candidates)

    @staticmethod
    def _list_arecord_capture_devices() -> list[str]:
        result = subprocess.run(
            ["arecord", "-l"],
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            return []

        devices = []
        pattern = re.compile(r"^card\s+(\d+):\s*([^\s\[]+).*device\s+(\d+):", re.MULTILINE)
        for match in pattern.finditer(result.stdout):
            card_number = match.group(1)
            card_name = match.group(2)
            device_number = match.group(3)
            devices.append(f"plughw:CARD={card_name},DEV={device_number}")
            devices.append(f"plughw:{card_number},{device_number}")
            devices.append(f"default:CARD={card_name}")
            devices.append(f"sysdefault:CARD={card_name}")
        return devices

    @staticmethod
    def _list_arecord_named_capture_devices() -> list[str]:
        result = subprocess.run(
            ["arecord", "-L"],
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            return []

        devices = []
        for line in result.stdout.splitlines():
            name = line.strip()
            if not name.startswith(("plughw:CARD=", "default:CARD=", "sysdefault:CARD=")):
                continue
            devices.append(name)
        return devices

    @staticmethod
    def _dedupe(values: list[str]) -> list[str]:
        result = []
        seen = set()
        for value in values:
            if value in seen:
                continue
            seen.add(value)
            result.append(value)
        return result

    def _stop_process(self) -> None:
        process = self._process
        self._process = None
        if process is None or process.poll() is not None:
            return
        process.terminate()
        try:
            process.wait(timeout=1)
        except subprocess.TimeoutExpired:
            process.kill()

    @staticmethod
    def _load_wake_module():
        llm_dir = Path(__file__).resolve().parents[3] / "LLM"
        if str(llm_dir) not in sys.path:
            sys.path.insert(0, str(llm_dir))
        import wake_openwakeword

        return wake_openwakeword
