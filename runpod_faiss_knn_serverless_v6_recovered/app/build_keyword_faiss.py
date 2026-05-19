from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict, Sequence

import faiss
import numpy as np

from faiss_knn_classifier import DEFAULT_OPENAI_EMBEDDING_MODEL, normalize_openai_base_url


DEFAULT_KEYWORDS = [
    "친구",
    "가족",
    "금전",
    "수면",
    "학업",
    "피곤",
    "지침",
    "집중력 저하",
    "폭력",
    "긍정",
    "부정",
    "중립",
    "분노",
    "슬픔",
]

KEYWORD_DESCRIPTIONS = {
    "친구": "친구, 또래, 지인, 사회적 관계에서의 어려움",
    "가족": "가족, 부모, 형제자매, 배우자, 가정 내 관계",
    "금전": "돈, 경제적 어려움, 빚, 생활비, 직업 소득 문제",
    "수면": "잠, 불면, 과다수면, 수면의 질 저하",
    "학업": "학교, 공부, 시험, 과제, 진로, 성적 문제",
    "피곤": "피로감, 몸이 피곤함, 기운 없음",
    "지침": "정신적으로 지침, 번아웃, 버티기 어려움",
    "집중력 저하": "집중이 안 됨, 생각 정리가 어려움, 주의력 저하",
    "폭력": "폭력, 학대, 위협, 공격, 괴롭힘, 안전 문제",
    "긍정": "희망, 안정, 회복, 감사, 좋은 변화",
    "부정": "부정적 사고, 비관, 자기비난, 절망",
    "중립": "감정 판단이 어렵거나 긍정/부정이 뚜렷하지 않음",
    "분노": "화, 짜증, 분개, 억울함, 공격적인 감정",
    "슬픔": "슬픔, 우울감, 외로움, 상실감, 눈물",
}


def encode_openai(
    texts: Sequence[str],
    *,
    model: str,
    base_url: str | None,
    dimensions: int | None,
) -> np.ndarray:
    from openai import OpenAI

    kwargs: Dict[str, Any] = {}
    normalized_base_url = normalize_openai_base_url(base_url or os.getenv("OPENAI_BASE_URL"))
    if normalized_base_url:
        kwargs["base_url"] = normalized_base_url
    client = OpenAI(**kwargs)

    request: Dict[str, Any] = {
        "model": model,
        "input": list(texts),
        "encoding_format": "float",
    }
    if dimensions is not None:
        request["dimensions"] = dimensions
    response = client.embeddings.create(**request)
    ordered = sorted(response.data, key=lambda item: item.index)
    embeddings = np.array([item.embedding for item in ordered], dtype=np.float32)
    faiss.normalize_L2(embeddings)
    return embeddings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a small FAISS DB for Korean analysis keywords.")
    parser.add_argument("--out-dir", default="faiss_keywords")
    parser.add_argument("--embedding-model", default=DEFAULT_OPENAI_EMBEDDING_MODEL)
    parser.add_argument("--openai-base-url", default=None)
    parser.add_argument("--openai-dimensions", type=int, default=None)
    parser.add_argument("--keywords", default=",".join(DEFAULT_KEYWORDS))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    keywords = [keyword.strip() for keyword in args.keywords.split(",") if keyword.strip()]
    texts = [f"{keyword}: {KEYWORD_DESCRIPTIONS.get(keyword, keyword)}" for keyword in keywords]

    embeddings = encode_openai(
        texts,
        model=args.embedding_model,
        base_url=args.openai_base_url,
        dimensions=args.openai_dimensions,
    )
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(out_dir / "index.faiss"))
    (out_dir / "keywords.json").write_text(
        json.dumps({"keywords": keywords, "texts": texts}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (out_dir / "config.json").write_text(
        json.dumps(
            {
                "embedding_model": args.embedding_model,
                "openai_base_url": normalize_openai_base_url(args.openai_base_url or os.getenv("OPENAI_BASE_URL")),
                "openai_dimensions": args.openai_dimensions,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"saved keyword FAISS DB to: {out_dir}")


if __name__ == "__main__":
    main()
