package com.rebloom.watch.model

data class HeartRateData(
    val timestamp: Long,
    val hr: Int,
    val ibi: List<Double>
)