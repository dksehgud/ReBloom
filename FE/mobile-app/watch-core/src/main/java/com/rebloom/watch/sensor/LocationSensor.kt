package com.rebloom.watch.sensor

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.rebloom.watch.model.LocationData

class LocationSensor(
    private val context: Context
) {
    private val locationManager =
        context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    private var listener: LocationListener? = null

    var onLocationReceived: ((LocationData) -> Unit)? = null

    fun connect() {
        if (!hasLocationPermission()) {
            Log.w(TAG, "Location permission is not granted")
            return
        }

        Log.d(
            TAG,
            "connect gpsEnabled=${isProviderEnabled(LocationManager.GPS_PROVIDER)} " +
                "networkEnabled=${isProviderEnabled(LocationManager.NETWORK_PROVIDER)}"
        )

        val locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                Log.d(
                    TAG,
                    "onLocationChanged provider=${location.provider} " +
                        "lat=${location.latitude}, lon=${location.longitude}, " +
                        "accuracy=${if (location.hasAccuracy()) location.accuracy else null}"
                )
                onLocationReceived?.invoke(
                    LocationData(
                        timestamp = location.time.takeIf { it > 0 } ?: System.currentTimeMillis(),
                        latitude = location.latitude,
                        longitude = location.longitude,
                        accuracy = if (location.hasAccuracy()) location.accuracy else null,
                        provider = location.provider
                    )
                )
            }

            override fun onProviderEnabled(provider: String) = Unit
            override fun onProviderDisabled(provider: String) = Unit
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
        }

        listener = locationListener

        requestUpdates(LocationManager.GPS_PROVIDER, locationListener)
        requestUpdates(LocationManager.NETWORK_PROVIDER, locationListener)

        val lastKnownLocation = getBestLastKnownLocation()
        if (lastKnownLocation == null) {
            Log.d(TAG, "No last known location available")
        } else {
            Log.d(TAG, "Using last known location provider=${lastKnownLocation.provider}")
            locationListener.onLocationChanged(lastKnownLocation)
        }
    }

    fun disconnect() {
        listener?.let { locationManager.removeUpdates(it) }
        listener = null
    }

    private fun requestUpdates(provider: String, listener: LocationListener) {
        if (!hasLocationPermission()) return
        if (!isProviderEnabled(provider)) {
            Log.w(TAG, "Provider disabled: $provider")
            return
        }

        try {
            locationManager.requestLocationUpdates(
                provider,
                LOCATION_INTERVAL_MS,
                LOCATION_MIN_DISTANCE_METERS,
                listener,
                Looper.getMainLooper()
            )
            Log.d(TAG, "Requested location updates from $provider")
        } catch (_: SecurityException) {
            Log.w(TAG, "Missing permission while requesting $provider")
            return
        } catch (_: IllegalArgumentException) {
            Log.w(TAG, "Invalid provider while requesting $provider")
            return
        }
    }

    private fun isProviderEnabled(provider: String): Boolean =
        try {
            locationManager.isProviderEnabled(provider)
        } catch (_: IllegalArgumentException) {
            false
        }

    private fun getBestLastKnownLocation(): Location? {
        if (!hasLocationPermission()) return null

        return listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            .mapNotNull { provider ->
                try {
                    locationManager.getLastKnownLocation(provider)
                } catch (_: SecurityException) {
                    null
                } catch (_: IllegalArgumentException) {
                    null
                }
            }
            .maxByOrNull { it.time }
    }

    private fun hasLocationPermission(): Boolean {
        val fineGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarseGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        return fineGranted || coarseGranted
    }

    companion object {
        private const val TAG = "LocationSensor"
        private const val LOCATION_INTERVAL_MS = 10_000L
        private const val LOCATION_MIN_DISTANCE_METERS = 0f
    }
}
