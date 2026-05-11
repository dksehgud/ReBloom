package com.rebloom.mobile.network

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class TokenBridge(private val context: Context) {

    private val scope = CoroutineScope(Dispatchers.IO)

    @JavascriptInterface
    fun saveToken(token: String) {
        scope.launch {
            TokenDataStore.saveToken(context, token)
            Log.d("TokenBridge", "토큰 저장 완료")
        }
    }

    @JavascriptInterface
    fun clearToken() {
        scope.launch {
            TokenDataStore.clearToken(context)
            Log.d("TokenBridge", "토큰 삭제 완료")
        }
    }
}