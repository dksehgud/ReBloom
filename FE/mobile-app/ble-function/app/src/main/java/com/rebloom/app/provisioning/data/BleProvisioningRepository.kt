package com.rebloom.app.provisioning.data

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.rebloom.app.provisioning.util.CryptoUtil
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import java.util.UUID

@SuppressLint("MissingPermission")
class BleProvisioningRepository(private val context: Context) {

    companion object {
        private const val TAG = "BleRepo"
        private const val TARGET_MTU = 512
        val SERVICE_UUID = UUID.fromString("0000fe10-0000-1000-8000-00805f9b34fb")
        val PUBKEY_UUID  = UUID.fromString("0000fe11-0000-1000-8000-00805f9b34fb")
        val WIFI_UUID    = UUID.fromString("0000fe12-0000-1000-8000-00805f9b34fb")
        val STATUS_UUID  = UUID.fromString("0000fe13-0000-1000-8000-00805f9b34fb")
        val CCCD_UUID    = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
    }

    sealed class BleEvent {
        object Connected : BleEvent()
        object Disconnected : BleEvent()
        object WriteDone : BleEvent()
        data class StatusNotify(val status: String) : BleEvent()
        data class Error(val message: String) : BleEvent()
    }

    private val _events = Channel<BleEvent>(Channel.BUFFERED)
    val events: Flow<BleEvent> = _events.receiveAsFlow()

    private var gatt: BluetoothGatt? = null
    private var pendingSsid = ""
    private var pendingPassword = ""
    private var appKeyPair: CryptoUtil.ECKeyPair? = null

    // 암호화된 페이로드를 미리 저장해두고 올바른 시점에 전송
    private var pendingWifiPayload: ByteArray? = null

    fun connect(device: BluetoothDevice, ssid: String, password: String) {
        pendingSsid = ssid
        pendingPassword = password
        appKeyPair = CryptoUtil.generateKeyPair()
        pendingWifiPayload = null
        gatt = device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
    }

    fun disconnect() {
        gatt?.disconnect()
        gatt?.close()
        gatt = null
    }

    private val gattCallback = object : BluetoothGattCallback() {

        // ── 1단계: 연결 완료 → MTU 협상 요청 ──────────────────────────
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            when (newState) {
                BluetoothProfile.STATE_CONNECTED -> {
                    Log.d(TAG, "GATT 연결됨. MTU 협상 요청...")
                    _events.trySend(BleEvent.Connected)
                    gatt.requestMtu(TARGET_MTU)
                }
                BluetoothProfile.STATE_DISCONNECTED -> {
                    Log.d(TAG, "GATT 연결 해제")
                    _events.trySend(BleEvent.Disconnected)
                    gatt.close()
                }
            }
        }

