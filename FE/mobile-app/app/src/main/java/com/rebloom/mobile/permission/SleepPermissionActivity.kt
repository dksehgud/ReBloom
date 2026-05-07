package com.rebloom.mobile.permission

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import com.samsung.android.sdk.health.data.HealthDataService
import com.samsung.android.sdk.health.data.permission.AccessType
import com.samsung.android.sdk.health.data.permission.Permission
import com.samsung.android.sdk.health.data.request.DataTypes
import kotlinx.coroutines.launch

class SleepPermissionActivity : ComponentActivity() {

    private var store: com.samsung.android.sdk.health.data.HealthDataStore? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lifecycleScope.launch {
            try {
                store = HealthDataService.getStore(this@SleepPermissionActivity)
                val permissions = setOf(
                    Permission.of(DataTypes.SLEEP, AccessType.READ)
                )
                store?.requestPermissions(permissions, this@SleepPermissionActivity)
                Log.d("SleepPermission", "권한 요청 완료")
            } catch (e: Exception) {
                Log.e("SleepPermission", "권한 요청 실패: ${e.message}")
            }
            // finish는 권한 요청 완료 후에
            finish()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        store = null
    }
}