"""
FAISS + kNN voting 기반 텍스트 분류기.

흐름:
1. CSV에서 텍스트 컬럼과 라벨 컬럼을 읽습니다.
2. 텍스트를 embedding 입력에 맞게 정리합니다.
3. SentenceTransformer 또는 OpenAI Embeddings API로 문장을 벡터로 변환합니다.
4. 벡터를 L2 normalize해서 IndexFlatIP 검색이 cosine similarity처럼 동작하게 합니다.
5. FAISS index에 학습 벡터를 저장합니다.
6. 예측 시 top-k 이웃의 라벨을 voting해서 최종 라벨을 정합니다.

주의:
- kNN은 별도의 분류 head를 학습하지 않습니다.
- 저장되는 것은 학습 텍스트의 embedding DB, label 배열, source_id/text 메타데이터입니다.
- 학습과 예측에서 같은 embedding provider/model을 사용해야 합니다.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

import faiss
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from tqdm.auto import tqdm


DEFAULT_EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-0.6B"
DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-large"
RANDOM_STATE = 42
LABEL_ORDER = ["minimal", "mild", "moderate", "severe"]


def normalize_openai_base_url(base_url: Optional[str]) -> Optional[str]:
    """base_url에 /embeddings endpoint까지 들어온 경우 SDK용 base URL로 되돌립니다."""
    if not base_url:
        return None
    cleaned = base_url.strip().rstrip("/")
    if cleaned.endswith("/embeddings"):
        cleaned = cleaned[: -len("/embeddings")].rstrip("/")
    return cleaned


def embedding_post_url(base_url: Optional[str]) -> Optional[str]:
    url = (
        os.getenv("EMBEDDING_API_URL")
        or os.getenv("EMBEDDING_POST_URL")
        or os.getenv("OPENAI_EMBEDDING_URL")
    )
    if url:
        return url.strip().rstrip("/")

    cleaned = normalize_openai_base_url(base_url or os.getenv("OPENAI_BASE_URL"))
    if cleaned:
        return f"{cleaned}/embeddings"
    return None


def embedding_api_key() -> Optional[str]:
    return (
        os.getenv("EMBEDDING_API_KEY")
        or os.getenv("GMS_API_KEY")
        or os.getenv("SUMMARY_API_KEY")
        or os.getenv("OPENAI_API_KEY")
    )


def embedding_auth_headers(api_key: str) -> Dict[str, str]:
    header_name = os.getenv("EMBEDDING_API_KEY_HEADER", "Authorization").strip()
    if header_name.lower() == "authorization":
        value = api_key if api_key.lower().startswith("bearer ") else f"Bearer {api_key}"
    else:
        value = api_key
    return {
        header_name: value,
        "Content-Type": "application/json",
        "Accept-Encoding": "identity",
        "Connection": "close",
    }


def parse_json_object_from_response(raw_body: str) -> Dict[str, Any]:
    raw_body = raw_body.lstrip("\ufeff").strip()
    try:
        parsed = json.loads(raw_body)
    except json.JSONDecodeError:
        decoder = json.JSONDecoder()
        start = raw_body.find("{")
        while start != -1:
            try:
                parsed, _ = decoder.raw_decode(raw_body[start:])
                break
            except json.JSONDecodeError:
                start = raw_body.find("{", start + 1)
        else:
            preview = raw_body[:500].replace("\n", "\\n")
            raise ValueError(f"Could not parse embedding response as JSON. Preview: {preview}") from None

    if not isinstance(parsed, dict):
        preview = raw_body[:500].replace("\n", "\\n")
        raise ValueError(f"Embedding response JSON is not an object. Preview: {preview}")
    return parsed


def _extract_embeddings_from_dict(body: Dict[str, Any]) -> Optional[np.ndarray]:
    """OpenAI \ud615\uc2dd dict\uc5d0\uc11c embedding \ubc30\uc5f4\uc744 \ucd94\ucd9c\ud569\ub2c8\ub2e4. \uc2e4\ud328\uc2dc None \ubc18\ud658."""
    data = body.get("data")
    if isinstance(data, list):
        ordered = sorted(data, key=lambda item: int(item.get("index", 0)))
        return np.array([item["embedding"] for item in ordered], dtype=np.float32)
    if isinstance(body.get("embedding"), list):
        return np.asarray([body["embedding"]], dtype=np.float32)
    if isinstance(body.get("embeddings"), list):
        embeddings = body["embeddings"]
        if embeddings and isinstance(embeddings[0], (int, float)):
            return np.asarray([embeddings], dtype=np.float32)
        return np.asarray(embeddings, dtype=np.float32)
    return None


def parse_embedding_response(raw_body: str) -> np.ndarray:
    cleaned = raw_body.lstrip("\ufeff").strip()
    if not cleaned:
        raise ValueError("Embedding response is empty.")

    # 1\ucc28: \uc815\uc0c1 JSON \ud30c\uc2f1
    try:
        body = parse_json_object_from_response(cleaned)
        result = _extract_embeddings_from_dict(body)
        if result is not None:
            return result
    except Exception:
        pass

    # 2\ucc28: \ud504\ub85d\uc2dc\uac00 OpenAI \uc751\ub2f5\uc744 JSON \ubb38\uc790\uc5f4\ub85c \uc774\uc911 \uc778\ucf54\ub529\ud55c \uacbd\uc6b0 \ucc98\ub9ac
    # \uc608: {"result": "{\"data\":[{\"embedding\":[...]}]}"} \ub610\ub294 \uc678\ubd80 \ub530\uc634\ud45c\ub85c \uac10\uc2fc \ud615\ud0dc
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, str):
            inner = _extract_embeddings_from_dict(parse_json_object_from_response(parsed))
            if inner is not None:
                return inner
        elif isinstance(parsed, dict):
            for key in ("result", "response", "body", "output"):
                val = parsed.get(key)
                if isinstance(val, str):
                    try:
                        inner = _extract_embeddings_from_dict(parse_json_object_from_response(val))
                        if inner is not None:
                            return inner
                    except Exception:
                        pass
            result = _extract_embeddings_from_dict(parsed)
            if result is not None:
                return result
        elif isinstance(parsed, list):
            if parsed and isinstance(parsed[0], (int, float)):
                return np.asarray([parsed], dtype=np.float32)
            return np.asarray(parsed, dtype=np.float32)
    except (json.JSONDecodeError, Exception):
        pass

    number_pattern = r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?"
    bracket_candidates = re.findall(r"\[[^\[\]]+\]", cleaned, flags=re.DOTALL)
    numeric_lists = []
    for candidate in bracket_candidates:
        matches = re.findall(number_pattern, candidate)
        if matches:
            numeric_lists.append([float(match) for match in matches])
    if numeric_lists:
        values = max(numeric_lists, key=len)
    else:
        values = [float(match) for match in re.findall(number_pattern, cleaned)]
    if not values:
        preview = cleaned[:500].replace("\n", "\\n")
        raise ValueError(f"Embedding response is not a recognized vector format. Preview: {preview}")
    return np.asarray([values], dtype=np.float32)


def order_labels(labels: Sequence[str]) -> List[str]:
    """알려진 우울 심각도 라벨을 ordinal 순서로 정렬하고, 나머지는 뒤에 붙입니다."""
    unique_labels = {str(label) for label in labels}
    ordered = [label for label in LABEL_ORDER if label in unique_labels]
    ordered.extend(sorted(unique_labels - set(LABEL_ORDER)))
    return ordered


def clean_text(raw_text: object) -> str:
    """embedding 입력으로 쓸 수 있도록 None/NaN을 빈 문자열로 바꾸고 앞뒤 공백을 제거합니다."""
    if raw_text is None or (isinstance(raw_text, float) and np.isnan(raw_text)):
        return ""
    return str(raw_text).strip()


def validate_dataframe(df: pd.DataFrame, text_col: str, label_col: Optional[str] = None) -> None:
    """CSV에 필요한 컬럼이 있는지 확인합니다."""
    missing = [col for col in [text_col, label_col] if col and col not in df.columns]
    if missing:
        raise ValueError(f"CSV에 필요한 컬럼이 없습니다: {missing}")


def load_labeled_csv(
    csv_path: Path,
    text_col: str,
    label_col: str,
    drop_duplicates: bool,
    id_col: Optional[str] = None,
) -> pd.DataFrame:
    """라벨이 있는 CSV를 읽고 비어 있는 텍스트/라벨을 제거합니다."""
    df = pd.read_csv(csv_path)
    validate_dataframe(df, text_col, label_col)

    selected_columns = [text_col, label_col]
    has_id_col = bool(id_col and id_col in df.columns)
    if has_id_col:
        selected_columns.insert(0, id_col)

    df = df[selected_columns].dropna(subset=[text_col, label_col]).copy()
    df[text_col] = df[text_col].map(clean_text)
    df = df[df[text_col].str.len() > 0].copy()

    if drop_duplicates:
        duplicate_subset = [id_col] if has_id_col else [text_col, label_col]
        df = df.drop_duplicates(subset=duplicate_subset).copy()

    rename_map = {text_col: "text", label_col: "label"}
    if has_id_col:
        df[id_col] = df[id_col].map(clean_text)
        rename_map[id_col] = "source_id"
    return df.rename(columns=rename_map).reset_index(drop=True)


class FaissKNNTextClassifier:
    """문장 embedding + FAISS 검색 + kNN voting을 묶은 분류기입니다."""

    def __init__(
        self,
        embedding_model: str = DEFAULT_EMBEDDING_MODEL,
        embedding_provider: str = "sentence-transformers",
        openai_dimensions: Optional[int] = None,
        openai_base_url: Optional[str] = None,
        openai_max_retries: int = 5,
        k: int = 5,
        threshold: float = 0.35,
        voting: str = "weighted",
        trust_remote_code: bool = True,
        use_gpu: bool = True,
        batch_size: int = 32,
    ) -> None:
        if voting not in {"weighted", "majority"}:
            raise ValueError("--voting은 weighted 또는 majority만 가능합니다.")
        if embedding_provider not in {"sentence-transformers", "openai"}:
            raise ValueError("--embedding-provider는 sentence-transformers 또는 openai만 가능합니다.")

        self.embedding_model_name = embedding_model
        self.embedding_provider = embedding_provider
        self.openai_dimensions = openai_dimensions
        self.openai_base_url = normalize_openai_base_url(openai_base_url or os.getenv("OPENAI_BASE_URL"))
        self.openai_max_retries = openai_max_retries
        self.k = k
        self.threshold = threshold
        self.voting = voting
        self.trust_remote_code = trust_remote_code
        self.use_gpu = use_gpu
        self.batch_size = batch_size

        self.model: Optional[Any] = None
        self.index: Optional[faiss.Index] = None
        self.labels: Optional[np.ndarray] = None
        self.texts: Optional[pd.DataFrame] = None
        self.label_to_id: Dict[str, int] = {}
        self.id_to_label: Dict[int, str] = {}
        self._gpu_resources = None

    def load_embedding_model(self) -> None:
        """embedding backend를 lazy loading합니다."""
        if self.model is not None:
            return

        if self.embedding_provider == "openai":
            try:
                from openai import OpenAI
            except ImportError as exc:
                raise RuntimeError("OpenAI embeddings를 쓰려면 `pip install openai`가 필요합니다.") from exc
            kwargs = {}
            if self.openai_base_url:
                kwargs["base_url"] = self.openai_base_url
            self.model = OpenAI(**kwargs)
            return

        try:
            import torch
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise RuntimeError(
                "sentence-transformers provider requires `pip install torch sentence-transformers`."
            ) from exc

        device = "cuda" if self.use_gpu and torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(
            self.embedding_model_name,
            device=device,
            trust_remote_code=self.trust_remote_code,
        )

    def _encode_openai_batch(self, texts: Sequence[str]) -> np.ndarray:
        """OpenAI Embeddings API로 한 batch를 embedding합니다."""
        post_url = embedding_post_url(self.openai_base_url)
        api_key = embedding_api_key()
        if post_url and api_key:
            return self._encode_openai_batch_post(texts, post_url=post_url, api_key=api_key)

        self.load_embedding_model()
        client = self.model
        request: Dict[str, Any] = {
            "model": self.embedding_model_name,
            "input": list(texts),
            "encoding_format": "float",
        }
        if self.openai_dimensions is not None:
            request["dimensions"] = self.openai_dimensions

        last_error: Optional[Exception] = None
        for attempt in range(self.openai_max_retries):
            try:
                response = client.embeddings.create(**request)
                ordered = sorted(response.data, key=lambda item: item.index)
                return np.array([item.embedding for item in ordered], dtype=np.float32)
            except Exception as exc:
                last_error = exc
                if attempt >= self.openai_max_retries - 1:
                    break
                sleep_seconds = min(2**attempt, 30)
                print(f"OpenAI embedding 요청 실패. {sleep_seconds}초 후 재시도합니다. Error: {exc}")
                time.sleep(sleep_seconds)
        raise RuntimeError(f"OpenAI embedding 요청이 {self.openai_max_retries}회 실패했습니다: {last_error}")

    def _encode_openai_batch_post(self, texts: Sequence[str], *, post_url: str, api_key: str) -> np.ndarray:
        request: Dict[str, Any] = {
            "model": self.embedding_model_name,
            "input": list(texts),
            "encoding_format": "float",
        }
        if self.openai_dimensions is not None:
            request["dimensions"] = self.openai_dimensions

        last_error: Optional[Exception] = None
        for attempt in range(self.openai_max_retries):
            try:
                http_request = urllib.request.Request(
                    url=post_url,
                    data=json.dumps(request, ensure_ascii=False).encode("utf-8"),
                    headers=embedding_auth_headers(api_key),
                    method="POST",
                )
                with urllib.request.urlopen(http_request, timeout=int(os.getenv("EMBEDDING_TIMEOUT", "120"))) as response:
                    raw_body = response.read().decode("utf-8")
                embeddings = parse_embedding_response(raw_body)
                if embeddings.ndim != 2 or embeddings.shape[0] != len(texts):
                    raise ValueError(
                        "Embedding response shape does not match request. "
                        f"Expected ({len(texts)}, dim), got {embeddings.shape}."
                    )
                expected_dim = self.openai_dimensions or (self.index.d if self.index is not None else None)
                if expected_dim is not None and embeddings.shape[1] != expected_dim:
                    raise ValueError(
                        f"Embedding response vector length does not match expected dimension. "
                        f"Got {embeddings.shape[1]}, expected {expected_dim}."
                    )
                return embeddings
            except Exception as exc:
                last_error = exc
                if attempt >= self.openai_max_retries - 1:
                    break
                sleep_seconds = min(2**attempt, 30)
                print(f"Embedding POST 요청 실패. {sleep_seconds}초 후 재시도합니다. Error: {exc}")
                time.sleep(sleep_seconds)
        raise RuntimeError(f"Embedding POST 요청이 {self.openai_max_retries}회 실패했습니다: {last_error}")

    def _encode_openai(self, texts: Sequence[str]) -> np.ndarray:
        """OpenAI Embeddings API로 전체 텍스트를 batch 단위로 embedding합니다."""
        cleaned = [clean_text(text) or "." for text in texts]
        parts = []
        starts = list(range(0, len(cleaned), self.batch_size))
        for start in tqdm(starts, desc="OpenAI embeddings", unit="batch"):
            batch = cleaned[start : start + self.batch_size]
            parts.append(self._encode_openai_batch(batch))
        embeddings = np.vstack(parts).astype("float32", copy=False)
        if self.index is not None and embeddings.shape[1] != self.index.d:
            raise ValueError(
                "Embedding dimension does not match FAISS index. "
                f"Got {embeddings.shape[1]}, expected {self.index.d}. "
                f"Check EMBEDDING_MODEL={self.embedding_model_name!r} and embedding API dimensions."
            )
        faiss.normalize_L2(embeddings)
        return embeddings

    def encode(self, texts: Sequence[str]) -> np.ndarray:
        """텍스트 목록을 float32 embedding matrix로 변환하고 L2 normalize합니다."""
        if self.embedding_provider == "openai":
            return self._encode_openai(texts)

        self.load_embedding_model()
        assert self.model is not None
        embeddings = self.model.encode(
            list(texts),
            batch_size=self.batch_size,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=True,
        )
        embeddings = embeddings.astype("float32", copy=False)
        faiss.normalize_L2(embeddings)
        return embeddings

    def _maybe_to_gpu(self, index: faiss.Index) -> faiss.Index:
        """가능하면 CPU FAISS index를 GPU index로 옮깁니다."""
        if not self.use_gpu:
            return index
        try:
            import torch
        except ImportError:
            return index
        if not hasattr(faiss, "StandardGpuResources") or not torch.cuda.is_available():
            return index
        self._gpu_resources = faiss.StandardGpuResources()
        return faiss.index_cpu_to_gpu(self._gpu_resources, 0, index)

    def fit(
        self,
        texts: Sequence[str],
        labels: Sequence[str],
        source_ids: Optional[Sequence[str]] = None,
    ) -> None:
        """텍스트와 라벨로 FAISS 검색 index를 만듭니다."""
        if len(texts) != len(labels):
            raise ValueError("texts와 labels 길이가 다릅니다.")
        if source_ids is not None and len(source_ids) != len(texts):
            raise ValueError("source_ids와 texts 길이가 다릅니다.")
        if not texts:
            raise ValueError("학습할 텍스트가 없습니다.")

        sorted_labels = order_labels(labels)
        self.label_to_id = {label: idx for idx, label in enumerate(sorted_labels)}
        self.id_to_label = {idx: label for label, idx in self.label_to_id.items()}
        self.labels = np.array([self.label_to_id[str(label)] for label in labels], dtype=np.int64)

        embeddings = self.encode(texts)
        cpu_index = faiss.IndexFlatIP(embeddings.shape[1])
        cpu_index.add(embeddings)
        self.index = self._maybe_to_gpu(cpu_index)

        data = {"text": list(texts), "label": list(labels)}
        if source_ids is not None:
            data["source_id"] = list(source_ids)
        self.texts = pd.DataFrame(data)

    def add_examples(
        self,
        texts: Sequence[str],
        labels: Sequence[str],
        source_ids: Optional[Sequence[str]] = None,
    ) -> None:
        """기존 index에 새 예시를 추가합니다."""
        if self.index is None or self.labels is None or self.texts is None:
            raise RuntimeError("추가할 기존 모델 index가 로드되지 않았습니다.")
        if len(texts) != len(labels):
            raise ValueError("texts와 labels 길이가 다릅니다.")
        if source_ids is not None and len(source_ids) != len(texts):
            raise ValueError("source_ids와 texts 길이가 다릅니다.")
        if not texts:
            raise ValueError("추가할 텍스트가 없습니다.")

        new_labels = [str(label) for label in labels]
        old_label_strings = [self.id_to_label[int(label_id)] for label_id in self.labels.tolist()]
        ordered_labels = order_labels(old_label_strings + new_labels)
        new_label_to_id = {label: idx for idx, label in enumerate(ordered_labels)}

        self.labels = np.array(
            [new_label_to_id[label] for label in old_label_strings]
            + [new_label_to_id[label] for label in new_labels],
            dtype=np.int64,
        )
        self.label_to_id = new_label_to_id
        self.id_to_label = {idx: label for label, idx in self.label_to_id.items()}

        embeddings = self.encode(texts)
        self.index.add(embeddings)

        new_texts = pd.DataFrame({"text": list(texts), "label": new_labels})
        if "source_id" in self.texts.columns or source_ids is not None:
            if source_ids is None:
                source_ids = [""] * len(texts)
            if "source_id" not in self.texts.columns:
                self.texts["source_id"] = ""
            new_texts["source_id"] = list(source_ids)
        self.texts = pd.concat([self.texts, new_texts], ignore_index=True)

    def _vote(self, neighbor_labels: np.ndarray, similarities: np.ndarray) -> tuple[str, float]:
        """top-k 이웃의 라벨과 similarity로 최종 라벨과 confidence를 계산합니다."""
        scores: defaultdict[int, float] = defaultdict(float)
        counts: Counter[int] = Counter()
        for label_id, sim in zip(neighbor_labels.tolist(), similarities.tolist()):
            if label_id < 0:
                continue
            counts[label_id] += 1
            weight = max(float(sim), 0.0) if self.voting == "weighted" else 1.0
            scores[label_id] += weight

        if not scores:
            return "uncertain", 0.0

        best_id = max(scores, key=scores.get)
        confidence = scores[best_id] / max(sum(scores.values()), 1e-12)
        best_similarity = float(np.max(similarities)) if len(similarities) else 0.0

        if best_similarity < self.threshold:
            return "uncertain", best_similarity
        return self.id_to_label[int(best_id)], confidence

    def predict(self, text: str) -> dict:
        """문장 하나를 예측합니다."""
        return self.batch_predict([text])[0]

    def batch_predict(self, texts: Sequence[str]) -> List[dict]:
        """여러 문장을 한 번에 예측합니다."""
        if self.index is None or self.labels is None:
            raise RuntimeError("모델 index가 로드되지 않았습니다.")

        cleaned_texts = [clean_text(text) for text in texts]
        embeddings = self.encode(cleaned_texts)
        return self.batch_predict_from_embeddings(texts, cleaned_texts, embeddings)

    def batch_predict_from_embeddings(
        self,
        texts: Sequence[str],
        cleaned_texts: Sequence[str],
        embeddings: np.ndarray,
    ) -> List[dict]:
        """이미 계산한 embedding으로 FAISS 검색 + kNN voting을 수행합니다."""
        if self.index is None or self.labels is None:
            raise RuntimeError("모델 index가 로드되지 않았습니다.")

        search_k = min(self.k, int(self.index.ntotal))
        similarities, indices = self.index.search(embeddings, search_k)

        predictions = []
        for raw, cleaned, sims, idxs in zip(texts, cleaned_texts, similarities, indices):
            valid = idxs >= 0
            neighbor_labels = self.labels[idxs[valid]]
            valid_sims = sims[valid]
            label, confidence = self._vote(neighbor_labels, valid_sims)
            predictions.append(
                {
                    "text": raw,
                    "cleaned_text": cleaned,
                    "prediction": label,
                    "confidence": float(confidence),
                    "max_similarity": float(np.max(valid_sims)) if len(valid_sims) else 0.0,
                }
            )
        return predictions

    def save(self, out_dir: Path) -> None:
        """학습 결과를 파일로 저장합니다."""
        if self.index is None or self.labels is None or self.texts is None:
            raise RuntimeError("저장할 학습 결과가 없습니다.")
        out_dir.mkdir(parents=True, exist_ok=True)

        index_to_save = self.index
        if hasattr(faiss, "index_gpu_to_cpu"):
            try:
                index_to_save = faiss.index_gpu_to_cpu(self.index)
            except Exception:
                index_to_save = self.index

        faiss.write_index(index_to_save, str(out_dir / "index.faiss"))
        np.save(out_dir / "labels.npy", self.labels)
        self.texts.to_csv(out_dir / "texts.csv", index=False, encoding="utf-8-sig")

        (out_dir / "label_mapping.json").write_text(
            json.dumps({"label_to_id": self.label_to_id, "id_to_label": self.id_to_label}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        config = {
            "embedding_model": self.embedding_model_name,
            "embedding_provider": self.embedding_provider,
            "openai_dimensions": self.openai_dimensions,
            "openai_base_url": self.openai_base_url,
            "openai_max_retries": self.openai_max_retries,
            "k": self.k,
            "threshold": self.threshold,
            "voting": self.voting,
            "trust_remote_code": self.trust_remote_code,
            "batch_size": self.batch_size,
            "random_state": RANDOM_STATE,
            "label_order": LABEL_ORDER,
        }
        (out_dir / "config.json").write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")

    @classmethod
    def load(cls, model_dir: Path, use_gpu: bool = True) -> "FaissKNNTextClassifier":
        """저장된 index/config/label mapping을 읽어 예측 가능한 classifier를 복원합니다."""
        config_path = model_dir / "config.json"
        mapping_path = model_dir / "label_mapping.json"
        if not config_path.exists():
            raise FileNotFoundError(f"config.json을 찾을 수 없습니다: {config_path}")

        config = json.loads(config_path.read_text(encoding="utf-8"))
        clf = cls(
            embedding_model=os.getenv("EMBEDDING_MODEL") or config["embedding_model"],
            embedding_provider=config.get("embedding_provider", "sentence-transformers"),
            openai_dimensions=config.get("openai_dimensions"),
            openai_base_url=os.getenv("OPENAI_BASE_URL") or config.get("openai_base_url"),
            openai_max_retries=int(config.get("openai_max_retries", 5)),
            k=int(config.get("k", 5)),
            threshold=float(config.get("threshold", 0.35)),
            voting=config.get("voting", "weighted"),
            trust_remote_code=bool(config.get("trust_remote_code", True)),
            use_gpu=use_gpu,
            batch_size=int(config.get("batch_size", 32)),
        )

        clf.index = clf._maybe_to_gpu(faiss.read_index(str(model_dir / "index.faiss")))
        clf.labels = np.load(model_dir / "labels.npy")
        clf.texts = pd.read_csv(model_dir / "texts.csv")

        mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
        clf.label_to_id = {str(k): int(v) for k, v in mapping["label_to_id"].items()}
        clf.id_to_label = {int(k): str(v) for k, v in mapping["id_to_label"].items()}
        return clf


def build_evaluation_report(y_true: Sequence[str], y_pred: Sequence[str]) -> tuple[str, dict]:
    """평가 결과를 사람이 읽는 텍스트와 JSON 저장용 dict로 만듭니다."""
    labels = order_labels(list(y_true) + [label for label in y_pred if label != "uncertain"])
    matrix_labels = labels + (["uncertain"] if "uncertain" in y_pred else [])
    accuracy = accuracy_score(y_true, y_pred)
    report_text = classification_report(y_true, y_pred, labels=matrix_labels, zero_division=0)
    matrix = confusion_matrix(y_true, y_pred, labels=matrix_labels)
    matrix_df = pd.DataFrame(matrix, index=matrix_labels, columns=matrix_labels)
    text = "\n".join(
        [
            f"accuracy: {accuracy:.4f}",
            "",
            "classification_report:",
            report_text,
            "",
            "confusion_matrix:",
            matrix_df.to_string(),
        ]
    )
    data = {
        "accuracy": float(accuracy),
        "labels": matrix_labels,
        "classification_report": classification_report(
            y_true,
            y_pred,
            labels=matrix_labels,
            output_dict=True,
            zero_division=0,
        ),
        "confusion_matrix": matrix.tolist(),
    }
    return text, data


def evaluate_predictions(
    y_true: Sequence[str],
    y_pred: Sequence[str],
    report_path: Optional[Path] = None,
) -> None:
    """예측 결과를 출력하고, 필요하면 txt/json 파일로 저장합니다."""
    text, data = build_evaluation_report(y_true, y_pred)
    print(text)
    if report_path:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(text, encoding="utf-8")
        report_path.with_suffix(".json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nevaluation report saved to: {report_path}")


def train_command(args: argparse.Namespace) -> None:
    """일반 train 명령입니다. split 평가 후 전체 데이터로 최종 index를 만듭니다."""
    if args.embedding_provider == "openai" and args.embedding_model == DEFAULT_EMBEDDING_MODEL:
        args.embedding_model = DEFAULT_OPENAI_EMBEDDING_MODEL
    df = load_labeled_csv(Path(args.csv), args.text_col, args.label_col, args.drop_duplicates, id_col=args.id_col)
    print(f"rows after cleaning: {len(df)}")

    label_counts = df["label"].value_counts()
    stratify = df["label"] if df["label"].nunique() > 1 and label_counts.min() >= 2 else None
    train_df, test_df = train_test_split(
        df,
        test_size=args.test_size,
        random_state=RANDOM_STATE,
        stratify=stratify,
    )

    eval_clf = FaissKNNTextClassifier(
        embedding_model=args.embedding_model,
        embedding_provider=args.embedding_provider,
        openai_dimensions=args.openai_dimensions,
        openai_base_url=args.openai_base_url,
        openai_max_retries=args.openai_max_retries,
        k=args.k,
        threshold=args.threshold,
        voting=args.voting,
        trust_remote_code=args.trust_remote_code,
        use_gpu=not args.no_gpu,
        batch_size=args.batch_size,
    )
    train_source_ids = train_df["source_id"].astype(str).tolist() if "source_id" in train_df.columns else None
    eval_clf.fit(train_df["text"].tolist(), train_df["label"].astype(str).tolist(), source_ids=train_source_ids)
    preds = [row["prediction"] for row in eval_clf.batch_predict(test_df["text"].tolist())]
    report_path = Path(args.report_path) if args.report_path else Path(args.out_dir) / "eval_report.txt"
    evaluate_predictions(test_df["label"].astype(str).tolist(), preds, report_path=report_path)

    final_clf = FaissKNNTextClassifier(
        embedding_model=args.embedding_model,
        embedding_provider=args.embedding_provider,
        openai_dimensions=args.openai_dimensions,
        openai_base_url=args.openai_base_url,
        openai_max_retries=args.openai_max_retries,
        k=args.k,
        threshold=args.threshold,
        voting=args.voting,
        trust_remote_code=args.trust_remote_code,
        use_gpu=not args.no_gpu,
        batch_size=args.batch_size,
    )
    source_ids = df["source_id"].astype(str).tolist() if "source_id" in df.columns else None
    final_clf.fit(df["text"].tolist(), df["label"].astype(str).tolist(), source_ids=source_ids)
    final_clf.save(Path(args.out_dir))
    print(f"\nmodel saved to: {args.out_dir}")


def train_openai_command(args: argparse.Namespace) -> None:
    """OpenAI embeddings로 전체 CSV를 한 번만 embedding해서 FAISS index를 만듭니다."""
    df = load_labeled_csv(Path(args.csv), args.text_col, args.label_col, args.drop_duplicates, id_col=args.id_col)
    print(f"rows after cleaning: {len(df)}")
    clf = FaissKNNTextClassifier(
        embedding_model=args.embedding_model,
        embedding_provider="openai",
        openai_dimensions=args.openai_dimensions,
        openai_base_url=args.openai_base_url,
        openai_max_retries=args.openai_max_retries,
        k=args.k,
        threshold=args.threshold,
        voting=args.voting,
        trust_remote_code=False,
        use_gpu=False,
        batch_size=args.batch_size,
    )
    source_ids = df["source_id"].astype(str).tolist() if "source_id" in df.columns else None
    clf.fit(df["text"].tolist(), df["label"].astype(str).tolist(), source_ids=source_ids)
    clf.save(Path(args.out_dir))
    print(f"\nmodel saved to: {args.out_dir}")


def eval_command(args: argparse.Namespace) -> None:
    """저장된 모델을 로드해서 라벨이 있는 CSV 전체를 평가합니다."""
    df = load_labeled_csv(Path(args.csv), args.text_col, args.label_col, drop_duplicates=False, id_col=args.id_col)
    clf = FaissKNNTextClassifier.load(Path(args.model_dir), use_gpu=not args.no_gpu)

    if args.k:
        clf.k = args.k
    if args.threshold is not None:
        clf.threshold = args.threshold
    if args.voting:
        clf.voting = args.voting
    preds = [row["prediction"] for row in clf.batch_predict(df["text"].tolist())]
    report_path = Path(args.report_path) if args.report_path else None
    evaluate_predictions(df["label"].astype(str).tolist(), preds, report_path=report_path)


def update_command(args: argparse.Namespace) -> None:
    """저장된 FAISS index에 새 라벨 데이터를 추가합니다."""
    df = load_labeled_csv(Path(args.csv), args.text_col, args.label_col, args.drop_duplicates, id_col=args.id_col)
    clf = FaissKNNTextClassifier.load(Path(args.model_dir), use_gpu=not args.no_gpu)
    before = int(clf.index.ntotal) if clf.index is not None else 0
    source_ids = df["source_id"].astype(str).tolist() if "source_id" in df.columns else None
    clf.add_examples(df["text"].tolist(), df["label"].astype(str).tolist(), source_ids=source_ids)
    out_dir = Path(args.out_dir) if args.out_dir else Path(args.model_dir)
    clf.save(out_dir)
    after = int(clf.index.ntotal) if clf.index is not None else before + len(df)
    print(f"index updated: {before} -> {after}")
    print(f"model saved to: {out_dir}")


def predict_command(args: argparse.Namespace) -> None:
    """문장 하나를 받아 JSON 형태로 예측 결과를 출력합니다."""
    clf = FaissKNNTextClassifier.load(Path(args.model_dir), use_gpu=not args.no_gpu)
    result = clf.predict(args.text)
    print(json.dumps(result, ensure_ascii=False, indent=2))


def batch_predict_command(args: argparse.Namespace) -> None:
    """CSV의 텍스트 컬럼을 예측하고 결과 CSV를 저장합니다."""
    input_path = Path(args.input)
    df = pd.read_csv(input_path)
    validate_dataframe(df, args.text_col)
    clf = FaissKNNTextClassifier.load(Path(args.model_dir), use_gpu=not args.no_gpu)
    results = clf.batch_predict(df[args.text_col].fillna("").astype(str).tolist())
    out_df = pd.concat([df.reset_index(drop=True), pd.DataFrame(results).drop(columns=["text"])], axis=1)
    out_df.to_csv(args.output, index=False, encoding="utf-8-sig")
    print(f"predictions saved to: {args.output}")


def build_parser() -> argparse.ArgumentParser:
    """argparse CLI 명령과 옵션을 정의합니다."""
    parser = argparse.ArgumentParser(description="FAISS + kNN voting text classifier")
    subparsers = parser.add_subparsers(dest="command", required=True)

    def add_common_model_args(p: argparse.ArgumentParser) -> None:
        p.add_argument("--k", type=int, default=5)
        p.add_argument("--threshold", type=float, default=0.35)
        p.add_argument("--voting", choices=["weighted", "majority"], default="weighted")
        p.add_argument("--batch-size", type=int, default=32)
        p.add_argument("--no-gpu", action="store_true", help="FAISS/SentenceTransformer GPU 사용을 끕니다.")

    train = subparsers.add_parser("train")
    train.add_argument("--csv", required=True)
    train.add_argument("--text-col", default="text_clean")
    train.add_argument("--label-col", default="label")
    train.add_argument("--id-col", default="source_id")
    train.add_argument("--out-dir", required=True)
    train.add_argument("--embedding-model", default=DEFAULT_EMBEDDING_MODEL)
    train.add_argument("--embedding-provider", choices=["sentence-transformers", "openai"], default="sentence-transformers")
    train.add_argument("--openai-dimensions", type=int, default=None)
    train.add_argument("--openai-base-url", default=None)
    train.add_argument("--openai-max-retries", type=int, default=5)
    train.add_argument("--trust-remote-code", action=argparse.BooleanOptionalAction, default=True)
    train.add_argument("--drop-duplicates", action=argparse.BooleanOptionalAction, default=True)
    train.add_argument("--test-size", type=float, default=0.2)
    train.add_argument("--report-path", default=None)
    add_common_model_args(train)
    train.set_defaults(func=train_command)

    train_openai = subparsers.add_parser("train-openai")
    train_openai.add_argument("--csv", required=True)
    train_openai.add_argument("--text-col", default="summary")
    train_openai.add_argument("--label-col", default="label")
    train_openai.add_argument("--id-col", default="source_id")
    train_openai.add_argument("--out-dir", required=True)
    train_openai.add_argument("--embedding-model", default=DEFAULT_OPENAI_EMBEDDING_MODEL)
    train_openai.add_argument("--openai-dimensions", type=int, default=None)
    train_openai.add_argument("--openai-base-url", default=None)
    train_openai.add_argument("--openai-max-retries", type=int, default=5)
    train_openai.add_argument("--drop-duplicates", action=argparse.BooleanOptionalAction, default=True)
    add_common_model_args(train_openai)
    train_openai.set_defaults(func=train_openai_command)

    eval_parser = subparsers.add_parser("eval")
    eval_parser.add_argument("--csv", required=True)
    eval_parser.add_argument("--model-dir", required=True)
    eval_parser.add_argument("--text-col", default="text_clean")
    eval_parser.add_argument("--label-col", default="label")
    eval_parser.add_argument("--id-col", default="source_id")
    eval_parser.add_argument("--k", type=int, default=None)
    eval_parser.add_argument("--threshold", type=float, default=None)
    eval_parser.add_argument("--voting", choices=["weighted", "majority"], default=None)
    eval_parser.add_argument("--report-path", default=None)
    eval_parser.add_argument("--no-gpu", action="store_true")
    eval_parser.set_defaults(func=eval_command)

    update = subparsers.add_parser("update")
    update.add_argument("--model-dir", required=True)
    update.add_argument("--csv", required=True)
    update.add_argument("--text-col", default="text_clean")
    update.add_argument("--label-col", default="label")
    update.add_argument("--id-col", default="source_id")
    update.add_argument("--out-dir", default=None)
    update.add_argument("--drop-duplicates", action=argparse.BooleanOptionalAction, default=True)
    update.add_argument("--no-gpu", action="store_true")
    update.set_defaults(func=update_command)

    predict = subparsers.add_parser("predict")
    predict.add_argument("--model-dir", required=True)
    predict.add_argument("--text", required=True)
    predict.add_argument("--no-gpu", action="store_true")
    predict.set_defaults(func=predict_command)

    batch_predict = subparsers.add_parser("batch-predict")
    batch_predict.add_argument("--model-dir", required=True)
    batch_predict.add_argument("--input", required=True)
    batch_predict.add_argument("--text-col", default="text_clean")
    batch_predict.add_argument("--output", required=True)
    batch_predict.add_argument("--no-gpu", action="store_true")
    batch_predict.set_defaults(func=batch_predict_command)
    return parser


def main() -> None:
    """프로그램 진입점입니다."""
    parser = build_parser()
    args = parser.parse_args()
    try:
        args.func(args)
    except Exception as exc:
        raise SystemExit(f"error: {exc}") from exc


if __name__ == "__main__":
    main()
