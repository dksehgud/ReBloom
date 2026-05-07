import logging
import asyncio
import re
import sys
import uuid
from pathlib import Path
from types import SimpleNamespace

from rpi_client.core.config import Settings
from rpi_client.schemas.message import ChatRequest
from rpi_client.services.session_event_sender import SessionEventSender
from rpi_client.services.stt_service import (
    BaseSTTService,
    STTInputUnavailableError,
    is_exit_command,
    is_meaningful_text,
)
from rpi_client.services.tts_service import BaseTTSService
from rpi_client.services.websocket_client import LLMWebSocketClient, LLMWebSocketError

logger = logging.getLogger(__name__)


class ConversationManager:
    """STT 입력, LLM streaming 수신, TTS 출력을 연결하는 대화 흐름 관리자."""

    def __init__(
        self,
        config: Settings,
        stt: BaseSTTService,
        tts: BaseTTSService,
        websocket_client: LLMWebSocketClient,
        session_sender: SessionEventSender,
    ) -> None:
        self.config = config
        self.stt = stt
        self.tts = tts
        self.websocket_client = websocket_client
        self.session_sender = session_sender
        self.session_id = self._create_session_id()
        self.session_sender.session_id = self.session_id
        self._voice_runtime = self._load_voice_runtime()
        self._start_sound_args = SimpleNamespace(
            start_sound=config.start_sound,
            start_sound_player=config.start_sound_player,
            start_sound_device=config.start_sound_device,
            aplay_bin=config.aplay_bin,
        )

    async def run(self) -> None:
        """사용자가 종료 명령을 입력할 때까지 대화 루프를 실행한다."""

        logger.info("대화 세션 시작: %s", self.session_id)

        while True:
            try:
                print("\n[듣기] 알림음 후 말씀하세요.", flush=True)
                self._play_start_sound()
                user_text = await self.stt.listen()
            except STTInputUnavailableError as exc:
                logger.warning("STT 입력 장치 대기 중: %s", exc)
                await asyncio.sleep(exc.retry_after)
                continue
            except Exception:
                logger.exception("STT 입력 처리 중 오류 발생")
                await asyncio.sleep(self.config.stt_retry_seconds)
                continue

            if is_exit_command(user_text):
                logger.info("종료 명령 수신")
                break
            if not self._is_meaningful_user_text(user_text):
                logger.info("의미 있는 STT 입력이 없어 현재 턴을 건너뜁니다.")
                if self.config.reprompt_on_empty:
                    await self.tts.speak(self.config.no_input_prompt)
                continue

            print(f"[나] {user_text}", flush=True)
            self.session_sender.append("user", user_text)

            request = ChatRequest(
                device_id=self.config.device_id,
                session_id=self.session_id,
                text=user_text,
            )

            try:
                answer_parts: list[str] = []
                filtered_count = 0
                filtered_examples: list[str] = []
                print("[서버] 답변 요청 중...", flush=True)
                async for sentence in self.websocket_client.stream_chat(request):
                    visible_sentence = self._clean_response_sentence(sentence)
                    if visible_sentence is None:
                        filtered_count += 1
                        if len(filtered_examples) < 2:
                            filtered_examples.append(self._preview_text(sentence))
                        logger.debug("LLM 내부 추론으로 보이는 문장을 건너뜁니다: %s", sentence)
                        continue
                    answer_parts.append(visible_sentence)
                    print(f"[봇] {visible_sentence}", flush=True)
                    await self.tts.speak(visible_sentence)
                answer_text = " ".join(answer_parts).strip()
                if answer_text:
                    self.session_sender.append("assistant", answer_text)
                else:
                    print("[봇] 표시할 수 있는 답변이 없습니다.", flush=True)
                    if filtered_count:
                        print(f"[진단] 서버 응답 {filtered_count}개가 내부 추론으로 판단되어 숨겨졌습니다.", flush=True)
                        for hidden_text in filtered_examples:
                            print(f"[숨김] {hidden_text}", flush=True)
                await self.session_sender.flush_if_due()
                if self.config.wait_tts_before_next_listen:
                    logger.info("TTS 출력 완료 대기")
                    await self.tts.wait_until_idle()
                    await asyncio.sleep(0.6)
            except LLMWebSocketError:
                logger.exception("대화 턴 처리 중 WebSocket 오류 발생")
                continue
            except Exception:
                logger.exception("대화 턴 처리 중 예상하지 못한 오류 발생")
                continue

    @staticmethod
    def _create_session_id() -> str:
        return f"session-{uuid.uuid4().hex[:12]}"

    def _is_meaningful_user_text(self, text: str) -> bool:
        checker = getattr(self.stt, "is_meaningful", None)
        if callable(checker):
            return bool(checker(text))
        return is_meaningful_text(text)

    def _clean_response_sentence(self, sentence: str) -> str | None:
        if not self.config.filter_llm_reasoning_text:
            return sentence.strip() or None

        text = sentence.strip()
        if not text:
            return None

        lower_text = text.lower()
        if "</think>" in lower_text:
            text = re.sub(r"(?is)^.*?</think>", "", text).strip()
            lower_text = text.lower()
            if not text:
                return None
        if "<think" in lower_text:
            text = re.sub(r"(?is)<think[^>]*>", "", text).strip()
            lower_text = text.lower()
            if not text:
                return None

        # 서버가 최종 답변이 아니라 모델 내부 추론을 sentence로 흘려보내는 경우를 임시 차단한다.
        reasoning_patterns = [
            r"^maybe\b",
            r"^or perhaps\b",
            r"^perhaps\b",
            r"^the phrase\b",
            r"^since the user\b",
            r"^i should\b",
            r"^i need\b",
            r"^the main thing\b",
            r"^it sounds like\b",
            r"^they'?re talking\b",
            r"^hmm\b",
            r"^first,\s*i\b",
            r"^since they\b",
            r"^since the\b",
            r"^something like\b",
            r"^instead,\s*maybe\b",
            r"^also,\s*no\b",
            r"^just a friendly\b",
            r"^let me check\b",
            r"^yep,\s*no\b",
            r"^keep it\b",
            r"^so something like\b",
            r"^i'?m thinking\b",
            r"^i will\b",
            r"^i can'?t mention\b",
            r"\bguidelines?\b",
            r"\binternal\b",
            r"^사용자의 말은\b",
            r"^사용자가 말하는 내용을\b",
            r"^이 문장은 문법적으로\b",
            r"^이 단어들은\b",
            r"^이 단어는\b",
            r"^문맥상\b",
            r"^정확히 파악하기\b",
            r"^\".*\"라는 문장",
        ]
        if any(re.search(pattern, lower_text) for pattern in reasoning_patterns):
            return None

        return text

    @staticmethod
    def _preview_text(text: str, limit: int = 120) -> str:
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) <= limit:
            return text
        return f"{text[:limit]}..."

    def _play_start_sound(self) -> None:
        self._voice_runtime.play_start_sound(self._start_sound_args)

    @staticmethod
    def _load_voice_runtime():
        llm_dir = Path(__file__).resolve().parents[3] / "LLM"
        if str(llm_dir) not in sys.path:
            sys.path.insert(0, str(llm_dir))
        from etc import voice_runtime

        return voice_runtime
