package com.rebloom.mobile.diary.network

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.rebloom.mobile.diary.model.Diary
import com.rebloom.mobile.network.TokenDataStore
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.runBlocking

class DiaryAnalysisClient(
    private val context: Context,
    private val analysisApiUrl: String,
    private val gson: Gson = Gson(),
) {
    fun requestAnalysis(diary: Diary) {
        if (analysisApiUrl.isBlank()) {
            Log.d(TAG, "Diary analysis API URL is empty. Skip request.")
            return
        }
        if (diary.userId.isNullOrBlank()) {
            Log.d(TAG, "Diary userId is empty. Skip analysis request.")
            return
        }
        if (diary.emotionKey.isNullOrBlank()) {
            Log.d(TAG, "Diary emotionKey is empty. Skip analysis request.")
            return
        }

        val connection = URL(analysisApiUrl).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = TIMEOUT_MILLIS
            connection.readTimeout = TIMEOUT_MILLIS
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            runBlocking { TokenDataStore.getToken(context) }
                ?.takeIf { it.isNotBlank() }
                ?.let { connection.setRequestProperty("Authorization", "Bearer $it") }
            connection.doOutput = true

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(gson.toJson(DiaryAnalysisRequest.from(diary)))
            }

            val responseCode = connection.responseCode
            if (responseCode !in 200..299) {
                Log.w(
                    TAG,
                    "Diary analysis request failed: code=$responseCode, diaryId=${diary.id}, " +
                        "targetDate=${diary.diaryDate}, body=${connection.readErrorBody()}",
                )
            } else {
                Log.d(
                    TAG,
                    "Diary analysis requested: diaryId=${diary.id}, targetDate=${diary.diaryDate}",
                )
            }
        } catch (exception: Exception) {
            Log.w(TAG, "Diary analysis request failed", exception)
        } finally {
            connection.disconnect()
        }
    }

    private fun HttpURLConnection.readErrorBody(): String =
        try {
            errorStream?.use { stream ->
                InputStreamReader(stream, Charsets.UTF_8).use { reader -> reader.readText() }
            }.orEmpty()
        } catch (_: Exception) {
            ""
        }

    private data class DiaryAnalysisRequest(
        val diary_id: String,
        val user_id: String?,
        val target_date: String,
        val emotion_icon: String,
        val content: String,
    ) {
        companion object {
            fun from(diary: Diary): DiaryAnalysisRequest =
                DiaryAnalysisRequest(
                    diary_id = diary.id,
                    user_id = diary.userId,
                    target_date = diary.diaryDate,
                    emotion_icon = requireNotNull(diary.emotionKey),
                    content = diary.content,
                )
        }
    }

    companion object {
        private const val TAG = "DiaryAnalysisClient"
        private const val TIMEOUT_MILLIS = 5_000
    }
}
