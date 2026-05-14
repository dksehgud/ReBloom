package com.rebloom.mobile.notification

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessaging
import com.rebloom.mobile.network.ApiClient
import com.rebloom.mobile.network.FcmTokenRequest
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine

object FcmTokenRegistrar {

    suspend fun registerCurrentToken(context: Context) {
        val token = getCurrentToken() ?: return
        registerToken(context, token)
    }

    suspend fun registerToken(context: Context, fcmToken: String) {
        runCatching {
            ApiClient.create(context).registerFcmToken(FcmTokenRequest(fcmToken))
        }.onSuccess {
            Log.d(TAG, "FCM token registered")
        }.onFailure { exception ->
            Log.w(TAG, "Failed to register FCM token", exception)
        }
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
}
