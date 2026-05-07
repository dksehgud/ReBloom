package com.rebloom.mobile.sleep

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class SleepSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

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
                        saveSleepRecord(record)
                        Log.d("SleepSyncWorker", "저장 완료: ${record.date}, score=${record.sleepScore}")
                    } else {
                        Log.d("SleepSyncWorker", "이미 저장된 데이터 스킵: ${record.date}")
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

    private fun saveSleepRecord(record: SleepRecord) {
        // 저장 완료 표시
        val prefs = applicationContext.getSharedPreferences("sleep_sync", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("${record.asleep}_${record.wakeup}", true).apply()

        // TODO: 백엔드 전송
        Log.d("SleepSyncWorker", """
            수면 데이터:
            날짜: ${record.date}
            수면 시작: ${record.asleep}
            기상: ${record.wakeup}
            수면 시간: ${record.sleepDuration}분
            WASO: ${record.waso}분
            수면 점수: ${record.sleepScore}
            수면 효율: ${record.sleepEfficiency}%
        """.trimIndent())
    }
}