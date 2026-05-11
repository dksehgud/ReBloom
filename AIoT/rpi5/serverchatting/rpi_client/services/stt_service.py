import asyncio
import logging
import re
import subprocess
import sys
import tempfile
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from rpi_client.core.config import Settings

logger = logging.getLogger(__name__)


EXIT_COMMANDS = {"exit", "quit", "종료"}
MIC_BUSY_MARKERS = (
    "device or resource busy",
    "resource busy",
    "장치나 자원이 동작 중",
)


class STTInputUnavailableError(RuntimeError):
    """마이크 입력 장치가 일시적으로 준비되지 않았을 때 발생한다."""

    def __init__(self, message: str, retry_after: float) -> None:
        super().__init__(message)
        self.retry_after = retry_after


class BaseSTTService(ABC):
    """STT 서비스 공통 인터페이스."""

    @abstractmethod
    async def listen(self, start_timeout: Optional[float] = None) -> str:
        """사용자 발화를 텍스트로 반환한다."""


class MockSTTService(BaseSTTService):
    """콘솔 입력을 STT 결과처럼 사용하는 MVP용 mock STT."""

    async def listen(self, start_timeout: Optional[float] = None) -> str:
        while True:
            text = await asyncio.to_thread(input, "사용자> ")
            text = text.strip()
            if text:
                logger.info("사용자 입력 수신: %s", text)
                return text
            logger.info("빈 입력은 무시합니다.")


class LocalSTTService(BaseSTTService):
    """arecord와 whisper.cpp를 사용하는 로컬 STT 서비스."""

    def __init__(self, config: Settings) -> None:
        self.config = config
        self._voice_runtime = self._load_voice_runtime()

    async def listen(self, start_timeout: Optional[float] = None) -> str:
        return await asyncio.to_thread(self._listen_blocking, start_timeout)

    def _listen_blocking(self, start_timeout: Optional[float] = None) -> str:
        with tempfile.TemporaryDirectory(prefix="rebloom_ws_stt_") as temp_dir:
            wav_path = Path(temp_dir) / "user.wav"
            if not self._record_with_fallback(wav_path, start_timeout):
                return ""

            transcript = self._voice_runtime.transcribe_whisper_cpp(
                wav_path,
                self.config.whisper_bin,
                self.config.whisper_model,
                self.config.language,
                self.config.whisper_threads,
                self.config.whisper_fast,
            )
            text = self._voice_runtime.clean_transcript(transcript)
            logger.info("로컬 STT 인식 결과: %s", text)
            return text

    def is_meaningful(self, text: str) -> bool:
        return self._voice_runtime.is_meaningful_transcript(text)

    def _record_with_fallback(self, wav_path: Path, start_timeout: Optional[float] = None) -> bool:
        last_error = None
        busy_errors = []
        candidates = self._record_device_candidates(self.config.audio_device)
        if not candidates:
            raise STTInputUnavailableError(
                "캡처 가능한 마이크 입력 장치를 찾지 못했습니다. "
                "`arecord -l`에서 USB 마이크가 보이는지 확인한 뒤 다시 시도합니다.",
                self.config.mic_busy_retry_seconds,
            )

        for audio_device in candidates:
            try:
                label = audio_device or "ALSA 기본 입력 장치"
                logger.info("마이크 입력 장치 시도: %s", label)
                if self.config.listen_mode == "vad":
                    speech_detected = self._voice_runtime.record_wav_until_silence(
                        wav_path,
                        audio_device,
                        self.config.max_record_seconds,
                        self.config.silence_seconds,
                        start_timeout if start_timeout is not None else self.config.start_timeout,
                        self.config.speech_threshold,
                    )
                    if not speech_detected:
                        logger.info("음성이 감지되지 않았습니다.")
                        return False
                else:
                    self._voice_runtime.record_wav(
                        wav_path,
                        self.config.record_seconds,
                        audio_device,
                    )
                logger.info("마이크 입력 장치 사용 성공: %s", label)
                return True
            except RuntimeError as exc:
                last_error = exc
                if self._is_microphone_busy_error(exc):
                    busy_errors.append(exc)
                logger.warning("마이크 입력 장치 실패: %s (%s)", audio_device or "default", exc)

        if last_error and busy_errors:
            raise STTInputUnavailableError(
                "마이크 입력 장치가 다른 프로세스에서 사용 중입니다. "
                f"{self.config.mic_busy_retry_seconds:.1f}초 후 다시 시도합니다.\n"
                f"마지막 오류: {last_error}",
                self.config.mic_busy_retry_seconds,
            ) from last_error

        raise RuntimeError(f"사용 가능한 마이크 입력 장치를 찾지 못했습니다.\n마지막 오류: {last_error}") from last_error

    @staticmethod
    def _is_microphone_busy_error(error: RuntimeError) -> bool:
        message = str(error).lower()
        return any(marker in message for marker in MIC_BUSY_MARKERS)

    def _record_device_candidates(self, device: str) -> list[str]:
        device = device.strip()
        if device not in {"", "auto", "default"}:
            return [device]

        candidates: list[str] = []
        selected = self._voice_runtime.choose_alsa_device("arecord")
        if device == "default":
            candidates.append("")
        if selected:
            candidates.append(selected)
        candidates.extend(self._list_arecord_capture_devices())
        candidates.extend(self._list_arecord_named_capture_devices())
        if device == "default":
            candidates.append("")
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
            devices.append(f"default:CARD={card_name}")
            devices.append(f"sysdefault:CARD={card_name}")
            devices.append(f"plughw:CARD={card_name},DEV={device_number}")
            devices.append(f"plughw:{card_number},{device_number}")
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

    @staticmethod
    def _load_voice_runtime():
        llm_dir = Path(__file__).resolve().parents[3] / "LLM"
        if str(llm_dir) not in sys.path:
            sys.path.insert(0, str(llm_dir))
        from etc import voice_runtime

        return voice_runtime


def is_exit_command(text: str) -> bool:
    """종료 명령어인지 확인한다."""

    return text.strip().lower() in EXIT_COMMANDS


def is_meaningful_text(text: str) -> bool:
    """mock 모드에서도 빈 입력과 너무 짧은 입력을 걸러낸다."""

    return len(text.strip()) >= 1
