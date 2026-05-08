package com.rebloom.mobile.sleep

import android.content.Context
import android.util.Log
import com.samsung.android.sdk.health.data.HealthDataService
import com.samsung.android.sdk.health.data.permission.AccessType
import com.samsung.android.sdk.health.data.permission.Permission
import com.samsung.android.sdk.health.data.request.DataTypes
import com.samsung.android.sdk.health.data.request.LocalTimeFilter
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class SleepRepository(private val context: Context) {

    suspend fun fetchSleepData(): List<SleepRecord> {
        return try {
            val store = HealthDataService.getStore(context)

            // 권한 체크
            val permissions = setOf(
                Permission.of(DataTypes.SLEEP, AccessType.READ)
            )
            val granted = store.getGrantedPermissions(permissions)
            if (granted.isEmpty()) {
                Log.d("SleepRepository", "권한 없음")
                return emptyList()
            }

            // 최근 24시간 쿼리
            val request = DataTypes.SLEEP.readDataRequestBuilder
                .setLocalTimeFilter(
                    LocalTimeFilter.of(
                        LocalDateTime.now().minusHours(24),
                        LocalDateTime.now()
                    )
                )
                .build()

            val response = store.readData(request)

            if (response.dataList.isEmpty()) {
                Log.d("SleepRepository", "수면 데이터 없음")
                return emptyList()
            }

            val sessionsField = DataTypes.SLEEP.allFields.first { it.name == "sessions" }
            val scoreField = DataTypes.SLEEP.allFields.first { it.name == "sleep_score" }
            val durationField = DataTypes.SLEEP.allFields.first { it.name == "sleep_duration" }

            response.dataList.mapNotNull { point ->
                try {
                    val startInstant = point.startTime ?: return@mapNotNull null
                    val endInstant = point.endTime ?: return@mapNotNull null

                    val sessions = point.getValue(sessionsField) as? List<*> ?: emptyList<Any>()
                    val score = point.getValue(scoreField)
                    val duration = point.getValue(durationField)

                    // WASO 계산
                    var wasoMs = 0L
                    sessions.forEach { session ->
                        val getStages = session!!.javaClass.getMethod("getStages")
                        val stages = getStages.invoke(session) as? List<*> ?: return@forEach
                        stages.forEach { stage ->
                            val getStage = stage!!.javaClass.getMethod("getStage")
                            val getStart = stage.javaClass.getMethod("getStartTime")
                            val getEnd = stage.javaClass.getMethod("getEndTime")

                            val stageType = getStage.invoke(stage).toString()
                            val stageStart = getStart.invoke(stage) as? Instant ?: return@forEach
                            val stageEnd = getEnd.invoke(stage) as? Instant ?: return@forEach
                            val durationMs = stageEnd.toEpochMilli() - stageStart.toEpochMilli()

                            if (stageType == "AWAKE") {
                                wasoMs += durationMs
                            }
                        }
                    }

                    // 날짜 (수면 시작 시각 기준)
                    val date = LocalDateTime
                        .ofInstant(startInstant, ZoneId.systemDefault())
                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))

                    // sleep_duration (분)
                    val sleepDurationMin = duration?.toString()?.let { parseDuration(it) } ?: 0f

                    // sleep_efficiency
                    val sleepEfficiency = if (sleepDurationMin > 0) {
                        val wasoMin = wasoMs / 60000f
                        (sleepDurationMin / (sleepDurationMin + wasoMin)) * 100f
                    } else null

                    SleepRecord(
                        date = date,
                        asleep = startInstant.toEpochMilli(),
                        wakeup = endInstant.toEpochMilli(),
                        sleepDuration = sleepDurationMin,
                        waso = wasoMs / 60000f,
                        sleepScore = score?.toString()?.toFloatOrNull(),
                        sleepEfficiency = sleepEfficiency
                    )
                } catch (e: Exception) {
                    Log.e("SleepRepository", "파싱 에러: ${e.message}")
                    null
                }
            }
        } catch (e: Exception) {
            Log.e("SleepRepository", "에러: ${e.message}", e)
            emptyList()
        }
    }

    // PT4H2M → 분으로 변환
    private fun parseDuration(duration: String): Float {
        var totalMinutes = 0f
        val hourMatch = Regex("(\\d+)H").find(duration)
        val minuteMatch = Regex("(\\d+)M").find(duration)
        hourMatch?.groupValues?.get(1)?.toFloatOrNull()?.let { totalMinutes += it * 60 }
        minuteMatch?.groupValues?.get(1)?.toFloatOrNull()?.let { totalMinutes += it }
        return totalMinutes
    }
}