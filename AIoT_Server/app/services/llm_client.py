"""
LLM 클라이언트 모듈.

실제 vLLM OpenAI-compatible endpoint를 호출하거나,
USE_MOCK_LLM=True 설정 시 mock 응답을 스트리밍 방식으로 반환한다.

설계 원칙:
- httpx.AsyncClient 사용 (비동기, timeout 포함)
- streaming=True 시 async generator로 토큰을 yield
- 예외 발생 시 LLMClientError를 raise
"""

import json
import asyncio
import logging
from typing import AsyncGenerator

import httpx

from app.core.config import settings
from app.core.prompts import get_system_prompt

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# 예외 클래스
# ─────────────────────────────────────────────


class LLMClientError(Exception):
    """LLM 클라이언트에서 발생하는 예외."""

    pass


# ─────────────────────────────────────────────
# Mock 모드 응답 목록
# ─────────────────────────────────────────────

MOCK_RESPONSES: list[str] = [
    "많이 지쳤구나. 오늘은 어떤 일이 제일 힘들었어?",
    "그랬구나. 그 감정이 느껴지는 것 자연스러운 거야. 요즘 어떤 일이 있었어?",
    "그런 마음이 들 때 정말 힘들지. 지금 옆에 있어 줄 수 있는 사람이 있어?",
    "오늘 수고 많았어. 쉬고 싶은 마음이 드는 게 당연해. 지금 기분은 어때?",
    "이야기해 줘서 고마워. 좀 더 들어도 될까?",
]

_mock_response_index = 0


def _get_mock_response() -> str:
    """순환 방식으로 mock 응답 문자열을 반환한다."""
    global _mock_response_index
    response = MOCK_RESPONSES[_mock_response_index % len(MOCK_RESPONSES)]
    _mock_response_index += 1
    return response


# ─────────────────────────────────────────────
# Mock streaming 생성기
# ─────────────────────────────────────────────


async def _mock_stream(text: str) -> AsyncGenerator[str, None]:
    """
    미리 정의된 문장을 글자 단위로 잘게 나눠 yield한다.
    실제 스트리밍과 유사한 효과를 준다.
    """
    for char in text:
        yield char
        # 글자 하나당 약간의 지연으로 스트리밍 시뮬레이션
        await asyncio.sleep(0.03)


# ─────────────────────────────────────────────
# vLLM OpenAI-compatible streaming 생성기
# ─────────────────────────────────────────────


