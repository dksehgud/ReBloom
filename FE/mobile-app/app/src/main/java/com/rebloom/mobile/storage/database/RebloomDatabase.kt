package com.rebloom.mobile.storage.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.rebloom.mobile.diary.storage.DiaryDao
import com.rebloom.mobile.diary.storage.DiaryEntity

@Database(
    entities = [
        DiaryEntity::class,
    ],
    version = 3,
    exportSchema = false,
)
abstract class RebloomDatabase : RoomDatabase() {
    abstract fun diaryDao(): DiaryDao

    companion object {
        private const val DATABASE_NAME = "rebloom.db"

        @Volatile
        private var instance: RebloomDatabase? = null

        fun getInstance(context: Context): RebloomDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    RebloomDatabase::class.java,
                    DATABASE_NAME,
                ).addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                    .build()
                    .also { instance = it }
            }

        private val MIGRATION_1_2 =
            object : Migration(1, 2) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    db.execSQL("ALTER TABLE child_diaries ADD COLUMN user_id TEXT")
                }
            }

        private val MIGRATION_2_3 =
            object : Migration(2, 3) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    db.execSQL("DROP INDEX IF EXISTS index_child_diaries_diary_date")
                    db.execSQL(
                        "CREATE UNIQUE INDEX IF NOT EXISTS index_child_diaries_user_id_diary_date " +
                            "ON child_diaries(user_id, diary_date)",
                    )
                }
            }
    }
}
