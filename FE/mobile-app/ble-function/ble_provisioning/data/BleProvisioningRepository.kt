package com.rebloom.app.provisioning.data

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.util.Log
import com.rebloom.app.provisioning.DiscoveredDevice
import com.rebloom.app.provisioning.util.CryptoUtil
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import java.util.UUID

/**
 * BleProvisioningRepository.kt
 * ──────────────────────────────
 * BLE GATT 클라이언트 로직을 담당하는 Repository.
 * ViewModel은 이 클래스를 통해 BLE 통신을 수행한다.
 *
 * [내부 통신 흐름]
 *   1. connect()         → GATT 연결
 *   2. discoverServices → PUBKEY Characteristic Read
 *   3. onCharacteristicRead → ECDH 공유키 도출
 *   4. sendWifiCredentials() → 암호화 후 WIFI Characteristic Write
 *   5. STATUS Notify 구독 → 결과 이벤트 emit
 */
@SuppressLint("MissingPermission")
class BleProvisioningRepository(private val context: Context) {

    companion object {
        private const val TAG = "BleRepo"

        val SERVICE_UUID     = UUID.fromString("0000fe10-0000-1000-8000-00805f9b34fb")
        val PUBKEY_UUID      = UUID.fromString("0000fe11-0000-1000-8000-00805f9b34fb")
        val WIFI_UUID        = UUID.fromString("0000fe12-0000-1000-8000-00805f9b34fb")
        val STATUS_UUID      = UUID.fromString("0000fe13-0000-1000-8000-00805f9b34fb")
        val DEVINFO_UUID     = UUID.fromString("0000fe14-0000-1000-8000-00805f9b34fb")

        // BlueZ CCCD UUID — Notify 활성화에 필요
        val CCCD_UUID        = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
    }

    // ─────────────────────────────────────────────
    // 이벤트 채널 (Repository → ViewModel)
    // ─────────────────────────────────────────────

    sealed class BleEvent {
        object Connected : BleEvent()
        object Disconnected : BleEvent()
        data class StatusNotify(val status: String) : BleEvent()
        data class Error(val message: String) : BleEvent()
        object WriteDone : BleEvent()
    }

    private val _events = Channel<BleEvent>(Channel.BUFFERED)
    val events: Flow<BleEvent> = _events.receiveAsFlow()

    // ─────────────────────────────────────────────
    // 내부 상태
    // ─────────────────────────────────────────────
    private var gatt: BluetoothGatt? = null
    private var pendingSsid: String = ""
    private var pendingPassword: String = ""

    // ECDH 키 쌍 — connect 시점에 생성
    private var appKeyPair: CryptoUtil.ECKeyPair? = null
    private var sharedKey: ByteArray? = null

    // ─────────────────────────────────────────────
    // 연결
    // ─────────────────────────────────────────────

    fun connect(device: BluetoothDevice, ssid: String, password: String) {
        pendingSsid = ssid
        pendingPassword = password
        appKeyPair = CryptoUtil.generateKeyPair()
        Log.d(TAG, "GATT 연결 시도: ${device.address}")
        gatt = device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
    }

    fun disconnect() {
        gatt?.disconnect()
        gatt?.close()
        gatt = null
    }

    // ─────────────────────────────────────────────
    // GATT 콜백
    // ─────────────────────────────────────────────

    private val gattCallback = object : BluetoothGattCallback() {

        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            when (newState) {
                BluetoothProfile.STATE_CONNECTED -> {
                    Log.d(TAG, "GATT 연결됨 → 서비스 탐색")
                    _events.trySend(BleEvent.Connected)
                    gatt.discoverServices()
                }
                BluetoothProfile.STATE_DISCONNECTED -> {
                    Log.d(TAG, "GATT 연결 해제")
                    _events.trySend(BleEvent.Disconnected)
                    gatt.close()
                }
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _events.trySend(BleEvent.Error("서비스 탐색 실패: status=$status"))
                return
            }

            Log.d(TAG, "서비스 탐색 완료 → PUBKEY Characteristic Read")
            val pubKeyChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(PUBKEY_UUID)
            if (pubKeyChar == null) {
                _events.trySend(BleEvent.Error("PUBKEY Characteristic 없음 — UUID 불일치 확인"))
                return
            }
            gatt.readCharacteristic(pubKeyChar)
        }

        @Deprecated("API 33 미만 호환용")
        override fun onCharacteristicRead(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int,
        ) {
            onCharacteristicRead(gatt, characteristic, characteristic.value, status)
        }

