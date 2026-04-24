package com.rebloom.app.provisioning.ui

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.rebloom.app.databinding.FragmentBleProvisioningBinding
import com.rebloom.app.provisioning.BleProvisioningViewModel
import com.rebloom.app.provisioning.ProvisioningState
import kotlinx.coroutines.launch

class BleProvisioningFragment : Fragment() {

    private var _binding: FragmentBleProvisioningBinding? = null
    private val binding get() = _binding!!

    private val viewModel: BleProvisioningViewModel by viewModels {
        BleProvisioningViewModelFactory(requireContext())
    }

    private val blePermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        arrayOf(Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT)
    } else {
        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
    }

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { results ->
        if (results.values.all { it }) viewModel.startScan()
        else showError("BLE 권한이 필요합니다.")
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentBleProvisioningBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupButtons()
        observeState()
        checkPermissionsAndScan()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun setupButtons() {
        binding.btnConnect.setOnClickListener {
            binding.deviceFoundPanel.isVisible = false
            binding.wifiInputPanel.isVisible = true
            binding.tvStatus.text = "Wi-Fi 정보를 입력해주세요"
            autoFillSsid()
        }
        binding.btnProvision.setOnClickListener {
            val ssid = binding.etSsid.text.toString().trim()
            val pw = binding.etPassword.text.toString()
            viewModel.connectAndProvision(ssid, pw)
        }
        binding.btnRetry.setOnClickListener {
            viewModel.retry()
            hideAll()
            checkPermissionsAndScan()
        }
        binding.btnAutoFill.setOnClickListener { autoFillSsid() }
    }

    private fun observeState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.state.collect { render(it) }
            }
        }
    }

    private fun render(state: ProvisioningState) {
        hideAll()
        when (state) {
            is ProvisioningState.Idle -> binding.tvStatus.text = "준비 중..."

            is ProvisioningState.Scanning -> {
                binding.scanningPanel.isVisible = true
                binding.tvStatus.text = "Re:Bloom 스피커를 찾는 중..."
            }

            is ProvisioningState.DeviceFound -> {
                binding.deviceFoundPanel.isVisible = true
                binding.tvDeviceName.text = state.device.name
                binding.tvDeviceAddress.text = state.device.address
                binding.tvRssi.text = "${state.device.rssi} dBm"
                binding.tvStatus.text = "스피커를 발견했습니다!"
            }

            is ProvisioningState.Connecting,
            is ProvisioningState.Connected,
            is ProvisioningState.Writing -> {
                binding.progressPanel.isVisible = true
                binding.tvStatus.text = "연결 중..."
            }

            is ProvisioningState.WaitingResult -> {
                binding.progressPanel.isVisible = true
                binding.tvStatus.text = "스피커가 Wi-Fi에 연결 중..."
            }

            is ProvisioningState.Success -> {
                binding.successPanel.isVisible = true
                binding.tvStatus.text = "연결 완료!"
                binding.tvSuccessMessage.text = "${state.ssid}에 연결됐어요 🎉"
                binding.root.postDelayed({ /* TODO: navigate to main */ }, 3000)
            }

            is ProvisioningState.Fail -> {
                binding.failPanel.isVisible = true
                binding.tvFailReason.text = state.reason
                binding.tvStatus.text = "연결 실패"
            }

            is ProvisioningState.BleUnavailable -> {
                binding.tvStatus.text = "블루투스를 켜주세요"
                showError("블루투스가 꺼져 있습니다.")
            }

            is ProvisioningState.PermissionRequired -> {
                binding.tvStatus.text = "권한이 필요합니다"
                permissionLauncher.launch(blePermissions)
            }
        }
    }

    private fun hideAll() {
        binding.scanningPanel.isVisible = false
        binding.deviceFoundPanel.isVisible = false
        binding.progressPanel.isVisible = false
        binding.wifiInputPanel.isVisible = false
        binding.successPanel.isVisible = false
        binding.failPanel.isVisible = false
    }

    private fun autoFillSsid() {
        @Suppress("DEPRECATION")
        val wm = requireContext().applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val ssid = wm.connectionInfo.ssid?.removePrefix("\"")?.removeSuffix("\"")
        if (!ssid.isNullOrBlank() && ssid != "<unknown ssid>") binding.etSsid.setText(ssid)
    }

    private fun showError(msg: String) {
        binding.failPanel.isVisible = true
        binding.tvFailReason.text = msg
    }

    private fun checkPermissionsAndScan() {
        val granted = blePermissions.all {
            requireContext().checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED
        }
        if (granted) viewModel.startScan() else permissionLauncher.launch(blePermissions)
    }
}
