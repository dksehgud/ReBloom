import json
import logging

import requests

from app.config.settings import (
    GMS_CHAT_COMPLETIONS_URL,
    GMS_KEY,
    GMS_MODEL,
    GMS_TIMEOUT_SECONDS,
)

logger = logging.getLogger(__name__)


def generate_status_card(name: str, biometrics: list[dict], sleeps: list[dict]) -> dict:
    if not GMS_KEY:
        raise ValueError("GMS_KEY must not be empty")
    if not name:
        raise ValueError("name must not be empty")
    if not biometrics:
        raise ValueError("biometrics must not be empty")
    if not sleeps:
        raise ValueError("sleeps must not be empty")

    response = requests.post(
        GMS_CHAT_COMPLETIONS_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GMS_KEY}",
        },
        json={
            "model": GMS_MODEL,
            "messages": [
                {
                    "role": "developer",
                    "content": (
                        "Answer in Korean. "
                        "너는 아동의 생체/수면 데이터를 바탕으로 보호자에게 전달할 "
                        "짧고 따뜻한 상태 카드를 작성하는 전문가다. "
                        "의학적 진단, 질병명 단정, 공포를 유발하는 표현은 피한다. "
                        "반드시 JSON object만 응답한다. "
                        "응답 JSON은 title, description, subTitle, suggestion 네 필드만 포함한다."
                    ),
                },
                {
                    "role": "user",
                    "content": _build_prompt(name=name, biometrics=biometrics, sleeps=sleeps),
                },
            ],
        },
        timeout=GMS_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    data = response.json()
    content = data["choices"][0]["message"]["content"]
    parsed = _parse_json_content(content)
    return _validate_response(parsed)


def _build_prompt(name: str, biometrics: list[dict], sleeps: list[dict]) -> str:
    return json.dumps(
        {
            "task": "daily_child_status_card",
            "language": "ko",
            "childName": name,
            "rules": [
                "title은 30자 이내의 한 문장으로 작성한다.",
                "description은 데이터에서 관찰되는 수면, 활동량, 회복 흐름을 1~2문장으로 작성한다.",
                "subTitle은 보호자에게 건네는 가벼운 제안의 제목처럼 작성한다.",
                "suggestion은 아이에게 직접 건넬 수 있는 부드러운 질문이나 행동 제안 한 문장으로 작성한다.",
                "진단, 처방, 질병 확정 표현은 사용하지 않는다.",
                "데이터가 좋지 않아도 단정하지 말고 '~같아요', '~보여요'처럼 완곡하게 표현한다.",
                "보호자가 죄책감이나 불안을 느끼지 않도록 담담하고 따뜻한 톤을 유지한다.",
            ],
            "outputSchema": {
                "title": "string",
                "description": "string",
                "subTitle": "string",
                "suggestion": "string",
            },
            "biometrics": [_compact_biometric(row) for row in biometrics],
            "sleeps": [_compact_sleep(row) for row in sleeps],
        },
        ensure_ascii=False,
    )


def _compact_biometric(row: dict) -> dict:
    return {
        "tsStart": row.get("tsStart"),
        "tsEnd": row.get("tsEnd"),
        "hr": row.get("hr"),
        "rmssd": row.get("rmssd"),
        "pnn50": row.get("pnn50"),
        "lfHf": row.get("lfHf"),
        "accMag": row.get("accMag"),
        "hrAccRatio": row.get("hrAccRatio"),
        "missingnessScore": row.get("missingnessScore"),
    }


def _compact_sleep(row: dict) -> dict:
    return {
        "date": row.get("date"),
        "wakeup": row.get("wakeup"),
        "asleep": row.get("asleep"),
        "sleepDuration": row.get("sleepDuration"),
        "waso": row.get("waso"),
        "sleepScore": row.get("sleepScore"),
        "sleepEfficiency": row.get("sleepEfficiency"),
    }


def _parse_json_content(content: str) -> dict:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start < 0 or end < start:
            raise
        return json.loads(content[start:end + 1])


def _validate_response(value: dict) -> dict:
    required_fields = ("title", "description", "subTitle", "suggestion")
    result: dict[str, str] = {}

    for field in required_fields:
        text = value.get(field)
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"GMS response field is invalid: {field}")
        result[field] = text.strip()

    return result