package com.rebloom.mobile.webview.bridge

import android.webkit.JavascriptInterface
import com.google.gson.Gson
import com.rebloom.mobile.diary.network.DiaryAnalysisClient
import com.rebloom.mobile.diary.DiaryRepository
import com.rebloom.mobile.diary.model.DiarySaveRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking

class DiaryJavascriptBridge(
    private val diaryRepository: DiaryRepository,
    private val diaryAnalysisClient: DiaryAnalysisClient,
    private val gson: Gson = Gson(),
) {
    @JavascriptInterface
    fun getDiariesByMonth(userId: String, yearMonth: String): String =
        runBridge {
            diaryRepository.getMonth(userId, yearMonth)
        }

    @JavascriptInterface
    fun getDiaryByDate(userId: String, diaryDate: String): String =
        runBridge {
            diaryRepository.getByDate(userId, diaryDate)
        }

    @JavascriptInterface
    fun saveDiary(requestJson: String): String =
        runBridge {
            val request = gson.fromJson(requestJson, DiarySaveRequest::class.java)
            val savedDiary = diaryRepository.save(request)
            // Analysis API is intentionally paused for now.
            // diaryAnalysisClient.requestAnalysis(savedDiary)
            savedDiary
        }

    @JavascriptInterface
    fun deleteDiary(userId: String, id: String): String =
        runBridge {
            mapOf("deleted" to diaryRepository.delete(userId, id))
        }

    private fun <T> runBridge(block: suspend () -> T): String =
        try {
            val data = runBlocking(Dispatchers.IO) {
                block()
            }
            gson.toJson(BridgeResponse(success = true, data = data))
        } catch (exception: Exception) {
            gson.toJson(
                BridgeResponse<Nothing>(
                    success = false,
                    message = exception.message ?: "Diary bridge request failed",
                ),
            )
        }
}