        override fun onCharacteristicRead(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray,
            status: Int,
        ) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _events.trySend(BleEvent.Error("Characteristic Read 실패: status=$status"))
                return
            }

            when (characteristic.uuid) {
                PUBKEY_UUID -> handlePublicKeyRead(gatt, value)
                else -> Log.w(TAG, "알 수 없는 Characteristic Read: ${characteristic.uuid}")
            }
        }

        override fun onCharacteristicWrite(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int,
        ) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _events.trySend(BleEvent.Error("Wi-Fi 정보 Write 실패: status=$status"))
                return
            }
            Log.d(TAG, "Wi-Fi 정보 Write 성공 → STATUS Notify 대기")
            _events.trySend(BleEvent.WriteDone)
        }

        @Deprecated("API 33 미만 호환용")
        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
        ) {
            onCharacteristicChanged(gatt, characteristic, characteristic.value)
        }

        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray,
        ) {
            if (characteristic.uuid == STATUS_UUID) {
                val status = String(value, Charsets.UTF_8)
                Log.d(TAG, "STATUS Notify 수신: $status")
                _events.trySend(BleEvent.StatusNotify(status))

                // SUCCESS 수신 시 연결 해제 (3초 후 — 앱이 SUCCESS 처리할 시간 확보)
                if (status == "SUCCESS") {
                    gatt.postDelayed({ disconnect() }, 3000)
                }
            }
        }

        override fun onDescriptorWrite(
            gatt: BluetoothGatt,
            descriptor: BluetoothGattDescriptor,
            status: Int,
        ) {
            // CCCD 쓰기 완료 = Notify 활성화 성공
            Log.d(TAG, "CCCD 쓰기 완료 → STATUS Notify 활성화")
        }
    }

    // ─────────────────────────────────────────────
    // 내부 헬퍼
    // ─────────────────────────────────────────────

    private fun handlePublicKeyRead(gatt: BluetoothGatt, rpiPublicKeyRaw: ByteArray) {
        Log.d(TAG, "RPi5 공개키 수신: ${rpiPublicKeyRaw.size} bytes")

        val keyPair = appKeyPair ?: run {
            _events.trySend(BleEvent.Error("앱 키 쌍 미생성"))
            return
        }

        try {
            // ECDH 공유키 도출
            sharedKey = CryptoUtil.deriveSharedKey(keyPair.privateKey, rpiPublicKeyRaw)

            // Wi-Fi 정보 암호화
            val payload = CryptoUtil.buildEncryptedPayload(
                appPublicKeyRaw = keyPair.publicKeyRaw,
                sharedKey = sharedKey!!,
                ssid = pendingSsid,
                password = pendingPassword,
            )

            // STATUS Notify 먼저 구독
            subscribeToStatusNotify(gatt)

            // Wi-Fi Characteristic에 Write
            val wifiChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(WIFI_UUID)
            if (wifiChar == null) {
                _events.trySend(BleEvent.Error("WIFI Characteristic 없음"))
                return
            }

            // API 33+ / 미만 호환
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                gatt.writeCharacteristic(
                    wifiChar,
                    payload,
                    BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT,
                )
            } else {
                @Suppress("DEPRECATION")
                wifiChar.value = payload
                @Suppress("DEPRECATION")
                gatt.writeCharacteristic(wifiChar)
            }

        } catch (e: Exception) {
            Log.e(TAG, "ECDH/암호화 오류: ${e.message}", e)
            _events.trySend(BleEvent.Error("암호화 실패: ${e.message}"))
        }
    }

    private fun subscribeToStatusNotify(gatt: BluetoothGatt) {
        val statusChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(STATUS_UUID) ?: return
        gatt.setCharacteristicNotification(statusChar, true)

        // CCCD Descriptor에 ENABLE_NOTIFICATION_VALUE 쓰기
        val cccd = statusChar.getDescriptor(CCCD_UUID)
        if (cccd != null) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                gatt.writeDescriptor(cccd, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
            } else {
                @Suppress("DEPRECATION")
                cccd.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                @Suppress("DEPRECATION")
                gatt.writeDescriptor(cccd)
            }
        }
    }

    // BluetoothGatt에 postDelayed 확장 (GattCallback 내부 사용)
    private fun BluetoothGatt.postDelayed(action: () -> Unit, delayMs: Long) {
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(action, delayMs)
    }
}
