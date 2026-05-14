package com.rebloom.watch.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import com.rebloom.watch.model.AccelerometerData
import com.rebloom.watch.model.HeartRateData
import com.rebloom.watch.model.LocationData
import com.rebloom.watch.repository.BiometricRepository
import com.rebloom.watch.sensor.BiometricSensor
import com.rebloom.watch.sensor.LocationSensor

class BiometricService : Service() {

    private lateinit var sensor: BiometricSensor
    private lateinit var locationSensor: LocationSensor
    private lateinit var repository: BiometricRepository

    override fun onCreate() {
        super.onCreate()
        startForeground(1, createNotification())

        repository = BiometricRepository()
        sensor = BiometricSensor(this)
        locationSensor = LocationSensor(this)

        sensor.onHeartRateReceived = { hr, ibiList ->
            repository.addHeartRateData(
                HeartRateData(
                    timestamp = System.currentTimeMillis(),
                    hr = hr,
                    ibi = ibiList.map { it.toDouble() }
                )
            )
        }

        sensor.onAccelerometerReceived = { x, y, z ->
            repository.addAccelerometerData(
                AccelerometerData(
                    timestamp = System.currentTimeMillis(),
                    acc_x = x.toDouble(),
                    acc_y = y.toDouble(),
                    acc_z = z.toDouble()
                )
            )
        }

        repository.onRecordReady = { record ->
            val dataRequest = PutDataMapRequest.create("/biometric/${record.tsStart}").apply {
                dataMap.putLong("tsStart", record.tsStart)
                dataMap.putLong("tsEnd", record.tsEnd)
                dataMap.putFloat("hr", record.hr)
                dataMap.putFloat("ibi", record.ibi)
                dataMap.putFloat("accXAvg", record.accXAvg)
                dataMap.putFloat("accYAvg", record.accYAvg)
                dataMap.putFloat("accZAvg", record.accZAvg)
                dataMap.putFloat("accMag", record.accMag)
                dataMap.putFloat("rmssd", record.rmssd)
                dataMap.putFloat("pnn50", record.pnn50)
                dataMap.putFloat("lfHf", record.lfHf)
                dataMap.putFloat("missingnessScore", record.missingnessScore)
                dataMap.putFloat("hrAccRatio", record.hrAccRatio)
            }.asPutDataRequest().setUrgent()

            Wearable.getDataClient(this)
                .putDataItem(dataRequest)
                .addOnSuccessListener {
                    Log.d(TAG, "Biometric data sent: ${record.tsStart}")
                }
                .addOnFailureListener { error ->
                    Log.e(TAG, "Biometric data send failed: ${error.message}")
                }
        }

        locationSensor.onLocationReceived = { location ->
            sendLocation(location)
        }

        sensor.connect()
        locationSensor.connect()
    }

    override fun onDestroy() {
        sensor.disconnect()
        locationSensor.disconnect()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun sendLocation(location: LocationData) {
        val dataRequest = PutDataMapRequest.create("/location/${location.timestamp}").apply {
            dataMap.putLong("timestamp", location.timestamp)
            dataMap.putDouble("latitude", location.latitude)
            dataMap.putDouble("longitude", location.longitude)
            location.accuracy?.let { dataMap.putFloat("accuracy", it) }
            location.provider?.let { dataMap.putString("provider", it) }
        }.asPutDataRequest().setUrgent()

        Wearable.getDataClient(this)
            .putDataItem(dataRequest)
            .addOnSuccessListener {
                Log.d(
                    TAG,
                    "Location data sent: lat=${location.latitude}, lon=${location.longitude}"
                )
            }
            .addOnFailureListener { error ->
                Log.e(TAG, "Location data send failed: ${error.message}")
            }
    }

    private fun createNotification(): Notification {
        val channelId = "biometric_channel"
        val channel = NotificationChannel(
            channelId,
            "Biometric data collection",
            NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)

        return Notification.Builder(this, channelId)
            .setContentTitle("Biometric data collection")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()
    }

    private companion object {
        private const val TAG = "BiometricService"
    }
}
