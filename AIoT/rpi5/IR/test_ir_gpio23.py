#!/usr/bin/env python3
"""
Simple IR sensor test for Raspberry Pi BCM GPIO 23.

Run:
  python3 test_ir_gpio23.py
  python3 test_ir_gpio23.py --continuous

Most IR obstacle modules output LOW when an object is detected.
If your module works the opposite way, run with --no-active-low.
"""

import argparse
import signal
import sys
import time


DEFAULT_PIN = 23


def parse_args():
    parser = argparse.ArgumentParser(description="Test an IR sensor connected to BCM GPIO 23.")
    parser.add_argument("--pin", type=int, default=DEFAULT_PIN, help="BCM GPIO pin number. Default: 23")
    parser.add_argument("--seconds", type=float, default=30, help="Test duration in seconds. Default: 30")
    parser.add_argument("--interval", type=float, default=0.1, help="Read interval in seconds. Default: 0.1")
    parser.add_argument(
        "--active-low",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Treat LOW as detected. Default: true",
    )
    parser.add_argument(
        "--pull-up",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Enable internal pull-up resistor. Default: true",
    )
    parser.add_argument(
        "--continuous",
        action="store_true",
        help="Print every reading instead of only state changes.",
    )
    return parser.parse_args()


def load_gpiozero():
    try:
        from gpiozero import DigitalInputDevice
    except ImportError as exc:
        raise RuntimeError(
            "gpiozero is not installed. Install it on Raspberry Pi with: "
            "sudo apt install python3-gpiozero"
        ) from exc
    return DigitalInputDevice


def is_detected(raw_value, active_low):
    return not raw_value if active_low else raw_value


def main():
    args = parse_args()
    DigitalInputDevice = load_gpiozero()
    stop = False

    def handle_stop(_signum, _frame):
        nonlocal stop
        stop = True

    signal.signal(signal.SIGINT, handle_stop)
    signal.signal(signal.SIGTERM, handle_stop)

    sensor = DigitalInputDevice(pin=args.pin, pull_up=args.pull_up, bounce_time=0.05)
    started = time.monotonic()
    last_detected = None

    print(f"IR sensor test started: BCM GPIO {args.pin}")
    print("Object detected status will be printed below. Press Ctrl+C to stop.")

    try:
        while not stop and time.monotonic() - started < args.seconds:
            raw_value = bool(sensor.pin.state)
            detected = is_detected(raw_value, args.active_low)

            if args.continuous or detected != last_detected:
                elapsed = time.monotonic() - started
                state = "DETECTED" if detected else "CLEAR"
                raw = "HIGH" if raw_value else "LOW"
                print(f"{elapsed:6.2f}s  {state:8s}  raw={raw}")
                last_detected = detected

            time.sleep(args.interval)
    finally:
        sensor.close()

    print("IR sensor test finished.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
