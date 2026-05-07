plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

val webAppBaseUrl =
    providers.gradleProperty("WEB_APP_BASE_URL")
        .orElse("https://example.invalid")
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
        buildConfigField("String", "WEB_APP_BASE_URL", "\"$webAppBaseUrl\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    buildFeatures {
        buildConfig = true
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
}
