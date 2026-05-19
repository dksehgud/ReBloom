import json
import logging
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from types import SimpleNamespace


ROOT_DIR = Path(__file__).resolve().parents[1]
BLE_DIR = ROOT_DIR / "ble_provisioning"
SERVERCHATTING_DIR = ROOT_DIR / "serverchatting"
SERVERCHATTING_ENV = SERVERCHATTING_DIR / ".env"
LLM_DIR = ROOT_DIR / "LLM"

DEFAULT_WIFI_WAIT_SECONDS = 30.0
DEFAULT_WIFI_POLL_SECONDS = 2.0
DEFAULT_WIFI_MONITOR_SECONDS = 5.0
DEFAULT_WIFI_LOST_GRACE_SECONDS = 15.0
DEFAULT_AUDIO_WAIT_SECONDS = 15.0
SERVER_RESTART_SECONDS = 5.0
REGISTRATION_TIMEOUT_SECONDS = 5.0

NO_WIFI_PROMPT = "네트워크 연결이 안되어 있어요. 앱에서 연결 연동을 해주세요."
READY_PROMPT = "만나서 반가워요. 블루밍이 이야기 할 준비가 되어 있어요."
DEFAULT_NO_WIFI_TTS_FILE = SERVERCHATTING_DIR / "music" / "no_wifi_prompt_edge.mp3"

# TODO: main server device registration endpoint. Replace/uncomment when API is ready.
# DEFAULT_DEVICE_REGISTRATION_URL = "https://main.example.com/api/v1/devices/register"
DEFAULT_DEVICE_REGISTRATION_URL = ""

logger = logging.getLogger(__name__)
_stop_requested = False
_server_process: subprocess.Popen | None = None


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def setup_logging() -> None:
    logging.basicConfig(
        level=os.getenv("BOOT_LOG_LEVEL", "INFO").strip().upper(),
        format="%(asctime)s [%(levelname)s] %(message)s",
    )


def install_signal_handlers() -> None:
    def _handle_signal(_signum, _frame):
        request_stop()

    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)


def request_stop() -> None:
    global _stop_requested
    _stop_requested = True
    stop_server_process()


def stop_server_process() -> None:
    global _server_process
    process = _server_process
    if process is None or process.poll() is not None:
        return
    logger.info("[Boot] serverchatting 종료 요청")
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def import_boot_dependencies():
    system_dist_packages = Path("/usr/lib/python3/dist-packages")
    if system_dist_packages.exists() and str(system_dist_packages) not in sys.path:
        sys.path.append(str(system_dist_packages))

    if str(BLE_DIR) not in sys.path:
        sys.path.insert(0, str(BLE_DIR))
    if str(LLM_DIR) not in sys.path:
        sys.path.insert(0, str(LLM_DIR))

    from wifi_manager import get_connected_ssid, is_wifi_connected
    from etc import voice_runtime

    return get_connected_ssid, is_wifi_connected, voice_runtime


def env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    return float(value)


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def build_tts_args(tts_engine: str | None = None) -> SimpleNamespace:
    return SimpleNamespace(
        tts=tts_engine or os.getenv("TTS_ENGINE", "auto").strip(),
        edge_voice=os.getenv("EDGE_VOICE", "ko-KR-SunHiNeural").strip(),
        edge_rate=os.getenv("EDGE_RATE", "+0%").strip(),
        edge_volume=os.getenv("EDGE_VOLUME", "+0%").strip(),
        edge_pitch=os.getenv("EDGE_PITCH", "+0Hz").strip(),
        edge_emotion_auto=env_bool("EDGE_EMOTION_AUTO", True),
        elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY", "").strip(),
        elevenlabs_voice_id=os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb").strip(),
        elevenlabs_model_id=os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2").strip(),
        elevenlabs_output_format=os.getenv("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128").strip(),
        elevenlabs_timeout_seconds=env_float("ELEVENLABS_TIMEOUT_SECONDS", 30.0),
        elevenlabs_stability=env_float("ELEVENLABS_STABILITY", 0.45),
        elevenlabs_similarity_boost=env_float("ELEVENLABS_SIMILARITY_BOOST", 0.8),
        elevenlabs_style=env_float("ELEVENLABS_STYLE", 0.25),
        elevenlabs_use_speaker_boost=env_bool("ELEVENLABS_USE_SPEAKER_BOOST", True),
        elevenlabs_speed=env_float("ELEVENLABS_SPEED", 0.95),
        mp3_player=os.getenv("MP3_PLAYER", "mpg123").strip(),
        mp3_player_args=os.getenv("MP3_PLAYER_ARGS", "").strip(),
        tts_output_file="",
        espeak_voice=os.getenv("ESPEAK_VOICE", "ko").strip(),
        piper_bin=os.getenv("PIPER_BIN", "piper").strip(),
        piper_model=os.getenv("PIPER_MODEL", "").strip(),
        aplay_bin=os.getenv("APLAY_BIN", "aplay").strip(),
        hf_tts_model=os.getenv("HF_TTS_MODEL", "myshell-ai/MeloTTS-Korean").strip(),
        hf_tts_device=os.getenv("HF_TTS_DEVICE", "cpu").strip(),
        hf_tts_torch_dtype=os.getenv("HF_TTS_TORCH_DTYPE", "auto").strip(),
        melotts_language=os.getenv("MELOTTS_LANGUAGE", "KR").strip(),
        melotts_speaker=os.getenv("MELOTTS_SPEAKER", "KR").strip(),
        melotts_speed=env_float("MELOTTS_SPEED", 1.0),
    )


