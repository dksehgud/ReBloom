"""
ble_server.py
─────────────
Re:Bloom BLE GATT Server (Raspberry Pi 5)

[역할]
  - BLE Peripheral(GATT Server)로 동작
  - 앱(GATT Client)으로부터 암호화된 Wi-Fi 자격증명 수신
  - nmcli를 통해 Wi-Fi 연결 수행
  - 연결 결과를 Notify Characteristic으로 앱에 전달

[GATT 서비스 구조]
  Service  : 0000FE10-0000-1000-8000-00805F9B34FB  (Re:Bloom Provisioning)
  ├─ PUBKEY    (FE11) Read   : RPi5 ECDH 공개키 32바이트
  ├─ WIFI      (FE12) Write  : 암호화된 Wi-Fi 자격증명
  ├─ STATUS    (FE13) Notify : 연결 상태 문자열
  └─ DEVINFO   (FE14) Read   : 기기 정보 JSON

[페이로드 구조 - WIFI Characteristic]
  app_pubkey(32B) | nonce(12B) | AES-GCM ciphertext+tag
"""

import json
import logging
import threading
import time

import dbus
import dbus.exceptions
import dbus.mainloop.glib
import dbus.service
from gi.repository import GLib

from crypto_utils import ECDHProvider, decrypt_wifi_payload
from wifi_manager import connect_wifi

# ─────────────────────────────────────────────
# 로깅 설정
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# UUID 상수
# ─────────────────────────────────────────────
REBLOOM_SERVICE_UUID = "0000fe10-0000-1000-8000-00805f9b34fb"
PUBKEY_CHAR_UUID     = "0000fe11-0000-1000-8000-00805f9b34fb"
WIFI_CHAR_UUID       = "0000fe12-0000-1000-8000-00805f9b34fb"
STATUS_CHAR_UUID     = "0000fe13-0000-1000-8000-00805f9b34fb"
DEVINFO_CHAR_UUID    = "0000fe14-0000-1000-8000-00805f9b34fb"

BLUEZ_SERVICE_NAME   = "org.bluez"
GATT_MANAGER_IFACE   = "org.bluez.GattManager1"
DBUS_OM_IFACE        = "org.freedesktop.DBus.ObjectManager"
DBUS_PROP_IFACE      = "org.freedesktop.DBus.Properties"
GATT_SERVICE_IFACE   = "org.bluez.GattService1"
GATT_CHRC_IFACE      = "org.bluez.GattCharacteristic1"
LE_ADVERTISING_MGR   = "org.bluez.LEAdvertisingManager1"
LE_ADVERTISEMENT     = "org.bluez.LEAdvertisement1"

# ─────────────────────────────────────────────
# 전역 상태
# ─────────────────────────────────────────────
ecdh_provider = ECDHProvider()
_status_characteristic = None  # Notify 전송용 참조
_mainloop = None


def notify_status(status: str) -> None:
    """STATUS Characteristic으로 Notify 전송."""
    global _status_characteristic
    if _status_characteristic is not None:
        try:
            _status_characteristic.PropertiesChanged(
                GATT_CHRC_IFACE,
                {"Value": dbus.Array(list(status.encode()), signature="y")},
                [],
            )
            logger.info(f"[BLE] Notify 전송: {status}")
        except Exception as e:
            logger.error(f"[BLE] Notify 실패: {e}")
    else:
        logger.warning("[BLE] STATUS characteristic 미등록 상태")


# ─────────────────────────────────────────────
# D-Bus GATT 오브젝트 베이스
# ─────────────────────────────────────────────
class InvalidArgsException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.freedesktop.DBus.Error.InvalidArgs"


class NotSupportedException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.NotSupported"


