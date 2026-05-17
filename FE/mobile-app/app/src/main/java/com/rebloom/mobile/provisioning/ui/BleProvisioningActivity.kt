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

    companion object {
        const val EXTRA_CHILDREN_ID = "childrenId"
        const val EXTRA_ROLE = "role"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ble_provisioning)

        if (savedInstanceState == null) {
            val fragment = BleProvisioningFragment().apply {
                arguments = Bundle().apply {
                    putString(EXTRA_ROLE, intent.getStringExtra(EXTRA_ROLE) ?: "child")
                    putString(EXTRA_CHILDREN_ID, intent.getStringExtra(EXTRA_CHILDREN_ID))
                }
            }
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commit()
        }
    }
}
