package com.rebloom.mobile.network

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import com.rebloom.mobile.notification.FcmTokenRegistrar
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class TokenBridge(private val context: Context) {

    private val scope = CoroutineScope(Dispatchers.IO)

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
}
