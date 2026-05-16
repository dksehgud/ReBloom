import io
import joblib
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from app.config.settings import (
    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION,
    MODEL_S3_BUCKET, BASE_PHQ_MODEL_S3_KEY, USER_MODEL_S3_PREFIX,
    MODEL_DIR,
)


def _s3():
    return boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )


def _if_local_path(user_id: str) -> Path:
    return Path(MODEL_DIR) / "users" / user_id / "if_model.pkl"


def _phq_local_path() -> Path:
    return Path(MODEL_DIR) / "phq_model.pkl"


def _if_s3_key(user_id: str) -> str:
    return f"{USER_MODEL_S3_PREFIX}/{user_id}/if_model.pkl"


def save_if_model(user_id: str, model) -> None:
    # 로컬 저장
    local_path = _if_local_path(user_id)
    local_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, local_path)

    # S3 업로드
    buffer = io.BytesIO()
    joblib.dump(model, buffer)
    buffer.seek(0)
    _s3().put_object(Bucket=MODEL_S3_BUCKET, Key=_if_s3_key(user_id), Body=buffer.getvalue())


def load_if_model(user_id: str):
    local_path = _if_local_path(user_id)

    if local_path.exists():
        return joblib.load(local_path)

    try:
        obj = _s3().get_object(Bucket=MODEL_S3_BUCKET, Key=_if_s3_key(user_id))
        model = joblib.load(io.BytesIO(obj["Body"].read()))
        local_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, local_path)
        return model
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def load_phq_model() -> dict:
    local_path = _phq_local_path()

    if local_path.exists():
        return joblib.load(local_path)

    try:
        obj = _s3().get_object(Bucket=MODEL_S3_BUCKET, Key=BASE_PHQ_MODEL_S3_KEY)
        model = joblib.load(io.BytesIO(obj["Body"].read()))
        local_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, local_path)
        return model
    except ClientError as e:
        raise FileNotFoundError(f"PHQ 모델 파일이 없어요: s3://{MODEL_S3_BUCKET}/{BASE_PHQ_MODEL_S3_KEY}") from e