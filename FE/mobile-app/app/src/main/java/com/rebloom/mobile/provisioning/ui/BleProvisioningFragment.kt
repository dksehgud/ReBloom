package com.rebloom.mobile.provisioning.ui

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.location.LocationManager
import android.net.wifi.ScanResult
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.rebloom.mobile.provisioning.BleProvisioningViewModel
import com.rebloom.mobile.provisioning.ProvisioningState
import com.rebloom.mobile.provisioning.data.ProvisioningRegistrationContext
import com.rebloom.mobile.databinding.FragmentBleProvisioningBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * BleProvisioningFragment.kt
 * ───────────────────────────
 * BLE Provisioning UX를 담당하는 Fragment.
 *
 * [화면 전환 흐름]
 *   Idle → Scanning(BLE) → DeviceFound → [연결하기]
 *   → Wi-Fi 검색 → Wi-Fi 목록 → 네트워크 선택 → 비밀번호 입력 → [연결]
 *   → Connecting → WaitingResult → Success | Fail
 */
class BleProvisioningFragment : Fragment() {

    private var _binding: FragmentBleProvisioningBinding? = null
    private val binding get() = _binding!!

    private val viewModel: BleProvisioningViewModel by viewModels {
        BleProvisioningViewModelFactory(
            context = requireContext(),
            registrationContext = ProvisioningRegistrationContext(
                role = arguments?.getString(BleProvisioningActivity.EXTRA_ROLE) ?: "child",
                childrenId = arguments?.getString(BleProvisioningActivity.EXTRA_CHILDREN_ID),
            ),
        )
    }

    /** 현재 선택된 Wi-Fi SSID */
    private var selectedSsid: String = ""

    // ─────────────────────────────────────────────
    // 권한 요청
    // ─────────────────────────────────────────────

