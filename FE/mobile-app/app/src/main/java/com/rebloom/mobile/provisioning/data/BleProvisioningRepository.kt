package com.rebloom.mobile.provisioning.data

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.util.Log
import com.rebloom.mobile.provisioning.util.CryptoUtil
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import org.json.JSONObject
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
        data class ProvisioningSucceeded(val serialNumber: String) : BleEvent()
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

    private data class ParsedProvisioningStatus(
        val status: String,
        val serialNumber: String?,
    )

    // ─────────────────────────────────────────────
    // 연결
    // ─────────────────────────────────────────────

    fun connect(device: BluetoothDevice, ssid: String, password: String) {
        pendingSsid = ssid
        pendingPassword = password
        appKeyPair = CryptoUtil.generateKeyPair()
        Log.d(TAG, "GATT 연결 시도: ${device.address}")

        // 안드로이드 133 에러 방지를 위해 명시적으로 메인 스레드에서 연결 시도
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    gatt = device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
                } else {
                    gatt = device.connectGatt(context, false, gattCallback)
                }
            } catch (e: SecurityException) {
                _events.trySend(BleEvent.Error("블루투스 연결 권한이 없습니다."))
            }
        }
    }

    fun disconnect() {
        try {
            gatt?.disconnect()
            gatt?.close()
        } catch (e: SecurityException) {
            Log.e(TAG, "GATT 해제 중 권한 에러", e)
        } finally {
            gatt = null
        }
    }

    // ─────────────────────────────────────────────
    // GATT 콜백
    // ─────────────────────────────────────────────

    private val gattCallback = object : BluetoothGattCallback() {

        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            // 안드로이드 133 에러 (기기 연결 실패 / 타임아웃 / 캐시 꼬임)
            if (status == 133) {
                Log.e(TAG, "GATT 연결 실패 (status=133). 캐시 초기화 및 재시도 권장.")
                _events.trySend(BleEvent.Error("기기와의 연결이 불안정합니다(status 133).\n스마트폰의 블루투스를 껐다 켜거나 기기를 재부팅해주세요."))
                disconnect()
                return
            }

            when (newState) {
                BluetoothProfile.STATE_CONNECTED -> {
                    Log.d(TAG, "GATT 연결됨 → 600ms 대기 후 MTU 512 협상 요청")
                    _events.trySend(BleEvent.Connected)
                    
                    // 안드로이드 BLE 타이밍 이슈 방지를 위해 딜레이 후 실행
                    gatt.postDelayed({
                        val mtuRequested = gatt.requestMtu(512)
                        if (!mtuRequested) {
                            Log.w(TAG, "MTU 요청 실패 → 바로 서비스 탐색 시도")
                            gatt.discoverServices()
                        }
                    }, 600)
                }
                BluetoothProfile.STATE_DISCONNECTED -> {
                    Log.d(TAG, "GATT 연결 해제")
                    _events.trySend(BleEvent.Disconnected)
                    disconnect()
                }
            }
        }

        override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
            super.onMtuChanged(gatt, mtu, status)
            if (status == BluetoothGatt.GATT_SUCCESS) {
                Log.d(TAG, "MTU 확장 성공: $mtu bytes → 600ms 대기 후 서비스 탐색 시작")
            } else {
                Log.w(TAG, "MTU 확장 실패(status=$status) → 600ms 대기 후 서비스 탐색 시작")
            }
            
            gatt.postDelayed({
                gatt.discoverServices()
            }, 600)
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _events.trySend(BleEvent.Error("서비스 탐색 실패: status=$status"))
                return
            }

            Log.d(TAG, "서비스 탐색 완료 → 600ms 대기 후 PUBKEY Characteristic Read")
            
            gatt.postDelayed({
                val pubKeyChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(PUBKEY_UUID)
                if (pubKeyChar == null) {
                    _events.trySend(BleEvent.Error("PUBKEY Characteristic 없음 — UUID 불일치 확인"))
                    return@postDelayed
                }
                val isReadRequested = gatt.readCharacteristic(pubKeyChar)
                Log.d(TAG, "PUBKEY Read 요청 상태: $isReadRequested")
            }, 600)
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
                DEVINFO_UUID -> {
                    val serialNumber = extractSerialNumber(String(value, Charsets.UTF_8))
                        ?: String(value, Charsets.UTF_8).trim().takeIf { it.isNotBlank() }
                    if (serialNumber.isNullOrBlank()) {
                        _events.trySend(BleEvent.Error("스피커 serialNumber를 받지 못했습니다. 기기 펌웨어의 DEVINFO 값을 확인해주세요."))
                    } else {
                        _events.trySend(BleEvent.ProvisioningSucceeded(serialNumber))
                    }
                }
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
                val rawStatus = String(value, Charsets.UTF_8)
                val parsedStatus = parseProvisioningStatus(rawStatus)
                val status = parsedStatus.status

                Log.d(TAG, "STATUS Notify 수신: raw=$rawStatus, status=$status, serial=${parsedStatus.serialNumber}")
                _events.trySend(BleEvent.StatusNotify(status))

                // SUCCESS 수신 시 연결 해제 (3초 후 — 앱이 SUCCESS 처리할 시간 확보)
                if (isSuccessStatus(status)) {
                    val serialNumber = parsedStatus.serialNumber
                    if (!serialNumber.isNullOrBlank()) {
                        _events.trySend(BleEvent.ProvisioningSucceeded(serialNumber))
                    } else {
                        readDeviceInfoOrFallback(gatt)
                    }
                    gatt.postDelayed({ disconnect() }, 3000)
                }
            }
        }

        override fun onDescriptorWrite(
            gatt: BluetoothGatt,
            descriptor: BluetoothGattDescriptor,
            status: Int,
        ) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _events.trySend(BleEvent.Error("CCCD 쓰기 실패: status=$status"))
                return
            }
            
            Log.d(TAG, "CCCD 쓰기 완료 → STATUS Notify 활성화. Wi-Fi 정보 전송 시작.")
            
            pendingWifiPayload?.let { payload ->
                sendWifiCredentials(gatt, payload)
                pendingWifiPayload = null
            }
        }
    }

    private var pendingWifiPayload: ByteArray? = null

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

            // Android BLE의 고질적인 이슈(Race Condition) 방지
            // CCCD(Descriptor) 쓰기와 Characteristic 쓰기를 연속으로 호출하면 하나가 씹힙니다.
            // 페이로드를 임시 저장해두고, CCCD 쓰기가 성공한 후(onDescriptorWrite)에 전송합니다.
            pendingWifiPayload = payload
            
            // STATUS Notify 먼저 구독 (비동기)
            subscribeToStatusNotify(gatt)

        } catch (e: Exception) {
            Log.e(TAG, "ECDH/암호화 오류: ${e.message}", e)
            _events.trySend(BleEvent.Error("암호화 실패: ${e.message}"))
        }
    }

    private fun sendWifiCredentials(gatt: BluetoothGatt, payload: ByteArray) {
        val wifiChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(WIFI_UUID)
        if (wifiChar == null) {
            _events.trySend(BleEvent.Error("WIFI Characteristic 없음"))
            return
        }

        Log.d(TAG, "Wi-Fi 암호화 페이로드 전송 시도 (${payload.size} bytes)")
        
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

    private fun readDeviceInfoOrFallback(gatt: BluetoothGatt) {
        val devInfoChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(DEVINFO_UUID)
        if (devInfoChar == null) {
            Log.w(TAG, "DEVINFO Characteristic 없음")
            _events.trySend(BleEvent.Error("스피커가 Wi-Fi에는 연결됐지만 serialNumber를 제공하지 않았습니다."))
            return
        }

        val requested = gatt.readCharacteristic(devInfoChar)
        if (!requested) {
            Log.w(TAG, "DEVINFO Read 요청 실패")
            _events.trySend(BleEvent.Error("스피커 serialNumber 읽기에 실패했습니다."))
        }
    }

    private fun parseProvisioningStatus(rawValue: String): ParsedProvisioningStatus {
        val value = rawValue.trim().trim('\u0000')

        if (value.isBlank()) {
            return ParsedProvisioningStatus(status = "", serialNumber = null)
        }

        runCatching {
            val json = JSONObject(value)
            val status = listOf("status", "state", "result")
                .firstNotNullOfOrNull { key ->
                    json.optString(key).trim().takeIf { it.isNotBlank() }
                }
                ?: value
            val serialNumber = listOf("serialNumber", "serial", "deviceSerial")
                .firstNotNullOfOrNull { key ->
                    json.optString(key).trim().takeIf { it.isNotBlank() }
                }

            return ParsedProvisioningStatus(
                status = status,
                serialNumber = serialNumber,
            )
        }.onFailure {
            Log.d(TAG, "STATUS JSON 파싱 생략: ${it.message}")
        }

        return ParsedProvisioningStatus(
            status = value,
            serialNumber = extractSerialNumber(value),
        )
    }

    private fun isSuccessStatus(status: String): Boolean {
        val normalizedStatus = status.trim().uppercase()

        return normalizedStatus.startsWith("SUCCESS") ||
            normalizedStatus == "CONNECTED" ||
            normalizedStatus == "WIFI_CONNECTED" ||
            normalizedStatus == "DONE" ||
            normalizedStatus == "OK"
    }

    private fun extractSerialNumber(rawValue: String): String? {
        val value = rawValue.trim()
        if (value.isBlank()) {
            return null
        }

        runCatching {
            val json = JSONObject(value)
            json.optString("serialNumber")
                .takeIf { it.isNotBlank() }
                ?.let { return it }
            json.optString("serial")
                .takeIf { it.isNotBlank() }
                ?.let { return it }
        }

        if (!value.startsWith("SUCCESS")) {
            return null
        }

        return value
            .removePrefix("SUCCESS")
            .trimStart(':', '|', ',', ' ')
            .takeIf { it.isNotBlank() }
    }

    // BluetoothGatt에 postDelayed 확장 (GattCallback 내부 사용)
    private fun BluetoothGatt.postDelayed(action: () -> Unit, delayMs: Long) {
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(action, delayMs)
    }
}
