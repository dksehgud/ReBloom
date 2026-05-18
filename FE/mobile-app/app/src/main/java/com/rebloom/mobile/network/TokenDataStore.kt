package com.rebloom.mobile.network

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "rebloom_prefs")

object TokenDataStore {
    private val ACCESS_TOKEN = stringPreferencesKey("access_token")
    private val REFRESH_TOKEN = stringPreferencesKey("refresh_token")

    suspend fun saveToken(context: Context, token: String) {
        context.dataStore.edit { it[ACCESS_TOKEN] = token }
    }

    suspend fun saveRefreshToken(context: Context, token: String) {
        context.dataStore.edit { it[REFRESH_TOKEN] = token }
    }

    suspend fun getToken(context: Context): String? {
        return context.dataStore.data
            .map { it[ACCESS_TOKEN] }
            .first()
    }

    suspend fun getRefreshToken(context: Context): String? {
        return context.dataStore.data
            .map { it[REFRESH_TOKEN] }
            .first()
    }

    suspend fun clearToken(context: Context) {
        context.dataStore.edit {
            it.remove(ACCESS_TOKEN)
            it.remove(REFRESH_TOKEN)
        }
    }
}