def no_wifi_tts_file() -> Path:
    path = os.getenv("NO_WIFI_TTS_FILE", "").strip()
    if path:
        return Path(path).expanduser()
    return DEFAULT_NO_WIFI_TTS_FILE


def ensure_no_wifi_prompt_cache(voice_runtime) -> bool:
    mp3_path = no_wifi_tts_file()
    if mp3_path.exists() and mp3_path.stat().st_size > 0:
        return True

    try:
        mp3_path.parent.mkdir(parents=True, exist_ok=True)
        args = build_tts_args("edge")
        args.tts_output_file = str(mp3_path)
        voice_runtime.speak(NO_WIFI_PROMPT, args)
        logger.info("[Boot] BLE 프로비저닝 안내 음성 캐시 생성: %s", mp3_path)
        return True
    except Exception as exc:
        logger.warning("[Boot] BLE 프로비저닝 안내 음성 캐시 생성 실패: %s", exc)
        return False


def play_cached_no_wifi_prompt(voice_runtime) -> bool:
    mp3_path = no_wifi_tts_file()
    if not mp3_path.exists() or mp3_path.stat().st_size <= 0:
        logger.warning("[Boot] BLE 프로비저닝 안내 음성 캐시 없음: %s", mp3_path)
        return False

    if os.getenv("BOOT_TTS_ENABLED", "true").strip().lower() in {"0", "false", "no", "off"}:
        logger.info("[Boot] 안내 음성 비활성화: %s", NO_WIFI_PROMPT)
        return True

    if not wait_for_audio_output(voice_runtime):
        logger.warning("[Boot] 오디오 출력 장치가 없어 안내 음성을 건너뜁니다.")
        return False

    try:
        voice_runtime.play_mp3(
            mp3_path,
            os.getenv("MP3_PLAYER", "mpg123").strip(),
            os.getenv("MP3_PLAYER_ARGS", "").strip(),
        )
        return True
    except Exception as exc:
        logger.warning("[Boot] BLE 프로비저닝 안내 음성 캐시 재생 실패: %s", exc)
        return False


def speak_prompt(voice_runtime, text: str, prefer_offline: bool = False, **overrides) -> None:
    if os.getenv("BOOT_TTS_ENABLED", "true").strip().lower() in {"0", "false", "no", "off"}:
        logger.info("[Boot] 안내 음성 비활성화: %s", text)
        return

    if not wait_for_audio_output(voice_runtime):
        logger.warning("[Boot] 오디오 출력 장치가 없어 안내 음성을 건너뜁니다.")
        return

    engine_candidates = []
    if prefer_offline:
        if os.getenv("PIPER_MODEL", "").strip():
            engine_candidates.append("piper")
        engine_candidates.append("espeak")
    else:
        engine_candidates.append(os.getenv("TTS_ENGINE", "auto").strip())
        engine_candidates.append("espeak")

    for engine in engine_candidates:
        try:
            args = build_tts_args(engine)
            for key, value in overrides.items():
                setattr(args, key, value)
            voice_runtime.speak(text, args)
            return
        except Exception as exc:
            logger.warning("[Boot] 안내 음성 실패: engine=%s error=%s", engine, exc)


