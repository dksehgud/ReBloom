package com.rebloom.mobile.provisioning

/**
 * BLE Provisioning 전체 상태 머신
 *
 * IDLE → SCANNING → DEVICE_FOUND → CONNECTING → ENCRYPTING
 *      → WRITING → WAITING_RESULT → SUCCESS | FAIL
 */
sealed class ProvisioningState {

    /** 초기 상태 */
    object Idle : ProvisioningState()

    /** BLE 스캔 중 */
    object Scanning : ProvisioningState()

    /** Re:Bloom 기기 발견 — 사용자에게 선택 유도 */
    data class DeviceFound(val device: DiscoveredDevice) : ProvisioningState()

    /** GATT 연결 중 */
    object Connecting : ProvisioningState()

    /** GATT 연결됨 — Wi-Fi 정보 입력 대기 */
    object Connected : ProvisioningState()

    /** Wi-Fi 정보 암호화 후 Write 중 */
    object Writing : ProvisioningState()

    /** RPi5가 Wi-Fi 연결 시도 중 (CONNECTING Notify 수신) */
    object WaitingResult : ProvisioningState()

    /** Provisioning 완료 후 Gateway에 기기 등록 중 */
    object RegisteringDevice : ProvisioningState()

    /** Provisioning 완료 */
    data class Success(val ssid: String) : ProvisioningState()

    /** 실패 — 사용자에게 원인 메시지 표시 */
    data class Fail(val reason: String) : ProvisioningState()

    /** 권한 부족 */
    object PermissionRequired : ProvisioningState()

    /** BLE 미지원 또는 꺼짐 */
    object BleUnavailable : ProvisioningState()
}

/**
 * BLE 스캔으로 발견된 Re:Bloom 기기 정보
 */
data class DiscoveredDevice(
    val name: String,
    val address: String,
    val rssi: Int,
)
