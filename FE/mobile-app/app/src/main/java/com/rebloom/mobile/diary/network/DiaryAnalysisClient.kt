package com.rebloom.mobile.diary.network

import android.util.Log
import com.google.gson.Gson
import com.rebloom.mobile.diary.model.Diary
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class DiaryAnalysisClient(
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

        val connection = URL(analysisApiUrl).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = TIMEOUT_MILLIS
            connection.readTimeout = TIMEOUT_MILLIS
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            connection.doOutput = true

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(gson.toJson(DiaryAnalysisRequest.from(diary)))
            }

            val responseCode = connection.responseCode
            if (responseCode !in 200..299) {
                Log.w(TAG, "Diary analysis request failed: $responseCode")
            }
        } catch (exception: Exception) {
            Log.w(TAG, "Diary analysis request failed", exception)
        } finally {
            connection.disconnect()
        }
    }

    private data class DiaryAnalysisRequest(
        val diary_id: String,
        val user_id: String?,
        val target_date: String,
        val content: String,
    ) {
        companion object {
            fun from(diary: Diary): DiaryAnalysisRequest =
                DiaryAnalysisRequest(
                    diary_id = diary.id,
                    user_id = diary.userId,
                    target_date = diary.diaryDate,
                    content = diary.content,
                )
        }
    }

    companion object {
        private const val TAG = "DiaryAnalysisClient"
        private const val TIMEOUT_MILLIS = 5_000
    }
}