def wait_for_audio_output(voice_runtime) -> bool:
    wait_seconds = env_float("BOOT_AUDIO_WAIT_SECONDS", DEFAULT_AUDIO_WAIT_SECONDS)
    deadline = time.monotonic() + max(0.0, wait_seconds)
    warned = False

    while not _stop_requested:
        if voice_runtime.pipewire_sink_available():
            logger.info("[Boot] PipeWire 오디오 출력 장치 확인")
            return True
        selected = voice_runtime.choose_alsa_device("aplay")
        fallback_devices = voice_runtime.playback_devices_from_dev_snd()
        if selected or fallback_devices:
            selected = selected or fallback_devices[0]
            logger.info("[Boot] 오디오 출력 장치 확인: %s", selected)
            return True
        if time.monotonic() >= deadline:
            logger.warning("[Boot] 오디오 출력 장치를 찾지 못했습니다.")
            return False
        if not warned:
            logger.info("[Boot] 오디오 출력 장치 대기 중")
            warned = True
        time.sleep(1.0)
    return False


def wait_for_wifi(is_wifi_connected) -> bool:
    wait_seconds = env_float("BOOT_WIFI_WAIT_SECONDS", DEFAULT_WIFI_WAIT_SECONDS)
    poll_seconds = env_float("BOOT_WIFI_POLL_SECONDS", DEFAULT_WIFI_POLL_SECONDS)
    deadline = time.monotonic() + max(0.0, wait_seconds)

    while not _stop_requested:
        if is_wifi_connected():
            return True
        if time.monotonic() >= deadline:
            return False
        time.sleep(max(0.5, poll_seconds))
    return False


def run_ble_until_wifi(is_wifi_connected, voice_runtime=None, repeat_prompt_seconds: float = 40.0) -> bool:
    last_prompt_at = time.monotonic()

    while not _stop_requested and not is_wifi_connected():
        logger.info("[Boot] BLE 프로비저닝 시작")
        command = [str(server_python()), str(BLE_DIR / "main.py")]
        process = subprocess.Popen(command, cwd=str(BLE_DIR), env=ble_subprocess_env())
        while not _stop_requested:
            return_code = process.poll()
            if return_code is not None:
                if return_code != 0:
                    logger.warning("[Boot] BLE 프로비저닝 프로세스 종료: code=%s", return_code)
                break
            if is_wifi_connected():
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                return True
            if voice_runtime and time.monotonic() - last_prompt_at >= repeat_prompt_seconds:
                if not play_cached_no_wifi_prompt(voice_runtime):
                    speak_prompt(voice_runtime, NO_WIFI_PROMPT, prefer_offline=True)
                last_prompt_at = time.monotonic()
            time.sleep(1)

        if _stop_requested and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            return False

        if is_wifi_connected():
            return True
        logger.warning("[Boot] BLE 서버가 종료됐지만 Wi-Fi가 아직 연결되지 않았습니다. 재시작합니다.")
        time.sleep(2)
    return is_wifi_connected()


def ble_subprocess_env() -> dict[str, str]:
    env = os.environ.copy()
    system_dist_packages = "/usr/lib/python3/dist-packages"
    existing_pythonpath = env.get("PYTHONPATH", "")
    paths = [path for path in existing_pythonpath.split(os.pathsep) if path]
    if system_dist_packages not in paths:
        paths.insert(0, system_dist_packages)
    env["PYTHONPATH"] = os.pathsep.join(paths)
    return env


def get_device_serial() -> str:
    candidates = [
        Path("/proc/device-tree/serial-number"),
        Path("/sys/firmware/devicetree/base/serial-number"),
    ]
    for path in candidates:
        try:
            value = path.read_text(encoding="utf-8", errors="ignore").strip("\x00\n ")
        except OSError:
            continue
        if value:
            return value

    try:
        for line in Path("/proc/cpuinfo").read_text(encoding="utf-8", errors="ignore").splitlines():
            if line.lower().startswith("serial"):
                _, value = line.split(":", 1)
                value = value.strip()
                if value:
                    return value
    except OSError:
        pass

    return socket.gethostname()


