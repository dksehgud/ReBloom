import argparse
import io
import subprocess
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

import wake_openwakeword


class WakeOpenWakeWordTests(unittest.TestCase):
    def test_no_recognized_speech_returns_to_wake_wait(self):
        args = argparse.Namespace(
            audio_device="auto",
            model_paths=[],
            python_bin=sys.executable,
            output_device="",
            aplay_bin="aplay",
            ack_sound="off",
            debug=False,
            threshold=0.5,
            rearm_seconds=2,
            no_speech_suppress_seconds=15,
        )
        frame = b"\0" * wake_openwakeword.FRAME_BYTES
        fake_process = _FakeProcess(frame)
        fake_model = mock.Mock()
        fake_model.predict.return_value = {"hey_blooming": 0.9}
        no_speech = subprocess.CompletedProcess(args=[], returncode=wake_openwakeword.NO_RECOGNIZED_SPEECH_EXIT_CODE)

        with mock.patch.object(wake_openwakeword, "require_command"):
            with mock.patch.object(wake_openwakeword, "resolve_audio_device", return_value="plughw:3,0"):
                with mock.patch.object(wake_openwakeword, "load_model", return_value=fake_model):
                    with mock.patch.object(wake_openwakeword, "play_wake_ack"):
                        with mock.patch.object(wake_openwakeword.subprocess, "run", return_value=no_speech):
                            with mock.patch.object(wake_openwakeword.time, "sleep") as sleep:
                                with mock.patch.object(
                                    wake_openwakeword.subprocess,
                                    "Popen",
                                    side_effect=[fake_process, KeyboardInterrupt],
                                ) as popen:
                                    with self.assertRaises(KeyboardInterrupt):
                                        wake_openwakeword.run_detector(args, [])

        self.assertEqual(popen.call_count, 2)
        fake_model.reset.assert_called_once_with()
        sleep.assert_called_once_with(2)

    def test_no_recognized_speech_suppresses_same_wake_name_temporarily(self):
        args = argparse.Namespace(
            audio_device="auto",
            model_paths=[],
            python_bin=sys.executable,
            output_device="",
            aplay_bin="aplay",
            ack_sound="off",
            debug=False,
            threshold=0.5,
            rearm_seconds=0,
            no_speech_suppress_seconds=15,
        )
        frame = b"\0" * wake_openwakeword.FRAME_BYTES
        fake_model = mock.Mock()
        fake_model.predict.side_effect = [
            {"alexa": 0.9},
            {"alexa": 0.9},
            KeyboardInterrupt,
        ]
        no_speech = subprocess.CompletedProcess(args=[], returncode=wake_openwakeword.NO_RECOGNIZED_SPEECH_EXIT_CODE)

        with mock.patch.object(wake_openwakeword, "require_command"):
            with mock.patch.object(wake_openwakeword, "resolve_audio_device", return_value="plughw:3,0"):
                with mock.patch.object(wake_openwakeword, "load_model", return_value=fake_model):
                    with mock.patch.object(wake_openwakeword, "play_wake_ack"):
                        with mock.patch.object(wake_openwakeword.subprocess, "run", return_value=no_speech) as run:
                            with mock.patch.object(wake_openwakeword.time, "monotonic", side_effect=[100.0, 100.0, 104.0]):
                                with mock.patch.object(
                                    wake_openwakeword.subprocess,
                                    "Popen",
                                    side_effect=[_FakeProcess(frame), _FakeProcess(frame + frame)],
                                ):
                                    with self.assertRaises(KeyboardInterrupt):
                                        wake_openwakeword.run_detector(args, [])

        run.assert_called_once()


class _FakeProcess:
    def __init__(self, frame):
        self.stdout = io.BytesIO(frame)
        self.stderr = io.BytesIO()
        self.terminated = False

    def terminate(self):
        self.terminated = True

    def wait(self, timeout=None):
        return 0

    def kill(self):
        self.terminated = True

    def poll(self):
        return 0 if self.terminated else None


if __name__ == "__main__":
    unittest.main()
