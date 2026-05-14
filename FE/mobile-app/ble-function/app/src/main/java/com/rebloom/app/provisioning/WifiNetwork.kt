package com.rebloom.app.provisioning

data class WifiNetwork(
    val ssid: String,
    val rssi: Int,       // dBm
    val isSecured: Boolean,
) {
    /** 신호 세기를 0~4 단계로 반환 */
    val level: Int get() = when {
        rssi >= -55 -> 4
        rssi >= -65 -> 3
        rssi >= -75 -> 2
        rssi >= -85 -> 1
        else        -> 0
    }

    /** 신호 세기 아이콘 (텍스트 기반) */
    val signalIcon: String get() = when (level) {
        4    -> "▂▄▆█"
        3    -> "▂▄▆_"
        2    -> "▂▄__"
        1    -> "▂___"
        else -> "____"
    }
}
