package com.rebloom.mobile.provisioning.data

import android.content.Context
import com.rebloom.mobile.network.ApiClient
import com.rebloom.mobile.network.ApiService
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
            ?: throw IllegalStateException("Login token is missing. Cannot register device.")
        val api = ApiClient.create(context, accessToken)
        val request = DeviceRegistrationRequest(
            serialNumber = serialNumber,
            deviceType = "IOT",

            )
        val response = if (registrationContext.role == "parent") {
            val targetChildrenId = registrationContext.childrenId?.takeIf { it.isNotBlank() }
                ?: resolveConnectedChildId(api)

            api.registerParentDevice(targetChildrenId, request)
        } else {
            api.registerChildDevice(request)
        }

        if (response.code != null) {
            throw IllegalStateException(response.message ?: "Device registration failed.")
        }

        return response.data ?: throw IllegalStateException("Device registration response is empty.")
    }

    private suspend fun resolveConnectedChildId(api: ApiService): String {
        val response = api.getParentConnectedChild()
        if (response.code != null) {
            throw IllegalStateException(response.message ?: "Failed to load connected child.")
        }

        val child = response.data
            ?: throw IllegalStateException("Connected child response is empty.")

        if (!child.connected || child.childrenId.isNullOrBlank()) {
            throw IllegalStateException("No connected child found.")
        }

        return child.childrenId
    }
}
