"""
PHQ 예측 및 IF contamination 조정 (Phase 3 - 첫 수집일 기준 14일 경과)

예측 트리거: 매일 기상 후 수면 데이터 수신 시 (isPHQReady=True)
모델: 로지스틱 회귀 (app/model/phq_model.pkl)
결과에 따라 IF contamination 동적 조정
  정상 → 0.01 / 위험 → 0.05
"""

import numpy as np

from app.model.storage import load_phq_model
from app.service.if_model import train_if_model


# =====================================================================
# 모델 로드 (서버 시작 시 한 번만)
# =====================================================================

_bundle    = load_phq_model()
_model     = _bundle["model"]
_scaler    = _bundle["scaler"]
_threshold = _bundle["threshold"]
_features  = _bundle["features"]

CONTAMINATION_NORMAL = 0.01
CONTAMINATION_RISK   = 0.05


# =====================================================================
# PHQ 예측
# =====================================================================

def predict_phq(age: int | None, sleeps: list[dict], biometrics: list[dict]) -> dict:
    """
    PHQ 예측

    Args:
        age        : 유저 나이 (없으면 None)
        sleeps     : 14일치 수면 데이터 리스트
        biometrics : 14일치 생체 데이터 리스트

    Returns:
        {
            "phq_result" : int,    # 0: 정상, 1: 위험
            "phq_score"  : float,  # 예측 확률
        }
    """
    features = _aggregate_features(age, sleeps, biometrics)
    X        = np.array([[features[f] for f in _features]])
    X_scaled = _scaler.transform(X)
    prob     = _model.predict_proba(X_scaled)[0][1]

    return {
        "phq_result" : int(prob >= _threshold),
        "phq_score"  : round(float(prob), 4),
    }


# =====================================================================
# PHQ 예측 + IF 재학습
# =====================================================================

def analyze_and_retrain(
    user_id   : str,
    age       : int | None,
    sleeps    : list[dict],
    biometrics: list[dict],
) -> dict:
    """
    PHQ 예측 후 contamination 조정해서 IF 재학습

    Args:
        user_id    : 유저 UUID
        age        : 유저 나이 (없으면 None)
        sleeps     : 14일치 수면 데이터 리스트
        biometrics : 14일치 생체 데이터 리스트

    Returns:
        {
            "phq_result"    : int,
            "phq_score"     : float,
            "contamination" : float,  # 재학습에 사용된 contamination
        }
    """
    result = predict_phq(age, sleeps, biometrics)

    contamination = CONTAMINATION_RISK if result["phq_result"] == 1 else CONTAMINATION_NORMAL
    train_if_model(user_id, biometrics, contamination)

    return {
        **result,
        "contamination" : contamination,
    }


# =====================================================================
# 피처 집계 (14일치 데이터 → PHQ 모델 입력값)
# =====================================================================

def _aggregate_features(age: int | None, sleeps: list[dict], biometrics: list[dict]) -> dict:
    """
    14일치 수면/생체 데이터를 PHQ 모델 입력 피처로 집계

    Args:
        age        : 유저 나이 (없으면 None → 0.0 으로 처리)
        sleeps     : 14일치 수면 데이터 리스트
        biometrics : 14일치 생체 데이터 리스트

    PHQ 모델 학습 시 사용한 피처와 동일한 방식으로 집계
    """
    def mean(values):
        return float(np.mean(values)) if values else 0.0

    def std(values):
        return float(np.std(values)) if values else 0.0

    hrs      = [b["hr"]      for b in biometrics]
    rmssds   = [b["rmssd"]   for b in biometrics]
    pnn50s   = [b["pnn50"]   for b in biometrics]
    lf_hfs   = [b["lf_hf"]   for b in biometrics]
    acc_mags = [b["acc_mag"] for b in biometrics]

    sleep_durations = [s["sleep_duration"]     for s in sleeps]
    asleeps         = [s["asleep"]             for s in sleeps]
    wasos           = [s["waso"]               for s in sleeps]
    rmssd_nights    = [s.get("rmssd_night", 0) for s in sleeps]

    return {
        "hr_std"             : std(hrs),
        "rmssd_std"          : std(rmssds),
        "pnn50_std"          : std(pnn50s),
        "lf/hf_median"       : mean(lf_hfs),
        "acc_mag_median"     : mean(acc_mags),
        "sleep_duration_std" : std(sleep_durations),
        "asleep_std"         : std(asleeps),
        "waso_std"           : std(wasos),
        "rmssd_night_std"    : std(rmssd_nights),
        "age"                : float(age) if age is not None else 0.0,
    }