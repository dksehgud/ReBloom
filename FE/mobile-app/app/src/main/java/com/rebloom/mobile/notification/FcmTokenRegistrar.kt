package com.rebloom.mobile.notification

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessaging
import com.rebloom.mobile.network.ApiClient
import com.rebloom.mobile.network.FcmTokenRequest
import kotlin.coroutines.resume
import kotlinx.coroutines.delay
import kotlinx.coroutines.suspendCancellableCoroutine

object FcmTokenRegistrar {

    suspend fun registerCurrentToken(context: Context) {
        val token = getCurrentToken() ?: return
        registerToken(context, token)
    }

    suspend fun registerToken(context: Context, fcmToken: String) {
        var lastException: Throwable? = null

        repeat(REGISTER_RETRY_COUNT) { attempt ->
            runCatching {
                ApiClient.create(context).registerFcmToken(FcmTokenRequest(fcmToken))
            }.onSuccess {
                Log.d(TAG, "FCM token registered")
                return
            }.onFailure { exception ->
                lastException = exception
                if (attempt < REGISTER_RETRY_COUNT - 1) {
                    delay(REGISTER_RETRY_DELAY_MS)
                }
            }
        }

        Log.w(TAG, "Failed to register FCM token", lastException)
    }

    suspend fun deactivateCurrentToken(context: Context, accessToken: String?) {
        if (accessToken.isNullOrBlank()) {
            Log.w(TAG, "Skip FCM token deactivation because access token is missing")
            return
        }

        val token = getCurrentToken() ?: return
        runCatching {
            ApiClient.create(context, accessToken).deactivateFcmToken(FcmTokenRequest(token))
        }.onSuccess {
            Log.d(TAG, "FCM token deactivated")
        }.onFailure { exception ->
            Log.w(TAG, "Failed to deactivate FCM token", exception)
        }
    }

    private suspend fun getCurrentToken(): String? =
        suspendCancellableCoroutine { continuation ->
            FirebaseMessaging.getInstance().token
                .addOnCompleteListener { task ->
                    if (!continuation.isActive) {
                        return@addOnCompleteListener
                    }

                    continuation.resume(
                        if (task.isSuccessful) task.result else null
                    )
                }
        }

    private const val TAG = "FcmTokenRegistrar"
    private const val REGISTER_RETRY_COUNT = 3
    private const val REGISTER_RETRY_DELAY_MS = 1_000L
}
