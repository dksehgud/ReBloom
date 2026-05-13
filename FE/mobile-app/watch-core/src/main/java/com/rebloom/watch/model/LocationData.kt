package com.rebloom.watch.model

data class LocationData(
    val timestamp: Long,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float?,
    val provider: String?
)

