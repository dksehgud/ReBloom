package com.rebloom.mobile.diary

import com.rebloom.mobile.diary.model.Diary
import com.rebloom.mobile.diary.model.DiarySaveRequest
import com.rebloom.mobile.diary.storage.DiaryDao
import com.rebloom.mobile.diary.storage.DiaryEntity
import java.time.LocalDate
import java.time.YearMonth

class DiaryRepository(
    private val diaryDao: DiaryDao,
) {
    suspend fun getMonth(userId: String, yearMonthText: String): List<Diary> {
        requireUserId(userId)

        val yearMonth = YearMonth.parse(yearMonthText)
        val startDate = yearMonth.atDay(1).toString()
        val endDate = yearMonth.atEndOfMonth().toString()

        return diaryDao.findByDateRange(userId, startDate, endDate).map(Diary::from)
    }

    suspend fun getByDate(userId: String, diaryDate: String): Diary? {
        requireUserId(userId)
        requireValidDate(diaryDate)
        return diaryDao.findByDate(userId, diaryDate)?.let(Diary::from)
    }

    suspend fun save(request: DiarySaveRequest): Diary {
        val userId = request.userId?.trim().orEmpty()
        requireUserId(userId)
        requireValidDate(request.diaryDate)
        require(request.content.isNotBlank()) { "content is required" }

        val now = System.currentTimeMillis()
        val current =
            request.id
                ?.takeIf(String::isNotBlank)
                ?.let { diaryDao.findById(userId, it) }
                ?: diaryDao.findByDate(userId, request.diaryDate)

        val entity =
            current?.copy(
                userId = userId,
                diaryDate = request.diaryDate,
                content = request.content,
                emotionKey = request.emotionKey,
                updatedAt = now,
            ) ?: DiaryEntity(
                userId = userId,
                diaryDate = request.diaryDate,
                content = request.content,
                emotionKey = request.emotionKey,
                createdAt = now,
                updatedAt = now,
            )

        diaryDao.save(entity)
        return Diary.from(entity)
    }

    suspend fun delete(userId: String, id: String): Boolean {
        requireUserId(userId)
        require(id.isNotBlank()) { "id is required" }
        return diaryDao.deleteById(userId, id) > 0
    }

    private fun requireUserId(userId: String) {
        require(userId.isNotBlank()) { "userId is required" }
    }

    private fun requireValidDate(value: String) {
        LocalDate.parse(value)
    }
}
