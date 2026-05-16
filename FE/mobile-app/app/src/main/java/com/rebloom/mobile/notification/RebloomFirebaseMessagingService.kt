package com.rebloom.mobile.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.google.android.gms.wearable.Wearable
import com.rebloom.mobile.webview.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class RebloomFirebaseMessagingService : FirebaseMessagingService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        scope.launch {
            FcmTokenRegistrar.registerToken(applicationContext, token)
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        if (isGpsCheckRequest(message.data)) {
            requestWatchLocation()
            if (message.notification == null) {
                return
            }
        }

        val title = message.notification?.title ?: message.data["title"] ?: DEFAULT_TITLE
        val body = message.notification?.body
            ?: message.data.getOrDefault("content", DEFAULT_BODY)
                .ifBlank { DEFAULT_BODY }

        showNotification(title, body)
    }

    private fun isGpsCheckRequest(data: Map<String, String>): Boolean {
        return data["type"] == GPS_CHECK_REQUEST_TYPE ||
            data["topic"] == GPS_CHECK_REQUEST_TOPIC
    }

    private fun requestWatchLocation() {
        Wearable.getNodeClient(this)
            .connectedNodes
            .addOnSuccessListener { nodes ->
                nodes.forEach { node ->
                    Wearable.getMessageClient(this)
                        .sendMessage(node.id, LOCATION_REQUEST_PATH, ByteArray(0))
                        .addOnSuccessListener {
                            android.util.Log.d(
                                TAG,
                                "GPS check location request sent to watch node=${node.id}"
                            )
                        }
                        .addOnFailureListener { error ->
                            android.util.Log.e(
                                TAG,
                                "GPS check location request failed: ${error.message}"
                            )
                        }
                }
            }
            .addOnFailureListener { error ->
                android.util.Log.e(TAG, "Failed to load connected watch nodes: ${error.message}")
            }
    }

    private fun showNotification(title: String, body: String) {
        val notificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        createNotificationChannel(notificationManager)

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannel(notificationManager: NotificationManager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        )
        notificationManager.createNotificationChannel(channel)
    }

    companion object {
        private const val CHANNEL_ID = "rebloom_notification"
        private const val CHANNEL_NAME = "Re:Bloom notification"
        private const val DEFAULT_TITLE = "Re:Bloom"
        private const val DEFAULT_BODY = "You have a new notification."
        private const val GPS_CHECK_REQUEST_TYPE = "GPS_CHECK_REQUEST"
        private const val GPS_CHECK_REQUEST_TOPIC = "rebloom.gps-check.requested.v1"
        private const val LOCATION_REQUEST_PATH = "/location/request"
        private const val TAG = "RebloomFCM"
    }
}