        // ── 2단계: MTU 협상 완료 → 서비스 탐색 ────────────────────────
        override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
            Log.d(TAG, "MTU 협상 완료: $mtu (status=$status)")
            gatt.discoverServices()
        }

        // ── 3단계: 서비스 탐색 완료 → PUBKEY Read ─────────────────────
        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _events.trySend(BleEvent.Error("서비스 탐색 실패 (status=$status)"))
                return
            }
            val char = gatt.getService(SERVICE_UUID)?.getCharacteristic(PUBKEY_UUID)
                ?: return run { _events.trySend(BleEvent.Error("PUBKEY Characteristic 없음")); Unit }
            Log.d(TAG, "FE11 PUBKEY Read 요청")
            gatt.readCharacteristic(char)
        }

        // ── 4단계: PUBKEY Read 완료 → 페이로드 생성 + Notify 구독 ─────
        @Deprecated("API 33 미만 호환")
        override fun onCharacteristicRead(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {
            onCharacteristicRead(gatt, characteristic, characteristic.value ?: byteArrayOf(), status)
        }

        override fun onCharacteristicRead(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray,
            status: Int
        ) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _events.trySend(BleEvent.Error("PUBKEY Read 실패 (status=$status)"))
                return
            }
            if (characteristic.uuid == PUBKEY_UUID) {
                Log.d(TAG, "FE11 PUBKEY 수신 (${value.size}B): ${value.toHex()}")
                preparePayloadAndSubscribeNotify(gatt, value)
            }
        }

        // ── 5단계: Descriptor Write 완료 → Wi-Fi Write ────────────────
        override fun onDescriptorWrite(
            gatt: BluetoothGatt,
            descriptor: BluetoothGattDescriptor,
            status: Int
        ) {
            Log.d(TAG, "Descriptor write 완료 (status=$status, desc=${descriptor.uuid})")
            if (descriptor.uuid == CCCD_UUID) {
                val payload = pendingWifiPayload
                if (payload == null) {
                    _events.trySend(BleEvent.Error("Wi-Fi 페이로드 없음"))
                    return
                }
                writeWifiCredential(gatt, payload)
            }
        }

        // ── 6단계: Characteristic Write 완료 ──────────────────────────
        override fun onCharacteristicWrite(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _events.trySend(BleEvent.Error("FE12 Write 실패 (status=$status)"))
                return
            }
            Log.d(TAG, "FE12 Wi-Fi Write 완료")
            _events.trySend(BleEvent.WriteDone)
        }

        // ── STATUS 알림 수신 ──────────────────────────────────────────
        @Deprecated("API 33 미만 호환")
        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic
        ) {
            onCharacteristicChanged(gatt, characteristic, characteristic.value ?: byteArrayOf())
        }

        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray
        ) {
            if (characteristic.uuid == STATUS_UUID) {
                val status = String(value, Charsets.UTF_8)
                Log.d(TAG, "STATUS Notify: $status")
                _events.trySend(BleEvent.StatusNotify(status))
                if (status == "SUCCESS") {
                    Handler(Looper.getMainLooper()).postDelayed({ disconnect() }, 3000)
                }
            }
        }
    }

    /**
     * PUBKEY를 읽은 직후:
     * 1) 암호화 페이로드 생성 및 저장
     * 2) STATUS Notify 구독 (CCCD write)
     * → CCCD write 완료(onDescriptorWrite)되면 writeWifiCredential() 호출
     */
    private fun preparePayloadAndSubscribeNotify(gatt: BluetoothGatt, rpiPubKeyRaw: ByteArray) {
        val kp = appKeyPair ?: return run {
            _events.trySend(BleEvent.Error("키 쌍 없음"))
        }
        try {
            val sharedKey = CryptoUtil.deriveSharedKey(kp.privateKey, rpiPubKeyRaw)
            val payload = CryptoUtil.buildEncryptedPayload(
                kp.publicKeyRaw, sharedKey, pendingSsid, pendingPassword
            )
            pendingWifiPayload = payload
            Log.d(TAG, "Wi-Fi 페이로드 생성 완료 (${payload.size}B)")

            // STATUS Notify 구독 (완료 후 onDescriptorWrite에서 Wi-Fi write)
            val statusChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(STATUS_UUID)
            if (statusChar != null) {
                gatt.setCharacteristicNotification(statusChar, true)
                val cccd = statusChar.getDescriptor(CCCD_UUID)
                if (cccd != null) {
                    Log.d(TAG, "FE13 CCCD Notify 구독 요청")
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        gatt.writeDescriptor(cccd, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
                    } else {
                        @Suppress("DEPRECATION") cccd.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                        @Suppress("DEPRECATION") gatt.writeDescriptor(cccd)
                    }
                    return // onDescriptorWrite 콜백에서 Wi-Fi write 진행
                }
            }
            // CCCD가 없으면 바로 write 진행
            Log.w(TAG, "STATUS CCCD 없음 — 바로 Wi-Fi write 진행")
            writeWifiCredential(gatt, payload)

        } catch (e: Exception) {
            Log.e(TAG, "페이로드 생성 실패", e)
            _events.trySend(BleEvent.Error("암호화 실패: ${e.message}"))
        }
    }

    /**
     * FE12 Wi-Fi Credential Write
     */
    private fun writeWifiCredential(gatt: BluetoothGatt, payload: ByteArray) {
        val wifiChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(WIFI_UUID)
            ?: return run { _events.trySend(BleEvent.Error("WIFI Characteristic 없음")) }

        Log.d(TAG, "FE12 WiFiCredential Write 호출: ${payload.size}B → ${payload.toHex()}")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            gatt.writeCharacteristic(wifiChar, payload, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT)
        } else {
            @Suppress("DEPRECATION") wifiChar.value = payload
            @Suppress("DEPRECATION") wifiChar.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
            @Suppress("DEPRECATION") gatt.writeCharacteristic(wifiChar)
        }
    }

    private fun ByteArray.toHex(): String =
        joinToString("") { "%02x".format(it) }
}