async def _vllm_stream(
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    """
    vLLM의 OpenAI-compatible /v1/chat/completions 엔드포인트에
    streaming 요청을 보내고 토큰을 yield한다.

    SSE(Server-Sent Events) 형식의 응답을 파싱해 delta.content를 추출한다.
    """
    url = f"{settings.OPENAI_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.LLM_MODEL,
        "messages": messages,
        "max_tokens": settings.MAX_NEW_TOKENS,
        "temperature": settings.TEMPERATURE,
        "top_p": settings.TOP_P,
        "frequency_penalty": settings.FREQUENCY_PENALTY,
        "presence_penalty": settings.PRESENCE_PENALTY,
        "stream": True,
    }

    try:
        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT) as client:
            async with client.stream("POST", url, headers=headers, json=body) as response:
                if response.status_code != 200:
                    body_text = await response.aread()
                    raise LLMClientError(
                        f"vLLM API 오류: status={response.status_code}, body={body_text.decode()}"
                    )

                async for line in response.aiter_lines():
                    line = line.strip()

                    # SSE 데이터 라인만 처리
                    if not line.startswith("data:"):
                        continue

                    data_str = line[len("data:"):].strip()

                    # 스트림 종료 신호
                    if data_str == "[DONE]":
                        break

                    try:
                        data = json.loads(data_str)
                    except json.JSONDecodeError:
                        logger.warning(f"JSON 파싱 실패: {data_str}")
                        continue

                    # delta.content 추출
                    choices = data.get("choices", [])
                    if not choices:
                        continue

                    delta = choices[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content

    except httpx.TimeoutException as e:
        raise LLMClientError(f"vLLM 요청 타임아웃: {e}") from e
    except httpx.RequestError as e:
        raise LLMClientError(f"vLLM 연결 오류: {e}") from e


# ─────────────────────────────────────────────
# Qwen3 thinking 블록 필터
# ─────────────────────────────────────────────


async def _filter_thinking(
    raw_gen: AsyncGenerator[str, None],
) -> AsyncGenerator[str, None]:
    """
    Qwen3의 <think>...</think> 추론 블록을 제거하고
    실제 답변 토큰만 yield하는 필터.

    동작 방식:
    - 토큰을 누적해 <think> 태그 진입 여부를 판단
    - </think> 토큰이 완성되는 순간부터 이후 토큰을 yield
    - <think> 태그가 없는 응답(mock 등)은 그대로 통과

    예시:
        입력: <think>\n추론 내용...\n</think>\n실제 답변입니다.
        출력: 실제 답변입니다.
    """
    THINK_OPEN = "<think>"
    THINK_CLOSE = "</think>"

    # 전략: 모든 토큰을 일단 누적한 뒤
    # </think> 태그를 기준으로 실제 답변 부분만 스트리밍한다.
    #
    # - </think> 이전에는 yield하지 않는다.
    # - </think>를 감지한 순간부터 이후 토큰을 즉시 yield한다.
    # - <think>가 아예 없는 응답(mock 등)도 정상 처리된다.

    buffer = ""          # </think> 이전 누적 버퍼
    thinking_done = False  # </think>를 이미 통과했는지 여부

    async for token in raw_gen:
        # </think>를 이미 통과한 뒤: 이후 토큰은 즉시 전달
        if thinking_done:
            yield token
            continue

        buffer += token

        # </think> 태그가 버퍼 안에 완성되었는지 확인
        if THINK_CLOSE in buffer:
            thinking_done = True
            # </think> 이후 남은 텍스트를 즉시 yield
            after = buffer[buffer.index(THINK_CLOSE) + len(THINK_CLOSE):]
            buffer = ""
            if after:
                yield after
            logger.debug("[think-filter] <think> 블록 제거 완료, 실제 답변 스트리밍 시작")
            continue

        # </think>가 아직 없고, <think>도 없는 경우:
        # 일반 응답이거나 <think> 태그가 아직 조각나 있는 중간 상태.
        # <think>가 버퍼에 없으면 태그 경계용 버퍼(7자)만 남기고 즉시 yield.
        if THINK_OPEN not in buffer:
            safe_len = len(buffer) - len(THINK_OPEN)
            if safe_len > 0:
                yield buffer[:safe_len]
                buffer = buffer[safe_len:]

    # 스트림 종료: </think>가 한 번도 나오지 않은 경우 (thinking 없는 응답)
    if not thinking_done and buffer:
        yield buffer


# ─────────────────────────────────────────────
# 언어 필터 (한국어/ASCII 이외 문자 제거)
# ─────────────────────────────────────────────


def _is_allowed_char(ch: str) -> bool:
    """한국어, ASCII 출력 가능 문자, 공백·줄바꿈만 허용한다."""
    cp = ord(ch)
    # ASCII 출력 가능 문자 (공백, 영문, 숫자, 기본 문장부호)
    if 0x0020 <= cp <= 0x007E:
        return True
    # 줄바꿈·탭
    if ch in ("\n", "\r", "\t"):
        return True
    # 한글 음절 (가~힣)
    if 0xAC00 <= cp <= 0xD7A3:
        return True
    # 한글 자모
    if 0x1100 <= cp <= 0x11FF:
        return True
    # 한글 호환 자모 (ㄱ~ㅣ)
    if 0x3130 <= cp <= 0x318F:
        return True
    # 한글 자모 확장 A/B
    if 0xA960 <= cp <= 0xA97F:
        return True
    if 0xD7B0 <= cp <= 0xD7FF:
        return True
    return False


async def _filter_language(
    raw_gen: AsyncGenerator[str, None],
) -> AsyncGenerator[str, None]:
    """
    스트림에서 한국어·ASCII 이외의 문자(중국어·일본어 등)를 실시간으로 제거한다.
    Qwen 모델이 간헐적으로 중국어 문자를 섞어 출력하는 현상을 방어한다.
    """
    async for token in raw_gen:
        filtered = "".join(ch for ch in token if _is_allowed_char(ch))
        if filtered:
            yield filtered
        elif token:
            logger.debug(f"[lang-filter] 비허용 문자 제거됨: {repr(token)}")


# ─────────────────────────────────────────────
# 공개 인터페이스
# ─────────────────────────────────────────────


async def stream_chat(
    user_text: str,
    is_crisis: bool = False,
    history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """
    사용자 발화 텍스트를 받아 LLM 응답 토큰을 비동기 스트리밍으로 yield한다.
    Qwen3 thinking 블록(<think>...</think>)은 자동으로 제거된다.

    Args:
        user_text: 사용자가 말한 텍스트 (STT 결과)
        is_crisis: True이면 안전 대응 프롬프트를 사용
        history: 이전 대화 기록 [{"role": "user"|"assistant", "content": "..."}, ...]

    Yields:
        str: thinking 블록이 제거된 실제 답변 토큰
    """
    system_prompt = get_system_prompt(is_crisis=is_crisis)
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_text})

    if settings.USE_MOCK_LLM:
        logger.info("[MOCK] mock LLM 모드로 응답 생성")
        mock_text = _get_mock_response()
        async for token in _filter_language(_filter_thinking(_mock_stream(mock_text))):
            yield token
    else:
        logger.info(f"[vLLM] 모델={settings.LLM_MODEL}, 위기모드={is_crisis}, 히스토리={len(history) if history else 0}턴")
        async for token in _filter_language(_filter_thinking(_vllm_stream(messages))):
            yield token


async def complete_chat(
    user_text: str,
    is_crisis: bool = False,
    history: list[dict] | None = None,
) -> str:
    """
    스트리밍 없이 전체 응답 텍스트를 한 번에 반환한다.
    non-streaming API (POST /api/v1/chat)에서 사용한다.

    Args:
        user_text: 사용자 발화 텍스트
        is_crisis: True이면 안전 대응 프롬프트 사용
        history: 이전 대화 기록

    Returns:
        str: LLM 전체 응답 문자열
    """
    tokens: list[str] = []
    async for token in stream_chat(user_text, is_crisis=is_crisis, history=history):
        tokens.append(token)
    return "".join(tokens).strip()