class Application(dbus.service.Object):
    """GATT Application — GattManager1에 등록할 최상위 오브젝트."""

    def __init__(self, bus):
        self.path = "/"
        self.services = []
        dbus.service.Object.__init__(self, bus, self.path)
        self.add_service(ReBlooomProvisioningService(bus, 0))

    def add_service(self, service):
        self.services.append(service)

    @dbus.service.method(DBUS_OM_IFACE, out_signature="a{oa{sa{sv}}}")
    def GetManagedObjects(self):
        response = {}
        for service in self.services:
            response[service.get_path()] = service.get_properties()
            for chrc in service.get_characteristics():
                response[chrc.get_path()] = chrc.get_properties()
        return response


class Service(dbus.service.Object):
    PATH_BASE = "/org/bluez/example/service"

    def __init__(self, bus, index, uuid, primary):
        self.path = self.PATH_BASE + str(index)
        self.bus = bus
        self.uuid = uuid
        self.primary = primary
        self.characteristics = []
        dbus.service.Object.__init__(self, bus, self.path)

    def get_properties(self):
        return {
            GATT_SERVICE_IFACE: {
                "UUID": self.uuid,
                "Primary": self.primary,
                "Characteristics": dbus.Array(
                    [c.get_path() for c in self.characteristics],
                    signature="o",
                ),
            }
        }

    def get_path(self):
        return dbus.ObjectPath(self.path)

    def add_characteristic(self, characteristic):
        self.characteristics.append(characteristic)

    def get_characteristics(self):
        return self.characteristics

    @dbus.service.method(DBUS_PROP_IFACE, in_signature="s", out_signature="a{sv}")
    def GetAll(self, interface):
        if interface != GATT_SERVICE_IFACE:
            raise InvalidArgsException()
        return self.get_properties()[GATT_SERVICE_IFACE]


class Characteristic(dbus.service.Object):
    def __init__(self, bus, index, uuid, flags, service):
        self.path = service.path + "/char" + str(index)
        self.bus = bus
        self.uuid = uuid
        self.service = service
        self.flags = flags
        self.notifying = False
        dbus.service.Object.__init__(self, bus, self.path)

    def get_properties(self):
        return {
            GATT_CHRC_IFACE: {
                "Service": self.service.get_path(),
                "UUID": self.uuid,
                "Flags": self.flags,
            }
        }

    def get_path(self):
        return dbus.ObjectPath(self.path)

    @dbus.service.method(DBUS_PROP_IFACE, in_signature="s", out_signature="a{sv}")
    def GetAll(self, interface):
        if interface != GATT_CHRC_IFACE:
            raise InvalidArgsException()
        return self.get_properties()[GATT_CHRC_IFACE]

    @dbus.service.signal(DBUS_PROP_IFACE, signature="sa{sv}as")
    def PropertiesChanged(self, interface, changed, invalidated):
        pass

    @dbus.service.method(GATT_CHRC_IFACE, in_signature="a{sv}", out_signature="ay")
    def ReadValue(self, options):
        raise NotSupportedException()

    @dbus.service.method(GATT_CHRC_IFACE, in_signature="aya{sv}")
    def WriteValue(self, value, options):
        raise NotSupportedException()

    @dbus.service.method(GATT_CHRC_IFACE)
    def StartNotify(self):
        self.notifying = True

    @dbus.service.method(GATT_CHRC_IFACE)
    def StopNotify(self):
        self.notifying = False


# ─────────────────────────────────────────────
# Re:Bloom Provisioning 서비스 구현
# ─────────────────────────────────────────────
class ReBlooomProvisioningService(Service):
    def __init__(self, bus, index):
        super().__init__(bus, index, REBLOOM_SERVICE_UUID, primary=True)
        self.add_characteristic(PublicKeyCharacteristic(bus, 0, self))
        self.add_characteristic(WiFiCredentialCharacteristic(bus, 1, self))

        status_char = StatusCharacteristic(bus, 2, self)
        self.add_characteristic(status_char)

        global _status_characteristic
        _status_characteristic = status_char

        self.add_characteristic(DeviceInfoCharacteristic(bus, 3, self))


