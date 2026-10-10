"""Read tables straight from a plain-text `pg_dump` file.

Training reads the snapshot file, not a live database, so the dataset can be
rebuilt identically from one file without a running database.

A plain dump stores each table as `COPY public.<table> (<columns>) FROM stdin;`
followed by tab-separated rows and a terminating `\\.` line. NULL is `\\N`.
"""

from __future__ import annotations

import csv
import io
import re
from collections.abc import Iterable
from pathlib import Path

import pandas as pd

_COPY_HEADER = re.compile(r"^COPY public\.(\w+) \((.+)\) FROM stdin;$")
_NULL = "\\N"


def read_tables(dump: Path, tables: Iterable[str]) -> dict[str, pd.DataFrame]:
    """Return the requested tables as DataFrames, streaming the file once."""
    wanted = set(tables)
    found: dict[str, pd.DataFrame] = {}

    with dump.open(encoding="utf-8") as source:
        current: str | None = None
        columns: list[str] = []
        rows: list[str] = []

        for line in source:
            if current is None:
                header = _COPY_HEADER.match(line.rstrip("\n"))
                if header and header.group(1) in wanted:
                    current = header.group(1)
                    columns = header.group(2).split(", ")
                    rows = []
                continue

            if line.rstrip("\n") == "\\.":
                found[current] = _to_frame(columns, rows)
                current = None
                if found.keys() == wanted:
                    break
                continue

            rows.append(line)

    missing = wanted - found.keys()
    if missing:
        raise ValueError(f"Tables not found in {dump.name}: {sorted(missing)}")
    return found


def _to_frame(columns: list[str], rows: list[str]) -> pd.DataFrame:
    return pd.read_csv(
        io.StringIO("".join(rows)),
        sep="\t",
        names=columns,
        na_values=[_NULL],
        keep_default_na=False,
        quoting=csv.QUOTE_NONE,
        low_memory=False,
    )
