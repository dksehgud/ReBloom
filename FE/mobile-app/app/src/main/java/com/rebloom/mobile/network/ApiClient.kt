package com.rebloom.mobile.network

import android.content.Context
import android.util.Log
import com.rebloom.mobile.BuildConfig
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    private val baseUrl = BuildConfig.API_BASE_URL.trimEnd('/') + "/"
    private val refreshLock = Any()

    private fun plainService(): ApiService {
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(OkHttpClient.Builder().build())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    fun create(context: Context, accessTokenOverride: String? = null): ApiService {
        val tokenInterceptor = Interceptor { chain ->
            val token = accessTokenOverride ?: runBlocking { TokenDataStore.getToken(context) }
            val request = chain.request().newBuilder()
                .apply {
                    if (token != null) {
                        addHeader("Authorization", "Bearer $token")
                    }
                }
                .build()
            chain.proceed(request)
        }

        val tokenAuthenticator = Authenticator { _, response ->
            if (response.priorResponse != null) {
                Log.w("ApiClient", "Authenticator: prior response exists, giving up")
                return@Authenticator null
            }

            synchronized(refreshLock) {
                val currentToken = runBlocking { TokenDataStore.getToken(context) }
                val requestToken = response.request.header("Authorization")?.removePrefix("Bearer ")
                if (currentToken != null && currentToken != requestToken) {
                    Log.d("ApiClient", "Authenticator: token already refreshed by another thread, retrying")
                    return@synchronized response.request.newBuilder()
                        .header("Authorization", "Bearer $currentToken")
                        .build()
                }

                val refreshToken = runBlocking { TokenDataStore.getRefreshToken(context) }
                if (refreshToken == null) {
                    Log.e("ApiClient", "Authenticator: no refresh token found in DataStore, cannot refresh")
                    return@synchronized null
                }

                Log.d("ApiClient", "Authenticator: attempting token reissue")
                val result = runBlocking {
                    try {
                        plainService().reissue(refreshToken)
                    } catch (e: retrofit2.HttpException) {
                        if (e.code() == 401 || e.code() == 400) {
                            Log.e("ApiClient", "Authenticator: refresh token rejected (${e.code()}), clearing tokens")
                            TokenDataStore.clearToken(context)
                        } else {
                            Log.e("ApiClient", "Authenticator: reissue server error ${e.code()}")
                        }
                        null
                    } catch (e: Exception) {
                        Log.e("ApiClient", "Authenticator: reissue network error: ${e.message}")
                        null
                    }
                }

                val newAccessToken = result?.data?.accessToken
                val newRefreshToken = result?.data?.refreshToken

                if (newAccessToken == null) {
                    Log.e("ApiClient", "Authenticator: reissue returned no access token (code=${result?.code}, msg=${result?.message})")
                    return@synchronized null
                }

                Log.d("ApiClient", "Authenticator: token reissue success, retrying original request")
                runBlocking {
                    TokenDataStore.saveToken(context, newAccessToken)
                    if (newRefreshToken != null) {
                        TokenDataStore.saveRefreshToken(context, newRefreshToken)
                    }
                }

                response.request.newBuilder()
                    .header("Authorization", "Bearer $newAccessToken")
                    .build()
            }
        }

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(tokenInterceptor)
            .addInterceptor(logging)
            .authenticator(tokenAuthenticator)
            .build()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
