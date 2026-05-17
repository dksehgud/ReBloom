package com.rebloom.mobile.provisioning.data

import android.content.Context
import com.rebloom.mobile.network.ApiClient
import com.rebloom.mobile.network.DeviceRegistrationData
import com.rebloom.mobile.network.DeviceRegistrationRequest
import com.rebloom.mobile.network.TokenDataStore

data class ProvisioningRegistrationContext(
    val role: String = "child",
    val childrenId: String? = null,
)

class DeviceRegistrationRepository(private val context: Context) {

    suspend fun registerIotDevice(
        serialNumber: String,
        registrationContext: ProvisioningRegistrationContext,
    ): DeviceRegistrationData {
        val accessToken = TokenDataStore.getToken(context)
            ?: throw IllegalStateException("로그인 토큰이 없어 기기를 등록할 수 없습니다.")
        val api = ApiClient.create(context, accessToken)
        val request = DeviceRegistrationRequest(
            serialNumber = serialNumber,
            deviceType = "IOT",
        )
        val response = if (registrationContext.role == "parent") {
            val childrenId = registrationContext.childrenId
                ?: throw IllegalStateException("아이 정보가 없어 보호자 기기 등록을 진행할 수 없습니다.")

            api.registerParentDevice(childrenId, request)
        } else {
            api.registerChildDevice(request)
        }

        if (response.code != null) {
            throw IllegalStateException(response.message ?: "기기 등록에 실패했습니다.")
        }

        return response.data ?: throw IllegalStateException("기기 등록 응답이 비어 있습니다.")
    }
}
