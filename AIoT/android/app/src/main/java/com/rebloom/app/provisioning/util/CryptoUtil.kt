package com.rebloom.app.provisioning.util

import android.security.keystore.KeyProperties
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.PrivateKey
import java.security.SecureRandom
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

object CryptoUtil {

    private const val ALGORITHM = "X25519"
    private const val NONCE_SIZE = 12
    private const val AES_KEY_SIZE = 16

    data class ECKeyPair(val privateKey: PrivateKey, val publicKeyRaw: ByteArray)

    fun generateKeyPair(): ECKeyPair {
        return try {
            val gen = KeyPairGenerator.getInstance(ALGORITHM)
            val kp = gen.generateKeyPair()
            // DER 인코딩(44B) 뒤 32바이트 = Raw 공개키
            val raw = kp.public.encoded.takeLast(32).toByteArray()
            ECKeyPair(kp.private, raw)
        } catch (e: Exception) {
            // BouncyCastle 폴백 (API 26~32)
            val provider = org.bouncycastle.jce.provider.BouncyCastleProvider()
            val gen = KeyPairGenerator.getInstance(ALGORITHM, provider)
            val kp = gen.generateKeyPair()
            val raw = kp.public.encoded.takeLast(32).toByteArray()
            ECKeyPair(kp.private, raw)
        }
    }

    fun deriveSharedKey(appPrivateKey: PrivateKey, rpiPublicKeyRaw: ByteArray): ByteArray {
        val rpiPublicKey = rawToPublicKey(rpiPublicKeyRaw)
        val ka = try {
            KeyAgreement.getInstance(ALGORITHM)
        } catch (e: Exception) {
            KeyAgreement.getInstance(ALGORITHM, org.bouncycastle.jce.provider.BouncyCastleProvider())
        }
        ka.init(appPrivateKey)
        ka.doPhase(rpiPublicKey, true)
        return ka.generateSecret().take(AES_KEY_SIZE).toByteArray()
    }

    // 페이로드: appPubKey(32B) | nonce(12B) | ciphertext+tag
    fun buildEncryptedPayload(
        appPublicKeyRaw: ByteArray,
        sharedKey: ByteArray,
        ssid: String,
        password: String,
    ): ByteArray {
        val plain = """{"ssid":"$ssid","password":"$password"}""".toByteArray(Charsets.UTF_8)
        val nonce = ByteArray(NONCE_SIZE).also { SecureRandom().nextBytes(it) }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(sharedKey, KeyProperties.KEY_ALGORITHM_AES), GCMParameterSpec(128, nonce))
        return appPublicKeyRaw + nonce + cipher.doFinal(plain)
    }

    private fun rawToPublicKey(raw: ByteArray): java.security.PublicKey {
        // X25519 OID DER prefix (12 bytes)
        val prefix = byteArrayOf(0x30, 0x2A, 0x30, 0x05, 0x06, 0x03, 0x2B, 0x65, 0x6E, 0x03, 0x21, 0x00)
        val der = prefix + raw
        val spec = X509EncodedKeySpec(der)
        return try {
            KeyFactory.getInstance(ALGORITHM).generatePublic(spec)
        } catch (e: Exception) {
            KeyFactory.getInstance(ALGORITHM, org.bouncycastle.jce.provider.BouncyCastleProvider()).generatePublic(spec)
        }
    }
}
