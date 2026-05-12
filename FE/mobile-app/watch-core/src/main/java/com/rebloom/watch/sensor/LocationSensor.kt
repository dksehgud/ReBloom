package com.rebloom.watch.sensor

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
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
        if (!hasLocationPermission()) return

        val locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
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

        getBestLastKnownLocation()?.let(locationListener::onLocationChanged)
    }

    fun disconnect() {
        listener?.let { locationManager.removeUpdates(it) }
        listener = null
    }

    private fun requestUpdates(provider: String, listener: LocationListener) {
        if (!hasLocationPermission() || !locationManager.isProviderEnabled(provider)) return

        try {
            locationManager.requestLocationUpdates(
                provider,
                LOCATION_INTERVAL_MS,
                LOCATION_MIN_DISTANCE_METERS,
                listener,
                Looper.getMainLooper()
            )
        } catch (_: SecurityException) {
            return
        } catch (_: IllegalArgumentException) {
            return
        }
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
        private const val LOCATION_INTERVAL_MS = 60_000L
        private const val LOCATION_MIN_DISTANCE_METERS = 10f
    }
}

