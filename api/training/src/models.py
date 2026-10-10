"""The two learned models: logistic regression and LightGBM."""

from __future__ import annotations

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# 12 combinations, each with early stopping on validation. A wider search on
# one validation year would mostly fit noise.
LIGHTGBM_GRID = [
    {"num_leaves": leaves, "learning_rate": rate, "min_child_samples": min_rows}
    for leaves in (7, 15, 31)
    for rate in (0.03, 0.08)
    for min_rows in (20, 60)
]


def train_logistic(x: pd.DataFrame, y: np.ndarray, seed: int) -> Pipeline:
    model = Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
            ("classify", LogisticRegression(class_weight="balanced", max_iter=5000, random_state=seed)),
        ]
    )
    return model.fit(x, y)


def train_lightgbm(
    x_train: pd.DataFrame, y_train: np.ndarray, x_val: pd.DataFrame, y_val: np.ndarray, seed: int
) -> tuple[lgb.LGBMClassifier, list[dict]]:
    """Grid search scored by PR-AUC on validation. Single thread and fixed
    seeds so two runs give the same trees."""
    history = []
    best: tuple[float, lgb.LGBMClassifier] | None = None
    for params in LIGHTGBM_GRID:
        model = lgb.LGBMClassifier(
            n_estimators=3000,
            subsample=0.8,
            subsample_freq=1,
            colsample_bytree=0.8,
            reg_lambda=1.0,
            random_state=seed,
            deterministic=True,
            force_row_wise=True,
            n_jobs=1,
            verbose=-1,
            **params,
        )
        model.fit(
            x_train,
            y_train,
            eval_X=(x_val,),
            eval_y=(y_val,),
            eval_metric="binary_logloss",
            callbacks=[lgb.early_stopping(100, verbose=False)],
        )
        score = average_precision_score(y_val, model.predict_proba(x_val)[:, 1])
        history.append({**params, "trees": int(model.best_iteration_), "validationPrAuc": float(score)})
        if best is None or score > best[0]:
            best = (score, model)
    assert best is not None
    return best[1], history
