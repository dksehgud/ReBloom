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
        WHERE diary_date BETWEEN :startDate AND :endDate
        ORDER BY diary_date ASC
        """,
    )
    suspend fun findByDateRange(startDate: String, endDate: String): List<DiaryEntity>

    @Query("SELECT * FROM child_diaries WHERE id = :id LIMIT 1")
    suspend fun findById(id: String): DiaryEntity?

    @Query("SELECT * FROM child_diaries WHERE diary_date = :diaryDate LIMIT 1")
    suspend fun findByDate(diaryDate: String): DiaryEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(entity: DiaryEntity)

    @Query("DELETE FROM child_diaries WHERE id = :id")
    suspend fun deleteById(id: String): Int
}
