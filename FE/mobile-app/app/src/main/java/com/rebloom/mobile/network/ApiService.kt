package com.rebloom.mobile.network

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.Header
import retrofit2.http.Path
import retrofit2.http.POST

data class ApiBaseResponse<T>(
    val code: String?,
    val message: String?,
    val data: T?
)

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

data class ReissueResponse(
    val accessToken: String,
    val refreshToken: String
)

data class FcmTokenRequest(
    val fcmToken: String
)

data class DeviceRegistrationRequest(
    val serialNumber: String,
    val deviceType: String = "IOT"
)

data class DeviceRegistrationData(
    val deviceId: Long,
    val serialNumber: String,
    val deviceType: String,
    val childrenId: String?
)

data class ParentConnectedChildData(
    val connected: Boolean,
    val childrenId: String?,
    val name: String?,
    val email: String?,
    val birth: String?
)

data class LocationEvaluateRequest(
    val children_id: String,
    val parent_id: String?,
    val latitude: Double,
    val longitude: Double,
    val measured_at: String,
    val request_id: String? = null
)

data class LocationEvaluateResponse(
    val children_id: String,
    val parent_id: String?,
    val device_id: String?,
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

    @POST("ai/api/v1/location/evaluate")
    suspend fun evaluateLocation(@Body request: LocationEvaluateRequest): LocationEvaluateResponse

    @POST("notification/api/v1/notifications/fcm-tokens")
    suspend fun registerFcmToken(@Body request: FcmTokenRequest): IntakeResponse

    @POST("auth/api/v1/children/devices")
    suspend fun registerChildDevice(
        @Body request: DeviceRegistrationRequest
    ): ApiBaseResponse<DeviceRegistrationData>

    @POST("auth/api/v1/parents/devices/{childrenId}")
    suspend fun registerParentDevice(
        @Path("childrenId") childrenId: String,
        @Body request: DeviceRegistrationRequest
    ): ApiBaseResponse<DeviceRegistrationData>

    @GET("auth/api/v1/parents/children")
    suspend fun getParentConnectedChild(): ApiBaseResponse<ParentConnectedChildData>

    @HTTP(method = "DELETE", path = "notification/api/v1/notifications/fcm-tokens", hasBody = true)
    suspend fun deactivateFcmToken(@Body request: FcmTokenRequest): IntakeResponse

    @POST("auth/api/v1/auth/reissue")
    suspend fun reissue(@Header("refresh-token") refreshToken: String): ApiBaseResponse<ReissueResponse>
}
