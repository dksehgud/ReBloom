package com.rebloom.mobile.sleep

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.rebloom.mobile.network.ApiClient
import com.rebloom.mobile.network.SleepRequest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SleepSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())

    override suspend fun doWork(): Result {
        return try {
            val repository = SleepRepository(applicationContext)
            val records = repository.fetchSleepData()

            if (records.isEmpty()) {
                Log.d("SleepSyncWorker", "데이터 없음 → 재시도")
                Result.retry()
            } else {
                records.forEach { record ->
                    if (!isAlreadySaved(record.asleep, record.wakeup)) {
                        sendSleepRecord(record)
                    } else {
                        Log.d("SleepSyncWorker", "이미 전송된 데이터 스킵: ${record.date}")
                    }
                }
                Result.success()
            }
        } catch (e: Exception) {
            Log.e("SleepSyncWorker", "에러: ${e.message}", e)
            Result.retry()
        }
    }

    private fun isAlreadySaved(asleep: Long, wakeup: Long): Boolean {
        val prefs = applicationContext.getSharedPreferences("sleep_sync", Context.MODE_PRIVATE)
        return prefs.getBoolean("${asleep}_${wakeup}", false)
    }

    private suspend fun sendSleepRecord(record: SleepRecord) {
        try {
            val request = SleepRequest(
                userId = "TODO: 토큰에서 userId 추출",
                wakeup = dateFormat.format(Date(record.wakeup)),
                asleep = dateFormat.format(Date(record.asleep)),
                sleepDuration = record.sleepDuration,
                waso = record.waso,
                sleepScore = record.sleepScore ?: 0f,
                sleepEfficiency = record.sleepEfficiency ?: 0f
            )

            val response = ApiClient.create(applicationContext).sendSleep(request)
            Log.d("SleepSyncWorker", "전송 성공: ${response.message}")

            // 전송 성공 시 중복 전송 방지 표시
            val prefs = applicationContext.getSharedPreferences("sleep_sync", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("${record.asleep}_${record.wakeup}", true).apply()

        } catch (e: Exception) {
            Log.e("SleepSyncWorker", "전송 실패: ${e.message}")
            throw e  // doWork에서 retry 처리하도록
        }
    }
}