# Smart Speaker Boot Manager

`boot_manager.py` is the single boot-time entry point for the Re:Bloom speaker.

## Flow

1. Load `serverchatting/.env`.
2. Wait briefly for Wi-Fi to connect.
3. If Wi-Fi is still disconnected, speak an offline-friendly provisioning prompt and start BLE provisioning.
4. When BLE provisioning connects Wi-Fi, optionally send the device serial number to the main server.
5. Wait briefly for an audio output device, then speak the ready prompt.
6. Run `serverchatting` continuously and restart it if it exits unexpectedly.
7. While running, keep monitoring Wi-Fi. If Wi-Fi stays disconnected past the grace period, stop `serverchatting` and return to BLE provisioning.

## Device Registration Placeholder

The API endpoint is intentionally disabled until the main server URL is finalized.

```python
# DEFAULT_DEVICE_REGISTRATION_URL = "https://main.example.com/api/v1/devices/register"
DEFAULT_DEVICE_REGISTRATION_URL = ""
```

To enable it without editing code, add this to `serverchatting/.env`:

```env
# DEVICE_REGISTRATION_URL=https://main.example.com/api/v1/devices/register
```

Payload:

```json
{
  "serial_number": "raspberry-pi-serial",
  "device_id": "DEVICE_ID from .env",
  "ssid": "connected wifi ssid"
}
```

Useful boot/audio settings in `serverchatting/.env`:

```env
BOOT_WIFI_WAIT_SECONDS=30
BOOT_WIFI_POLL_SECONDS=2
BOOT_WIFI_MONITOR_SECONDS=5
BOOT_WIFI_LOST_GRACE_SECONDS=15
BOOT_AUDIO_WAIT_SECONDS=15
AUDIO_OUTPUT_WAIT_SECONDS=30
BOOT_TTS_ENABLED=true
```

## Install Service

This boot manager replaces the standalone BLE service and any standalone voice/chat service. Disable older services first if they are enabled.

```bash
sudo systemctl disable --now rebloom-ble.service 2>/dev/null || true
sudo systemctl disable --now rebloom-voice.service 2>/dev/null || true
```

The service runs as the `ssafy` user. To let BLE provisioning control Wi-Fi through NetworkManager from systemd, install the polkit rule:

```bash
sudo cp /home/ssafy/project/S14P31B109/AIoT/rpi5/smart_speaker/49-rebloom-networkmanager.rules /etc/polkit-1/rules.d/49-rebloom-networkmanager.rules
sudo systemctl restart polkit
```

```bash
sudo cp /home/ssafy/project/S14P31B109/AIoT/rpi5/smart_speaker/rebloom-speaker.service /etc/systemd/system/rebloom-speaker.service
sudo systemctl daemon-reload
sudo systemctl enable rebloom-speaker.service
sudo systemctl start rebloom-speaker.service
```

Check logs:

```bash
sudo journalctl -u rebloom-speaker -f
```
