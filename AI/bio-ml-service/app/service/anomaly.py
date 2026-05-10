"""
임계치 기반 이상치 탐지 (Phase 1 - biometric_count < 288건)

논문 49명 데이터 기반 IQR 임계치 사용
변수: hr, rmssd, pnn50, lf_hf, acc_mag, hr_acc_ratio

모든 값은 워치에서 5분 집계 시 계산된 값을 그대로 사용
"""


# =====================================================================
# IQR 임계치 상수 (논문 데이터로 계산 후 채워넣기)
# 범위: [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR]
# =====================================================================

THRESHOLDS: dict[str, tuple[float, float]] = {
    "hr"           : (0.0, 0.0),   # TODO: 논문 계산값으로 교체
    "rmssd"        : (0.0, 0.0),
    "pnn50"        : (0.0, 0.0),
    "lf_hf"        : (0.0, 0.0),
    "acc_mag"      : (0.0, 0.0),
    "hr_acc_ratio" : (0.0, 0.0),
}


# =====================================================================
# 이상치 판단
# =====================================================================

def detect_anomaly(
    hr: float,
    rmssd: float,
    pnn50: float,
    lf_hf: float,
    acc_mag: float,
    hr_acc_ratio: float,
) -> dict:
    """
    임계치 기반 이상치 탐지

    Args:
        hr           : 심박수 (워치에서 계산된 값)
        rmssd        : HRV rmssd (워치에서 계산된 값)
        pnn50        : HRV pnn50 (워치에서 계산된 값)
        lf_hf        : LF/HF ratio (워치에서 계산된 값)
        acc_mag      : 가속도 크기 (워치에서 계산된 값)
        hr_acc_ratio : 심박수 / 가속도 비율 (워치에서 계산된 값)

    Returns:
        {
            "is_anomaly"       : bool,
            "anomaly_features" : list[str],  # 이상치로 판단된 변수명
        }
    """
    features = {
        "hr"           : hr,
        "rmssd"        : rmssd,
        "pnn50"        : pnn50,
        "lf_hf"        : lf_hf,
        "acc_mag"      : acc_mag,
        "hr_acc_ratio" : hr_acc_ratio,
    }

    anomaly_features = [
        feature
        for feature, value in features.items()
        if value < THRESHOLDS[feature][0] or value > THRESHOLDS[feature][1]
    ]

    return {
        "is_anomaly"       : len(anomaly_features) > 0,
        "anomaly_features" : anomaly_features,
    }