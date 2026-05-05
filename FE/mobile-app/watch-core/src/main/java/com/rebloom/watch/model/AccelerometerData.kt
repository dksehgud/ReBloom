package com.rebloom.watch.model

data class AccelerometerData(
    val timestamp: Long,
    val acc_x: Double,
    val acc_y: Double,
    val acc_z: Double
)