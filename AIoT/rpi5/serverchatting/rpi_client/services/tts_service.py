import asyncio
import contextlib
import logging
import sys
from abc import ABC, abstractmethod
from pathlib import Path
from types import SimpleNamespace
from typing import Optional

from rpi_client.core.config import Settings

logger = logging.getLogger(__name__)


class BaseTTSService(ABC):
    """TTS 서비스 공통 인터페이스."""

    def __init__(self, sentence_delay: float = 0.8) -> None:
        self.sentence_delay = sentence_delay
        self._queue: asyncio.Queue[Optional[str]] = asyncio.Queue()
        self._worker_task: Optional[asyncio.Task[None]] = None

    def start_worker(self) -> None:
        """백그라운드 TTS worker를 시작한다."""

        if self._worker_task is None or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._worker())
            logger.info("TTS worker 시작")

    async def speak(self, text: str) -> None:
        """문장을 queue에 넣어 순서대로 발화되게 한다."""

        await self._queue.put(text)
        logger.info("TTS queue 추가: %s", text)

    async def wait_until_idle(self) -> None:
        """queue에 쌓인 문장이 모두 처리될 때까지 기다린다."""

        await self._queue.join()

    async def stop(self) -> None:
        """TTS worker를 안전하게 종료한다."""

        if self._worker_task is None:
            return

        await self._queue.put(None)
        await self._queue.join()
        self._worker_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await self._worker_task
        logger.info("TTS worker 종료")

    async def _worker(self) -> None:
        while True:
            text = await self._queue.get()
            try:
                if text is None:
                    return
                await self._speak_now(text)
                if self.sentence_delay > 0:
                    await asyncio.sleep(self.sentence_delay)
            except Exception:
                logger.exception("TTS 처리 중 오류 발생")
            finally:
                self._queue.task_done()

    @abstractmethod
    async def _speak_now(self, text: str) -> None:
        """실제 한 문장을 발화한다."""


class MockTTSService(BaseTTSService):
    """콘솔 출력을 음성 출력처럼 사용하는 MVP용 mock TTS."""

    async def _speak_now(self, text: str) -> None:
        print(f"[TTS] {text}")


class LocalTTSService(BaseTTSService):
    """voice_chat.py의 TTS 런타임을 재사용하는 로컬 TTS 서비스."""

    def __init__(self, config: Settings) -> None:
        super().__init__(config.tts_sentence_delay)
        self.config = config
        self._voice_runtime = self._load_voice_runtime()
        self._args = SimpleNamespace(
            tts=config.tts_engine,
            edge_voice=config.edge_voice,
            edge_rate=config.edge_rate,
            edge_volume=config.edge_volume,
            elevenlabs_api_key=config.elevenlabs_api_key,
            elevenlabs_voice_id=config.elevenlabs_voice_id,
            elevenlabs_model_id=config.elevenlabs_model_id,
            elevenlabs_output_format=config.elevenlabs_output_format,
            elevenlabs_timeout_seconds=config.elevenlabs_timeout_seconds,
            elevenlabs_stability=config.elevenlabs_stability,
            elevenlabs_similarity_boost=config.elevenlabs_similarity_boost,
            elevenlabs_style=config.elevenlabs_style,
            elevenlabs_use_speaker_boost=config.elevenlabs_use_speaker_boost,
            elevenlabs_speed=config.elevenlabs_speed,
            mp3_player=config.mp3_player,
            mp3_player_args=config.mp3_player_args,
            tts_output_file=config.tts_output_file,
            espeak_voice=config.espeak_voice,
            piper_bin=config.piper_bin,
            piper_model=config.piper_model,
            aplay_bin=config.aplay_bin,
            hf_tts_model=config.hf_tts_model,
            hf_tts_device=config.hf_tts_device,
            hf_tts_torch_dtype=config.hf_tts_torch_dtype,
            melotts_language=config.melotts_language,
            melotts_speaker=config.melotts_speaker,
            melotts_speed=config.melotts_speed,
        )

    async def _speak_now(self, text: str) -> None:
        await asyncio.to_thread(self._voice_runtime.speak, text, self._args)

    @staticmethod
    def _load_voice_runtime():
        llm_dir = Path(__file__).resolve().parents[3] / "LLM"
        if str(llm_dir) not in sys.path:
            sys.path.insert(0, str(llm_dir))
        from etc import voice_runtime

        return voice_runtime
