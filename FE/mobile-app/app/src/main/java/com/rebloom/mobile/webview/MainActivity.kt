package com.rebloom.mobile.webview

import android.annotation.SuppressLint
import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.view.Gravity
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebView.WebViewTransport
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.rebloom.mobile.BuildConfig
import com.rebloom.mobile.diary.DiaryRepository
import com.rebloom.mobile.diary.network.DiaryAnalysisClient
import com.rebloom.mobile.network.TokenBridge
import com.rebloom.mobile.storage.database.RebloomDatabase
import com.rebloom.mobile.webview.bridge.DiaryJavascriptBridge

class MainActivity : ComponentActivity() {

    private lateinit var rootView: FrameLayout
    private lateinit var webView: WebView
    private var popupContainer: FrameLayout? = null
    private var popupWebView: WebView? = null
    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            Log.d(TAG, "Notification permission granted=$granted")
            if (!granted) {
                Toast.makeText(
                    this,
                    "Notification permission is required to receive push alerts.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }

    private val diaryBridge: DiaryJavascriptBridge by lazy {
        val database = RebloomDatabase.getInstance(applicationContext)
        DiaryJavascriptBridge(
            diaryRepository = DiaryRepository(database.diaryDao()),
            diaryAnalysisClient = DiaryAnalysisClient(
                context = this,
                analysisApiUrl = BuildConfig.DIARY_ANALYSIS_API_URL,
            ),
        )
    }

    private val webAppBaseUrl: String
        get() {
            val configuredBaseUrl = BuildConfig.WEB_APP_BASE_URL
            if (configuredBaseUrl.isNotBlank()) {
                return configuredBaseUrl
            }

            return if (isProbablyEmulator()) {
                "http://10.0.2.2:5173"
            } else {
                "http://127.0.0.1:5173"
            }
        }

    private val launchUrl: String
        get() = webAppBaseUrl.trimEnd('/') + "/?mode=webview"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.WHITE
        window.navigationBarColor = Color.WHITE
        WindowCompat.setDecorFitsSystemWindows(window, true)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = true
            isAppearanceLightNavigationBars = true
        }

        rootView = FrameLayout(this)
        webView = createConfiguredWebView().apply {
            addJavascriptInterface(TokenBridge(this@MainActivity), "Android")
            addJavascriptInterface(diaryBridge, DIARY_BRIDGE_NAME)
            Log.d(TAG, "Loading WebView URL: $launchUrl")
            loadUrl(launchUrl)
        }

        rootView.addView(webView)
        setContentView(rootView)
        requestNotificationPermissionIfNeeded()

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    when {
                        popupWebView != null -> closePopupWebView()
                        webView.canGoBack() -> webView.goBack()
                        else -> finish()
                    }
                }
            },
        )
    }

    override fun onDestroy() {
        closePopupWebView()

        if (::webView.isInitialized) {
            webView.apply {
                stopLoading()
                loadUrl("about:blank")
                destroy()
            }
        }
        super.onDestroy()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createConfiguredWebView(): WebView =
        WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT)
            setBackgroundColor(Color.WHITE)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.builtInZoomControls = false
            settings.displayZoomControls = false
            settings.setSupportMultipleWindows(true)
            settings.setSupportZoom(false)
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.useWideViewPort = false
            settings.loadWithOverviewMode = false
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            webChromeClient = ReBloomWebChromeClient()
            webViewClient = ReBloomWebViewClient()
        }

    private fun closePopupWebView() {
        val popup = popupWebView ?: return

        popupContainer?.let { container ->
            rootView.removeView(container)
        }
        popup.apply {
            stopLoading()
            loadUrl("about:blank")
            destroy()
        }
        popupWebView = null
        popupContainer = null
    }

    private inner class ReBloomWebChromeClient : WebChromeClient() {
        override fun onCreateWindow(
            view: WebView?,
            isDialog: Boolean,
            isUserGesture: Boolean,
            resultMsg: Message?,
        ): Boolean {
            if (!isUserGesture) {
                return false
            }

            val transport = resultMsg?.obj as? WebViewTransport ?: return false

            closePopupWebView()

            val popup = createConfiguredWebView()
            val container =
                FrameLayout(this@MainActivity).apply {
                    setBackgroundColor(Color.WHITE)
                    elevation = dp(16).toFloat()
                    addView(popup, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
                }

            val width = (resources.displayMetrics.widthPixels - dp(32)).coerceAtLeast(dp(280))
            val height = (resources.displayMetrics.heightPixels * 0.78f).toInt()
            rootView.addView(
                container,
                FrameLayout.LayoutParams(width, height, Gravity.CENTER),
            )

            popupWebView = popup
            popupContainer = container
            transport.webView = popup
            resultMsg.sendToTarget()

            return true
        }

        override fun onCloseWindow(window: WebView?) {
            if (window == popupWebView) {
                closePopupWebView()
            }
        }
    }

    private inner class ReBloomWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(
            view: WebView?,
            request: WebResourceRequest?,
        ): Boolean {
            val uri = request?.url ?: return false

            return when (uri.scheme) {
                "http", "https" -> false
                else -> openExternal(uri)
            }
        }

        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?,
        ) {
            super.onReceivedError(view, request, error)

            if (request?.isForMainFrame == true) {
                Log.e(
                    TAG,
                    "Failed to load main frame: ${request.url} (${error?.errorCode}) ${error?.description}",
                )
            }
        }
    }

    private fun openExternal(uri: Uri): Boolean {
        return try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
            true
        } catch (exception: ActivityNotFoundException) {
            Log.w(TAG, "No activity found for external URL: $uri", exception)
            false
        }
    }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density).toInt()

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return
        }

        val permission = Manifest.permission.POST_NOTIFICATIONS
        if (ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED) {
            return
        }

        notificationPermissionLauncher.launch(permission)
    }

    private fun isProbablyEmulator(): Boolean =
        Build.FINGERPRINT.startsWith("generic") ||
            Build.FINGERPRINT.lowercase().contains("emulator") ||
            Build.MODEL.lowercase().contains("sdk") ||
            Build.MODEL.lowercase().contains("emulator") ||
            Build.MANUFACTURER.lowercase().contains("genymotion") ||
            Build.BRAND.startsWith("generic") ||
            Build.DEVICE.startsWith("generic")

    private companion object {
        private const val TAG = "ReBloomWebView"
        private const val DIARY_BRIDGE_NAME = "RebloomDiaryBridge"
    }
}
