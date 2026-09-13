"""Plant recommendation scoring and regional indexes.

Kept close to the original student project logic, with a few correctness
fixes so scoring and lookups stay consistent after region filtering.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import pandas as pd

# Filters the API scores against, in order matching the search payload.
FILTER_COLUMNS = [
    "Sun Exposure",
    "Color",
    "Blooming Period",
    "Fruit Characteristics",
    "Type",
    "Size",
]

DEFAULT_WEIGHTS = [0.5, 0.3, 1.0, 0.3, 1.3, 1.0]
EARTH_INDEX_WEIGHT = 0.15
MAX_SCORE = 5.9
NUM_REGIONS = 8  # regions 0..7 in pants_filtered.csv

_BACKEND_DIR = Path(__file__).resolve().parent


def _default_data_path() -> Path:
    env = os.environ.get("PLANT_DATA_PATH")
    if env:
        return Path(env)
    return _BACKEND_DIR / "pants_filtered.csv"


def load_plants(path: Path | None = None) -> pd.DataFrame:
    data_path = path or _default_data_path()
    if not data_path.is_file():
        raise FileNotFoundError(f"Plant dataset not found: {data_path}")
    return pd.read_csv(data_path)


# Loaded lazily so importing the module in unit tests does not require the
# full CSV until something asks for it.
df: pd.DataFrame | None = None


def get_df() -> pd.DataFrame:
    global df
    if df is None:
        df = load_plants()
    return df


def filter_region(region: int, source: pd.DataFrame | None = None) -> pd.DataFrame:
    """Return plants for one region with a clean 0..n-1 index.

    Resetting the index matters: make_dicts stores positional ints, and
    get_scores used to write scores with .at[i] (label-based). After a
    region filter those labels no longer match positions.
    """
    frame = get_df() if source is None else source
    filtered = frame.loc[frame["Region"] == region].copy()
    return filtered.reset_index(drop=True)


def make_dicts(frame: pd.DataFrame) -> list[dict[str, set[int]]]:
    """Build inverted indexes from filter value -> row positions."""
    dict_list: list[dict[str, set[int]]] = []
    for column in FILTER_COLUMNS:
        temp_dict: dict[str, set[int]] = {}
        for count in range(len(frame)):
            info = frame.iloc[count][column]
            # Fruit is a plain TRUE/FALSE string in the CSV; everything else
            # is a stringified list/set that we unpack.
            if column == "Fruit Characteristics" or info == "set()":
                key = str(info).lower()
                temp_dict.setdefault(key, set()).add(count)
                continue

            raw = str(info)
            parts = raw[1:-1].split(", ") if len(raw) >= 2 else [raw]
            for part in parts:
                if not part:
                    continue
                # Strip surrounding quotes from list/set repr tokens.
                key = part[1:-1] if len(part) >= 2 and part[0] in "'\"" else part
                key = key.lower()
                temp_dict.setdefault(key, set()).add(count)
        dict_list.append(temp_dict)
    return dict_list


def get_scores(
    spec_arr: list[Any],
    frame: pd.DataFrame,
    dict_list: list[dict[str, set[int]]],
    weights: list[float] | None = None,
) -> pd.DataFrame:
    """Score plants against user preferences.

    Bugfix vs original: always advance the filter index, even when a
    preference is missing or unmatched. Previously `count` only moved
    forward on hits, which shifted later filters onto the wrong maps.
    """
    weights = weights or DEFAULT_WEIGHTS
    scored = frame.copy()
    scored["Score"] = 0.0

    for idx, column in enumerate(FILTER_COLUMNS):
        spec = spec_arr[idx] if idx < len(spec_arr) else None
        if spec is None or spec == "":
            continue
        good_indices = dict_list[idx].get(str(spec).lower())
        if good_indices is None:
            continue
        for row_i in good_indices:
            scored.at[row_i, "Score"] = float(scored.at[row_i, "Score"]) + weights[idx]

    scored["Score"] = scored["Score"] + (scored["Rating"] * EARTH_INDEX_WEIGHT)
    scored["Percent Match"] = scored["Score"] / MAX_SCORE * 100
    return scored


def init(
    source: pd.DataFrame | None = None,
    num_regions: int = NUM_REGIONS,
) -> tuple[list[list[dict[str, set[int]]]], list[pd.DataFrame]]:
    """Precompute per-region dataframes and inverted indexes."""
    frame = get_df() if source is None else source
    dict_list_per_region: list[list[dict[str, set[int]]]] = []
    df_list_per_region: list[pd.DataFrame] = []

    for region in range(num_regions):
        temp_df = filter_region(region, frame)
        dict_list_per_region.append(make_dicts(temp_df))
        df_list_per_region.append(temp_df)

    return dict_list_per_region, df_list_per_region
