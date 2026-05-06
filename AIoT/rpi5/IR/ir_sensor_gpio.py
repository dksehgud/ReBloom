#실행 명령어
#!/usr/bin/env python3
# python3 test_ir_sensor_gpio13.py --seconds 60

import argparse
import signal
import sys
import time


DEFAULT_PIN = 23


def load_gpiozero():
    try:
        from gpiozero import DigitalInputDevice
    except ImportError as exc:
        raise RuntimeError(
            "gpiozero가 설치되어 있지 않습니다. Raspberry Pi에서 "
            "`sudo apt install python3-gpiozero` 또는 "
            "`python3 -m pip install gpiozero`로 설치한 뒤 다시 실행하세요."
        ) from exc
    return DigitalInputDevice


def make_sensor(pin, pull_up, active_low):
    DigitalInputDevice = load_gpiozero()
    kwargs = {
        "pin": pin,
        "pull_up": pull_up,
        "bounce_time": 0.05,
    }
    if pull_up is None:
        kwargs["active_state"] = False if active_low else True
    return DigitalInputDevice(**kwargs)


def read_raw_value(sensor):
    return bool(sensor.pin.state)


def format_state(value, active_low):
    detected = not value if active_low else value
    label = "DETECTED" if detected else "CLEAR"
    raw = "HIGH" if value else "LOW"
    return label, raw


def parse_args():
    parser = argparse.ArgumentParser(
        description="Test an IR obstacle sensor connected to Raspberry Pi GPIO 13 (BCM numbering)."
    )
    parser.add_argument(
        "--pin",
        type=int,
        default=DEFAULT_PIN,
        help=f"BCM GPIO pin number. Default: {DEFAULT_PIN}",
    )
    parser.add_argument(
        "--active-low",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Most IR obstacle modules pull the signal LOW when detected. Default: true",
    )
    parser.add_argument(
        "--pull-up",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Enable the Raspberry Pi internal pull-up. Default: true, to keep disconnected inputs stable.",
    )
    parser.add_argument("--seconds", type=float, default=15, help="How long to watch the sensor. Default: 15")
    parser.add_argument("--interval", type=float, default=0.1, help="Polling interval in seconds. Default: 0.1")
    parser.add_argument(
        "--stable-count",
        type=int,
        default=3,
        help="Require this many identical readings before accepting a state change. Default: 3",
    )
    parser.add_argument(
        "--continuous",
        action="store_true",
        help="Print every accepted reading instead of only printing when the accepted sensor state changes.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    stop = False

    def handle_stop(signum, frame):
        nonlocal stop
        stop = True

    signal.signal(signal.SIGINT, handle_stop)
    signal.signal(signal.SIGTERM, handle_stop)

    try:
        sensor = make_sensor(args.pin, args.pull_up, args.active_low)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    started = time.monotonic()
    last_value = None
    candidate_value = None
    candidate_count = 0

    print(f"IR sensor test started on BCM GPIO {args.pin}. Move an object in front of the sensor.")
    print("Press Ctrl+C to stop.")

    try:
        while not stop and time.monotonic() - started < args.seconds:
            value = read_raw_value(sensor)
            if value == candidate_value:
                candidate_count += 1
            else:
                candidate_value = value
                candidate_count = 1

            if candidate_count < max(1, args.stable_count):
                time.sleep(args.interval)
                continue

            if args.continuous or value != last_value:
                label, raw = format_state(value, args.active_low)
                elapsed = time.monotonic() - started
                print(f"{elapsed:6.2f}s  {label:8s}  raw={raw}")
                last_value = value

            time.sleep(args.interval)
    finally:
        sensor.close()

    print("IR sensor test finished.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
