import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import llm_client


class LlmClientTests(unittest.TestCase):
    def test_post_chat_sends_keep_alive(self):
        body = {"message": {"content": "네."}}
        fake_response = _FakeResponse(json.dumps(body).encode("utf-8"))

        with mock.patch.dict(llm_client.os.environ, {"REBLOOM_OLLAMA_KEEP_ALIVE": "45m"}):
            with mock.patch.object(llm_client.urllib.request, "urlopen", return_value=fake_response) as urlopen:
                answer = llm_client.post_chat(
                    "http://ollama.test",
                    "rebloom-gemma4",
                    [{"role": "user", "content": "안녕"}],
                )

        self.assertEqual(answer, "네.")
        request = urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(payload["keep_alive"], "45m")
        self.assertEqual(payload["options"]["num_predict"], 96)

    def test_post_chat_allows_num_predict_override(self):
        body = {"message": {"content": "좋아."}}
        fake_response = _FakeResponse(json.dumps(body).encode("utf-8"))

        with mock.patch.dict(llm_client.os.environ, {"REBLOOM_NUM_PREDICT": "128"}):
            with mock.patch.object(llm_client.urllib.request, "urlopen", return_value=fake_response) as urlopen:
                llm_client.post_chat(
                    "http://ollama.test",
                    "rebloom-gemma4",
                    [{"role": "user", "content": "조금 더 길게 말해줘"}],
                )

        request = urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(payload["options"]["num_predict"], 128)

    def test_load_messages_returns_system_prompt_when_history_is_missing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            history_file = Path(temp_dir) / "missing.json"

            messages = llm_client.load_messages(str(history_file))

        self.assertEqual(messages, [{"role": "system", "content": llm_client.SYSTEM_PROMPT}])

    def test_save_and_load_messages_persists_recent_turns(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            history_file = Path(temp_dir) / "voice_history.json"
            messages = [
                {"role": "system", "content": llm_client.SYSTEM_PROMPT},
                {"role": "user", "content": "첫 번째"},
                {"role": "assistant", "content": "하나"},
                {"role": "user", "content": "두 번째"},
                {"role": "assistant", "content": "둘"},
                {"role": "user", "content": "세 번째"},
                {"role": "assistant", "content": "셋"},
            ]

            llm_client.save_messages(messages, str(history_file))
            loaded = llm_client.load_messages(str(history_file))

        self.assertEqual(
            loaded,
            [
                {"role": "system", "content": llm_client.SYSTEM_PROMPT},
                {"role": "user", "content": "두 번째"},
                {"role": "assistant", "content": "둘"},
                {"role": "user", "content": "세 번째"},
                {"role": "assistant", "content": "셋"},
            ],
        )


class _FakeResponse:
    def __init__(self, body):
        self._body = io.BytesIO(body)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return self._body.read()


if __name__ == "__main__":
    unittest.main()
