import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "Tamilnadu_and_Puducherry_weather_2022.zip"

parser = argparse.ArgumentParser(description="Aggregate the weather CSV into the data file the dashboard loads.")
parser.add_argument("--land-only", action="store_true",
                    help="drop sea and out-of-state grid cells using data/mask.json (Heatwave Watch version)")
args = parser.parse_args()
OUT = ROOT / ("versions/heatwave-watch/data.js" if args.land_only else "dashboard/data.js")

raw = pd.read_csv(SRC)
clean = {"rows_raw": int(len(raw)), "cols_raw": int(raw.shape[1])}
clean["country_variants"] = {repr(k): int(v) for k, v in raw["Country"].value_counts().items()}
clean["district_ws"] = sorted({d.strip() for d in raw["District"].unique() if d != d.strip()})
clean["nulls"] = int(raw.isna().sum().sum())
clean["dupes"] = int(raw[["latitude", "longitude", "time"]].duplicated().sum())

df = raw.copy()
for c in ["Country", "District", "State", "City"]:
    df[c] = df[c].str.strip()
df["time"] = pd.to_datetime(df["time"])
out_of_year = df["time"].dt.year != 2022
clean["rows_out_of_year"] = int(out_of_year.sum())
df = df[~out_of_year].copy()

backdrop = None
if args.land_only:
    clean["rows_in_year"] = int(len(df))
    mask = json.loads((ROOT / "data" / "mask.json").read_text())
    keep = pd.DataFrame(mask["keep"], columns=["_la", "_lo"])
    df["_la"] = df["latitude"].round(6)
    df["_lo"] = df["longitude"].round(6)
    df = df.merge(keep, on=["_la", "_lo"]).drop(columns=["_la", "_lo"])
    clean.update(cells_raw=mask["cells_raw"], cells_sea=mask["sea"], cells_outside=mask["outside"], cells_kept=mask["kept"])
    clean["rows_spatial_removed"] = clean["rows_in_year"] - int(len(df))
    backdrop = dict(lat=[a for a, _ in mask["outside_cells"]], lon=[b for _, b in mask["outside_cells"]])
clean["rows_clean"] = int(len(df))

df["temp"] = df["TMP_2m"] - 273.15
df["rh"] = df["RH_2m"]
df["rain"] = df["APCP_sfc"]
df["gust"] = df["GUST_10m"] * 3.6
df["cloud"] = df["TCDCRO_atmc"]
df["vis"] = df["VIS_2m"] / 1000
df["slp"] = df["PRMSL_msl"] / 100
df["wind"] = np.hypot(df["UGRD_10m"], df["VGRD_10m"]) * 3.6
VARS = ["temp", "rh", "rain", "gust", "cloud", "vis", "slp", "wind"]
df["month"] = df["time"].dt.month
df["doy"] = df["time"].dt.dayofyear - 1
# Condition_encoded is a rain-intensity class: 3 dry, 1 light, 2 moderate, 0 heavy
df["cond"] = df["Condition_encoded"].map({3: 0, 1: 1, 2: 2, 0: 3})

stats = {}
for v in VARS:
    s = df[v]
    q1, med, q3 = s.quantile([0.25, 0.5, 0.75])
    iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    row = dict(mean=s.mean(), std=s.std(), min=s.min(), q1=q1, median=med, q3=q3, max=s.max(),
               skew=s.skew(), kurt=s.kurt(), lo=lo, hi=hi, outliers=int(((s < lo) | (s > hi)).sum()))
    stats[v] = {k: (x if isinstance(x, int) else round(float(x), 3)) for k, x in row.items()}
corr = df[VARS].corr().round(3).values.tolist()

pts = df.groupby(["latitude", "longitude"]).agg(district=("District", "first"), state=("State", "first")).reset_index()
pts["pid"] = range(len(pts))
df = df.merge(pts[["latitude", "longitude", "pid"]], on=["latitude", "longitude"])
districts = sorted(pts["district"].unique())
dstate = {d: pts.loc[pts.district == d, "state"].iloc[0] for d in districts}
pts["did"] = pts["district"].map({d: i for i, d in enumerate(districts)})

