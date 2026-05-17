plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.ksp)
    alias(libs.plugins.google.services)
}

val webAppBaseUrlProvider = providers.gradleProperty("WEB_APP_BASE_URL")
val debugWebAppBaseUrl = webAppBaseUrlProvider
    .orElse("")
    .get()
val releaseWebAppBaseUrl = webAppBaseUrlProvider
    .orElse("https://example.invalid")
    .get()
val diaryAnalysisApiUrl =
    providers.gradleProperty("DIARY_ANALYSIS_API_URL")
        .orElse("")
        .get()
val apiBaseUrl =
    providers.gradleProperty("API_BASE_URL")
        .orElse("https://example.invalid/")
        .get()

android {
    namespace = "com.rebloom.mobile"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.rebloom.mobile"
        minSdk = 29
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "WEB_APP_BASE_URL", "\"$debugWebAppBaseUrl\"")
        buildConfigField("String", "DIARY_ANALYSIS_API_URL", "\"$diaryAnalysisApiUrl\"")
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
    }

    signingConfigs {
        create("shared") {
            storeFile = file("../rebloom.keystore")
            storePassword = "rebloom123"
            keyAlias = "rebloom"
            keyPassword = "rebloom123"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("shared")
            buildConfigField("String", "WEB_APP_BASE_URL", "\"$debugWebAppBaseUrl\"")
        }
        release {
            signingConfig = signingConfigs.getByName("shared")
            isMinifyEnabled = false
            buildConfigField("String", "WEB_APP_BASE_URL", "\"$releaseWebAppBaseUrl\"")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    buildFeatures {
        buildConfig = true
        viewBinding = true
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    implementation(group = "", name = "samsung-health-data-api-1.1.0", ext = "aar")
    implementation(libs.play.services.wearable)
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    implementation("com.google.code.gson:gson:2.11.0")
    implementation("org.jetbrains.kotlin:kotlin-parcelize-runtime:1.9.0")
    implementation("androidx.activity:activity-ktx:1.9.0")
    implementation("androidx.fragment:fragment-ktx:1.8.5")
    implementation("androidx.webkit:webkit:1.8.0")
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.messaging)

    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("org.bouncycastle:bcpkix-jdk18on:1.77")
}
