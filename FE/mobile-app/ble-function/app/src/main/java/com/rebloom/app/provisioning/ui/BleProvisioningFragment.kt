package com.rebloom.app.provisioning.ui

import android.Manifest
import android.content.pm.PackageManager
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
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import com.rebloom.app.databinding.FragmentBleProvisioningBinding
import com.rebloom.app.provisioning.BleProvisioningViewModel
import com.rebloom.app.provisioning.ProvisioningState
import com.rebloom.app.provisioning.WifiNetwork
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

    // Wi-Fi 스캔에는 위치 권한 필요
    private val wifiPermissions = arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        if (results.values.all { it }) viewModel.startScan()
        else showError("BLE 권한이 필요합니다.")
    }

    private val wifiPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        if (results.values.all { it }) {
            viewModel.registerWifiReceiver()
            viewModel.scanWifiNetworks()
        }
    }

    private lateinit var wifiAdapter: WifiListAdapter
    private var selectedNetwork: WifiNetwork? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBleProvisioningBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupWifiList()
        setupButtons()
        observeState()
        observeWifi()
        checkPermissionsAndScan()
    }

    override fun onResume() {
        super.onResume()
        if (hasWifiPermission()) {
            viewModel.registerWifiReceiver()
            viewModel.scanWifiNetworks()
        }
    }

    override fun onPause() {
        super.onPause()
        viewModel.unregisterWifiReceiver()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // ─── Wi-Fi 리스트 셋업 ────────────────────────

    private fun setupWifiList() {
        wifiAdapter = WifiListAdapter { network ->
            selectedNetwork = network
            showPasswordPanel(network)
        }
        binding.rvWifiList.apply {
            adapter = wifiAdapter
            layoutManager = LinearLayoutManager(requireContext())
            addItemDecoration(DividerItemDecoration(requireContext(), DividerItemDecoration.VERTICAL))
            isNestedScrollingEnabled = false
        }
    }

    private fun showPasswordPanel(network: WifiNetwork) {
        binding.passwordPanel.isVisible = true
        binding.tvSelectedSsid.text = "선택한 Wi-Fi: ${network.ssid}"

        val isOpen = !network.isSecured
        binding.etPassword.isEnabled = !isOpen
        binding.tvOpenNetwork.isVisible = isOpen
        if (isOpen) binding.etPassword.text?.clear()
    }

    private fun observeWifi() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    viewModel.wifiScanning.collect { scanning ->
                        binding.wifiScanningRow.isVisible = scanning
                        updateEmptyState()
                    }
                }
                launch {
                    viewModel.wifiNetworks.collect { networks ->
                        wifiAdapter.submitList(networks)
                        binding.rvWifiList.isVisible = networks.isNotEmpty()
                        updateEmptyState()
                    }
                }
                launch {
                    viewModel.wifiError.collect { error ->
                        if (error != null) {
                            binding.tvWifiEmpty.text = error
                            binding.tvWifiEmpty.setTextColor(0xFFE63946.toInt()) // 빨간색
                        } else {
                            binding.tvWifiEmpty.text = "주변 Wi-Fi를 찾지 못했습니다"
                            binding.tvWifiEmpty.setTextColor(0xFF6C757D.toInt()) // 기본 회색
                        }
                        updateEmptyState()
                    }
                }
            }
        }
    }

    private fun updateEmptyState() {
        val scanning = viewModel.wifiScanning.value
        val empty = viewModel.wifiNetworks.value.isEmpty()
        val hasError = viewModel.wifiError.value != null
        
        // 에러가 있거나(위치 꺼짐 등), 스캔이 끝났는데 목록이 비어있으면 노출
        binding.tvWifiEmpty.isVisible = hasError || (!scanning && empty)
    }

    private fun hasWifiPermission() =
        wifiPermissions.all { requireContext().checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }

    private fun requestWifiScan() {
        if (hasWifiPermission()) {
            viewModel.registerWifiReceiver()
            viewModel.scanWifiNetworks()
        } else {
            wifiPermissionLauncher.launch(wifiPermissions)
        }
    }

    // ─── 버튼 셋업 ───────────────────────────────

    private fun setupButtons() {
        binding.btnConnect.setOnClickListener {
            binding.deviceFoundPanel.isVisible = false
            binding.wifiInputPanel.isVisible = true
            binding.tvStatus.text = "연결할 Wi-Fi를 선택해주세요"
            requestWifiScan()
        }

        binding.btnScanWifi.setOnClickListener {
            selectedNetwork = null
            binding.passwordPanel.isVisible = false
            requestWifiScan()
        }

        binding.btnProvision.setOnClickListener {
            val network = selectedNetwork ?: run {
                binding.tvSelectedSsid.text = "Wi-Fi를 선택해주세요"
                return@setOnClickListener
            }
            val pw = if (network.isSecured) {
                val entered = binding.etPassword.text.toString()
                if (entered.isBlank()) {
                    binding.etPassword.error = "비밀번호를 입력해주세요"
                    return@setOnClickListener
                }
                entered
            } else {
                ""  // 오픈 네트워크
            }
            viewModel.connectAndProvision(network.ssid, pw)
        }

        binding.btnRetry.setOnClickListener {
            viewModel.retry()
            selectedNetwork = null
            hideAll()
            checkPermissionsAndScan()
        }
    }

    // ─── State 관찰 ──────────────────────────────

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
