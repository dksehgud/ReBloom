package com.rebloom.watch.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import com.rebloom.watch.model.AccelerometerData
import com.rebloom.watch.model.HeartRateData
import com.rebloom.watch.repository.BiometricRepository
import com.rebloom.watch.sensor.BiometricSensor

class BiometricService : Service() {

    private lateinit var sensor: BiometricSensor
    private lateinit var repository: BiometricRepository

    override fun onCreate() {
        super.onCreate()
        startForeground(1, createNotification())

        repository = BiometricRepository()
        sensor = BiometricSensor(this)

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
                dataMap.putBoolean("isSleeping", record.isSleeping)
                dataMap.putFloat("missingnessScore", record.missingnessScore)
            }.asPutDataRequest()

            com.google.android.gms.wearable.Wearable.getDataClient(this)
                .putDataItem(dataMap)
        }

        sensor.connect()
    }

    override fun onDestroy() {
        super.onDestroy()
        sensor.disconnect()
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
}