package com.rebloom.app.provisioning

sealed class ProvisioningState {
    object Idle : ProvisioningState()
    object Scanning : ProvisioningState()
    data class DeviceFound(val device: DiscoveredDevice) : ProvisioningState()
    object Connecting : ProvisioningState()
    object Connected : ProvisioningState()
    object Writing : ProvisioningState()
    object WaitingResult : ProvisioningState()
    data class Success(val ssid: String) : ProvisioningState()
    data class Fail(val reason: String) : ProvisioningState()
    object PermissionRequired : ProvisioningState()
    object BleUnavailable : ProvisioningState()
}

data class DiscoveredDevice(
    val name: String,
    val address: String,
    val rssi: Int,
)
