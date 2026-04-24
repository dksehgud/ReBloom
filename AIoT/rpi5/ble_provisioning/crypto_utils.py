"""
crypto_utils.py
───────────────
ECDH (X25519) 키 교환 + AES-128-GCM 암복호화 유틸리티.

[암호화 흐름]
  1. RPi5가 X25519 키 쌍을 생성하고 공개키를 BLE Characteristic으로 노출
  2. 앱이 RPi5 공개키를 읽고 자신의 X25519 키 쌍 생성
  3. ECDH로 공유 비밀(shared secret) 도출 → 앞 16바이트를 AES-128 키로 사용
  4. 앱이 Wi-Fi 정보를 AES-128-GCM으로 암호화해 Write
  5. RPi5가 복호화

[Write Characteristic 페이로드 구조]
  app_pubkey (32B) | nonce (12B) | ciphertext+tag (N+16B)
"""

import os
from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey,
    X25519PublicKey,
)
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class ECDHProvider:
    """RPi5 측 ECDH 키 관리자. 프로세스 기동 시 1회 생성."""

    def __init__(self):
        self._private_key: X25519PrivateKey = X25519PrivateKey.generate()

    @property
    def public_key_bytes(self) -> bytes:
        """BLE Characteristic으로 노출할 32바이트 공개키."""
        return self._private_key.public_key().public_bytes(
            serialization.Encoding.Raw,
            serialization.PublicFormat.Raw,
        )

    def derive_shared_key(self, peer_public_key_bytes: bytes) -> bytes:
        """
        상대방(앱) 공개키 32바이트를 받아 AES-128 공유키(16바이트) 반환.
        X25519 교환 결과 앞 16바이트만 사용.
        """
        peer_public_key = X25519PublicKey.from_public_bytes(peer_public_key_bytes)
        shared_secret = self._private_key.exchange(peer_public_key)
        return shared_secret[:16]  # AES-128


def decrypt_wifi_payload(payload: bytes, shared_key: bytes) -> dict:
    """
    앱이 전송한 암호화 페이로드를 복호화해 Wi-Fi 자격증명 딕셔너리 반환.

    페이로드 구조:
        app_pubkey (32B) | nonce (12B) | ciphertext+tag

    반환값:
        {"ssid": "...", "password": "..."}

    예외:
        ValueError — 페이로드 길이 부족
        cryptography.exceptions.InvalidTag — 복호화 실패(무결성 오류)
    """
    MIN_LEN = 32 + 12 + 1  # pubkey + nonce + 최소 ciphertext
    if len(payload) < MIN_LEN:
        raise ValueError(f"페이로드 길이 부족: {len(payload)} < {MIN_LEN}")

    # app_pubkey는 derive_shared_key 단계에서 이미 소비됨 → 여기선 skip
    nonce = payload[32:44]
    ciphertext = payload[44:]

    import json
    aesgcm = AESGCM(shared_key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return json.loads(plaintext.decode("utf-8"))
