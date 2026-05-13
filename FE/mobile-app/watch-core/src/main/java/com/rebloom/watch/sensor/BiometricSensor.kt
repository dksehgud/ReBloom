package com.rebloom.watch.sensor

import android.content.Context
import android.util.Log
import com.samsung.android.service.health.tracking.ConnectionListener
import com.samsung.android.service.health.tracking.HealthTracker
import com.samsung.android.service.health.tracking.HealthTrackerException
import com.samsung.android.service.health.tracking.HealthTrackingService
import com.samsung.android.service.health.tracking.data.DataPoint
import com.samsung.android.service.health.tracking.data.HealthTrackerType
import com.samsung.android.service.health.tracking.data.ValueKey

class BiometricSensor(private val context: Context) {

    private var healthTrackingService: HealthTrackingService? = null

    var onHeartRateReceived: ((hr: Int, ibiList: List<Int>) -> Unit)? = null
    var onAccelerometerReceived: ((x: Int, y: Int, z: Int) -> Unit)? = null

    private val connectionListener = object : ConnectionListener {
        override fun onConnectionSuccess() {
            Log.d("BiometricSensor", "연결 성공!")
            startTracking()
        }
        override fun onConnectionEnded() {
            Log.d("BiometricSensor", "연결 종료")
        }
        override fun onConnectionFailed(e: HealthTrackerException) {
            Log.e("BiometricSensor", "연결 실패: errorCode=${e.errorCode}, msg=${e.message}")
            e.printStackTrace()
        }
    }

    fun connect() {
        healthTrackingService = HealthTrackingService(connectionListener, context)
        healthTrackingService?.connectService()
    }

    private fun startTracking() {
        startHeartRateTracking()
        startAccelerometerTracking()
    }

    private fun startHeartRateTracking() {
        val tracker = healthTrackingService
            ?.getHealthTracker(HealthTrackerType.HEART_RATE_CONTINUOUS) ?: return

        tracker.setEventListener(object : HealthTracker.TrackerEventListener {
            override fun onDataReceived(dataPoints: List<DataPoint>) {
                dataPoints.forEach { dp ->
                    val hr = dp.getValue(ValueKey.HeartRateSet.HEART_RATE)
                    val ibiList = dp.getValue(ValueKey.HeartRateSet.IBI_LIST)
                    Log.d("BiometricSensor", "HR: $hr, IBI: $ibiList")
                    onHeartRateReceived?.invoke(hr, ibiList)
                }
            }
            override fun onFlushCompleted() {}
            override fun onError(error: HealthTracker.TrackerError) {}
        })
    }

    private fun startAccelerometerTracking() {
        val tracker = healthTrackingService
            ?.getHealthTracker(HealthTrackerType.ACCELEROMETER_CONTINUOUS) ?: return

        tracker.setEventListener(object : HealthTracker.TrackerEventListener {
            override fun onDataReceived(dataPoints: List<DataPoint>) {
                dataPoints.forEach { dp ->
                    val x = dp.getValue(ValueKey.AccelerometerSet.ACCELEROMETER_X)
                    val y = dp.getValue(ValueKey.AccelerometerSet.ACCELEROMETER_Y)
                    val z = dp.getValue(ValueKey.AccelerometerSet.ACCELEROMETER_Z)
                    Log.d("BiometricSensor", "ACC x: $x, y: $y, z: $z")
                    onAccelerometerReceived?.invoke(x, y, z)
                }
            }
            override fun onFlushCompleted() {}
            override fun onError(error: HealthTracker.TrackerError) {}
        })
    }

    fun disconnect() {
        healthTrackingService?.disconnectService()
    }
}