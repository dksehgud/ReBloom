package com.rebloom.app.provisioning.ui

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.rebloom.app.provisioning.BleProvisioningViewModel

class BleProvisioningViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(BleProvisioningViewModel::class.java))
            return BleProvisioningViewModel(context.applicationContext) as T
        throw IllegalArgumentException("Unknown ViewModel: $modelClass")
    }
}
