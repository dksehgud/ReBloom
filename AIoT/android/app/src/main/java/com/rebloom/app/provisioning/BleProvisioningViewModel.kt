package com.rebloom.app.provisioning

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rebloom.app.provisioning.data.BleProvisioningRepository
import com.rebloom.app.provisioning.data.BleProvisioningRepository.BleEvent
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@SuppressLint("MissingPermission")
class BleProvisioningViewModel(
    private val context: Context,
    private val repository: BleProvisioningRepository = BleProvisioningRepository(context),
) : ViewModel() {

    companion object {
        private const val TAG = "BleVM"
        private const val SCAN_TIMEOUT_MS = 15_000L
        val TARGET_SERVICE_UUID = ParcelUuid.fromString("0000fe10-0000-1000-8000-00805f9b34fb")
    }

    private val _state = MutableStateFlow<ProvisioningState>(ProvisioningState.Idle)
    val state: StateFlow<ProvisioningState> = _state.asStateFlow()

    private var scanTimeoutJob: Job? = null
    private var foundDevice: BluetoothDevice? = null
    private var pendingSsid: String = ""

    private val bluetoothAdapter: BluetoothAdapter? by lazy {
        (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
    }

    init {
        viewModelScope.launch {
            repository.events.collect { handleBleEvent(it) }
        }
    }

    // ─── BLE 스캔 ──────────────────────────────────

    fun startScan() {
        val adapter = bluetoothAdapter
        if (adapter == null || !adapter.isEnabled) { _state.value = ProvisioningState.BleUnavailable; return }

        _state.value = ProvisioningState.Scanning
        val filter = ScanFilter.Builder().setServiceUuid(TARGET_SERVICE_UUID).build()
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
        adapter.bluetoothLeScanner?.startScan(listOf(filter), settings, scanCallback)

        scanTimeoutJob?.cancel()
        scanTimeoutJob = viewModelScope.launch {
            delay(SCAN_TIMEOUT_MS)
            if (_state.value == ProvisioningState.Scanning) {
                stopScan()
                _state.value = ProvisioningState.Fail("Re:Bloom 기기를 찾지 못했습니다. 기기가 켜져 있는지 확인해주세요.")
            }
        }
    }

    fun stopScan() {
        scanTimeoutJob?.cancel()
        bluetoothAdapter?.bluetoothLeScanner?.stopScan(scanCallback)
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            stopScan()
            foundDevice = result.device
            val name = result.scanRecord?.deviceName ?: result.device.name ?: "Re:Bloom Speaker"
            _state.value = ProvisioningState.DeviceFound(DiscoveredDevice(name, result.device.address, result.rssi))
        }
        override fun onScanFailed(errorCode: Int) {
            _state.value = ProvisioningState.Fail("BLE 스캔 오류 (코드: $errorCode)")
        }
    }

    // ─── 연결 및 Provisioning ──────────────────────

    fun connectAndProvision(ssid: String, password: String) {
        val device = foundDevice ?: return run { _state.value = ProvisioningState.Fail("기기를 먼저 스캔해주세요.") }
        if (ssid.isBlank()) { _state.value = ProvisioningState.Fail("Wi-Fi SSID를 입력해주세요."); return }
        pendingSsid = ssid
        _state.value = ProvisioningState.Connecting
        repository.connect(device, ssid, password)
    }

    fun retry() { foundDevice = null; _state.value = ProvisioningState.Idle }

    // ─── 이벤트 처리 ──────────────────────────────

    private fun handleBleEvent(event: BleEvent) {
        Log.d(TAG, "BleEvent: $event")
        when (event) {
            is BleEvent.Connected    -> _state.value = ProvisioningState.Connected
            is BleEvent.WriteDone    -> _state.value = ProvisioningState.WaitingResult
            is BleEvent.Disconnected -> if (_state.value !is ProvisioningState.Success) _state.value = ProvisioningState.Fail("연결이 끊겼습니다.")
            is BleEvent.StatusNotify -> when (event.status) {
                "CONNECTING" -> _state.value = ProvisioningState.WaitingResult
                "SUCCESS"    -> _state.value = ProvisioningState.Success(pendingSsid)
                "FAIL"       -> _state.value = ProvisioningState.Fail("Wi-Fi 연결 실패. SSID와 비밀번호를 확인해주세요.")
            }
            is BleEvent.Error        -> _state.value = ProvisioningState.Fail(event.message)
        }
    }

    override fun onCleared() {
        super.onCleared()
        stopScan()
        repository.disconnect()
    }
}
