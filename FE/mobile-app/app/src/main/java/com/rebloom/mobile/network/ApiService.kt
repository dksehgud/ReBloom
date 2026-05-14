package com.rebloom.mobile.network

import retrofit2.http.Body
import retrofit2.http.POST

data class BiometricRequest(
    val userId: String,
    val tsStart: String,
    val tsEnd: String,
    val hr: Float,
    val ibi: Float,
    val rmssd: Float,
    val pnn50: Float,
    val lfHf: Float,
    val accXAvg: Float,
    val accYAvg: Float,
    val accZAvg: Float,
    val accMag: Float,
    val hrAccRatio: Float,
    val missingnessScore: Float
)

data class SleepRequest(
    val userId: String,
    val wakeup: String,
    val asleep: String,
    val sleepDuration: Float,
    val waso: Float,
    val sleepScore: Float,
    val sleepEfficiency: Float
)

data class IntakeResponse(
    val message: String
)

data class LocationEvaluateRequest(
    val user_id: String,
    val latitude: Double,
    val longitude: Double,
    val measured_at: String
)

data class LocationEvaluateResponse(
    val user_id: String,
    val device_id: String,
    val matched: Boolean,
    val distance_meters: Double,
    val threshold_meters: Double,
    val target_name: String?,
    val action: String,
    val request_id: String?,
    val topic: String?
)

interface ApiService {
    @POST("intake/api/v1/intakes/biometrics/raw")
    suspend fun sendBiometric(@Body request: BiometricRequest): IntakeResponse

    @POST("intake/api/v1/intakes/sleeps/raw")
    suspend fun sendSleep(@Body request: SleepRequest): IntakeResponse

    @POST("aiot/api/v1/location/evaluate")
    suspend fun evaluateLocation(@Body request: LocationEvaluateRequest): LocationEvaluateResponse
}
