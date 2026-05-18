from __future__ import annotations

import logging

import numpy as np

from app.model.storage import load_depression_svr_model

logger = logging.getLogger(__name__)

FEATURE_COUNT = 11

_bundle = None


def _load_bundle():
    global _bundle
    if _bundle is None:
        _bundle = load_depression_svr_model()
    return _bundle


def predict_score(features: list[float]) -> float:
    if len(features) != FEATURE_COUNT:
        raise ValueError(f"features must contain exactly {FEATURE_COUNT} values")

    bundle = _load_bundle()
    values = np.array([features], dtype=float)

    if isinstance(bundle, dict):
        expected_count = int(bundle.get("feature_count", FEATURE_COUNT))
        if expected_count != FEATURE_COUNT:
            logger.warning("SVR bundle feature_count=%s, expected=%s", expected_count, FEATURE_COUNT)

        model = bundle.get("model")
        scaler = bundle.get("scaler")
        if model is None:
            raise RuntimeError("SVR bundle does not contain model")
        if scaler is not None:
            values = scaler.transform(values)
    else:
        model = bundle

    score = model.predict(values)[0]
    return round(float(score), 4)