gm = df.groupby(["pid", "month"])[VARS].mean()
grid = {}
for v in VARS:
    m = gm[v].unstack("month").reindex(range(len(pts))).values
    grid[v] = np.round(m, 2 if v == "rain" else 1).flatten().tolist()

dd = df.groupby(["District", "doy"])[VARS].mean()
dq = df.groupby(["District", "doy"])["temp"].quantile([0.1, 0.9]).unstack()
daily = {}
for d in districts:
    row = {v: np.round(dd.loc[d][v].reindex(range(365)).values, 2).tolist() for v in VARS}
    row["t10"] = np.round(dq.loc[d][0.1].reindex(range(365)).values, 2).tolist()
    row["t90"] = np.round(dq.loc[d][0.9].reindex(range(365)).values, 2).tolist()
    daily[d] = row

cc = df.groupby(["District", "month", "cond"]).size().unstack(fill_value=0).reindex(columns=range(4), fill_value=0)
conds = {d: [cc.loc[(d, m)].astype(int).tolist() if (d, m) in cc.index else [0, 0, 0, 0] for m in range(1, 13)] for d in districts}

HB = {
    "temp": np.arange(14, 36.01, 0.5),
    "rh": np.arange(20, 100.01, 2),
    "gust": np.arange(0, 108.01, 3),
    "rain": np.array([0, 0.1, 0.5, 1, 2.5, 5, 7.6, 10, 15, 25]),
    "cloud": np.arange(0, 100.01, 2.5),
    "vis": np.arange(4, 30.01, 0.5),
    "slp": np.arange(995, 1018.01, 0.5),
    "wind": np.arange(0, 80.01, 2),
}
hist = {v: {} for v in HB}
for v, edges in HB.items():
    b = np.clip(np.digitize(df[v].values, edges) - 1, 0, len(edges) - 2)
    counts = pd.DataFrame({"d": df["District"].values, "m": df["month"].values, "b": b}).groupby(["d", "m", "b"]).size()
    dm_index = counts.index.droplevel(2)
    for d in districts:
        hist[v][d] = []
        for m in range(1, 13):
            arr = np.zeros(len(edges) - 1, dtype=int)
            if (d, m) in dm_index:
                s = counts.loc[(d, m)]
                arr[s.index.values] = s.values
            hist[v][d].append(arr.tolist())

# wind rose: direction the wind blows from (16 sectors) x speed class, per district and month
wdir = (270 - np.degrees(np.arctan2(df["VGRD_10m"].values, df["UGRD_10m"].values))) % 360
sector = ((wdir + 11.25) // 22.5).astype(int) % 16
sbin = np.digitize(df["wind"].values, [10, 20, 30])
didx = df["District"].map({d: i for i, d in enumerate(districts)}).values
code = ((didx * 12 + (df["month"].values - 1)) * 16 + sector) * 4 + sbin
rose_counts = np.bincount(code, minlength=len(districts) * 12 * 16 * 4).reshape(len(districts), 12, 16, 4)
rose = {d: rose_counts[i].tolist() for i, d in enumerate(districts)}

payload = dict(
    clean=clean, stats=stats, corr=corr, vars=VARS,
    points=dict(lat=pts["latitude"].round(3).tolist(), lon=pts["longitude"].round(3).tolist(), did=pts["did"].tolist()),
    districts=[dict(name=d, state=dstate[d], n=int((pts.district == d).sum())) for d in districts],
    grid=grid, daily=daily, conds=conds, rose=rose,
    hist=hist, histEdges={v: e.round(2).tolist() for v, e in HB.items()},
)
if backdrop:
    payload["backdrop"] = backdrop
OUT.write_text("window.WX=" + json.dumps(payload, separators=(",", ":")) + ";", encoding="utf-8")
print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1e6:.1f} MB) from {clean['rows_clean']:,} clean rows")
