package com.rebloom.watch.service

import android.util.Log
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import com.rebloom.watch.model.LocationData
import com.rebloom.watch.sensor.LocationSensor

@Deprecated
class LocationRequestListenerService : WearableListenerService() {

    override fun onMessageReceived(messageEvent: MessageEvent) {
        super.onMessageReceived(messageEvent)

        if (messageEvent.path != LOCATION_REQUEST_PATH) {
            return
        }

        Log.d(TAG, "Location request received from mobile app")
        LocationSensor(this).requestSingleLocation(
            onResult = { location -> sendLocation(location) },
            onError = { error -> Log.e(TAG, "Location request failed: $error") }
        )
    }

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
                Log.d(TAG, "Location data sent: lat=${location.latitude}, lon=${location.longitude}")
            }
            .addOnFailureListener { error ->
                Log.e(TAG, "Location data send failed: ${error.message}")
            }
    }

    private companion object {
        private const val TAG = "LocationRequestListener"
        private const val LOCATION_REQUEST_PATH = "/location/request"
    }
}
