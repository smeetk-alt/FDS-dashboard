"""FastAPI backend: every dashboard panel is one SQL file in sql/queries, run against PostgreSQL.

    python -m uvicorn app.main:app
"""
import json
import os
import re
import time
from contextlib import asynccontextmanager
from pathlib import Path

import psycopg
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pydantic import BaseModel
from scipy import stats as sps

ROOT = Path(__file__).resolve().parent.parent
QUERIES = ROOT / "sql" / "queries"
STATIC = Path(__file__).resolve().parent / "static"
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fds_weather")

# key used by the dashboard -> column, label, and histogram range
VARS = {
    "temp":  dict(col="temp_c",   label="Air temperature",   unit="°C",   dp=1, lo=14,  hi=36,   bins=44),
    "rh":    dict(col="rh",       label="Relative humidity", unit="%",    dp=0, lo=20,  hi=100,  bins=40),
    "rain":  dict(col="rain_mm",  label="Precipitation",     unit="mm",   dp=2, lo=0,   hi=20,   bins=40),
    "gust":  dict(col="gust_kmh", label="Wind gust",         unit="km/h", dp=1, lo=0,   hi=108,  bins=36),
    "wind":  dict(col="wind_kmh", label="Wind speed",        unit="km/h", dp=1, lo=0,   hi=80,   bins=40),
    "cloud": dict(col="cloud",    label="Cloud cover",       unit="%",    dp=0, lo=0,   hi=100,  bins=40),
    "vis":   dict(col="vis_km",   label="Visibility",        unit="km",   dp=1, lo=4,   hi=30,   bins=52),
    "slp":   dict(col="slp_hpa",  label="Sea-level pressure", unit="hPa", dp=1, lo=995, hi=1018, bins=46),
}
SEASONS = {
    "all":    dict(label="Full year",  sub="",        months=list(range(1, 13))),
    "winter": dict(label="Winter",     sub="Jan–Feb", months=[1, 2]),
    "pre":    dict(label="Summer",     sub="Mar–May", months=[3, 4, 5]),
    "sw":     dict(label="SW monsoon", sub="Jun–Sep", months=[6, 7, 8, 9]),
    "ne":     dict(label="NE monsoon", sub="Oct–Dec", months=[10, 11, 12]),
}
# panels that can be requested at /api/q/<name>
PANELS = {p.stem for p in QUERIES.glob("*.sql")}

pool: ConnectionPool


@asynccontextmanager
async def lifespan(_app):
    global pool
    pool = ConnectionPool(
        DATABASE_URL, min_size=1, max_size=6, open=True,
        kwargs=dict(row_factory=dict_row, options="-c search_path=weather,public"),
    )
    yield
    pool.close()


app = FastAPI(title="Weather Atlas 2022 (PostgreSQL)", lifespan=lifespan)


def parse_months(text: str | None) -> list[int]:
    if not text:
        return list(range(1, 13))
    try:
        months = sorted({int(m) for m in text.split(",") if m})
    except ValueError:
        raise HTTPException(400, "months must be a comma-separated list of integers")
    if not months or any(m < 1 or m > 12 for m in months):
        raise HTTPException(400, "months must be between 1 and 12")
    return months


def var_of(key: str) -> dict:
    if key not in VARS:
        raise HTTPException(400, f"unknown variable '{key}'")
    return VARS[key]


_cache: dict[str, dict] = {}   # the data never changes while the app runs, so results can be reused


def run(name: str, params: dict, columns: dict[str, str] | None = None) -> dict:
    """Read sql/queries/<name>.sql, substitute the whitelisted column names, execute it."""
    text = (QUERIES / f"{name}.sql").read_text(encoding="utf-8")
    for placeholder, col in (columns or {}).items():
        text = text.replace("{" + placeholder + "}", col)
    key = json.dumps([text, params], sort_keys=True, default=str)
    if key in _cache:
        return {**_cache[key], "cached": True}
    t0 = time.perf_counter()
    with pool.connection() as conn:
        conn.execute("SET LOCAL work_mem = '64MB'")   # keep the sorts behind percentile_cont in memory
        rows = conn.execute(text, params).fetchall()
    ms = (time.perf_counter() - t0) * 1000
    shown = {k: v for k, v in params.items() if re.search(r"%\(" + k + r"\)s", text)}
    result = dict(rows=rows, ms=round(ms, 1), sql=text.strip(), params=shown, cached=False)
    if len(_cache) < 500:
        _cache[key] = result
    return result


@app.get("/api/meta")
def meta():
    res = run("districts", {})
    return dict(vars=VARS, seasons=SEASONS, districts=res["rows"], sql=res["sql"], ms=res["ms"])


@app.get("/api/q/{name}")
def panel(
    name: str,
    district: str | None = None,
    months: str | None = None,
    var: str = "temp",
    x: str = "temp",
    y: str = "rh",
    zthr: float = Query(2.5, ge=1, le=6),
    a: str | None = None,
    b: str | None = None,
):
    if name not in PANELS:
        raise HTTPException(404, f"no query named '{name}'")
    v, vx, vy = var_of(var), var_of(x), var_of(y)
    params = dict(
        district=district or None,
        months=parse_months(months),
        months_a=parse_months(a),
        months_b=parse_months(b),
        lo=v["lo"], hi=v["hi"], bins=v["bins"], zthr=zthr,
    )
    res = run(name, params, columns={"col": v["col"], "xcol": vx["col"], "ycol": vy["col"]})
    if name == "ttest":
        res["rows"] = [welch_p_value(r) for r in res["rows"]]
    return res


def welch_p_value(r: dict) -> dict:
    """SQL computed t and df; the p-value and 95 % CI need the t distribution."""
    if r["t_stat"] is None or r["df"] is None:
        return r
    t, df = float(r["t_stat"]), float(r["df"])
    crit = float(sps.t.ppf(0.975, df))
    r["p_value"] = float(2 * sps.t.sf(abs(t), df))
    r["ci_lo"] = float(r["diff"]) - crit * float(r["se"])
    r["ci_hi"] = float(r["diff"]) + crit * float(r["se"])
    return r


class SqlRequest(BaseModel):
    sql: str


@app.post("/api/sql")
def console(req: SqlRequest):
    """Run one read-only SELECT typed into the SQL console (local use only)."""
    text = req.sql.strip().rstrip(";").strip()
    if not re.match(r"(?is)^(select|with|explain|table|values)\b", text) or ";" in text:
        raise HTTPException(400, "Only a single SELECT / WITH / EXPLAIN statement is allowed.")
    t0 = time.perf_counter()
    try:
        with pool.connection() as conn:
            conn.read_only = True
            try:
                conn.execute("SET LOCAL statement_timeout = '10s'")
                cur = conn.execute(text)
                cols = [c.name for c in cur.description] if cur.description else []
                rows = cur.fetchmany(500)
            finally:
                conn.rollback()
                conn.read_only = False
    except psycopg.Error as e:
        raise HTTPException(400, str(e).strip())
    return dict(cols=cols, rows=rows, ms=round((time.perf_counter() - t0) * 1000, 1), truncated=len(rows) == 500)


@app.get("/api/health")
def health():
    return run("health", {})["rows"][0]


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


app.mount("/static", StaticFiles(directory=STATIC), name="static")
