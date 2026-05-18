package com.rebloom.mobile.network

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.JavascriptInterface
import com.rebloom.mobile.notification.FcmTokenRegistrar
import com.rebloom.mobile.permission.SleepPermissionActivity
import com.rebloom.mobile.provisioning.ui.BleProvisioningActivity
import com.samsung.android.sdk.health.data.HealthDataService
import com.samsung.android.sdk.health.data.permission.AccessType
import com.samsung.android.sdk.health.data.permission.Permission
import com.samsung.android.sdk.health.data.request.DataTypes
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

class TokenBridge(
    private val context: Context,
    private val clearWebHistory: (() -> Unit)? = null,
) {

    private val scope = CoroutineScope(Dispatchers.IO)
    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun saveToken(token: String) {
        scope.launch {
            TokenDataStore.saveToken(context, token)
            FcmTokenRegistrar.registerCurrentToken(context)
            Log.d("TokenBridge", "Token saved")
        }
    }

    @JavascriptInterface
    fun clearToken() {
        scope.launch {
            val accessToken = TokenDataStore.getToken(context)
            FcmTokenRegistrar.deactivateCurrentToken(context, accessToken)
            TokenDataStore.clearToken(context)
            Log.d("TokenBridge", "Token cleared")
        }
    }

    @JavascriptInterface
    fun clearHistory() {
        mainHandler.post {
            clearWebHistory?.invoke()
            Log.d("TokenBridge", "WebView history cleared")
        }
    }

    @JavascriptInterface
    fun checkSleepPermission() {
        scope.launch {
            try {
                val store = HealthDataService.getStore(context)
                val permissions = setOf(Permission.of(DataTypes.SLEEP, AccessType.READ))
                val granted = store.getGrantedPermissions(permissions)
                if (granted.containsAll(permissions)) {
                    Log.d("TokenBridge", "Sleep permission already granted")
                    return@launch
                }
                val intent = Intent(context, SleepPermissionActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            } catch (e: Exception) {
                Log.e("TokenBridge", "Sleep permission check failed: ${e.message}")
            }
        }
    }

    @JavascriptInterface
    fun startBleProvisioning() {
        startBleProvisioning("""{"role":"child"}""")
    }

    @JavascriptInterface
    fun startBleProvisioning(payloadJson: String?) {
        val payload = payloadJson
            ?.takeIf { it.isNotBlank() }
            ?.let { runCatching { JSONObject(it) }.getOrNull() }
        val intent = Intent(context, BleProvisioningActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(
                BleProvisioningActivity.EXTRA_ROLE,
                payload?.optString("role")?.takeIf { it.isNotBlank() } ?: "child",
            )
            payload?.optString("childrenId")
                ?.takeIf { it.isNotBlank() }
                ?.let { putExtra(BleProvisioningActivity.EXTRA_CHILDREN_ID, it) }
        }
        context.startActivity(intent)
    }
}
