from dotenv import load_dotenv
import os

load_dotenv(".env.local")

# Server
SERVER_PORT = int(os.getenv("SERVER_PORT", 8002))

# Kafka
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "bio-ml-service")

# Kafka Topics - Consume
KAFKA_TOPIC_BIOMETRIC_RAW = os.getenv("KAFKA_TOPIC_BIOMETRIC_RAW", "rebloom.biometric.raw.v1")
KAFKA_TOPIC_AI_TRAIN      = os.getenv("KAFKA_TOPIC_AI_MODEL_TRAIN_REQUESTED", "rebloom.ai.model.train.requested.v1")  # ← 기본값 수정
KAFKA_TOPIC_AI_ANALYZE    = os.getenv("KAFKA_TOPIC_AI_ANALYZE_REQUESTED", "rebloom.ai.analyze.requested.v1")

# Kafka Topics - Produce
KAFKA_TOPIC_ANOMALY_VERIFIED = os.getenv("KAFKA_TOPIC_ANOMALY_VERIFIED", "rebloom.anomaly.verified.v1")
KAFKA_TOPIC_PHQ_RESULT       = os.getenv("KAFKA_TOPIC_PHQ_RESULT", "rebloom.phq.result.v1")  # ← 추가

# Redis
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Model
MODEL_DIR = os.getenv("MODEL_DIR", "./app/model")