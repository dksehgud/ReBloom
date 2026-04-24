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
        val SERVICE_UUID  = UUID.fromString("0000fe10-0000-1000-8000-00805f9b34fb")
        val PUBKEY_UUID   = UUID.fromString("0000fe11-0000-1000-8000-00805f9b34fb")
        val WIFI_UUID     = UUID.fromString("0000fe12-0000-1000-8000-00805f9b34fb")
        val STATUS_UUID   = UUID.fromString("0000fe13-0000-1000-8000-00805f9b34fb")
        val CCCD_UUID     = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
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

    fun connect(device: BluetoothDevice, ssid: String, password: String) {
        pendingSsid = ssid
        pendingPassword = password
        appKeyPair = CryptoUtil.generateKeyPair()
        gatt = device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
    }

    fun disconnect() {
        gatt?.disconnect()
        gatt?.close()
        gatt = null
    }

    private val gattCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            when (newState) {
                BluetoothProfile.STATE_CONNECTED -> {
                    _events.trySend(BleEvent.Connected)
                    gatt.discoverServices()
                }
                BluetoothProfile.STATE_DISCONNECTED -> {
                    _events.trySend(BleEvent.Disconnected)
                    gatt.close()
                }
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _events.trySend(BleEvent.Error("서비스 탐색 실패"))
                return
            }
            val char = gatt.getService(SERVICE_UUID)?.getCharacteristic(PUBKEY_UUID)
                ?: return _events.trySend(BleEvent.Error("PUBKEY Characteristic 없음"))
            gatt.readCharacteristic(char)
        }

        @Deprecated("API 33 미만 호환")
        override fun onCharacteristicRead(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
            onCharacteristicRead(gatt, characteristic, characteristic.value, status)
        }

        override fun onCharacteristicRead(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, value: ByteArray, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) { _events.trySend(BleEvent.Error("Read 실패")); return }
            if (characteristic.uuid == PUBKEY_UUID) handlePubKeyRead(gatt, value)
        }

        override fun onCharacteristicWrite(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) { _events.trySend(BleEvent.Error("Write 실패")); return }
            _events.trySend(BleEvent.WriteDone)
        }

        @Deprecated("API 33 미만 호환")
        override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
            onCharacteristicChanged(gatt, characteristic, characteristic.value)
        }

        override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, value: ByteArray) {
            if (characteristic.uuid == STATUS_UUID) {
                val status = String(value, Charsets.UTF_8)
                Log.d(TAG, "STATUS Notify: $status")
                _events.trySend(BleEvent.StatusNotify(status))
                if (status == "SUCCESS") Handler(Looper.getMainLooper()).postDelayed({ disconnect() }, 3000)
            }
        }
    }

    private fun handlePubKeyRead(gatt: BluetoothGatt, rpiPubKeyRaw: ByteArray) {
        val kp = appKeyPair ?: return _events.trySend(BleEvent.Error("키 쌍 없음"))
        try {
            val sharedKey = CryptoUtil.deriveSharedKey(kp.privateKey, rpiPubKeyRaw)
            val payload = CryptoUtil.buildEncryptedPayload(kp.publicKeyRaw, sharedKey, pendingSsid, pendingPassword)

            // STATUS Notify 구독
            val statusChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(STATUS_UUID)
            if (statusChar != null) {
                gatt.setCharacteristicNotification(statusChar, true)
                val cccd = statusChar.getDescriptor(CCCD_UUID)
                if (cccd != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        gatt.writeDescriptor(cccd, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
                    } else {
                        @Suppress("DEPRECATION") cccd.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                        @Suppress("DEPRECATION") gatt.writeDescriptor(cccd)
                    }
                }
            }

            // Wi-Fi 정보 Write
            val wifiChar = gatt.getService(SERVICE_UUID)?.getCharacteristic(WIFI_UUID)
                ?: return _events.trySend(BleEvent.Error("WIFI Characteristic 없음"))
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                gatt.writeCharacteristic(wifiChar, payload, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT)
            } else {
                @Suppress("DEPRECATION") wifiChar.value = payload
                @Suppress("DEPRECATION") gatt.writeCharacteristic(wifiChar)
            }
        } catch (e: Exception) {
            _events.trySend(BleEvent.Error("암호화 실패: ${e.message}"))
        }
    }
}