    private val blePermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        arrayOf(
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.ACCESS_FINE_LOCATION // Wi-Fi 스캔(getScanResults)에 필수
        )
    } else {
        arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
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
        checkAndStartBleScan()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // ─────────────────────────────────────────────
    // 버튼 설정
    // ─────────────────────────────────────────────

    private fun setupButtons() {
        // BLE 기기 발견 후 "연결하기" → Wi-Fi 검색 패널 표시
        binding.btnConnect.setOnClickListener {
            showWifiInputPanel()
        }

        // "Wi-Fi 네트워크 검색" 버튼
        binding.btnScanWifi.setOnClickListener {
            startWifiScan()
        }

        // "스피커에 Wi-Fi 연결" 버튼
        binding.btnProvision.setOnClickListener {
            val password = binding.etPassword.text.toString()
            if (selectedSsid.isBlank()) {
                Toast.makeText(requireContext(), "Wi-Fi 네트워크를 선택해주세요.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewModel.connectAndProvision(selectedSsid, password)
        }

        // 실패 후 "다시 시도" 버튼
        binding.btnRetry.setOnClickListener {
            viewModel.retry()
            checkAndStartBleScan()
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
                binding.progressPanel.isVisible = true
                binding.tvStatus.text = "스피커와 연결되었습니다. 설정 전송 중..."
                binding.progressIndicator.isVisible = true
            }

            is ProvisioningState.Writing, is ProvisioningState.WaitingResult -> {
                binding.progressPanel.isVisible = true
                binding.tvStatus.text = "스피커가 Wi-Fi에 연결 중..."
                binding.progressIndicator.isVisible = true
            }

            is ProvisioningState.RegisteringDevice -> {
                binding.progressPanel.isVisible = true
                binding.tvStatus.text = "스피커를 계정에 등록 중..."
                binding.progressIndicator.isVisible = true
            }

            is ProvisioningState.Success -> {
                binding.successPanel.isVisible = true
                binding.tvStatus.text = "연결 완료!"
                binding.tvSuccessMessage.text = "${state.ssid}에 연결됐어요 🎉"
                binding.root.postDelayed({ activity?.finish() }, 3000)
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
                startActivity(Intent(android.provider.Settings.ACTION_BLUETOOTH_SETTINGS))
            }
        }
    }

    // ─────────────────────────────────────────────
    // Wi-Fi 스캔 & 목록 표시
    // ─────────────────────────────────────────────

    private fun showWifiInputPanel() {
        resetPanels()
        binding.wifiInputPanel.isVisible = true
        binding.tvStatus.text = "Wi-Fi 네트워크를 선택해주세요"
        // 패널 진입 시 자동으로 스캔 시작
        startWifiScan()
    }

    @SuppressLint("MissingPermission")
    private fun startWifiScan() {
        val wifiManager = requireContext().applicationContext
            .getSystemService(Context.WIFI_SERVICE) as WifiManager

        if (!wifiManager.isWifiEnabled) {
            Toast.makeText(requireContext(), "Wi-Fi를 켜주세요.", Toast.LENGTH_LONG).show()
            return
        }

        // 스캔 중 UI 표시
        binding.wifiInputPanel.isVisible = true
        binding.wifiScanningPanel.isVisible = true
        binding.wifiListContainer.isVisible = false
        binding.wifiCredentialPanel.isVisible = false

        viewLifecycleOwner.lifecycleScope.launch {
            // 백그라운드에서 스캔 트리거 + 결과 로드
            val networks = withContext(Dispatchers.IO) {
                @Suppress("DEPRECATION")
                wifiManager.startScan()   // deprecated지만 캐시 새로고침용
                delay(1500)               // 스캔 결과 대기
                wifiManager.scanResults
                    .filter { it.SSID.isNotBlank() }
                    .distinctBy { it.SSID }
                    .sortedByDescending { it.level }
            }

            if (_binding == null) return@launch

            binding.wifiScanningPanel.isVisible = false

            if (networks.isEmpty()) {
                Toast.makeText(requireContext(), "주변 Wi-Fi를 찾지 못했습니다. 다시 시도해주세요.", Toast.LENGTH_SHORT).show()
                return@launch
            }

            showWifiList(networks)
        }
    }

    /**
     * Wi-Fi 네트워크 목록을 동적으로 생성하여 표시.
     */
    private fun showWifiList(networks: List<ScanResult>) {
        binding.wifiListContainer.removeAllViews()

        networks.forEachIndexed { index, network ->
            val itemView = createWifiItem(network, isLast = index == networks.size - 1)
            binding.wifiListContainer.addView(itemView)
        }

        binding.wifiListContainer.isVisible = true
    }

    private fun createWifiItem(network: ScanResult, isLast: Boolean): View {
        val ctx = requireContext()
        val dp = resources.displayMetrics.density

        val row = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            )
            setPadding(
                (16 * dp).toInt(),
                (14 * dp).toInt(),
                (16 * dp).toInt(),
                (14 * dp).toInt(),
            )
            isClickable = true
            isFocusable = true
            setBackgroundColor(Color.TRANSPARENT)
            // 구분선 (마지막 항목 제외)
            if (!isLast) {
                setBackgroundResource(android.R.drawable.list_selector_background)
            }
        }

        // Wi-Fi 신호 강도 이모지
        val signalEmoji = getSignalEmoji(network.level)
        val signalView = TextView(ctx).apply {
            text = signalEmoji
            textSize = 18f
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).also { it.marginEnd = (10 * dp).toInt() }
        }

        // SSID + 보안 타입
        val ssidView = TextView(ctx).apply {
            text = network.SSID
            textSize = 15f
            setTextColor(Color.parseColor("#1A1A2E"))
            layoutParams = LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1f,
            )
        }

        // 보안 아이콘
        val secureView = TextView(ctx).apply {
            text = if (network.capabilities.contains("WPA") || network.capabilities.contains("WEP")) "🔒" else "🔓"
            textSize = 14f
        }

        row.addView(signalView)
        row.addView(ssidView)
        row.addView(secureView)

        // 클릭 시 해당 SSID 선택
        row.setOnClickListener {
            onWifiNetworkSelected(network.SSID)
        }

        return row
    }

    private fun onWifiNetworkSelected(ssid: String) {
        selectedSsid = ssid
        binding.tvSelectedSsid.text = ssid
        binding.wifiListContainer.isVisible = false
        binding.wifiCredentialPanel.isVisible = true
        binding.etPassword.requestFocus()
    }

    // 신호 강도에 따른 이모지
    private fun getSignalEmoji(level: Int): String {
        return when {
            level >= -55 -> "▐▐▐▐"   // 매우 강함
            level >= -65 -> "▐▐▐░"   // 강함
            level >= -75 -> "▐▐░░"   // 보통
            else         -> "▐░░░"   // 약함
        }
    }

    // ─────────────────────────────────────────────
    // BLE 스캔 시작 (권한 + 위치 서비스 체크)
    // ─────────────────────────────────────────────

    private fun checkAndStartBleScan() {
        val hasPermissions = blePermissions.all { permission ->
            requireContext().checkSelfPermission(permission) ==
                    android.content.pm.PackageManager.PERMISSION_GRANTED
        }
        if (!hasPermissions) {
            permissionLauncher.launch(blePermissions)
            return
        }

        val locationManager = requireContext()
            .getSystemService(Context.LOCATION_SERVICE) as LocationManager
        if (!locationManager.isLocationEnabled) {
            android.app.AlertDialog.Builder(requireContext())
                .setTitle("위치 서비스 비활성화")
                .setMessage("스피커를 찾으려면 위치 서비스(GPS)를 켜줘야 합니다.\n설정화면으로 이동할까요?")
                .setPositiveButton("설정 열기") { _, _ ->
                    startActivity(Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                }
                .setNegativeButton("그냥 시도") { _, _ ->
                    viewModel.startScan()
                }
                .show()
            return
        }

        viewModel.startScan()
    }

    // ─────────────────────────────────────────────
    // 헬퍼
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
}
