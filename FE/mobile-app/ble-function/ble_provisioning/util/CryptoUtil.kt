package com.rebloom.app.provisioning.util

import android.security.keystore.KeyProperties
import java.security.KeyPairGenerator
import java.security.KeyFactory
import java.security.PrivateKey
import java.security.PublicKey
import java.security.SecureRandom
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * CryptoUtil.kt
 * ─────────────
 * Android 쪽 ECDH (X25519) 키 교환 + AES-128-GCM 암호화 유틸리티.
 *
 * [암호화 페이로드 구조 — RPi5 WIFI Characteristic으로 Write]
 *   app_pubkey (32B) | nonce (12B) | AES-GCM ciphertext+tag
 *
 * [주의]
 *   X25519는 Android API 33+에서 네이티브 지원.
 *   그 이하 버전은 build.gradle에 BouncyCastle 의존성 추가 필요:
 *   implementation("org.bouncycastle:bcpkix-jdk18on:1.77")
 */
object CryptoUtil {

    private const val EC_ALGORITHM = "X25519"
    private const val AES_TRANSFORMATION = "AES/GCM/NoPadding"
    private const val GCM_TAG_LENGTH = 128  // bits
    private const val NONCE_SIZE = 12       // bytes
    private const val AES_KEY_SIZE = 16     // bytes (AES-128)

    // ─────────────────────────────────────────────
    // ECDH 키 쌍 생성
    // ─────────────────────────────────────────────

    data class ECKeyPair(
        val privateKey: PrivateKey,
        val publicKeyRaw: ByteArray,  // 32바이트 Raw 형식 (RPi5와 호환)
    )

    /**
     * X25519 키 쌍 생성.
     * Android API 33+: java.security 네이티브 사용
     * Android API 26~32: BouncyCastle 폴백
     */
    fun generateKeyPair(): ECKeyPair {
        return try {
            generateKeyPairNative()
        } catch (e: Exception) {
            generateKeyPairBouncyCastle()
        }
    }

    private fun generateKeyPairNative(): ECKeyPair {
        val generator = KeyPairGenerator.getInstance(EC_ALGORITHM)
        val keyPair = generator.generateKeyPair()

        // X25519 공개키를 Raw 32바이트로 추출
        // getEncoded()는 DER 형식(44bytes) → 뒤 32바이트가 Raw 키
        val pubKeyEncoded = keyPair.public.encoded
        val pubKeyRaw = pubKeyEncoded.takeLast(32).toByteArray()

        return ECKeyPair(
            privateKey = keyPair.private,
            publicKeyRaw = pubKeyRaw,
        )
    }

    private fun generateKeyPairBouncyCastle(): ECKeyPair {
        // BouncyCastle 경로 (API < 33 폴백)
        val provider = org.bouncycastle.jce.provider.BouncyCastleProvider()
        val generator = KeyPairGenerator.getInstance(EC_ALGORITHM, provider)
        val keyPair = generator.generateKeyPair()

        val pubKeyEncoded = keyPair.public.encoded
        val pubKeyRaw = pubKeyEncoded.takeLast(32).toByteArray()

        return ECKeyPair(
            privateKey = keyPair.private,
            publicKeyRaw = pubKeyRaw,
        )
    }

    // ─────────────────────────────────────────────
    // ECDH 공유키 도출
    // ─────────────────────────────────────────────

    /**
     * 앱의 개인키 + RPi5 공개키(32B Raw) → AES-128 공유키(16B) 도출.
     *
     * @param appPrivateKey  generateKeyPair()로 생성한 앱 개인키
     * @param rpiPublicKeyRaw RPi5 PUBKEY Characteristic에서 읽은 32바이트
     * @return 16바이트 AES-128 공유키
     */
    fun deriveSharedKey(appPrivateKey: PrivateKey, rpiPublicKeyRaw: ByteArray): ByteArray {
        val rpiPublicKey = rawToX25519PublicKey(rpiPublicKeyRaw)

        val keyAgreement = try {
            KeyAgreement.getInstance(EC_ALGORITHM)
        } catch (e: Exception) {
            KeyAgreement.getInstance(
                EC_ALGORITHM,
                org.bouncycastle.jce.provider.BouncyCastleProvider()
            )
        }
        keyAgreement.init(appPrivateKey)
        keyAgreement.doPhase(rpiPublicKey, true)

        val sharedSecret = keyAgreement.generateSecret()
        return sharedSecret.take(AES_KEY_SIZE).toByteArray()  // 앞 16바이트
    }

    /**
     * 32바이트 Raw X25519 공개키를 Java PublicKey 객체로 변환.
     * X25519 DER 헤더(12바이트)를 앞에 붙여 X509EncodedKeySpec으로 파싱.
     */
    private fun rawToX25519PublicKey(rawBytes: ByteArray): PublicKey {
        // X25519 OID DER prefix: 30 2A 30 05 06 03 2B 65 6E 03 21 00
        val x25519OidPrefix = byteArrayOf(
            0x30, 0x2A, 0x30, 0x05, 0x06, 0x03,
            0x2B, 0x65, 0x6E, 0x03, 0x21, 0x00
        )
        val derEncoded = x25519OidPrefix + rawBytes
        val keySpec = X509EncodedKeySpec(derEncoded)
        return try {
            KeyFactory.getInstance(EC_ALGORITHM).generatePublic(keySpec)
        } catch (e: Exception) {
            KeyFactory.getInstance(
                EC_ALGORITHM,
                org.bouncycastle.jce.provider.BouncyCastleProvider()
            ).generatePublic(keySpec)
        }
    }

    // ─────────────────────────────────────────────
    // AES-128-GCM 암호화
    // ─────────────────────────────────────────────

    /**
     * Wi-Fi 자격증명을 암호화하고 BLE Write 페이로드를 반환한다.
     *
     * 반환 포맷: app_pubkey(32B) | nonce(12B) | ciphertext+tag
     *
     * @param appPublicKeyRaw 앱 X25519 공개키 32바이트 (RPi5가 공유키 도출에 사용)
     * @param sharedKey       deriveSharedKey()로 도출한 16바이트 AES 키
     * @param ssid            Wi-Fi SSID
     * @param password        Wi-Fi 비밀번호
     */
    fun buildEncryptedPayload(
        appPublicKeyRaw: ByteArray,
        sharedKey: ByteArray,
        ssid: String,
        password: String,
    ): ByteArray {
        val plaintext = """{"ssid":"$ssid","password":"$password"}""".toByteArray(Charsets.UTF_8)
        val nonce = ByteArray(NONCE_SIZE).also { SecureRandom().nextBytes(it) }

        val cipher = Cipher.getInstance(AES_TRANSFORMATION)
        cipher.init(
            Cipher.ENCRYPT_MODE,
            SecretKeySpec(sharedKey, KeyProperties.KEY_ALGORITHM_AES),
            GCMParameterSpec(GCM_TAG_LENGTH, nonce),
        )
        val ciphertext = cipher.doFinal(plaintext)

        // 최종 페이로드 조립
        return appPublicKeyRaw + nonce + ciphertext
    }
}
