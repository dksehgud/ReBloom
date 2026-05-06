import argparse
import io
import stat
import subprocess
import sys
import tempfile
import unittest
import wave
import array
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import voice_chat


class VoiceChatSttTests(unittest.TestCase):
    def setUp(self):
        voice_chat._START_SOUND_WARNING_SHOWN = False

    def test_record_wav_invokes_arecord_with_expected_options(self):
        output_path = Path("/tmp/user.wav")
        completed = subprocess.CompletedProcess(args=[], returncode=0, stdout="", stderr="")

        with mock.patch.object(voice_chat, "require_command") as require_command:
            with mock.patch.object(voice_chat.subprocess, "run", return_value=completed) as run:
                voice_chat.record_wav(output_path, seconds=3, device="plughw:3,0")

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
                "plughw:3,0",
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
                with self.assertRaisesRegex(RuntimeError, "--audio-device plughw:3,0"):
                    voice_chat.record_wav(Path("/tmp/user.wav"), seconds=1, device="")

    def test_record_wav_until_silence_writes_detected_audio(self):
        speech = self._pcm_chunk(1000)
        silence = self._pcm_chunk(0)
        fake_process = self._fake_arecord_process([speech, speech, silence, silence])

        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "user.wav"
            with mock.patch.object(voice_chat, "require_command") as require_command:
                with mock.patch.object(voice_chat.subprocess, "Popen", return_value=fake_process) as popen:
                    speech_detected = voice_chat.record_wav_until_silence(
                        output_path,
                        device="plughw:3,0",
                        max_seconds=5,
                        silence_seconds=0.2,
                        start_timeout=1,
                        speech_threshold=500,
                    )

            self.assertTrue(speech_detected)
            with wave.open(str(output_path), "rb") as wav_file:
                self.assertEqual(wav_file.getnchannels(), 1)
                self.assertEqual(wav_file.getframerate(), 16000)
                self.assertGreater(wav_file.getnframes(), 0)

        require_command.assert_called_once_with("arecord")
        command = popen.call_args.args[0]
        self.assertIn("-t", command)
        self.assertIn("raw", command)
        self.assertIn("plughw:3,0", command)
        self.assertTrue(fake_process.terminated)

    def test_record_wav_until_silence_returns_false_without_speech(self):
        silence = self._pcm_chunk(0)
        fake_process = self._fake_arecord_process([silence, silence, silence])

        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "user.wav"
            with mock.patch.object(voice_chat, "require_command"):
                with mock.patch.object(voice_chat.subprocess, "Popen", return_value=fake_process):
                    speech_detected = voice_chat.record_wav_until_silence(
                        output_path,
                        device="",
                        max_seconds=1,
                        silence_seconds=0.2,
                        start_timeout=0.2,
                        speech_threshold=500,
                    )

            self.assertFalse(speech_detected)
            self.assertFalse(output_path.exists())

    def test_clean_transcript_removes_whisper_artifacts(self):
        text = voice_chat.clean_transcript("  [음악]  <|ko|> 안녕하세요   테스트입니다.  ")

        self.assertEqual(text, "안녕하세요 테스트입니다.")

    def test_is_meaningful_transcript_filters_common_silence_hallucination(self):
        self.assertFalse(voice_chat.is_meaningful_transcript("시청해 주셔서 감사합니다."))
        self.assertTrue(voice_chat.is_meaningful_transcript("불 켜줘"))

    def test_clean_spoken_answer_removes_markdown_for_tts(self):
        answer = voice_chat.clean_spoken_answer("**좋아요.**\n- `조명`을 켤게요.")

        self.assertEqual(answer, "좋아요. 조명을 켤게요.")

    def test_load_env_file_sets_missing_values_only(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            env_path = Path(temp_dir) / ".env"
            env_path.write_text(
                "\n".join(
                    [
                        "REBLOOM_SESSION_EVENTS_URL=http://192.168.0.2:8084/api/v1/conversations/sessions/analysis",
                        "REBLOOM_DEVICE_ID='rebloom-rpi5-test'",
                        "# comment",
                        "IGNORED_LINE",
                    ]
                ),
                encoding="utf-8",
            )

            with mock.patch.dict(
                voice_chat.os.environ,
                {"REBLOOM_SESSION_EVENTS_URL": "http://existing.test"},
                clear=True,
            ):
                voice_chat.load_env_file(env_path)

                self.assertEqual(voice_chat.os.environ["REBLOOM_SESSION_EVENTS_URL"], "http://existing.test")
                self.assertEqual(voice_chat.os.environ["REBLOOM_DEVICE_ID"], "rebloom-rpi5-test")

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
                threads=4,
                fast=True,
            )

        self.assertEqual(text, "안녕하세요 테스트입니다")

    def test_transcribe_whisper_cpp_passes_thread_and_fast_options(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            wav_path = temp_path / "user.wav"
            wav_path.write_bytes(b"fake wav data")
            model_path = temp_path / "ggml-base.bin"
            model_path.write_bytes(b"fake model")
            txt_path = temp_path / "user.txt"

            def fake_run(command, check):
                txt_path.write_text("빠른 테스트", encoding="utf-8")
                return subprocess.CompletedProcess(command, 0)

            with mock.patch.object(voice_chat, "require_command"):
                with mock.patch.object(voice_chat.subprocess, "run", side_effect=fake_run) as run:
                    text = voice_chat.transcribe_whisper_cpp(
                        wav_path,
                        "whisper-cli",
                        str(model_path),
                        "ko",
                        threads=6,
                        fast=True,
                    )

        command = run.call_args.args[0]
        self.assertEqual(text, "빠른 테스트")
        self.assertEqual(command[command.index("-t") + 1], "6")
        self.assertIn("--no-timestamps", command)
        self.assertEqual(command[command.index("--beam-size") + 1], "1")
        self.assertEqual(command[command.index("--best-of") + 1], "1")

    def test_transcribe_whisper_cpp_requires_model_path(self):
        with self.assertRaisesRegex(RuntimeError, "모델 경로"):
            voice_chat.transcribe_whisper_cpp(Path("/tmp/user.wav"), "whisper-cli", "", "ko")

    def test_play_start_sound_auto_prefers_ffplay(self):
        args = argparse.Namespace(
            start_sound="on",
            start_sound_player="auto",
            aplay_bin="aplay",
            start_sound_device="",
        )
        completed = subprocess.CompletedProcess(args=[], returncode=0, stdout="", stderr="")

        with mock.patch.object(voice_chat, "has_command", return_value=True) as has_command:
            with mock.patch.object(voice_chat.subprocess, "run", return_value=completed) as run:
                voice_chat.play_start_sound(args)

        has_command.assert_called_once_with("ffplay")
        command = run.call_args.args[0]
        self.assertEqual(command[:5], ["ffplay", "-nodisp", "-autoexit", "-loglevel", "error"])
        self.assertTrue(Path(command[5]).name.endswith(".wav"))

    def test_play_start_sound_uses_configured_output_device(self):
        args = argparse.Namespace(
            start_sound="on",
            start_sound_player="aplay",
            aplay_bin="aplay",
            start_sound_device="plughw:3,0",
        )
        completed = subprocess.CompletedProcess(args=[], returncode=0, stdout="", stderr="")

        with mock.patch.object(voice_chat, "has_command", return_value=True):
            with mock.patch.object(voice_chat.subprocess, "run", return_value=completed) as run:
                voice_chat.play_start_sound(args)

        command = run.call_args.args[0]
        self.assertEqual(command[:4], ["aplay", "-q", "-D", "plughw:3,0"])

    def test_play_start_sound_can_be_disabled(self):
        args = argparse.Namespace(start_sound="off", start_sound_player="auto", aplay_bin="aplay", start_sound_device="")

        with mock.patch.object(voice_chat, "has_command") as has_command:
            with mock.patch.object(voice_chat.subprocess, "run") as run:
                voice_chat.play_start_sound(args)

        has_command.assert_not_called()
        run.assert_not_called()

    def test_play_start_sound_does_not_raise_when_aplay_fails(self):
        args = argparse.Namespace(
            start_sound="on",
            start_sound_player="aplay",
            aplay_bin="aplay",
            start_sound_device="",
        )
        failed = subprocess.CompletedProcess(args=[], returncode=1, stdout="", stderr="audio open error")

        with mock.patch.object(voice_chat, "has_command", return_value=True):
            with mock.patch.object(voice_chat.subprocess, "run", return_value=failed):
                with mock.patch("sys.stderr", new_callable=io.StringIO):
                    voice_chat.play_start_sound(args)

    def test_play_start_sound_warns_only_once_when_aplay_fails(self):
        args = argparse.Namespace(
            start_sound="on",
            start_sound_player="aplay",
            aplay_bin="aplay",
            start_sound_device="",
        )
        failed = subprocess.CompletedProcess(args=[], returncode=1, stdout="", stderr="audio open error")

        with mock.patch.object(voice_chat, "has_command", return_value=True):
            with mock.patch.object(voice_chat.subprocess, "run", return_value=failed):
                with mock.patch("sys.stderr", new_callable=io.StringIO) as stderr:
                    voice_chat.play_start_sound(args)
                    voice_chat.play_start_sound(args)

        self.assertEqual(stderr.getvalue().count("시작 알림음 재생을 건너뜁니다"), 1)

    def test_listen_once_plays_start_sound_before_recording(self):
        args = argparse.Namespace(
            stt_only=False,
            listen_mode="fixed",
            record_seconds=5,
            audio_device="plughw:3,0",
            whisper_bin="whisper-cli",
            whisper_model="/models/ggml-base.bin",
            language="ko",
            whisper_threads=4,
            whisper_fast=False,
        )

        with mock.patch.object(voice_chat, "play_start_sound") as play_start_sound:
            with mock.patch.object(voice_chat, "record_wav") as record_wav:
                with mock.patch.object(voice_chat, "transcribe_whisper_cpp", return_value="안녕하세요"):
                    text = voice_chat.listen_once(args)

        self.assertEqual(text, "안녕하세요")
        play_start_sound.assert_called_once_with(args)
        record_wav.assert_called_once()

    def test_listen_once_skips_stt_when_vad_detects_no_speech(self):
        args = argparse.Namespace(
            stt_only=False,
            listen_mode="vad",
            audio_device="plughw:3,0",
            max_record_seconds=5,
            silence_seconds=0.8,
            start_timeout=1,
            speech_threshold=500,
            whisper_bin="whisper-cli",
            whisper_model="/models/ggml-base.bin",
            language="ko",
            whisper_threads=4,
            whisper_fast=False,
        )

        with mock.patch.object(voice_chat, "play_start_sound"):
            with mock.patch.object(voice_chat, "record_wav_until_silence", return_value=False):
                with mock.patch.object(voice_chat, "transcribe_whisper_cpp") as transcribe_whisper_cpp:
                    text = voice_chat.listen_once(args)

        self.assertEqual(text, "")
        transcribe_whisper_cpp.assert_not_called()

    def test_speak_auto_prefers_edge_when_available(self):
        args = self._tts_args(tts="auto", piper_model="/models/ko.onnx")

        with mock.patch.object(voice_chat, "has_python_module", return_value=True):
            with mock.patch.object(voice_chat, "has_command", return_value=True):
                with mock.patch.object(voice_chat, "speak_edge") as speak_edge:
                    with mock.patch.object(voice_chat, "speak_piper") as speak_piper:
                        voice_chat.speak("안녕하세요", args)

        speak_edge.assert_called_once_with(
            "안녕하세요",
            "ko-KR-SunHiNeural",
            "+0%",
            "+0%",
            "mpg123",
            "",
            "",
        )
        speak_piper.assert_not_called()

    def test_speak_auto_falls_back_to_piper_when_edge_is_unavailable(self):
        args = self._tts_args(tts="auto", piper_model="/models/ko.onnx")

        with mock.patch.object(voice_chat, "has_python_module", return_value=False):
            with mock.patch.object(voice_chat, "has_command", return_value=True):
                with mock.patch.object(voice_chat, "speak_edge") as speak_edge:
                    with mock.patch.object(voice_chat, "speak_piper") as speak_piper:
                        with mock.patch.object(voice_chat, "speak_espeak") as speak_espeak:
                            voice_chat.speak("안녕하세요", args)

        speak_edge.assert_not_called()
        speak_piper.assert_called_once_with("안녕하세요", "piper", "/models/ko.onnx", "aplay")
        speak_espeak.assert_not_called()

    def test_speak_edge_generates_mp3_and_plays_it(self):
        args = self._tts_args(tts="edge")

        async def fake_save(text, output_path, voice, rate, volume):
            output_path.write_bytes(b"fake mp3")

        with mock.patch.object(voice_chat, "require_command") as require_command:
            with mock.patch.object(voice_chat, "save_edge_tts_mp3", side_effect=fake_save) as save_edge_tts_mp3:
                with mock.patch.object(voice_chat.subprocess, "run") as run:
                    voice_chat.speak("안녕하세요", args)

        require_command.assert_any_call("mpg123")
        save_edge_tts_mp3.assert_called_once()
        self.assertEqual(save_edge_tts_mp3.call_args.args[0], "안녕하세요")
        self.assertEqual(save_edge_tts_mp3.call_args.args[2:], ("ko-KR-SunHiNeural", "+0%", "+0%"))
        play_command = run.call_args.args[0]
        self.assertEqual(play_command[0], "mpg123")
        self.assertEqual(play_command[1], "-q")

    def test_speak_edge_can_save_mp3_without_playing(self):
        args = self._tts_args(tts="edge")

        async def fake_save(text, output_path, voice, rate, volume):
            output_path.write_bytes(b"fake mp3")

        with tempfile.TemporaryDirectory() as temp_dir:
            args.tts_output_file = str(Path(temp_dir) / "answer.mp3")
            with mock.patch.object(voice_chat, "require_command") as require_command:
                with mock.patch.object(voice_chat, "save_edge_tts_mp3", side_effect=fake_save):
                    with mock.patch.object(voice_chat.subprocess, "run") as run:
                        voice_chat.speak("안녕하세요", args)

        require_command.assert_not_called()
        run.assert_not_called()

    def test_speak_explicit_piper_uses_piper(self):
        args = self._tts_args(tts="piper", piper_model="/models/ko.onnx")

        with mock.patch.object(voice_chat, "has_command", return_value=True):
            with mock.patch.object(voice_chat, "speak_piper") as speak_piper:
                with mock.patch.object(voice_chat, "speak_espeak") as speak_espeak:
                    voice_chat.speak("안녕하세요", args)

        speak_piper.assert_called_once_with("안녕하세요", "piper", "/models/ko.onnx", "aplay")
        speak_espeak.assert_not_called()

    def test_speak_auto_falls_back_to_espeak_without_piper_model(self):
        args = self._tts_args(tts="auto", piper_model="")

        with mock.patch.object(voice_chat, "has_python_module", return_value=False):
            with mock.patch.object(voice_chat, "has_command", return_value=True):
                with mock.patch.object(voice_chat, "speak_piper") as speak_piper:
                    with mock.patch.object(voice_chat, "speak_espeak") as speak_espeak:
                        voice_chat.speak("안녕하세요", args)

        speak_piper.assert_not_called()
        speak_espeak.assert_called_once_with("안녕하세요", "ko")

    def test_speak_none_does_not_call_tts_engine(self):
        args = self._tts_args(tts="none")

        with mock.patch.object(voice_chat, "speak_piper") as speak_piper:
            with mock.patch.object(voice_chat, "speak_espeak") as speak_espeak:
                voice_chat.speak("안녕하세요", args)

        speak_piper.assert_not_called()
        speak_espeak.assert_not_called()

    @staticmethod
    def _tts_args(tts, piper_model=""):
        return argparse.Namespace(
            tts=tts,
            edge_voice="ko-KR-SunHiNeural",
            edge_rate="+0%",
            edge_volume="+0%",
            mp3_player="mpg123",
            mp3_player_args="",
            tts_output_file="",
            espeak_voice="ko",
            piper_bin="piper",
            piper_model=piper_model,
            aplay_bin="aplay",
        )

    @staticmethod
    def _pcm_chunk(value, sample_count=1600):
        samples = array.array("h", [value] * sample_count)
        if sys.byteorder != "little":
            samples.byteswap()
        return samples.tobytes()

    @staticmethod
    def _fake_arecord_process(chunks):
        class FakeStdout:
            def __init__(self, chunks):
                self._chunks = list(chunks)

            def read(self, size):
                if not self._chunks:
                    return b""
                return self._chunks.pop(0)

        class FakeProcess:
            def __init__(self, chunks):
                self.stdout = FakeStdout(chunks)
                self.stderr = io.BytesIO()
                self.terminated = False

            def terminate(self):
                self.terminated = True

            def wait(self, timeout=None):
                return 0

            def kill(self):
                self.terminated = True

        return FakeProcess(chunks)

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
