package com.rebloom.mobile.provisioning

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
import com.rebloom.mobile.provisioning.data.BleProvisioningRepository
import com.rebloom.mobile.provisioning.data.BleProvisioningRepository.BleEvent
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * BleProvisioningViewModel.kt
 * ────────────────────────────
 * BLE Provisioning 전체 흐름을 조율하는 ViewModel.
 *
 * [Fragment와 통신]
 *   - state: StateFlow<ProvisioningState> — UI 상태 구독
 *   - startScan() / stopScan() — BLE 스캔 제어
 *   - connectAndProvision() — 기기 선택 + Wi-Fi 정보 전달
 *   - retry() — 실패 후 재시도
 */
@SuppressLint("MissingPermission")
class BleProvisioningViewModel(
    private val context: Context,
    private val repository: BleProvisioningRepository = BleProvisioningRepository(context),
) : ViewModel() {

    companion object {
        private const val TAG = "BleVM"
        private const val UUID_SCAN_TIMEOUT_MS  = 7_000L   // 1단계: UUID 필터 스캔 타임아웃
        private const val FALLBACK_SCAN_TIMEOUT_MS = 8_000L // 2단계: 필터 없는 폴백 스캔 타임아웃
        val TARGET_SERVICE_UUID = ParcelUuid.fromString("0000fe10-0000-1000-8000-00805f9b34fb")
        // RPi5 기기 이름 매칭 키워드 (대소문자 무시) — 폴백 스캔에서 사용
        private val DEVICE_NAME_KEYWORDS = listOf("rebloom", "re:bloom", "bloom")
    }

    // ─────────────────────────────────────────────
    // 상태
    // ─────────────────────────────────────────────
    private val _state = MutableStateFlow<ProvisioningState>(ProvisioningState.Idle)
    val state: StateFlow<ProvisioningState> = _state.asStateFlow()

    private var scanTimeoutJob: Job? = null
    private var foundBluetoothDevice: BluetoothDevice? = null

    private val bluetoothAdapter: BluetoothAdapter? by lazy {
        (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
    }

    init {
        // Repository 이벤트 구독
        viewModelScope.launch {
            repository.events.collect { event -> handleBleEvent(event) }
        }
    }

    // ─────────────────────────────────────────────
    // BLE 스캔
    // ─────────────────────────────────────────────

    fun startScan() {
        val adapter = bluetoothAdapter
        if (adapter == null || !adapter.isEnabled) {
            _state.value = ProvisioningState.BleUnavailable
            return
        }

        Log.d(TAG, "BLE 스캔 시작 (1단계: UUID 필터)")
        _state.value = ProvisioningState.Scanning

        startScanWithUuidFilter(adapter)
    }

    /** 1단계: UUID 필터로 스캔 — 가장 정확하지만 일부 기기/광고 형식에서 미탐지 */
    private fun startScanWithUuidFilter(adapter: BluetoothAdapter) {
        val filter = ScanFilter.Builder()
            .setServiceUuid(TARGET_SERVICE_UUID)
            .build()

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            // FIRST_MATCH 대신 ALL_MATCHES — 삼성 등 일부 기기에서 FIRST_MATCH가 누락될 수 있음
            .setCallbackType(ScanSettings.CALLBACK_TYPE_ALL_MATCHES)
            .setMatchMode(ScanSettings.MATCH_MODE_AGGRESSIVE)
            .setNumOfMatches(ScanSettings.MATCH_NUM_ONE_ADVERTISEMENT)
            .build()

        adapter.bluetoothLeScanner?.startScan(listOf(filter), settings, scanCallback)

        // UUID 필터로 7초 내 못 찾으면 2단계(필터 없음)로 전환
        scanTimeoutJob?.cancel()
        scanTimeoutJob = viewModelScope.launch {
            delay(UUID_SCAN_TIMEOUT_MS)
            if (_state.value == ProvisioningState.Scanning) {
                adapter.bluetoothLeScanner?.stopScan(scanCallback)
                Log.d(TAG, "UUID 필터 스캔 타임아웃 → 2단계 폴백 스캔 시작")
                startFallbackScan(adapter)
            }
        }
    }

    /** 2단계: 필터 없이 전체 스캔 후 이름으로 매칭 — UUID가 광고 패킷에 없는 경우 대응 */
    private fun startFallbackScan(adapter: BluetoothAdapter) {
        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .setCallbackType(ScanSettings.CALLBACK_TYPE_ALL_MATCHES)
            .build()

        adapter.bluetoothLeScanner?.startScan(null, settings, fallbackScanCallback)
        Log.d(TAG, "2단계 폴백 스캔 시작 (이름 매칭)")

        scanTimeoutJob?.cancel()
        scanTimeoutJob = viewModelScope.launch {
            delay(FALLBACK_SCAN_TIMEOUT_MS)
            if (_state.value == ProvisioningState.Scanning) {
                stopScan()
                _state.value = ProvisioningState.Fail(
                    "Re:Bloom 기기를 찾지 못했습니다.\n• 기기가 켜져 있는지 확인해주세요.\n• 위치 서비스(GPS)를 활성화해주세요."
                )
            }
        }
    }

    fun stopScan() {
        scanTimeoutJob?.cancel()
        bluetoothAdapter?.bluetoothLeScanner?.let { scanner ->
            scanner.stopScan(scanCallback)
            scanner.stopScan(fallbackScanCallback)
        }
        Log.d(TAG, "BLE 스캔 중단")
    }

    /** 1단계 UUID 필터 스캔 콜백 */
    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            stopScan()
            val device = result.device
            val name = result.scanRecord?.deviceName ?: device.name ?: "Re:Bloom Speaker"
            Log.d(TAG, "[1단계] 기기 발견: $name (${device.address}), RSSI=${result.rssi}")

            foundBluetoothDevice = device
            _state.value = ProvisioningState.DeviceFound(
                DiscoveredDevice(
                    name = name,
                    address = device.address,
                    rssi = result.rssi,
                )
            )
        }

        override fun onScanFailed(errorCode: Int) {
            Log.e(TAG, "[1단계] BLE 스캔 실패: errorCode=$errorCode")
            _state.value = ProvisioningState.Fail("BLE 스캔 오류 (코드: $errorCode)")
        }
    }

    /** 2단계 필터 없는 폴백 스캔 콜백 — 이름으로 기기 매칭 */
    private val fallbackScanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val device = result.device
            val name = (result.scanRecord?.deviceName ?: device.name ?: "").lowercase()

            // 이름에 키워드가 포함된 경우만 매칭
            val isTarget = DEVICE_NAME_KEYWORDS.any { keyword -> name.contains(keyword) }
            if (!isTarget) return

            stopScan()
            val displayName = result.scanRecord?.deviceName ?: device.name ?: "Re:Bloom Speaker"
            Log.d(TAG, "[2단계] 기기 발견: $displayName (${device.address}), RSSI=${result.rssi}")

            foundBluetoothDevice = device
            _state.value = ProvisioningState.DeviceFound(
                DiscoveredDevice(
                    name = displayName,
                    address = device.address,
                    rssi = result.rssi,
                )
            )
        }

        override fun onScanFailed(errorCode: Int) {
            Log.e(TAG, "[2단계] BLE 폴백 스캔 실패: errorCode=$errorCode")
            _state.value = ProvisioningState.Fail("BLE 스캔 오류 (코드: $errorCode)")
        }
    }

    // ─────────────────────────────────────────────
    // 연결 및 Provisioning
    // ─────────────────────────────────────────────

    /**
     * 사용자가 기기를 선택하고 Wi-Fi 정보를 입력한 후 호출.
     * @param ssid     연결할 Wi-Fi SSID
     * @param password Wi-Fi 비밀번호
     */
    fun connectAndProvision(ssid: String, password: String) {
        val device = foundBluetoothDevice
        if (device == null) {
            _state.value = ProvisioningState.Fail("기기 정보가 없습니다. 다시 스캔해주세요.")
            return
        }
        if (ssid.isBlank()) {
            _state.value = ProvisioningState.Fail("Wi-Fi SSID를 입력해주세요.")
            return
        }

        Log.d(TAG, "GATT 연결 시작: ${device.address}")
        _state.value = ProvisioningState.Connecting
        repository.connect(device, ssid, password)
    }

    fun retry() {
        foundBluetoothDevice = null
        _state.value = ProvisioningState.Idle
    }

    // ─────────────────────────────────────────────
    // Repository 이벤트 처리
    // ─────────────────────────────────────────────

    private fun handleBleEvent(event: BleEvent) {
        Log.d(TAG, "BleEvent 수신: $event")
        when (event) {
            is BleEvent.Connected    -> _state.value = ProvisioningState.Connected
            is BleEvent.WriteDone    -> _state.value = ProvisioningState.WaitingResult
            is BleEvent.Disconnected -> {
                // SUCCESS 후 disconnect는 정상 흐름이므로 무시
                if (_state.value !is ProvisioningState.Success) {
                    _state.value = ProvisioningState.Fail("연결이 끊겼습니다.")
                }
            }
            is BleEvent.StatusNotify -> handleStatusNotify(event.status)
            is BleEvent.Error        -> _state.value = ProvisioningState.Fail(event.message)
        }
    }

    private fun handleStatusNotify(status: String) {
        when (status) {
            "CONNECTING" -> _state.value = ProvisioningState.WaitingResult
            "SUCCESS"    -> {
                val ssid = (foundBluetoothDevice?.name ?: "홈 Wi-Fi")
                _state.value = ProvisioningState.Success(ssid)
            }
            "FAIL"       -> _state.value = ProvisioningState.Fail("Wi-Fi 연결 실패. SSID와 비밀번호를 확인해주세요.")
            else         -> Log.w(TAG, "알 수 없는 STATUS: $status")
        }
    }

    override fun onCleared() {
        super.onCleared()
        stopScan()
        repository.disconnect()
    }
}
