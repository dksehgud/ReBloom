package com.rebloom.watch.repository

import com.rebloom.watch.model.AccelerometerData
import com.rebloom.watch.model.BiometricRecord
import com.rebloom.watch.model.HeartRateData
import kotlin.math.sqrt

class BiometricRepository {

    private val hrBuffer = mutableListOf<HeartRateData>()
    private val accBuffer = mutableListOf<AccelerometerData>()
    private val bufferDurationMs = 5 * 60 * 1000L

    private var bufferStartTime: Long = System.currentTimeMillis()

    fun addHeartRateData(data: HeartRateData) {
        hrBuffer.add(data)
        checkAndFlush()
    }

    fun addAccelerometerData(data: AccelerometerData) {
        accBuffer.add(data)
    }

    var onRecordReady: ((BiometricRecord) -> Unit)? = null

    private fun checkAndFlush() {
        val now = System.currentTimeMillis()
        if (now - bufferStartTime >= bufferDurationMs) {
            val record = buildRecord(bufferStartTime, now)
            onRecordReady?.invoke(record)
            hrBuffer.clear()
            accBuffer.clear()
            bufferStartTime = now
        }
    }

    private fun buildRecord(tsStart: Long, tsEnd: Long): BiometricRecord {
        val validHr = hrBuffer.filter { it.hr > 0 }
        val allIbi = validHr.flatMap { it.ibi }.filter { it > 0 }

        val hrAvg = if (validHr.isEmpty()) 0f else validHr.map { it.hr }.average().toFloat()
        val ibiAvg = if (allIbi.isEmpty()) 0f else allIbi.average().toFloat()
        val accXAvg = if (accBuffer.isEmpty()) 0f else accBuffer.map { it.acc_x }.average().toFloat()
        val accYAvg = if (accBuffer.isEmpty()) 0f else accBuffer.map { it.acc_y }.average().toFloat()
        val accZAvg = if (accBuffer.isEmpty()) 0f else accBuffer.map { it.acc_z }.average().toFloat()

        return BiometricRecord(
            tsStart = tsStart,
            tsEnd = tsEnd,
            missingnessScore = calcMissingness(validHr.size),
            hr = hrAvg,
            ibi = ibiAvg,
            accXAvg = accXAvg,
            accYAvg = accYAvg,
            accZAvg = accZAvg,
            sdnn = calcSdnn(allIbi),
            sdsd = calcSdsd(allIbi),
            rmssd = calcRmssd(allIbi),
            pnn20 = calcPnn(allIbi, 20.0),
            pnn50 = calcPnn(allIbi, 50.0)
        )
    }

    private fun calcMissingness(validCount: Int): Float {
        val expected = bufferDurationMs / 1000f
        return 1f - (validCount.toFloat() / expected).coerceIn(0f, 1f)
    }

    private fun calcSdnn(ibi: List<Double>): Float {
        if (ibi.isEmpty()) return 0f
        val mean = ibi.average()
        return sqrt(ibi.map { (it - mean) * (it - mean) }.average()).toFloat()
    }

    private fun calcSdsd(ibi: List<Double>): Float {
        if (ibi.size < 2) return 0f
        val diffs = ibi.zipWithNext { a, b -> b - a }
        val mean = diffs.average()
        return sqrt(diffs.map { (it - mean) * (it - mean) }.average()).toFloat()
    }

    private fun calcRmssd(ibi: List<Double>): Float {
        if (ibi.size < 2) return 0f
        val diffs = ibi.zipWithNext { a, b -> b - a }
        return sqrt(diffs.map { it * it }.average()).toFloat()
    }

    private fun calcPnn(ibi: List<Double>, threshold: Double): Float {
        if (ibi.size < 2) return 0f
        val diffs = ibi.zipWithNext { a, b -> Math.abs(b - a) }
        return diffs.count { it > threshold }.toFloat() / diffs.size.toFloat()
    }
}