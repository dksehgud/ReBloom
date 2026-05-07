#!/usr/bin/env python3
"""
Re:Bloom LLM Server 외부 통신 테스트 스크립트.

라즈베리파이 또는 외부 PC에서 실행해 WebSocket / SSE / REST API를 검증한다.

사용법:
    python test_client.py --host 172.29.166.138 --port 8000

의존성:
    pip install websockets httpx
"""

import asyncio
import json
import argparse
import sys
import time

try:
    import httpx
except ImportError:
    print("httpx 미설치: pip install httpx")
    sys.exit(1)

try:
    import websockets
except ImportError:
    print("websockets 미설치: pip install websockets")
    sys.exit(1)


# ─────────────────────────────────────────────
# 테스트 페이로드
# ─────────────────────────────────────────────

TEST_PAYLOAD = {
    "device_id": "rpi-001",
    "session_id": "test-session-001",
    "text": "오늘 너무 피곤했어",
    "user_profile": {"age_group": "teenager"},
}

CRISIS_PAYLOAD = {
    "device_id": "rpi-001",
    "session_id": "test-session-crisis",
    "text": "죽고 싶어",
}


def sep(title: str) -> None:
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")


# ─────────────────────────────────────────────
# 1. Health Check
# ─────────────────────────────────────────────


def test_health(base_url: str) -> bool:
    sep("1. Health Check  GET /health")
    try:
        with httpx.Client(timeout=5) as client:
            r = client.get(f"{base_url}/health")
            print(f"  상태코드: {r.status_code}")
            print(f"  응답: {r.json()}")
            ok = r.status_code == 200
            print(f"  결과: {'✅ 성공' if ok else '❌ 실패'}")
            return ok
    except Exception as e:
        print(f"  ❌ 연결 실패: {e}")
        return False


# ─────────────────────────────────────────────
# 2. POST /api/v1/chat (non-streaming)
# ─────────────────────────────────────────────


def test_rest(base_url: str) -> bool:
    sep("2. REST API  POST /api/v1/chat")
    try:
        with httpx.Client(timeout=30) as client:
            start = time.time()
            r = client.post(f"{base_url}/api/v1/chat", json=TEST_PAYLOAD)
            elapsed = time.time() - start
            print(f"  상태코드: {r.status_code}")
            print(f"  응답: {r.json()}")
            print(f"  소요시간: {elapsed:.2f}s")
            ok = r.status_code == 200
            print(f"  결과: {'✅ 성공' if ok else '❌ 실패'}")
            return ok
    except Exception as e:
        print(f"  ❌ 오류: {e}")
        return False


# ─────────────────────────────────────────────
# 3. POST /api/v1/chat/sse (SSE streaming)
# ─────────────────────────────────────────────


def test_sse(base_url: str) -> bool:
    sep("3. SSE Streaming  POST /api/v1/chat/sse")
    sentences = []
    try:
        with httpx.Client(timeout=30) as client:
            with client.stream("POST", f"{base_url}/api/v1/chat/sse", json=TEST_PAYLOAD) as r:
                print(f"  상태코드: {r.status_code}")
                for line in r.iter_lines():
                    if not line:
                        continue
                    if line.startswith("event:"):
                        event = line.split(":", 1)[1].strip()
                        if event == "done":
                            print(f"  [done] 스트림 종료")
                            break
                    elif line.startswith("data:"):
                        data_str = line.split(":", 1)[1].strip()
                        try:
                            data = json.loads(data_str)
                            if "text" in data:
                                sentences.append(data["text"])
                                print(f"  [sentence] {data['text']}")
                        except json.JSONDecodeError:
                            pass

        print(f"  수신 문장 수: {len(sentences)}")
        ok = len(sentences) > 0
        print(f"  결과: {'✅ 성공' if ok else '❌ 실패 (문장 없음)'}")
        return ok
    except Exception as e:
        print(f"  ❌ 오류: {e}")
        return False


# ─────────────────────────────────────────────
# 4. WebSocket /api/v1/chat/ws (streaming)
# ─────────────────────────────────────────────


