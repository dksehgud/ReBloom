package com.rebloom.mobile.provisioning.ui

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.rebloom.mobile.R

/**
 * BleProvisioningActivity.kt
 * ───────────────────────────
 * BleProvisioningFragment를 호스팅하는 Activity.
 * WebView(MainActivity)에서 JavaScript Bridge를 통해 startActivity()로 실행됨.
 *
 * JS 호출 예:
 *   Android.startBleProvisioning()
 */
class BleProvisioningActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ble_provisioning)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, BleProvisioningFragment())
                .commit()
        }
    }
}
