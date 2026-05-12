package com.rebloom.mobile.diary.storage

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface DiaryDao {
    @Query(
        """
        SELECT *
        FROM child_diaries
        WHERE user_id = :userId
        AND diary_date BETWEEN :startDate AND :endDate
        ORDER BY diary_date ASC
        """,
    )
    suspend fun findByDateRange(userId: String, startDate: String, endDate: String): List<DiaryEntity>

    @Query("SELECT * FROM child_diaries WHERE user_id = :userId AND id = :id LIMIT 1")
    suspend fun findById(userId: String, id: String): DiaryEntity?

    @Query("SELECT * FROM child_diaries WHERE user_id = :userId AND diary_date = :diaryDate LIMIT 1")
    suspend fun findByDate(userId: String, diaryDate: String): DiaryEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(entity: DiaryEntity)

    @Query("DELETE FROM child_diaries WHERE user_id = :userId AND id = :id")
    suspend fun deleteById(userId: String, id: String): Int
}
