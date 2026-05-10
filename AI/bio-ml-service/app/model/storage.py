import joblib
from pathlib import Path
from app.config.settings import MODEL_DIR


def get_if_model_path(user_id: str) -> Path:
    """유저별 IF 모델 파일 경로 반환"""
    return Path(MODEL_DIR) / f"if_model_{user_id}.pkl"


def get_phq_model_path() -> Path:
    """공통 PHQ 모델 파일 경로 반환"""
    return Path(MODEL_DIR) / "phq_model.pkl"


def save_if_model(user_id: str, model) -> None:
    """유저별 IF 모델 저장
    
    Args:
        user_id: 유저 UUID
        model: 학습된 IsolationForest 모델
    """
    path = get_if_model_path(user_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)


def load_if_model(user_id: str):
    """유저별 IF 모델 로드
    
    Args:
        user_id: 유저 UUID
    Returns:
        IsolationForest 모델 or None (아직 학습 안 된 유저)
    """
    path = get_if_model_path(user_id)
    if not path.exists():
        return None
    return joblib.load(path)


def load_phq_model() -> dict:
    """공통 PHQ 로지스틱 회귀 모델 로드
    
    Returns:
        dict:
            - model: LogisticRegression 모델
            - scaler: StandardScaler
            - threshold: float (분류 임계값)
            - features: list[str] (사용 feature 목록)
    Raises:
        FileNotFoundError: PHQ 모델 파일이 없을 때
    """
    path = get_phq_model_path()
    if not path.exists():
        raise FileNotFoundError(f"PHQ 모델 파일이 없어요: {path}")
    return joblib.load(path)