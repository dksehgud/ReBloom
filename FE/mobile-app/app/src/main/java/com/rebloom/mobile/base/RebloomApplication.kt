package com.rebloom.mobile.base

import android.app.Application
import android.content.Intent
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.rebloom.mobile.permission.SleepPermissionActivity
import com.rebloom.mobile.sleep.SleepSyncWorker
import java.util.concurrent.TimeUnit

class RebloomApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        requestSleepPermission()
        startSleepSync()
    }

    private fun requestSleepPermission() {
        val intent = Intent(this, SleepPermissionActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }

    private fun startSleepSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.NOT_REQUIRED)
            .build()

        // 기존 작업 전부 취소
        WorkManager.getInstance(this).cancelAllWork()

        // 20분마다 반복
        val sleepSyncWork = PeriodicWorkRequestBuilder<SleepSyncWorker>(
            20, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "sleep_sync",
            ExistingPeriodicWorkPolicy.REPLACE,
            sleepSyncWork
        )
    }
}