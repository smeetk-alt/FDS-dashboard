import json
from pathlib import Path

import pandas as pd
from matplotlib.path import Path as Polygon

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "Tamilnadu_and_Puducherry_weather_2022.zip"
OUT = ROOT / "data" / "mask.json"

# Approximate Tamil Nadu + Puducherry outline (lon, lat). Land borders follow the AP / Karnataka /
# Kerala boundaries; the coastal side is pushed out to sea because the soil-temperature sea mask
# handles the real coastline, and the eastern edge stays west of Sri Lanka.
OUTLINE = [
    (80.50, 13.55), (80.10, 13.52), (79.90, 13.46), (79.55, 13.42), (79.35, 13.20), (79.05, 13.10),
    (78.80, 13.00), (78.55, 12.87), (78.35, 12.70), (78.15, 12.82), (77.90, 12.82), (77.73, 12.77),
    (77.65, 12.55), (77.60, 12.30), (77.75, 12.12), (77.45, 11.95), (77.20, 11.95), (77.00, 11.82),
    (76.75, 11.72), (76.50, 11.62), (76.25, 11.50), (76.30, 11.20), (76.70, 11.10), (76.85, 10.75),
    (76.85, 10.40), (77.20, 10.28), (77.22, 10.05), (77.20, 9.75), (77.20, 9.62), (77.35, 9.40),
    (77.20, 8.95), (77.20, 8.70), (77.20, 8.50), (77.13, 8.30), (77.10, 7.90), (77.60, 7.85),
    (78.30, 8.20), (78.40, 8.70), (78.70, 9.00), (79.55, 8.95), (79.75, 9.40), (79.95, 10.05),
    (80.10, 10.35), (80.05, 11.00), (80.00, 11.90), (80.35, 12.60), (80.50, 13.10),
]

df = pd.read_csv(SRC, usecols=["time", "latitude", "longitude", "District", "TSOIL_l4"])
df = df[df["time"] < "2023-01-01"]
df["District"] = df["District"].str.strip()
g = df.groupby(["latitude", "longitude"]).agg(tsoil_std=("TSOIL_l4", "std"), dist=("District", "first")).reset_index()
# Over the sea the model's soil temperature is a constant fill value, so zero variance means sea.
g["land"] = g["tsoil_std"] > 0.05
g["inside"] = Polygon(OUTLINE).contains_points(g[["longitude", "latitude"]].values)
g["keep"] = g["land"] & g["inside"]

OUT.write_text(json.dumps({
    "keep": [[round(a, 6), round(b, 6)] for a, b in g.loc[g.keep, ["latitude", "longitude"]].values.tolist()],
    "outside_cells": [[round(a, 6), round(b, 6)] for a, b in g.loc[g.land & ~g.inside, ["latitude", "longitude"]].values.tolist()],
    "cells_raw": int(len(g)), "sea": int((~g.land).sum()), "outside": int((g.land & ~g.inside).sum()), "kept": int(g.keep.sum()),
}))
print(f"cells {len(g)} · sea {int((~g.land).sum())} · land outside state {int((g.land & ~g.inside).sum())} · kept {int(g.keep.sum())}")
print(f"districts kept: {g[g.keep].dist.nunique()} of {g.dist.nunique()}")
