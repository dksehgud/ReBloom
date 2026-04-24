from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey,
    X25519PublicKey,
)
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class ECDHProvider:
    def __init__(self):
        self._private_key: X25519PrivateKey = X25519PrivateKey.generate()

    @property
    def public_key_bytes(self) -> bytes:
        return self._private_key.public_key().public_bytes(
            serialization.Encoding.Raw,
            serialization.PublicFormat.Raw,
        )

    def derive_shared_key(self, peer_public_key_bytes: bytes) -> bytes:
        peer_public_key = X25519PublicKey.from_public_bytes(peer_public_key_bytes)
        shared_secret = self._private_key.exchange(peer_public_key)
        return shared_secret[:16]


def decrypt_wifi_payload(payload: bytes, shared_key: bytes) -> dict:
    MIN_LEN = 32 + 12 + 1
    if len(payload) < MIN_LEN:
        raise ValueError(f"페이로드 길이 부족: {len(payload)} < {MIN_LEN}")

    nonce = payload[32:44]
    ciphertext = payload[44:]

    import json
    aesgcm = AESGCM(shared_key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return json.loads(plaintext.decode("utf-8"))
