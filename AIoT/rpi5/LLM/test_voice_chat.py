# whisper.cpp 기반 음성 인식 기능 테스트

import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

import voice_chat


class VoiceChatSttTests(unittest.TestCase):
    def test_record_wav_invokes_arecord_with_expected_options(self):
        output_path = Path("/tmp/user.wav")
        completed = subprocess.CompletedProcess(args=[], returncode=0, stdout="", stderr="")

        with mock.patch.object(voice_chat, "require_command") as require_command:
            with mock.patch.object(voice_chat.subprocess, "run", return_value=completed) as run:
                voice_chat.record_wav(output_path, seconds=3, device="plughw:2,0")

        require_command.assert_called_once_with("arecord")
        run.assert_called_once_with(
            [
                "arecord",
                "-q",
                "-f",
                "S16_LE",
                "-r",
                "16000",
                "-c",
                "1",
                "-d",
                "3",
                "-D",
                "plughw:2,0",
                str(output_path),
            ],
            text=True,
            capture_output=True,
        )

    def test_record_wav_error_explains_how_to_select_device(self):
        failed = subprocess.CompletedProcess(
            args=[],
            returncode=1,
            stdout="",
            stderr="cannot open audio device",
        )

        with mock.patch.object(voice_chat, "require_command"):
            with mock.patch.object(voice_chat.subprocess, "run", return_value=failed):
                with self.assertRaisesRegex(RuntimeError, "--audio-device plughw:2,0"):
                    voice_chat.record_wav(Path("/tmp/user.wav"), seconds=1, device="")

    def test_transcribe_whisper_cpp_reads_generated_txt(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            wav_path = temp_path / "user.wav"
            wav_path.write_bytes(b"fake wav data")
            model_path = temp_path / "ggml-base.bin"
            model_path.write_bytes(b"fake model")
            whisper_bin = temp_path / "fake-whisper-cli"
            self._write_fake_whisper_cli(whisper_bin, "안녕하세요 테스트입니다")

            text = voice_chat.transcribe_whisper_cpp(
                wav_path,
                str(whisper_bin),
                str(model_path),
                "ko",
            )

        self.assertEqual(text, "안녕하세요 테스트입니다")

    def test_transcribe_whisper_cpp_requires_model_path(self):
        with self.assertRaisesRegex(RuntimeError, "모델 경로"):
            voice_chat.transcribe_whisper_cpp(Path("/tmp/user.wav"), "whisper-cli", "", "ko")

    @staticmethod
    def _write_fake_whisper_cli(path, transcript):
        script = f"""#!{sys.executable}
import pathlib
import sys

out_base = pathlib.Path(sys.argv[sys.argv.index("-of") + 1])
out_base.with_suffix(".txt").write_text({transcript!r}, encoding="utf-8")
"""
        path.write_text(script, encoding="utf-8")
        path.chmod(path.stat().st_mode | stat.S_IXUSR)


if __name__ == "__main__":
    unittest.main()
