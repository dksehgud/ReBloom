package com.rebloom.mobile.network

import android.content.Context
import com.rebloom.mobile.BuildConfig
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    private val baseUrl = BuildConfig.API_BASE_URL.trimEnd('/') + "/"

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

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(tokenInterceptor)
            .addInterceptor(logging)
            .build()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
