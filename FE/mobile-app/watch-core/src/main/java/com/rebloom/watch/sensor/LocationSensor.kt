package com.rebloom.watch.sensor

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.rebloom.watch.model.LocationData

@Deprecated("GPS flow removed")
class LocationSensor(
    private val context: Context
) {
    private val locationManager =
        context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    private var listener: LocationListener? = null
    private val retryHandler = Handler(Looper.getMainLooper())
    private var retryCount = 0
    private var hasReceivedLocation = false

    var onLocationReceived: ((LocationData) -> Unit)? = null

    fun requestSingleLocation(
        timeoutMs: Long = SINGLE_LOCATION_TIMEOUT_MS,
        onResult: (LocationData) -> Unit,
        onError: (String) -> Unit
    ) {
        if (!hasLocationPermission()) {
            onError("Location permission is not granted")
            return
        }

        var completed = false
        val singleListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                if (completed) return
                completed = true
                retryHandler.removeCallbacksAndMessages(null)
                locationManager.removeUpdates(this)
                onResult(location.toLocationData())
            }

            override fun onProviderEnabled(provider: String) = Unit
            override fun onProviderDisabled(provider: String) = Unit
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
        }

        val requested = requestSingleUpdate(LocationManager.GPS_PROVIDER, singleListener) or
            requestSingleUpdate(LocationManager.NETWORK_PROVIDER, singleListener)

        if (!requested) {
            onError("No enabled location provider is available")
            return
        }

        retryHandler.postDelayed({
            if (!completed) {
                completed = true
                locationManager.removeUpdates(singleListener)
                onError("Location request timed out")
            }
        }, timeoutMs)
    }

    fun connect() {
        Log.d(TAG, "connect() called")
        if (!hasLocationPermission()) {
            Log.e(TAG, "Location permission is not granted")
            return
        }

        val locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                hasReceivedLocation = true
                retryCount = 0
                retryHandler.removeCallbacksAndMessages(null)
                Log.d(
                    TAG,
                    "Location changed: provider=${location.provider}, lat=${location.latitude}, lon=${location.longitude}, accuracy=${location.accuracy}"
                )
                onLocationReceived?.invoke(
                    location.toLocationData()
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
            Log.d(TAG, "No last known location")
            scheduleLocationRetry()
        } else {
            Log.d(TAG, "Using last known location from ${lastKnownLocation.provider}")
            locationListener.onLocationChanged(lastKnownLocation)
        }
    }

    fun disconnect() {
        Log.d(TAG, "disconnect() called")
        retryHandler.removeCallbacksAndMessages(null)
        listener?.let { locationManager.removeUpdates(it) }
        listener = null
    }

    private fun requestUpdates(provider: String, listener: LocationListener) {
        if (!hasLocationPermission()) {
            Log.e(TAG, "Cannot request $provider updates: permission is not granted")
            scheduleLocationRetry()
            return
        }

        if (!locationManager.isProviderEnabled(provider)) {
            Log.e(TAG, "Cannot request $provider updates: provider is disabled")
            scheduleLocationRetry()
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
            Log.d(TAG, "Requested $provider updates")
        } catch (_: SecurityException) {
            Log.e(TAG, "Cannot request $provider updates: security exception")
            scheduleLocationRetry()
            return
        } catch (error: IllegalArgumentException) {
            Log.e(TAG, "Cannot request $provider updates: ${error.message}")
            scheduleLocationRetry()
            return
        }
    }

    private fun requestSingleUpdate(provider: String, listener: LocationListener): Boolean {
        if (!locationManager.isProviderEnabled(provider)) {
            Log.e(TAG, "Cannot request single $provider update: provider is disabled")
            return false
        }

        return try {
            locationManager.requestLocationUpdates(
                provider,
                0L,
                0f,
                listener,
                Looper.getMainLooper()
            )
            Log.d(TAG, "Requested single $provider update")
            true
        } catch (_: SecurityException) {
            Log.e(TAG, "Cannot request single $provider update: security exception")
            false
        } catch (error: IllegalArgumentException) {
            Log.e(TAG, "Cannot request single $provider update: ${error.message}")
            false
        }
    }

    private fun scheduleLocationRetry() {
        if (hasReceivedLocation || retryCount >= MAX_LOCATION_RETRY_COUNT) return

        retryCount += 1
        Log.d(TAG, "Scheduling location retry $retryCount/$MAX_LOCATION_RETRY_COUNT")
        retryHandler.removeCallbacksAndMessages(null)
        retryHandler.postDelayed({
            if (!hasReceivedLocation && listener != null) {
                listener?.let { locationManager.removeUpdates(it) }
                listener = null
                connect()
            }
        }, LOCATION_RETRY_DELAY_MS)
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

        Log.d(TAG, "Location permission fine=$fineGranted, coarse=$coarseGranted")
        return fineGranted || coarseGranted
    }

    private fun Location.toLocationData(): LocationData {
        return LocationData(
            timestamp = time.takeIf { it > 0 } ?: System.currentTimeMillis(),
            latitude = latitude,
            longitude = longitude,
            accuracy = if (hasAccuracy()) accuracy else null,
            provider = provider
        )
    }

    companion object {
        private const val TAG = "LocationSensor"
        private const val LOCATION_INTERVAL_MS = 10_000L
        private const val LOCATION_MIN_DISTANCE_METERS = 0f
        private const val LOCATION_RETRY_DELAY_MS = 15_000L
        private const val MAX_LOCATION_RETRY_COUNT = 3
        private const val SINGLE_LOCATION_TIMEOUT_MS = 15_000L
    }
}

