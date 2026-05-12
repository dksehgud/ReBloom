package com.rebloom.mobile.wear

import android.util.Log
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService
import com.rebloom.mobile.network.ApiClient
import com.rebloom.mobile.network.BiometricRequest
import com.rebloom.mobile.network.LocationEvaluateRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WearDataListenerService : WearableListenerService() {

    private val scope = CoroutineScope(Dispatchers.IO)
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents.forEach { event ->
            if (event.type != DataEvent.TYPE_CHANGED) {
                return@forEach
            }

            when {
                event.dataItem.uri.path?.startsWith("/biometric/") == true -> handleBiometric(event)
                event.dataItem.uri.path?.startsWith("/location/") == true -> handleLocation(event)
            }
        }
    }

    private fun handleBiometric(event: DataEvent) {
        val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap

        val tsStart = dataMap.getLong("tsStart")
        val tsEnd = dataMap.getLong("tsEnd")
        val hr = dataMap.getFloat("hr")
        val ibi = dataMap.getFloat("ibi")
        val accXAvg = dataMap.getFloat("accXAvg")
        val accYAvg = dataMap.getFloat("accYAvg")
        val accZAvg = dataMap.getFloat("accZAvg")
        val accMag = dataMap.getFloat("accMag")
        val rmssd = dataMap.getFloat("rmssd")
        val pnn50 = dataMap.getFloat("pnn50")
        val lfHf = dataMap.getFloat("lfHf")
        val hrAccRatio = dataMap.getFloat("hrAccRatio")
        val missingnessScore = dataMap.getFloat("missingnessScore")

        Log.d(TAG, "Biometric received: hr=$hr, rmssd=$rmssd, lfHf=$lfHf")

        sendBiometric(
            tsStart, tsEnd, hr, ibi,
            accXAvg, accYAvg, accZAvg, accMag,
            rmssd, pnn50, lfHf, hrAccRatio, missingnessScore
        )
    }

    private fun handleLocation(event: DataEvent) {
        val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap

        val timestamp = dataMap.getLong("timestamp")
        val latitude = dataMap.getDouble("latitude")
        val longitude = dataMap.getDouble("longitude")

        Log.d(TAG, "Location received: lat=$latitude, lon=$longitude")

        sendLocation(timestamp, latitude, longitude)
    }

    private fun sendBiometric(
        tsStart: Long, tsEnd: Long,
        hr: Float, ibi: Float,
        accXAvg: Float, accYAvg: Float, accZAvg: Float,
        accMag: Float,
        rmssd: Float, pnn50: Float,
        lfHf: Float, hrAccRatio: Float,
        missingnessScore: Float
    ) {
        scope.launch {
            try {
                val request = BiometricRequest(
                    userId = "TODO: extract userId from token",
                    tsStart = dateFormat.format(Date(tsStart)),
                    tsEnd = dateFormat.format(Date(tsEnd)),
                    hr = hr,
                    ibi = ibi,
                    rmssd = rmssd,
                    pnn50 = pnn50,
                    lfHf = lfHf,
                    accXAvg = accXAvg,
                    accYAvg = accYAvg,
                    accZAvg = accZAvg,
                    accMag = accMag,
                    hrAccRatio = hrAccRatio,
                    missingnessScore = missingnessScore
                )

                val response = ApiClient.create(applicationContext).sendBiometric(request)
                Log.d(TAG, "Biometric send success: ${response.message}")

            } catch (e: Exception) {
                Log.e(TAG, "Biometric send failed: ${e.message}")
            }
        }
    }

    private fun sendLocation(
        timestamp: Long,
        latitude: Double,
        longitude: Double
    ) {
        scope.launch {
            try {
                val request = LocationEvaluateRequest(
                    user_id = "TODO: extract userId from token",
                    latitude = latitude,
                    longitude = longitude,
                    measured_at = dateFormat.format(Date(timestamp))
                )

                val response = ApiClient.create(applicationContext).evaluateLocation(request)
                Log.d(
                    TAG,
                    "Location evaluate success: matched=${response.matched}, action=${response.action}"
                )

            } catch (e: Exception) {
                Log.e(TAG, "Location evaluate failed: ${e.message}")
            }
        }
    }

    private companion object {
        private const val TAG = "WearDataListener"
    }
}