class PublicKeyCharacteristic(Characteristic):
    """Read: RPi5의 ECDH X25519 공개키(32바이트)를 앱에 제공."""

    def __init__(self, bus, index, service):
        super().__init__(bus, index, PUBKEY_CHAR_UUID, ["read"], service)

    @dbus.service.method(GATT_CHRC_IFACE, in_signature="a{sv}", out_signature="ay")
    def ReadValue(self, options):
        pubkey = list(ecdh_provider.public_key_bytes)
        logger.info(f"[BLE] PublicKey Read: {len(pubkey)} bytes")
        return dbus.Array(pubkey, signature="y")


class WiFiCredentialCharacteristic(Characteristic):
    """Write: 앱으로부터 암호화된 Wi-Fi 자격증명 수신 후 연결 시도."""

    def __init__(self, bus, index, service):
        super().__init__(bus, index, WIFI_CHAR_UUID, ["write"], service)

    @dbus.service.method(GATT_CHRC_IFACE, in_signature="aya{sv}")
    def WriteValue(self, value, options):
        logger.info(f"[BLE] WiFiCredential Write: {len(value)} bytes")

        raw = bytes(value)

        # 백그라운드 스레드에서 Wi-Fi 연결 처리 (BLE 이벤트 루프 블로킹 방지)
        thread = threading.Thread(
            target=self._handle_wifi_connection,
            args=(raw,),
            daemon=True,
        )
        thread.start()

    def _handle_wifi_connection(self, raw: bytes) -> None:
        try:
            # 1. 앱 공개키 추출 및 ECDH 공유키 도출
            if len(raw) < 44:
                raise ValueError(f"페이로드 길이 부족: {len(raw)}")

            app_pubkey_bytes = raw[:32]
            shared_key = ecdh_provider.derive_shared_key(app_pubkey_bytes)

            # 2. Wi-Fi 자격증명 복호화
            credentials = decrypt_wifi_payload(raw, shared_key)
            ssid = credentials.get("ssid", "")
            password = credentials.get("password", "")

            if not ssid:
                raise ValueError("SSID가 비어 있음")

            # 3. Notify: 연결 중
            notify_status("CONNECTING")

            # 4. Wi-Fi 연결 시도
            success = connect_wifi(ssid, password, timeout=30)

            # 5. 결과 Notify
            if success:
                notify_status("SUCCESS")
                logger.info("[BLE] Wi-Fi 연결 성공 → BLE 서버 종료 예약")
                # 3초 후 BLE Advertising 종료 (앱이 Notify를 수신할 시간 확보)
                threading.Timer(3.0, self._stop_ble).start()
            else:
                notify_status("FAIL")

        except Exception as e:
            logger.error(f"[BLE] Wi-Fi 연결 처리 오류: {e}")
            notify_status("FAIL")

    @staticmethod
    def _stop_ble():
        """Wi-Fi 연결 성공 후 BLE Advertising 및 메인루프 종료."""
        global _mainloop
        logger.info("[BLE] 메인루프 종료")
        if _mainloop is not None:
            _mainloop.quit()


class StatusCharacteristic(Characteristic):
    """Notify: Wi-Fi 연결 상태(CONNECTING / SUCCESS / FAIL)를 앱에 전송."""

    def __init__(self, bus, index, service):
        super().__init__(bus, index, STATUS_CHAR_UUID, ["notify"], service)

    @dbus.service.method(GATT_CHRC_IFACE)
    def StartNotify(self):
        self.notifying = True
        logger.info("[BLE] STATUS Notify 구독 시작")

    @dbus.service.method(GATT_CHRC_IFACE)
    def StopNotify(self):
        self.notifying = False
        logger.info("[BLE] STATUS Notify 구독 해제")


class DeviceInfoCharacteristic(Characteristic):
    """Read: 기기 정보 JSON (device_id, name, firmware)."""

    DEVICE_ID = "SPK-UUID-xxxx"  # 실제 배포 시 uuid.uuid4()로 고정값 생성

    def __init__(self, bus, index, service):
        super().__init__(bus, index, DEVINFO_CHAR_UUID, ["read"], service)

    @dbus.service.method(GATT_CHRC_IFACE, in_signature="a{sv}", out_signature="ay")
    def ReadValue(self, options):
        info = {
            "device_id": self.DEVICE_ID,
            "name": "Re:Bloom Speaker",
            "firmware": "1.0.0",
        }
        data = list(json.dumps(info).encode("utf-8"))
        return dbus.Array(data, signature="y")


