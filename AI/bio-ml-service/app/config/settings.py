from dotenv import load_dotenv
import os

load_dotenv(".env")

# Server
SERVER_PORT = int(os.getenv("SERVER_PORT", 8002))

# Kafka
KAFKA_BOOTSTRAP_SERVERS       = os.environ["KAFKA_BOOTSTRAP_SERVERS"]
KAFKA_GROUP_ID                = os.getenv("KAFKA_GROUP_ID", "bio-ml-service")

# Kafka Topics - Consume
KAFKA_TOPIC_BIOMETRIC_RAW     = os.getenv("KAFKA_TOPIC_BIOMETRIC_RAW", "rebloom.biometric.received.v1")
KAFKA_TOPIC_AI_TRAIN          = os.getenv("KAFKA_TOPIC_AI_MODEL_TRAIN_REQUESTED", "rebloom.model.training.requested.v1")
KAFKA_TOPIC_AI_ANALYZE        = os.getenv("KAFKA_TOPIC_AI_ANALYZE_REQUESTED", "rebloom.model.retraining.requested.v1")
KAFKA_TOPIC_STATUS_CARD_REQUESTED = os.getenv("KAFKA_TOPIC_STATUS_CARD_REQUESTED", "rebloom.status-card.requested.v1")

# Kafka Topics - Produce
KAFKA_TOPIC_ANOMALY_VERIFIED    = os.getenv("KAFKA_TOPIC_ANOMALY_VERIFIED", "rebloom.anomaly.analysed.v1")
KAFKA_TOPIC_PHQ_RESULT          = os.getenv("KAFKA_TOPIC_PHQ_RESULT", "rebloom.phq.completed.v1")
KAFKA_TOPIC_STATUS_CARD_CREATED = os.getenv("KAFKA_TOPIC_STATUS_CARD_CREATED", "rebloom.status-card.created.v1")

# Redis
REDIS_HOST = os.environ["REDIS_HOST"]
REDIS_PORT = int(os.environ["REDIS_PORT"])


# Model
MODEL_DIR          = os.getenv("MODEL_DIR", "/app/model")
IF_READY_THRESHOLD = int(os.getenv("IF_READY_THRESHOLD", 288))

# AWS S3
AWS_ACCESS_KEY_ID     = os.environ["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
AWS_REGION            = os.getenv("AWS_REGION", "ap-northeast-2")
MODEL_S3_BUCKET       = os.environ["MODEL_S3_BUCKET"]
BASE_PHQ_MODEL_S3_KEY = os.getenv("BASE_PHQ_MODEL_S3_KEY", "models/base/phq_model.pkl")
BASE_DEPRESSION_SVR_MODEL_S3_KEY = os.getenv(
    "BASE_DEPRESSION_SVR_MODEL_S3_KEY",
    "models/base/depression_svr_model.joblib",
)
USER_MODEL_S3_PREFIX  = os.getenv("USER_MODEL_S3_PREFIX", "models/users")

# GMS
GMS_KEY = os.getenv("GMS_KEY", "")
GMS_CHAT_COMPLETIONS_URL = os.getenv(
    "GMS_CHAT_COMPLETIONS_URL",
    "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions",
)
GMS_MODEL = os.getenv("GMS_MODEL", "gpt-5-mini")
GMS_TIMEOUT_SECONDS = int(os.getenv("GMS_TIMEOUT_SECONDS", 60))
