"""
Isolation Forest 모델 학습 및 추론 (Phase 2 - biometric_count >= 288건)

학습 트리거: biometric_count 288건 달성 시 최초 학습
재학습 트리거: 매일 기상 후 수면 데이터 수신 시
contamination: 기본 0.01 / PHQ 위험 판정 시 0.05
"""

import numpy as np
from sklearn.ensemble import IsolationForest

from app.model.storage import load_if_model, save_if_model


# =====================================================================
# 피처 정의 (anomaly.py와 동일한 순서 유지)
# =====================================================================

FEATURES = ["hr", "rmssd", "pnn50", "lf_hf", "acc_mag", "hr_acc_ratio"]

DEFAULT_CONTAMINATION = 0.01


# =====================================================================
# 학습
# =====================================================================

def train_if_model(user_id: str, biometrics: list[dict], contamination: float = DEFAULT_CONTAMINATION) -> None:
    """
    IF 모델 학습 및 저장

    Args:
        user_id       : 유저 UUID
        biometrics    : 생체 데이터 리스트 (각 dict에 FEATURES 키 포함)
        contamination : 이상치 비율 (기본 0.01 / PHQ 위험 시 0.05)
    """
    X = _to_matrix(biometrics)

    model = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=100,
    )
    model.fit(X)

    save_if_model(user_id, model)


# =====================================================================
# 추론
# =====================================================================

def predict_if_model(user_id: str, biometric: dict) -> dict:
    """
    IF 모델로 이상치 판단

    Args:
        user_id   : 유저 UUID
        biometric : 생체 데이터 단건 (FEATURES 키 포함)

    Returns:
        {
            "is_anomaly" : bool,
            "score"      : float,  # 이상치 점수 (낮을수록 이상)
        }

    Raises:
        FileNotFoundError: 아직 학습된 모델이 없을 때
    """
    model = load_if_model(user_id)
    if model is None:
        raise FileNotFoundError(f"IF 모델이 없어요. 먼저 학습이 필요해요: {user_id}")

    X = _to_matrix([biometric])

    prediction = model.predict(X)[0]   # 1: 정상, -1: 이상치
    score      = model.score_samples(X)[0]

    return {
        "is_anomaly" : prediction == -1,
        "score"      : round(float(score), 4),
    }


# =====================================================================
# 내부 유틸
# =====================================================================

def _to_matrix(biometrics: list[dict]) -> np.ndarray:
    """biometrics 리스트 → numpy 행렬 변환"""
    return np.array([
        [record[feature] for feature in FEATURES]
        for record in biometrics
    ])