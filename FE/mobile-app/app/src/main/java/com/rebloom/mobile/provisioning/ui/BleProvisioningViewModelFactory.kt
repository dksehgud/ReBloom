package com.rebloom.mobile.provisioning.ui

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.rebloom.mobile.provisioning.BleProvisioningViewModel
import com.rebloom.mobile.provisioning.data.ProvisioningRegistrationContext

class BleProvisioningViewModelFactory(
    private val context: Context,
    private val registrationContext: ProvisioningRegistrationContext = ProvisioningRegistrationContext(),
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(BleProvisioningViewModel::class.java)) {
            return BleProvisioningViewModel(
                context = context.applicationContext,
                registrationContext = registrationContext,
            ) as T
        }
        throw IllegalArgumentException("Unknown ViewModel: $modelClass")
    }
}
