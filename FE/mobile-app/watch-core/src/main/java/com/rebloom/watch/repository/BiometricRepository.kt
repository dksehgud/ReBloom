package com.rebloom.watch.repository

import com.rebloom.watch.model.AccelerometerData
import com.rebloom.watch.model.BiometricRecord
import com.rebloom.watch.model.HeartRateData
import org.apache.commons.math3.complex.Complex
import org.apache.commons.math3.transform.DftNormalization
import org.apache.commons.math3.transform.FastFourierTransformer
import org.apache.commons.math3.transform.TransformType
import kotlin.math.abs
import kotlin.math.sqrt

class BiometricRepository {

    private val hrBuffer = mutableListOf<HeartRateData>()
    private val accBuffer = mutableListOf<AccelerometerData>()

    private val bufferDurationMs = 5 * 60 * 1000L

    // 테스트용 (30초로 단축)
    // private val bufferDurationMs = 30 * 1000L
    private var bufferStartTime: Long = System.currentTimeMillis()

    companion object {
        const val MIN_LFHF_IBI_SIZE = 30
    }

    var onRecordReady: ((BiometricRecord) -> Unit)? = null

    fun addHeartRateData(data: HeartRateData) {
        hrBuffer.add(data)
        checkAndFlush()
    }

    fun addAccelerometerData(data: AccelerometerData) {
        accBuffer.add(data)
    }

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
        val rawIbi = validHr.flatMap { it.ibi }
        val allIbi = preprocessIbi(rawIbi)

        val hrAvg = if (validHr.isEmpty()) 0f
        else validHr.map { it.hr }.average().toFloat()
        val ibiAvg = if (allIbi.isEmpty()) 0f
        else allIbi.average().toFloat()
        val accXAvg = if (accBuffer.isEmpty()) 0f
        else accBuffer.map { it.acc_x }.average().toFloat()
        val accYAvg = if (accBuffer.isEmpty()) 0f
        else accBuffer.map { it.acc_y }.average().toFloat()
        val accZAvg = if (accBuffer.isEmpty()) 0f
        else accBuffer.map { it.acc_z }.average().toFloat()
        val accMag = calcAccMag(accBuffer)

        val rmssd = calcRmssd(allIbi)
        val pnn50 = calcPnn(allIbi, 50.0)
        val lfHf = calcLfHf(allIbi)
        val hrAccRatio = if (accMag > 0f) hrAvg / accMag else 0f  // ← 추가

        return BiometricRecord(
            tsStart = tsStart,
            tsEnd = tsEnd,
            missingnessScore = calcMissingness(validHr.size),
            hr = hrAvg,
            ibi = ibiAvg,
            accXAvg = accXAvg,
            accYAvg = accYAvg,
            accZAvg = accZAvg,
            accMag = accMag,
            rmssd = rmssd,
            pnn50 = pnn50,
            lfHf = lfHf,
            hrAccRatio = hrAccRatio
        )
    }

    private fun preprocessIbi(ibi: List<Double>): List<Double> {
        val rangeFiltered = ibi.filter { it in 300.0..2000.0 }
        if (rangeFiltered.size < 2) return emptyList()

        val cleaned = mutableListOf<Double>()
        cleaned.add(rangeFiltered.first())
        for (i in 1 until rangeFiltered.size) {
            if (abs(rangeFiltered[i] - rangeFiltered[i - 1]) < 250.0) {
                cleaned.add(rangeFiltered[i])
            }
        }
        return cleaned
    }

    private fun calcAccMag(accData: List<AccelerometerData>): Float {
        if (accData.isEmpty()) return 0f
        val magnitudes = accData.map {
            sqrt(it.acc_x * it.acc_x + it.acc_y * it.acc_y + it.acc_z * it.acc_z)
        }
        val mean = magnitudes.average()
        return sqrt(magnitudes.map { (it - mean) * (it - mean) }.average()).toFloat()
    }

    private fun calcLfHf(ibi: List<Double>): Float {
        if (ibi.size < MIN_LFHF_IBI_SIZE) return -1f

        val resampleRate = 4.0
        val resampled = resampleIbi(ibi, resampleRate)
        if (resampled.size < 16) return -1f

        val mean = resampled.average()
        val fftSize = nextPowerOfTwo(resampled.size)
        val padded = DoubleArray(fftSize)
        for (i in resampled.indices) {
            padded[i] = resampled[i] - mean
        }

        val transformer = FastFourierTransformer(DftNormalization.STANDARD)
        val fftResult: Array<Complex> = transformer.transform(padded, TransformType.FORWARD)

        val freqResolution = resampleRate / fftSize
        var lfPower = 0.0
        var hfPower = 0.0

        for (i in 1 until fftResult.size / 2) {
            val freq = i * freqResolution
            val power = fftResult[i].real * fftResult[i].real +
                    fftResult[i].imaginary * fftResult[i].imaginary
            when {
                freq in 0.04..0.15 -> lfPower += power
                freq in 0.15..0.40 -> hfPower += power
            }
        }

        return if (hfPower == 0.0) -1f else (lfPower / hfPower).toFloat()
    }

    private fun resampleIbi(ibi: List<Double>, targetRate: Double): List<Double> {
        val times = mutableListOf<Double>()
        var t = 0.0
        for (interval in ibi) {
            t += interval / 1000.0
            times.add(t)
        }
        val totalTime = times.last()
        val step = 1.0 / targetRate
        val result = mutableListOf<Double>()
        var sampleTime = 0.0
        while (sampleTime <= totalTime) {
            val idx = times.indexOfFirst { it >= sampleTime }.takeIf { it >= 0 } ?: break
            result.add(ibi[idx])
            sampleTime += step
        }
        return result
    }

    private fun nextPowerOfTwo(n: Int): Int {
        var power = 1
        while (power < n) power = power shl 1
        return power
    }

    private fun calcMissingness(validCount: Int): Float {
        val expectedSamples = (bufferDurationMs / 1000f).toInt()
        return 1f - (validCount.toFloat() / expectedSamples).coerceIn(0f, 1f)
    }

    private fun calcRmssd(ibi: List<Double>): Float {
        if (ibi.size < 2) return 0f
        val diffs = ibi.zipWithNext { a, b -> b - a }
        return sqrt(diffs.map { it * it }.average()).toFloat()
    }

    private fun calcPnn(ibi: List<Double>, threshold: Double): Float {
        if (ibi.size < 2) return 0f
        val diffs = ibi.zipWithNext { a, b -> abs(b - a) }
        return diffs.count { it > threshold }.toFloat() / diffs.size.toFloat()
    }
}