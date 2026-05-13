import logging
import asyncio
import re
import sys
import uuid
from difflib import SequenceMatcher
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
from rpi_client.services.wake_word_detector import OpenWakeWordDetector

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
        wake_word_detector: OpenWakeWordDetector | None = None,
    ) -> None:
        self.config = config
        self.stt = stt
        self.tts = tts
        self.websocket_client = websocket_client
        self.session_sender = session_sender
        self.wake_word_detector = wake_word_detector
        self.session_id = self._create_session_id()
        self.session_sender.session_id = self.session_id
        self._voice_runtime = self._load_voice_runtime()
        self._conversation_lock = asyncio.Lock()
        self._stt_lock = asyncio.Lock()
        self._trigger_pending = False
        self._start_sound_args = SimpleNamespace(
            start_sound=config.start_sound,
            start_sound_file=config.start_sound_file,
            start_sound_player=config.start_sound_player,
            start_sound_device=config.start_sound_device,
            aplay_bin=config.aplay_bin,
        )

    async def run(self) -> None:
        """wake word를 기다리다가 호출되면 대화 루프를 실행한다."""

        logger.info("대기 세션 시작: %s", self.session_id)

        if self.config.start_conversation_on_boot:
            print("\n[대화] 즉시 대화 모드 시작", flush=True)
            await self.start_conversation()
            return

        if not self.config.wake_word_enabled or self._should_skip_wake_word_loop_for_mock():
            print("\n[대기] MQTT/HTTP 대화 시작 신호 대기 중", flush=True)
            while True:
                await asyncio.sleep(3600)

        if self.wake_word_detector is not None:
            await self._run_openwakeword_loop()
            return

        while True:
            try:
                print("\n[대기] wake word 대기 중: %s" % ", ".join(self.config.wake_words), flush=True)
                async with self._stt_lock:
                    heard_text = await self.stt.listen(start_timeout=self.config.wake_word_start_timeout)
            except STTInputUnavailableError as exc:
                logger.warning("STT 입력 장치 대기 중: %s", exc)
                await asyncio.sleep(exc.retry_after)
                continue
            except Exception:
                logger.exception("대기 중 STT 입력 처리 오류 발생")
                await asyncio.sleep(self.config.stt_retry_seconds)
                continue

            if is_exit_command(heard_text):
                logger.info("종료 명령 수신")
                break

            if heard_text.strip():
                print(f"[대기 STT] {heard_text}", flush=True)
            wake_detected, initial_text = self._parse_wake_word(heard_text)
            if not wake_detected:
                logger.info("wake word가 없어 대기 상태를 유지합니다: %s", heard_text)
                continue

            print("[호출] wake word 감지", flush=True)
            await self.start_conversation(initial_text=initial_text)

    async def trigger_conversation(self, greeting: str | None = None) -> bool:
        """외부 API 요청으로 인사 후 대화를 시작한다."""

        if self._conversation_lock.locked() or self._trigger_pending:
            logger.info("이미 대화 중이라 외부 트리거를 거절합니다.")
            return False

        if self.wake_word_detector is not None:
            self.wake_word_detector.stop()
        self._trigger_pending = True
        asyncio.create_task(self._start_triggered_conversation(greeting))
        return True

    async def _run_openwakeword_loop(self) -> None:
        assert self.wake_word_detector is not None
        while True:
            try:
                if self._trigger_pending or self._conversation_lock.locked():
                    await asyncio.sleep(0.1)
                    continue
                print("\n[대기] openWakeWord 호출어 대기 중", flush=True)
                async with self._stt_lock:
                    detected = await self.wake_word_detector.wait_for_wake()
            except STTInputUnavailableError as exc:
                logger.warning("wake word 입력 장치 대기 중: %s", exc)
                await asyncio.sleep(exc.retry_after)
                continue
            except Exception:
                logger.exception("openWakeWord 처리 중 오류 발생")
                await asyncio.sleep(self.config.stt_retry_seconds)
                continue

            if not detected:
                continue

            print("[호출] wake word 감지", flush=True)
            await self.start_conversation()
            if self.config.openwakeword_rearm_seconds > 0:
                print(f"[대기] wake word 재감지 방지 대기 {self.config.openwakeword_rearm_seconds:.1f}초", flush=True)
                await asyncio.sleep(self.config.openwakeword_rearm_seconds)
            if self.config.openwakeword_flush_seconds > 0:
                print(f"[대기] wake word 입력 버퍼 비우기 {self.config.openwakeword_flush_seconds:.1f}초", flush=True)
                await asyncio.to_thread(
                    self.wake_word_detector.flush_audio_buffer,
                    self.config.openwakeword_flush_seconds,
                )

    async def _start_triggered_conversation(self, greeting: str | None) -> None:
        try:
            await self.start_conversation(greeting=greeting or self.config.trigger_greeting)
        finally:
            self._trigger_pending = False

    async def start_conversation(self, initial_text: str | None = None, greeting: str | None = None) -> None:
        """한 번의 활성 대화 세션을 실행하고 끝나면 대기 상태로 돌아간다."""

        async with self._conversation_lock:
            logger.info("대화 활성화: %s", self.session_id)
            async with self._stt_lock:
                if greeting:
                    print(f"[봇] {greeting}", flush=True)
                    await self.tts.speak(greeting)
                    await self.tts.wait_until_idle()

                if initial_text:
                    should_continue = await self._handle_user_turn(initial_text)
                    if not should_continue:
                        return

                empty_turns = 0
                while True:
                    user_text = await self._listen_for_user_turn()
                    if user_text is None:
                        continue
                    if user_text == "__no_input__":
                        empty_turns += 1
                        if empty_turns >= self.config.conversation_empty_turns_to_end:
                            print("[대화 종료] 입력이 없어 대기 상태로 돌아갑니다.", flush=True)
                            return
                        print("[듣기] 입력이 없어 한 번 더 기다립니다.", flush=True)
                        continue
                    empty_turns = 0
                    should_continue = await self._handle_user_turn(user_text)
                    if not should_continue:
                        return

    async def _listen_for_user_turn(self) -> str | None:
        try:
            print("\n[듣기] 알림음 후 말씀하세요.", flush=True)
            self._play_start_sound()
            user_text = await self.stt.listen()
        except STTInputUnavailableError as exc:
            logger.warning("STT 입력 장치 대기 중: %s", exc)
            await asyncio.sleep(exc.retry_after)
            return None
        except Exception:
            logger.exception("STT 입력 처리 중 오류 발생")
            await asyncio.sleep(self.config.stt_retry_seconds)
            return None

        if is_exit_command(user_text):
            logger.info("대화 종료 명령 수신")
            return "__exit__"
        if not self._is_meaningful_user_text(user_text):
            logger.info("의미 있는 STT 입력이 없어 대화를 종료합니다.")
            if self.config.reprompt_on_empty:
                await self.tts.speak(self.config.no_input_prompt)
                return None
            return "__no_input__"
        return user_text

    async def _handle_user_turn(self, user_text: str) -> bool:
        if user_text == "__exit__":
            return False

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
                await asyncio.sleep(0.2)
        except LLMWebSocketError:
            logger.exception("대화 턴 처리 중 WebSocket 오류 발생")
        except Exception:
            logger.exception("대화 턴 처리 중 예상하지 못한 오류 발생")

        return True

    def _parse_wake_word(self, text: str) -> tuple[bool, str | None]:
        stripped_text = text.strip()
        normalized_text = self._normalize_wake_text(stripped_text)
        for wake_word in self.config.wake_words:
            normalized_wake_word = self._normalize_wake_text(wake_word)
            if not normalized_wake_word:
                continue
            index = normalized_text.find(normalized_wake_word)
            if index < 0 and not self._is_similar_wake_word(normalized_text, normalized_wake_word):
                continue
            after_wake_word = stripped_text.strip(" ,.!?，。！？")
            if self._normalize_wake_text(after_wake_word) == normalized_wake_word:
                after_wake_word = ""
            return True, after_wake_word or None
        return False, None

    @staticmethod
    def _normalize_wake_text(text: str) -> str:
        return re.sub(r"[^0-9a-z가-힣]+", "", text.lower())

    @staticmethod
    def _is_similar_wake_word(text: str, wake_word: str) -> bool:
        if not text or not wake_word:
            return False
        if len(text) > len(wake_word) + 2:
            return False
        return SequenceMatcher(None, text, wake_word).ratio() >= 0.72

    def _should_skip_wake_word_loop_for_mock(self) -> bool:
        return self.config.use_mock_stt and self.config.mqtt_enabled

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
