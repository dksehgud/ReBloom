# BLE Provisioning

Raspberry Pi 5가 BLE GATT 서버로 동작하면서 앱에서 Wi-Fi 정보를 받아 NetworkManager로 연결하는 구조입니다.

## Flow

1. `main.py`가 시작되면 현재 Wi-Fi 연결 상태를 확인합니다.
2. 이미 Wi-Fi가 연결되어 있으면 BLE provisioning을 건너뜁니다.
3. Wi-Fi가 없으면 `ble_server.py`가 GATT 서버와 advertisement를 등록합니다.
4. 앱은 `PUBKEY` characteristic을 읽어 Raspberry Pi 공개키를 가져갑니다.
5. 앱은 자체 공개키로 공유키를 만든 뒤 Wi-Fi 정보를 AES-GCM으로 암호화합니다.
6. 앱은 암호화된 payload를 `WIFI` characteristic에 write 합니다.
7. Raspberry Pi는 payload를 복호화한 뒤 `nmcli`로 Wi-Fi 연결을 시도합니다.
8. 연결 상태는 `STATUS` characteristic notify로 앱에 전달됩니다.
9. 연결이 성공하면 BLE 루프를 종료하고 이후 정상 동작으로 넘어갑니다.
10. 앱은 성공 payload 또는 `DEVINFO` read 값으로 받은 `serialNumber`, `deviceType`을 백엔드에 등록합니다.

## GATT Structure

- Service: `0000fe10-0000-1000-8000-00805f9b34fb`
- `PUBKEY`: `0000fe11-0000-1000-8000-00805f9b34fb`
- `WIFI`: `0000fe12-0000-1000-8000-00805f9b34fb`
- `STATUS`: `0000fe13-0000-1000-8000-00805f9b34fb`
- `DEVINFO`: `0000fe14-0000-1000-8000-00805f9b34fb`

## Payload

`WIFI` characteristic payload format:

```text
app_pubkey(32B) | nonce(12B) | ciphertext+tag
```

복호화 결과 JSON 예시는 아래와 같습니다.

```json
{"ssid": "your-ssid", "password": "your-password"}
```

## Run

테스트용 수동 실행:

```bash
cd /home/ssafy/project/S14P31B109/AIoT/rpi5/ble_provisioning
source .venv/bin/activate
sudo .venv/bin/python main.py
```

권한 문제가 없다면 `STATUS` notify로 `CONNECTING`, `SUCCESS`, `FAIL` 상태를 확인할 수 있습니다.

Wi-Fi 연결 성공 시 `STATUS` notify는 기기 등록에 필요한 JSON payload를 전달합니다.

```json
{
  "status": "SUCCESS",
  "serialNumber": "0000fe10-0000-1000-8000-00805f9b34fb",
  "deviceType": "IOT",
  "device_id": "0000fe10-0000-1000-8000-00805f9b34fb",
  "name": "Re:Bloom Speaker",
  "firmware": "1.0.0"
}
```

`DEVINFO` characteristic을 read해도 같은 기기 정보를 받을 수 있습니다.