def register_device_after_provisioning(ssid: str | None) -> None:
    registration_url = os.getenv("DEVICE_REGISTRATION_URL", DEFAULT_DEVICE_REGISTRATION_URL).strip()
    if not registration_url:
        logger.info("[Boot] DEVICE_REGISTRATION_URL 미설정, 시리얼 번호 API 전송 스킵")
        return

    payload = {
        "serial_number": get_device_serial(),
        "device_id": os.getenv("DEVICE_ID", "").strip(),
        "ssid": ssid,
    }
    request = urllib.request.Request(
        registration_url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=REGISTRATION_TIMEOUT_SECONDS) as response:
            logger.info("[Boot] 기기 시리얼 전송 완료: status=%s", response.status)
    except urllib.error.URLError as exc:
        logger.warning("[Boot] 기기 시리얼 전송 실패: %s", exc)


def server_python() -> Path:
    venv_python = SERVERCHATTING_DIR / ".venv" / "bin" / "python"
    if venv_python.exists():
        return venv_python
    return Path(sys.executable)


def run_serverchatting_until_wifi_lost(is_wifi_connected) -> int:
    global _server_process
    command = [str(server_python()), "-m", "rpi_client.main"]
    poll_seconds = env_float("BOOT_WIFI_MONITOR_SECONDS", DEFAULT_WIFI_MONITOR_SECONDS)
    lost_grace_seconds = env_float("BOOT_WIFI_LOST_GRACE_SECONDS", DEFAULT_WIFI_LOST_GRACE_SECONDS)

    while not _stop_requested:
        disconnected_since = None
        logger.info("[Boot] serverchatting 시작: %s", " ".join(command))
        _server_process = subprocess.Popen(command, cwd=str(SERVERCHATTING_DIR))

        while not _stop_requested:
            return_code = _server_process.poll()
            if return_code is not None:
                logger.warning(
                    "[Boot] serverchatting 종료됨: code=%s, %.1f초 후 재시작",
                    return_code,
                    SERVER_RESTART_SECONDS,
                )
                time.sleep(SERVER_RESTART_SECONDS)
                break

            if is_wifi_connected():
                disconnected_since = None
            else:
                now = time.monotonic()
                if disconnected_since is None:
                    disconnected_since = now
                    logger.warning("[Boot] Wi-Fi 연결 끊김 감지, 복구 대기 시작")
                elif now - disconnected_since >= lost_grace_seconds:
                    logger.warning("[Boot] Wi-Fi 연결 끊김 확정")
                    logger.warning("[Boot] Wi-Fi 미연결 상태로 전환, serverchatting 중지")
                    stop_server_process()
                    return 100

            time.sleep(max(1.0, poll_seconds))
        else:
            continue

        if _stop_requested:
            break
        continue

    stop_server_process()
    return 0


def main() -> int:
    load_env_file(SERVERCHATTING_ENV)
    setup_logging()
    install_signal_handlers()
    get_connected_ssid, is_wifi_connected, voice_runtime = import_boot_dependencies()

    logger.info("=" * 50)
    logger.info("[Boot] Re:Bloom 스마트 스피커 부팅 관리자 시작")
    logger.info("=" * 50)

    while not _stop_requested:
        provisioned_in_this_cycle = False
        if not wait_for_wifi(is_wifi_connected):
            logger.info("[Boot] Wi-Fi 미연결, BLE 프로비저닝 모드 진입")
            if not play_cached_no_wifi_prompt(voice_runtime):
                speak_prompt(voice_runtime, NO_WIFI_PROMPT, prefer_offline=True)
            if not run_ble_until_wifi(is_wifi_connected, voice_runtime=voice_runtime):
                logger.error("[Boot] Wi-Fi 연결 없이 종료")
                return 1
            provisioned_in_this_cycle = True

        ssid = get_connected_ssid()
        logger.info("[Boot] Wi-Fi 연결 확인: ssid=%s", ssid or "unknown")
        ensure_no_wifi_prompt_cache(voice_runtime)
        if provisioned_in_this_cycle:
            register_device_after_provisioning(ssid)

        speak_prompt(
            voice_runtime,
            READY_PROMPT,
            prefer_offline=False,
            elevenlabs_stability=0.45,
            elevenlabs_style=0.30,
            elevenlabs_speed=0.87,
        )
        result = run_serverchatting_until_wifi_lost(is_wifi_connected)
        if result != 100:
            return result

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
