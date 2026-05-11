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
    suspend fun getMonth(yearMonthText: String): List<Diary> {
        val yearMonth = YearMonth.parse(yearMonthText)
        val startDate = yearMonth.atDay(1).toString()
        val endDate = yearMonth.atEndOfMonth().toString()

        return diaryDao.findByDateRange(startDate, endDate).map(Diary::from)
    }

    suspend fun getByDate(diaryDate: String): Diary? {
        requireValidDate(diaryDate)
        return diaryDao.findByDate(diaryDate)?.let(Diary::from)
    }

    suspend fun save(request: DiarySaveRequest): Diary {
        requireValidDate(request.diaryDate)
        require(request.content.isNotBlank()) { "content is required" }

        val now = System.currentTimeMillis()
        val current =
            request.id
                ?.takeIf(String::isNotBlank)
                ?.let { diaryDao.findById(it) }
                ?: diaryDao.findByDate(request.diaryDate)

        val entity =
            current?.copy(
                userId = request.userId ?: current.userId,
                diaryDate = request.diaryDate,
                content = request.content,
                emotionKey = request.emotionKey,
                updatedAt = now,
            ) ?: DiaryEntity(
                userId = request.userId,
                diaryDate = request.diaryDate,
                content = request.content,
                emotionKey = request.emotionKey,
                createdAt = now,
                updatedAt = now,
            )

        diaryDao.save(entity)
        return Diary.from(entity)
    }

    suspend fun delete(id: String): Boolean {
        require(id.isNotBlank()) { "id is required" }
        return diaryDao.deleteById(id) > 0
    }

    private fun requireValidDate(value: String) {
        LocalDate.parse(value)
    }
}