# ─────────────────────────────────────────────
# BLE Advertisement
# ─────────────────────────────────────────────
class ReBlooomAdvertisement(dbus.service.Object):
    PATH_BASE = "/org/bluez/example/advertisement"

    def __init__(self, bus, index):
        self.path = self.PATH_BASE + str(index)
        self.bus = bus
        self.ad_type = "peripheral"
        self.service_uuids = [REBLOOM_SERVICE_UUID]
        self.local_name = "Re:Bloom"
        self.include_tx_power = True
        dbus.service.Object.__init__(self, bus, self.path)

    def get_path(self):
        return dbus.ObjectPath(self.path)

    @dbus.service.method(DBUS_PROP_IFACE, in_signature="s", out_signature="a{sv}")
    def GetAll(self, interface):
        if interface != LE_ADVERTISEMENT:
            raise InvalidArgsException()
        properties = {
            "Type": dbus.String(self.ad_type),
            "ServiceUUIDs": dbus.Array(self.service_uuids, signature="s"),
            "LocalName": dbus.String(self.local_name),
            "IncludeTxPower": dbus.Boolean(self.include_tx_power),
        }
        return properties

    @dbus.service.method(LE_ADVERTISEMENT, in_signature="", out_signature="")
    def Release(self):
        logger.info("[BLE] Advertisement Released")


def register_advertisement(bus, adapter_path):
    ad_manager = dbus.Interface(
        bus.get_object(BLUEZ_SERVICE_NAME, adapter_path),
        LE_ADVERTISING_MGR,
    )
    advertisement = ReBlooomAdvertisement(bus, 0)

    def register_ok():
        logger.info("[BLE] Advertisement 등록 완료")

    def register_error(error):
        logger.error(f"[BLE] Advertisement 등록 실패: {error}")

    ad_manager.RegisterAdvertisement(
        advertisement.get_path(),
        {},
        reply_handler=register_ok,
        error_handler=register_error,
    )


def register_application(bus, adapter_path, app):
    gatt_manager = dbus.Interface(
        bus.get_object(BLUEZ_SERVICE_NAME, adapter_path),
        GATT_MANAGER_IFACE,
    )

    def register_ok():
        logger.info("[BLE] GATT Application 등록 완료")

    def register_error(error):
        logger.error(f"[BLE] GATT Application 등록 실패: {error}")

    gatt_manager.RegisterApplication(
        app.get_path(),
        {},
        reply_handler=register_ok,
        error_handler=register_error,
    )


def find_adapter(bus):
    """BlueZ에서 첫 번째 BLE 어댑터 경로 반환."""
    remote_om = dbus.Interface(
        bus.get_object(BLUEZ_SERVICE_NAME, "/"),
        DBUS_OM_IFACE,
    )
    objects = remote_om.GetManagedObjects()
    for path, interfaces in objects.items():
        if GATT_MANAGER_IFACE in interfaces:
            return path
    return None


def run_ble_server():
    global _mainloop

    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    bus = dbus.SystemBus()

    adapter_path = find_adapter(bus)
    if adapter_path is None:
        raise RuntimeError("BLE 어댑터를 찾을 수 없습니다. bluetoothd가 실행 중인지 확인하세요.")

    logger.info(f"[BLE] 어댑터 발견: {adapter_path}")

    app = Application(bus)
    register_application(bus, adapter_path, app)
    register_advertisement(bus, adapter_path)

    _mainloop = GLib.MainLoop()
    logger.info("[BLE] GATT Server 시작. 앱의 스캔을 기다리는 중...")
    _mainloop.run()
    logger.info("[BLE] GATT Server 종료")


if __name__ == "__main__":
    run_ble_server()
