package com.rebloom.app.provisioning.ui

import android.Manifest
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.rebloom.app.provisioning.BleProvisioningViewModel
import com.rebloom.app.provisioning.ProvisioningState
import com.rebloom.app.R
import com.rebloom.app.databinding.FragmentBleProvisioningBinding
import kotlinx.coroutines.launch

/**
 * BleProvisioningFragment.kt
 * ───────────────────────────
 * BLE Provisioning UX를 담당하는 Fragment.
 *
 * [화면 전환 흐름]
 *   Idle → Scanning → DeviceFound → Connected(Wi-Fi 입력) → WaitingResult → Success | Fail
 *
 * View Binding 사용. fragment_ble_provisioning.xml 참조.
 */
class BleProvisioningFragment : Fragment() {

    private var _binding: FragmentBleProvisioningBinding? = null
    private val binding get() = _binding!!

    private val viewModel: BleProvisioningViewModel by viewModels {
        BleProvisioningViewModelFactory(requireContext())
    }

    // ─────────────────────────────────────────────
    // 권한 요청
    // ─────────────────────────────────────────────

    private val blePermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        arrayOf(
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT,
        )
    } else {
        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        if (results.values.all { it }) {
            viewModel.startScan()
        } else {
            Toast.makeText(requireContext(), "BLE 권한이 필요합니다.", Toast.LENGTH_LONG).show()
        }
    }

    // ─────────────────────────────────────────────
    // 생명주기
    // ─────────────────────────────────────────────

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        _binding = FragmentBleProvisioningBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupButtons()
        observeState()
        // 진입 시 BLE 스캔 자동 시작
        checkAndStartScan()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // ─────────────────────────────────────────────
    // UI 설정
    // ─────────────────────────────────────────────

    private fun setupButtons() {
        // [연결하기] 버튼 — DeviceFound 상태에서 표시
        binding.btnConnect.setOnClickListener {
            showWifiInputPanel()
        }

        // [Wi-Fi 연결] 버튼 — Wi-Fi 입력 완료 후
        binding.btnProvision.setOnClickListener {
            val ssid = binding.etSsid.text.toString().trim()
            val password = binding.etPassword.text.toString()
            viewModel.connectAndProvision(ssid, password)
        }

        // [다시 스캔] 버튼 — 실패 화면에서
        binding.btnRetry.setOnClickListener {
            viewModel.retry()
            checkAndStartScan()
        }

        // [현재 Wi-Fi 가져오기] 버튼 — SSID 자동 입력
        binding.btnAutoFillSsid.setOnClickListener {
            autoFillCurrentSsid()
        }
    }

    private fun observeState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.state.collect { state -> renderState(state) }
            }
        }
    }

    // ─────────────────────────────────────────────
    // 상태별 UI 렌더링
    // ─────────────────────────────────────────────

    private fun renderState(state: ProvisioningState) {
        // 전체 패널 초기화
        resetPanels()

        when (state) {
            is ProvisioningState.Idle -> {
                binding.tvStatus.text = "기기를 준비하고 있어요"
            }

            is ProvisioningState.Scanning -> {
                binding.scanningPanel.isVisible = true
                binding.tvStatus.text = "Re:Bloom 스피커를 찾는 중..."
                binding.progressScan.isVisible = true
            }

            is ProvisioningState.DeviceFound -> {
                binding.deviceFoundPanel.isVisible = true
                binding.tvDeviceName.text = state.device.name
                binding.tvDeviceAddress.text = state.device.address
                binding.tvRssi.text = "신호 강도: ${state.device.rssi} dBm"
                binding.btnConnect.isVisible = true
                binding.tvStatus.text = "스피커를 발견했습니다!"
            }

            is ProvisioningState.Connecting -> {
                binding.progressPanel.isVisible = true
                binding.tvStatus.text = "스피커에 연결 중..."
                binding.progressIndicator.isVisible = true
            }

            is ProvisioningState.Connected -> {
                binding.wifiInputPanel.isVisible = true
                binding.tvStatus.text = "Wi-Fi 정보를 입력해주세요"
            }

            is ProvisioningState.Writing -> {
                binding.progressPanel.isVisible = true
                binding.tvStatus.text = "Wi-Fi 정보를 전송 중..."
            }

            is ProvisioningState.WaitingResult -> {
                binding.progressPanel.isVisible = true
                binding.tvStatus.text = "스피커가 Wi-Fi에 연결 중..."
                binding.progressIndicator.isVisible = true
            }

            is ProvisioningState.Success -> {
                binding.successPanel.isVisible = true
                binding.tvStatus.text = "연결 완료!"
                binding.tvSuccessMessage.text = "${state.ssid}에 연결됐어요 🎉"
                // 다음 화면으로 이동 (3초 후 자동)
                binding.root.postDelayed({ navigateToMain() }, 3000)
            }

            is ProvisioningState.Fail -> {
                binding.failPanel.isVisible = true
                binding.tvStatus.text = "연결 실패"
                binding.tvFailReason.text = state.reason
                binding.btnRetry.isVisible = true
            }

            is ProvisioningState.PermissionRequired -> {
                binding.tvStatus.text = "BLE 권한이 필요합니다"
                permissionLauncher.launch(blePermissions)
            }

            is ProvisioningState.BleUnavailable -> {
                binding.tvStatus.text = "블루투스를 켜주세요"
                promptEnableBluetooth()
            }
        }
    }

    // ─────────────────────────────────────────────
    // 헬퍼 함수
    // ─────────────────────────────────────────────

    private fun resetPanels() {
        binding.scanningPanel.isVisible = false
        binding.deviceFoundPanel.isVisible = false
        binding.progressPanel.isVisible = false
        binding.wifiInputPanel.isVisible = false
        binding.successPanel.isVisible = false
        binding.failPanel.isVisible = false
        binding.btnConnect.isVisible = false
        binding.btnRetry.isVisible = false
        binding.progressScan.isVisible = false
        binding.progressIndicator.isVisible = false
    }

    private fun showWifiInputPanel() {
        resetPanels()
        binding.wifiInputPanel.isVisible = true
        binding.tvStatus.text = "Wi-Fi 정보를 입력해주세요"
        autoFillCurrentSsid()
    }

    /** 현재 폰이 연결된 Wi-Fi SSID를 자동 입력. */
    private fun autoFillCurrentSsid() {
        val wifiManager = requireContext()
            .applicationContext
            .getSystemService(Context.WIFI_SERVICE) as WifiManager
        val ssid = wifiManager.connectionInfo.ssid?.removePrefix("\"")?.removeSuffix("\"")
        if (!ssid.isNullOrBlank() && ssid != "<unknown ssid>") {
            binding.etSsid.setText(ssid)
        }
    }

    private fun checkAndStartScan() {
        val hasPermissions = blePermissions.all { permission ->
            requireContext().checkSelfPermission(permission) ==
                    android.content.pm.PackageManager.PERMISSION_GRANTED
        }
        if (hasPermissions) {
            viewModel.startScan()
        } else {
            permissionLauncher.launch(blePermissions)
        }
    }

    private fun promptEnableBluetooth() {
        startActivity(Intent(android.provider.Settings.ACTION_BLUETOOTH_SETTINGS))
    }

    private fun navigateToMain() {
        // TODO: NavController로 메인 화면 이동
        // findNavController().navigate(R.id.action_provisioning_to_home)
    }
}
