package com.rebloom.mobile.webview.bridge

data class BridgeResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null,
)
