import base64
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "Tamilnadu_and_Puducherry_weather_2022.zip"
OUT = ROOT / "versions" / "heatwave-watch" / "temps.js"

df = pd.read_csv(SRC, usecols=["time", "latitude", "longitude", "TMP_2m"])
df["time"] = pd.to_datetime(df["time"])
df = df[df["time"].dt.year == 2022]
mask = json.loads((ROOT / "data" / "mask.json").read_text())
keep = pd.DataFrame(mask["keep"], columns=["_la", "_lo"])
df["_la"] = df["latitude"].round(6)
df["_lo"] = df["longitude"].round(6)
df = df.merge(keep, on=["_la", "_lo"]).drop(columns=["_la", "_lo"])

# Point order must match prep.py: groupby(latitude, longitude), sorted.
pts = df.groupby(["latitude", "longitude"]).size().reset_index()[["latitude", "longitude"]]
pts["pid"] = range(len(pts))
df = df.merge(pts, on=["latitude", "longitude"])
grid = np.full((len(pts), 365), np.nan)
grid[df["pid"].values, df["time"].dt.dayofyear.values - 1] = df["TMP_2m"].values - 273.15
assert not np.isnan(grid).any()

# Every cell's daily temperature as little-endian int16 tenths of a degree, base64-encoded.
packed = np.round(grid * 10).astype("<i2").tobytes()
OUT.write_text('window.WXT="' + base64.b64encode(packed).decode("ascii") + '";', encoding="ascii")
print(f"wrote {OUT.relative_to(ROOT)} for {len(pts)} cells ({grid.min():.1f} to {grid.max():.1f} °C)")
