package com.rebloom.mobile.webview.bridge

import android.app.Activity
import android.content.Intent
import android.webkit.JavascriptInterface
import com.rebloom.mobile.provisioning.ui.BleProvisioningActivity

/**
 * BleBridge.kt
 * ─────────────
 * WebView JavaScript → BLE Provisioning Activity 실행 브릿지.
 *
 * [웹에서 호출 방법]
 *   Android.startBleProvisioning()
 *
 * [등록 위치]
 *   MainActivity.kt → webView.addJavascriptInterface(BleBridge(this), "Android")
 *   ※ 기존 TokenBridge와 같은 "Android" 네임스페이스에 통합됨.
 */
class BleBridge(private val activity: Activity) {

    /**
     * BLE Provisioning 화면을 실행한다.
     * 설정 페이지의 "기기 연결하기" 버튼에서 호출.
     */
    @JavascriptInterface
    fun startBleProvisioning() {
        activity.runOnUiThread {
            val intent = Intent(activity, BleProvisioningActivity::class.java)
            activity.startActivity(intent)
        }
    }
}
