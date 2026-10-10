"""Folders shared by the training scripts."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ARTIFACTS = ROOT / "artifacts"
FIGURES = ROOT / "figures"
RESULTS = ROOT / "results"
