// app/build.gradle.kts (Module: app)
// BLE Provisioning 관련 의존성 스니펫

android {
    defaultConfig {
        minSdk = 26  // X25519 API 26+ 지원 (BouncyCastle 폴백)
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    // ─── BLE / Bluetooth ───────────────────────────
    // 네이티브 Android BLE API 사용 (별도 라이브러리 불필요)

    // ─── 암호화 ─────────────────────────────────────
    // Android API 33+ : 네이티브 X25519 지원
    // Android API 26~32: BouncyCastle 폴백
    implementation("org.bouncycastle:bcpkix-jdk18on:1.77")

    // ─── Coroutines ──────────────────────────────────
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // ─── Lifecycle (ViewModel, StateFlow) ────────────
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

    // ─── Material Components (TextInputLayout 등) ─────
    implementation("com.google.android.material:material:1.11.0")

    // ─── Navigation (Provisioning → 메인 화면 전환) ───
    implementation("androidx.navigation:navigation-fragment-ktx:2.7.7")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.7")
}
