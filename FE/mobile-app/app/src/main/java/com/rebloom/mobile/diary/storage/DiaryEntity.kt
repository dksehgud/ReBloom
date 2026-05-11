package com.rebloom.mobile.diary.storage

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "child_diaries",
    indices = [
        Index(value = ["diary_date"], unique = true),
    ],
)
data class DiaryEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    @ColumnInfo(name = "user_id")
    val userId: String?,
    @ColumnInfo(name = "diary_date")
    val diaryDate: String,
    val content: String,
    @ColumnInfo(name = "emotion_key")
    val emotionKey: String?,
    @ColumnInfo(name = "created_at")
    val createdAt: Long,
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long,
)
