package com.rebloom.mobile.diary.model

import com.rebloom.mobile.diary.storage.DiaryEntity

data class Diary(
    val id: String,
    val userId: String?,
    val diaryDate: String,
    val content: String,
    val emotionKey: String?,
    val createdAt: Long,
    val updatedAt: Long,
) {
    companion object {
        fun from(entity: DiaryEntity): Diary =
            Diary(
                id = entity.id,
                userId = entity.userId,
                diaryDate = entity.diaryDate,
                content = entity.content,
                emotionKey = entity.emotionKey,
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt,
            )
    }
}
