package com.rebloom.mobile.webview

import android.annotation.SuppressLint
import android.graphics.Color
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.ComponentActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.rebloom.mobile.BuildConfig
import com.rebloom.mobile.diary.DiaryRepository
import com.rebloom.mobile.diary.network.DiaryAnalysisClient
import com.rebloom.mobile.storage.database.RebloomDatabase
import com.rebloom.mobile.webview.bridge.DiaryJavascriptBridge
import com.rebloom.mobile.network.TokenBridge

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private val diaryBridge: DiaryJavascriptBridge by lazy {
        val database = RebloomDatabase.getInstance(applicationContext)
        DiaryJavascriptBridge(
            diaryRepository = DiaryRepository(database.diaryDao()),
            diaryAnalysisClient = DiaryAnalysisClient(BuildConfig.DIARY_ANALYSIS_API_URL),
        )
    }

    private val launchUrl: String
        get() = BuildConfig.WEB_APP_BASE_URL.trimEnd('/') + "/?mode=webview"

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

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT)
            setBackgroundColor(Color.WHITE)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.builtInZoomControls = false
            settings.displayZoomControls = false
            settings.setSupportMultipleWindows(false)
            settings.setSupportZoom(false)
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.useWideViewPort = false
            settings.loadWithOverviewMode = false
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            addJavascriptInterface(TokenBridge(this@MainActivity), "Android")
            webChromeClient = WebChromeClient()
            webViewClient = ReBloomWebViewClient()
            addJavascriptInterface(diaryBridge, DIARY_BRIDGE_NAME)
            loadUrl(launchUrl)
        }

        setContentView(webView)

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        finish()
                    }
                }
            },
        )
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.apply {
                stopLoading()
                loadUrl("about:blank")
                destroy()
            }
        }
        super.onDestroy()
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

    private companion object {
        private const val TAG = "ReBloomWebView"
        private const val DIARY_BRIDGE_NAME = "RebloomDiaryBridge"
    }
}
