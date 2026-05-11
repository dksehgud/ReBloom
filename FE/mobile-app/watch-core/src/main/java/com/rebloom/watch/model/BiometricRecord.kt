package com.rebloom.watch.model

data class BiometricRecord(
    val tsStart: Long,
    val tsEnd: Long,
    val missingnessScore: Float,
    val hr: Float,
    val ibi: Float,
    val accXAvg: Float,
    val accYAvg: Float,
    val accZAvg: Float,
    val accMag: Float,
    val rmssd: Float,
    val pnn50: Float,
    val lfHf: Float,
    val hrAccRatio: Float
)