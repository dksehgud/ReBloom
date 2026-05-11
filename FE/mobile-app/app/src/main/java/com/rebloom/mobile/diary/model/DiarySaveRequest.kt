package com.rebloom.mobile.diary.model

data class DiarySaveRequest(
    val id: String? = null,
    val userId: String? = null,
    val diaryDate: String,
    val content: String,
    val emotionKey: String? = null,
)
