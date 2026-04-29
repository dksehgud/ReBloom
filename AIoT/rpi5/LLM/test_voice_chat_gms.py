import io
import http.client
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

import voice_chat_gms


class VoiceChatGmsTests(unittest.TestCase):
    def test_to_gms_messages_maps_system_to_developer(self):
        messages = [
            {"role": "system", "content": "Answer in Korean"},
            {"role": "user", "content": "안녕"},
        ]

        self.assertEqual(
            voice_chat_gms.to_gms_messages(messages),
            [
                {"role": "developer", "content": "Answer in Korean"},
                {"role": "user", "content": "안녕"},
            ],
        )

    def test_post_gms_chat_sends_authorization_and_returns_content(self):
        response_body = {
            "choices": [
                {
                    "message": {
                        "content": "안녕하세요.",
                    }
                }
            ]
        }
        fake_response = _FakeResponse(json.dumps(response_body).encode("utf-8"))

        with mock.patch.object(voice_chat_gms.urllib.request, "urlopen", return_value=fake_response) as urlopen:
            answer = voice_chat_gms.post_gms_chat(
                "https://example.test/v1/chat/completions",
                "secret-key",
                "gpt-5-mini",
                [{"role": "system", "content": "Answer in Korean"}],
            )

        self.assertEqual(answer, "안녕하세요.")
        request = urlopen.call_args.args[0]
        self.assertEqual(request.headers["Authorization"], "Bearer secret-key")
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(payload["model"], "gpt-5-mini")
        self.assertEqual(payload["messages"][0]["role"], "developer")

    def test_post_gms_chat_handles_incomplete_read_when_partial_is_valid_json(self):
        response_body = {
            "choices": [
                {
                    "message": {
                        "content": "부분 응답입니다.",
                    }
                }
            ]
        }
        fake_response = _IncompleteReadResponse(json.dumps(response_body).encode("utf-8"))

        with mock.patch.object(voice_chat_gms.urllib.request, "urlopen", return_value=fake_response):
            answer = voice_chat_gms.post_gms_chat(
                "https://example.test/v1/chat/completions",
                "secret-key",
                "gpt-5-mini",
                [{"role": "system", "content": "Answer in Korean"}],
            )

        self.assertEqual(answer, "부분 응답입니다.")

    def test_post_gms_chat_extracts_content_from_truncated_partial_body(self):
        truncated_body = b'{"choices":[{"message":{"content":"\\uc548\\ub155\\ud558\\uc138\\uc694."}}'
        fake_response = _IncompleteReadResponse(truncated_body)

        with mock.patch.object(voice_chat_gms.urllib.request, "urlopen", return_value=fake_response):
            answer = voice_chat_gms.post_gms_chat(
                "https://example.test/v1/chat/completions",
                "secret-key",
                "gpt-5-mini",
                [{"role": "system", "content": "Answer in Korean"}],
            )

        self.assertEqual(answer, "안녕하세요.")

    def test_post_gms_chat_requires_key(self):
        with self.assertRaisesRegex(RuntimeError, "GMS_KEY"):
            voice_chat_gms.post_gms_chat(
                "https://example.test/v1/chat/completions",
                "",
                "gpt-5-mini",
                [],
            )

    def test_load_env_file_sets_missing_values_only(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            env_path = Path(temp_dir) / ".env"
            env_path.write_text(
                "\n".join(
                    [
                        "GMS_KEY=file-key",
                        "REBLOOM_GMS_MODEL='gpt-5-mini'",
                        "# comment",
                        "IGNORED_LINE",
                    ]
                ),
                encoding="utf-8",
            )

            with mock.patch.dict(voice_chat_gms.os.environ, {"GMS_KEY": "existing-key"}, clear=True):
                voice_chat_gms.load_env_file(env_path)

                self.assertEqual(voice_chat_gms.os.environ["GMS_KEY"], "existing-key")
                self.assertEqual(voice_chat_gms.os.environ["REBLOOM_GMS_MODEL"], "gpt-5-mini")


class _FakeResponse:
    def __init__(self, body):
        self._body = io.BytesIO(body)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return self._body.read()


class _IncompleteReadResponse(_FakeResponse):
    def read(self):
        raise http.client.IncompleteRead(self._body.read(), 1)


if __name__ == "__main__":
    unittest.main()
