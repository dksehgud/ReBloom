plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.rebloom.watch"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.rebloom.mobile"
        minSdk = 30
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
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
        }
        release {
            signingConfig = signingConfigs.getByName("shared")
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
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
    implementation(libs.play.services.wearable)
    implementation(group = "", name = "samsung-health-sensor-api-1.4.1", ext = "aar")
    implementation(libs.androidx.core.ktx)
    implementation("org.apache.commons:commons-math3:3.6.1")
}