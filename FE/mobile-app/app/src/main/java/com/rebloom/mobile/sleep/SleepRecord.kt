package com.rebloom.mobile.sleep

data class SleepRecord(
    val date: String,               // yyyy-MM-dd
    val asleep: Long,               // 수면 시작 시각 (timestamp ms)
    val wakeup: Long,               // 기상 시각 (timestamp ms)
    val sleepDuration: Float,       // 실제 수면 시간 (분)
    val waso: Float,                // 수면 중 깨어있던 시간 (분)
    val sleepScore: Float?,         // 수면 점수
    val sleepEfficiency: Float?     // 수면 효율
)