package com.rebloom.watch.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.rebloom.watch.model.AccelerometerData
import com.rebloom.watch.model.HeartRateData
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
            Log.d(TAG, "Heart rate received: hr=$hr, ibiCount=${ibiList.size}")
            repository.addHeartRateData(
                HeartRateData(
                    timestamp = System.currentTimeMillis(),
                    hr = hr,
                    ibi = ibiList.map { it.toDouble() }
                )
            )
        }

        sensor.onAccelerometerReceived = { x, y, z ->
            Log.d(TAG, "Accelerometer received: x=$x, y=$y, z=$z")
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
            Log.d(
                TAG,
                "Biometric record ready: hr=${record.hr}, rmssd=${record.rmssd}, lfHf=${record.lfHf}"
            )
            val dataMap = com.google.android.gms.wearable.PutDataMapRequest.create("/biometric/${record.tsStart}").apply {
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

            com.google.android.gms.wearable.Wearable.getDataClient(this)
                .putDataItem(dataMap)
                .addOnSuccessListener {
                    Log.d(TAG, "Biometric DataItem sent: tsStart=${record.tsStart}")
                }
                .addOnFailureListener { error ->
                    Log.e(TAG, "Biometric DataItem send failed: ${error.message}", error)
                }
        }

        locationSensor.onLocationReceived = { location ->
            val dataMap = com.google.android.gms.wearable.PutDataMapRequest.create("/location/${location.timestamp}").apply {
                dataMap.putLong("timestamp", location.timestamp)
                dataMap.putDouble("latitude", location.latitude)
                dataMap.putDouble("longitude", location.longitude)
                location.accuracy?.let { dataMap.putFloat("accuracy", it) }
                location.provider?.let { dataMap.putString("provider", it) }
            }.asPutDataRequest().setUrgent()

            com.google.android.gms.wearable.Wearable.getDataClient(this)
                .putDataItem(dataMap)
                .addOnSuccessListener {
                    Log.d(
                        TAG,
                        "Location DataItem sent: lat=${location.latitude}, lon=${location.longitude}"
                    )
                }
                .addOnFailureListener { error ->
                    Log.e(TAG, "Location DataItem send failed: ${error.message}", error)
                }
        }

        sensor.connect()
        locationSensor.connect()
    }

    override fun onDestroy() {
        super.onDestroy()
        sensor.disconnect()
        locationSensor.disconnect()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotification(): Notification {
        val channelId = "biometric_channel"
        val channel = NotificationChannel(
            channelId,
            "생체데이터 수집",
            NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)

        return Notification.Builder(this, channelId)
            .setContentTitle("생체데이터 수집 중")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()
    }

    private companion object {
        private const val TAG = "BiometricService"
    }
}
