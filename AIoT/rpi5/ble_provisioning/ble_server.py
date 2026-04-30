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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

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

ecdh_provider = ECDHProvider()
_status_characteristic = None
_mainloop = None
_server_generation = 0


def notify_status(status: str) -> None:
    global _status_characteristic
    if _status_characteristic is not None:
        try:
            logger.info(
                "[BLE] STATUS notify 시도: status=%s, subscribed=%s",
                status,
                _status_characteristic.notifying,
            )
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


class InvalidArgsException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.freedesktop.DBus.Error.InvalidArgs"


class NotSupportedException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.NotSupported"


class Application(dbus.service.Object):
    def __init__(self, bus, path, service_path_base):
        self.path = path
        self.services = []
        dbus.service.Object.__init__(self, bus, self.path)
        self.add_service(ReBlooomProvisioningService(bus, 0, service_path_base))

    def add_service(self, service):
        self.services.append(service)

    def get_path(self):
        return dbus.ObjectPath(self.path)

    @dbus.service.method(DBUS_OM_IFACE, out_signature="a{oa{sa{sv}}}")
    def GetManagedObjects(self):
        response = {}
        for service in self.services:
            response[service.get_path()] = service.get_properties()
            for chrc in service.get_characteristics():
                response[chrc.get_path()] = chrc.get_properties()
        return response


class Service(dbus.service.Object):
    def __init__(self, bus, index, uuid, primary, path_base):
        self.path = path_base + str(index)
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


class ReBlooomProvisioningService(Service):
    def __init__(self, bus, index, path_base):
        super().__init__(bus, index, REBLOOM_SERVICE_UUID, primary=True, path_base=path_base)
        self.add_characteristic(PublicKeyCharacteristic(bus, 0, self))
        self.add_characteristic(WiFiCredentialCharacteristic(bus, 1, self))

        status_char = StatusCharacteristic(bus, 2, self)
        self.add_characteristic(status_char)

        global _status_characteristic
        _status_characteristic = status_char

        self.add_characteristic(DeviceInfoCharacteristic(bus, 3, self))


class PublicKeyCharacteristic(Characteristic):
    def __init__(self, bus, index, service):
        super().__init__(bus, index, PUBKEY_CHAR_UUID, ["read"], service)

    @dbus.service.method(GATT_CHRC_IFACE, in_signature="a{sv}", out_signature="ay")
    def ReadValue(self, options):
        pubkey = list(ecdh_provider.public_key_bytes)
        logger.info(f"[BLE] PublicKey Read: {len(pubkey)} bytes")
        return dbus.Array(pubkey, signature="y")


class WiFiCredentialCharacteristic(Characteristic):
    def __init__(self, bus, index, service):
        super().__init__(bus, index, WIFI_CHAR_UUID, ["write"], service)
        logger.info(
            "[BLE] WIFI characteristic 준비 완료: uuid=%s, flags=%s",
            WIFI_CHAR_UUID,
            self.flags,
        )

    @dbus.service.method(GATT_CHRC_IFACE, in_signature="aya{sv}")
    def WriteValue(self, value, options):
        logger.info("[BLE] WiFiCredential Write 호출: %d bytes, options=%s", len(value), dict(options))

        raw = bytes(value)
        logger.info("[BLE] WiFiCredential payload preview(first16)=%s", raw[:16].hex())

        thread = threading.Thread(
            target=self._handle_wifi_connection,
            args=(raw,),
            daemon=True,
        )
        thread.start()

    def _handle_wifi_connection(self, raw: bytes) -> None:
        try:
            logger.info("[BLE] Wi-Fi payload 처리 시작: total_len=%d", len(raw))

            if len(raw) < 44:
                raise ValueError(f"페이로드 길이 부족: {len(raw)}")

            app_pubkey_bytes = raw[:32]
            logger.info("[BLE] 앱 공개키 추출 완료: %d bytes", len(app_pubkey_bytes))
            shared_key = ecdh_provider.derive_shared_key(app_pubkey_bytes)
            logger.info("[BLE] 공유키 도출 완료: %d bytes", len(shared_key))

            credentials = decrypt_wifi_payload(raw, shared_key)
            ssid = credentials.get("ssid", "")
            password = credentials.get("password", "")
            logger.info(
                "[BLE] payload 복호화 완료: ssid=%s, password_len=%d",
                ssid,
                len(password),
            )

            if not ssid:
                raise ValueError("SSID가 비어 있음")

            notify_status("CONNECTING")
            success = connect_wifi(ssid, password, timeout=30)

            if success:
                notify_status("SUCCESS")
                logger.info("[BLE] Wi-Fi 연결 성공 → BLE 서버 종료 예약")
                threading.Timer(3.0, self._stop_ble).start()
            else:
                notify_status("FAIL")

        except Exception as e:
            logger.error(f"[BLE] Wi-Fi 연결 처리 오류: {e}")
            notify_status("FAIL")

    @staticmethod
    def _stop_ble():
        global _mainloop
        logger.info("[BLE] 메인루프 종료")
        if _mainloop is not None:
            _mainloop.quit()


class StatusCharacteristic(Characteristic):
    def __init__(self, bus, index, service):
        super().__init__(bus, index, STATUS_CHAR_UUID, ["notify"], service)

    @dbus.service.method(GATT_CHRC_IFACE)
    def StartNotify(self):
        self.notifying = True
        logger.info("[BLE] STATUS Notify 구독 시작: notifying=%s", self.notifying)

    @dbus.service.method(GATT_CHRC_IFACE)
    def StopNotify(self):
        self.notifying = False
        logger.info("[BLE] STATUS Notify 구독 해제: notifying=%s", self.notifying)


class DeviceInfoCharacteristic(Characteristic):
    DEVICE_ID = "SPK-UUID-xxxx"

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


class ReBlooomAdvertisement(dbus.service.Object):
    def __init__(self, bus, path):
        self.path = path
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


def register_advertisement(bus, adapter_path, advertisement_path):
    ad_manager = dbus.Interface(
        bus.get_object(BLUEZ_SERVICE_NAME, adapter_path),
        LE_ADVERTISING_MGR,
    )
    advertisement = ReBlooomAdvertisement(bus, advertisement_path)
    logger.info("[BLE] Advertisement 등록 시도: path=%s", advertisement.get_path())

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

    logger.info("[BLE] GATT Application 등록 시도: path=%s", app.get_path())
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
    global _mainloop, _server_generation, _status_characteristic

    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    bus = dbus.SystemBus()

    adapter_path = find_adapter(bus)
    if adapter_path is None:
        raise RuntimeError("BLE 어댑터를 찾을 수 없습니다. bluetoothd가 실행 중인지 확인하세요.")

    logger.info(f"[BLE] 어댑터 발견: {adapter_path}")

    _server_generation += 1
    session_id = f"{int(time.time())}_{_server_generation}"
    app_path = f"/org/rebloom/provisioning/app{session_id}"
    service_path_base = f"/org/rebloom/provisioning/service{session_id}_"
    advertisement_path = f"/org/rebloom/provisioning/advertisement{session_id}"
    _status_characteristic = None

    app = Application(bus, app_path, service_path_base)
    register_application(bus, adapter_path, app)
    register_advertisement(bus, adapter_path, advertisement_path)

    _mainloop = GLib.MainLoop()
    logger.info("[BLE] GATT Server 시작. 앱의 스캔을 기다리는 중...")
    _mainloop.run()
    logger.info("[BLE] GATT Server 종료")


if __name__ == "__main__":
    run_ble_server()