async def _ws_test(ws_base: str, payload: dict) -> tuple[bool, list[str]]:
    sentences = []
    uri = f"{ws_base}/api/v1/chat/ws"
    try:
        async with websockets.connect(uri, open_timeout=10) as ws:
            await ws.send(json.dumps(payload))
            while True:
                msg = await asyncio.wait_for(ws.recv(), timeout=30)
                data = json.loads(msg)
                msg_type = data.get("type")

                if msg_type == "reply":
                    # 전체 답변 한 번에 수신 (stream: false 기본 모드)
                    sentences.append(data["text"])
                    print(f"  [reply] {data['text']}")
                    break
                elif msg_type == "sentence":
                    sentences.append(data["text"])
                    print(f"  [sentence] {data['text']}")
                elif msg_type == "done":
                    print(f"  [done] 스트림 종료")
                    break
                elif msg_type == "error":
                    print(f"  [error] {data.get('message')}")
                    return False, sentences
    except asyncio.TimeoutError:
        print(f"  ❌ 타임아웃")
        return False, sentences
    except Exception as e:
        print(f"  ❌ 오류: {e}")
        return False, sentences

    return True, sentences


def test_websocket(base_url: str, ws_base: str) -> bool:
    sep("4-A. WebSocket 전체 답변 모드  WS /api/v1/chat/ws  (stream: false)")
    payload_no_stream = {**TEST_PAYLOAD, "stream": False}
    ok, sentences = asyncio.run(_ws_test(ws_base, payload_no_stream))
    print(f"  결과: {'✅ 성공' if ok else '❌ 실패'}")

    sep("4-B. WebSocket 스트리밍 모드  WS /api/v1/chat/ws  (stream: true)")
    payload_stream = {**TEST_PAYLOAD, "stream": True}
    ok2, sentences2 = asyncio.run(_ws_test(ws_base, payload_stream))
    print(f"  수신 문장 수: {len(sentences2)}")
    print(f"  결과: {'✅ 성공' if ok2 else '❌ 실패'}")

    return ok and ok2



# ─────────────────────────────────────────────
# 5. 위기 키워드 안전 응답 테스트
# ─────────────────────────────────────────────


def test_crisis(base_url: str) -> bool:
    sep("5. 위기 키워드 안전 응답  POST /api/v1/chat")
    print(f"  입력: {CRISIS_PAYLOAD['text']!r}")
    try:
        with httpx.Client(timeout=30) as client:
            r = client.post(f"{base_url}/api/v1/chat", json=CRISIS_PAYLOAD)
            print(f"  상태코드: {r.status_code}")
            print(f"  응답: {r.json()}")
            ok = r.status_code == 200
            print(f"  결과: {'✅ 성공' if ok else '❌ 실패'}")
            return ok
    except Exception as e:
        print(f"  ❌ 오류: {e}")
        return False


# ─────────────────────────────────────────────
# 메인
# ─────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="Re:Bloom LLM Server 통신 테스트")
    parser.add_argument("--host", default="172.29.166.138", help="서버 IP 주소")
    parser.add_argument("--port", default=8000, type=int, help="FastAPI 서버 포트")
    parser.add_argument(
        "--test",
        choices=["all", "health", "rest", "sse", "ws", "crisis"],
        default="all",
        help="실행할 테스트 선택 (기본: all)",
    )
    args = parser.parse_args()

    base_url = f"http://{args.host}:{args.port}"
    ws_base = f"ws://{args.host}:{args.port}"

    print(f"\n🔗 대상 서버: {base_url}")
    print(f"🔗 WebSocket: {ws_base}")

    results = {}

    if args.test in ("all", "health"):
        results["health"] = test_health(base_url)

    if args.test in ("all", "rest"):
        results["rest"] = test_rest(base_url)

    if args.test in ("all", "sse"):
        results["sse"] = test_sse(base_url)

    if args.test in ("all", "ws"):
        results["websocket"] = test_websocket(base_url, ws_base)

    if args.test in ("all", "crisis"):
        results["crisis"] = test_crisis(base_url)

    # 최종 결과 요약
    sep("테스트 결과 요약")
    all_passed = True
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {name:<15} {status}")
        if not passed:
            all_passed = False

    print(f"\n  {'🎉 전체 통과!' if all_passed else '⚠️  일부 실패 — 로그 확인 필요'}")


if __name__ == "__main__":
    main()
