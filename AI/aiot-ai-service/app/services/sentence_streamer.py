"""
문장 단위 스트리머 모듈.

토큰 스트림(async generator)을 입력받아
TTS 재생에 적합한 문장 단위 청크로 묶어 yield한다.

문장 경계 기준:
- 마침표(. , 。), 물음표(? , ?), 느낌표(! , !)
- 한국어 종결 어미: 다., 요., 까?, 죠., 네., 군.
- 최대 길이(MAX_SENTENCE_LEN) 초과 시 강제 분리

TTS 친화적 처리:
- 빈 문자열 및 공백만 있는 청크는 전송하지 않음
- 스트림 종료 후 버퍼에 남은 텍스트도 최종 전송
"""

import re
import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

# 문장이 이 길이를 초과하면 강제로 청크를 끊는다
MAX_SENTENCE_LEN = 80

# 문장 종료로 판단하는 패턴 (문자 단위 확인용)
# 종료 문자 다음이 공백이거나 다음 글자가 대문자/한글 시작이면 분리
SENTENCE_END_CHARS = {".", "?", "!", "。", "？", "！"}

# 한국어 종결 어미 패턴 (마지막 글자 기준으로 확인)
# 버퍼 끝이 이 패턴으로 끝나면 문장 완성으로 간주
KOREAN_ENDINGS_PATTERN = re.compile(
    r"(다\.|요\.|까\?|죠\.|네\.|군\.|어\.|구나\.|구요\.|네요\.|겠어요\.|겠죠\.|겠네요\.)$"
)


def _is_sentence_end(buffer: str) -> bool:
    """
    현재 버퍼가 문장 종료 조건을 만족하는지 확인한다.

    판단 기준:
    1. 종료 문자(., ?, !, 。 등)로 끝나는 경우
    2. 한국어 종결 어미 패턴으로 끝나는 경우
    """
    stripped = buffer.rstrip()
    if not stripped:
        return False

    # 기본 종료 문자 확인
    if stripped[-1] in SENTENCE_END_CHARS:
        return True

    # 한국어 종결 어미 확인
    if KOREAN_ENDINGS_PATTERN.search(stripped):
        return True

    return False


def _clean_for_tts(text: str) -> str:
    """
    TTS 재생에 방해가 되는 요소를 제거한다.
    - 마크다운 강조 문자 (*, _, `, #)
    - 이모지 (이모지 유니코드 범위 제거)
    - 앞뒤 공백 정리
    """
    # 마크다운 강조 기호 제거
    text = re.sub(r"[*_`#]", "", text)
    # 이모지 제거 (기본 유니코드 이모지 범위)
    text = re.sub(
        r"[\U0001F600-\U0001F64F"
        r"\U0001F300-\U0001F5FF"
        r"\U0001F680-\U0001F6FF"
        r"\U0001F1E0-\U0001F1FF"
        r"\U00002700-\U000027BF"
        r"\U0000FE00-\U0000FE0F"
        r"\U00002600-\U000026FF]+",
        "",
        text,
    )
    return text.strip()


async def sentence_stream(
    token_gen: AsyncGenerator[str, None],
) -> AsyncGenerator[str, None]:
    """
    토큰 async generator를 받아 문장 단위로 묶어 yield하는 async generator.

    Args:
        token_gen: LLM 클라이언트에서 오는 토큰 스트림

    Yields:
        str: TTS 재생에 적합한 문장 단위 텍스트 (빈 문자열 제외)
    """
    buffer = ""

    async for token in token_gen:
        buffer += token

        # 최대 길이 초과 시 강제 분리 (공백 위치에서 자르기)
        if len(buffer) >= MAX_SENTENCE_LEN:
            # 마지막 공백 위치 탐색
            last_space = buffer.rfind(" ", 0, MAX_SENTENCE_LEN)
            if last_space > 0:
                chunk = buffer[:last_space].strip()
                buffer = buffer[last_space:].lstrip()
            else:
                # 공백이 없으면 MAX_SENTENCE_LEN에서 강제 절단
                chunk = buffer[:MAX_SENTENCE_LEN].strip()
                buffer = buffer[MAX_SENTENCE_LEN:].lstrip()

            cleaned = _clean_for_tts(chunk)
            if cleaned:
                logger.debug(f"[SentenceStreamer] 강제 분리 청크: {cleaned!r}")
                yield cleaned
            continue

        # 문장 종료 판단
        if _is_sentence_end(buffer):
            chunk = buffer.strip()
            buffer = ""
            cleaned = _clean_for_tts(chunk)
            if cleaned:
                logger.debug(f"[SentenceStreamer] 문장 청크: {cleaned!r}")
                yield cleaned

    # 스트림 종료 후 남은 버퍼 전송
    if buffer.strip():
        cleaned = _clean_for_tts(buffer.strip())
        if cleaned:
            logger.debug(f"[SentenceStreamer] 마지막 버퍼 청크: {cleaned!r}")
            yield cleaned
