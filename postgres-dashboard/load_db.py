"""Create the database, load the CSV with COPY, then clean and index it with the SQL files.

    python load_db.py                      # uses DATABASE_URL or the default below
    python load_db.py --url postgresql://user:password@localhost:5432/fds_weather
"""
import argparse
import os
import time
import zipfile
from pathlib import Path

import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict, make_conninfo

HERE = Path(__file__).resolve().parent
ZIP = HERE.parent / "data" / "Tamilnadu_and_Puducherry_weather_2022.zip"
DEFAULT_URL = "postgresql://postgres:postgres@localhost:5432/fds_weather"

parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument("--url", default=os.environ.get("DATABASE_URL", DEFAULT_URL), help="PostgreSQL connection URL")
parser.add_argument("--zip", type=Path, default=ZIP, help="zipped weather CSV")
args = parser.parse_args()

target = conninfo_to_dict(args.url)
dbname = target.get("dbname") or "fds_weather"


def step(label):
    print(f"[{time.strftime('%H:%M:%S')}] {label}", flush=True)
    return time.time()


def done(t0):
    print(f"           done in {time.time() - t0:.1f}s", flush=True)


t0 = step(f"Connecting and making sure database '{dbname}' exists")
admin = make_conninfo(args.url, dbname="postgres")
with psycopg.connect(admin, autocommit=True) as conn:
    exists = conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,)).fetchone()
    if not exists:
        conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(dbname)))
        print(f"           created database {dbname}")
done(t0)

with psycopg.connect(args.url, autocommit=True) as conn:
    t0 = step("Creating the schema (sql/01_schema.sql)")
    conn.execute((HERE / "sql" / "01_schema.sql").read_text(encoding="utf-8"))
    done(t0)

    t0 = step(f"Loading {args.zip.name} into weather.stg_raw with COPY")
    with zipfile.ZipFile(args.zip) as z, z.open(z.namelist()[0]) as src, conn.cursor() as cur:
        with cur.copy("COPY weather.stg_raw FROM STDIN WITH (FORMAT csv, HEADER true)") as copy:
            while chunk := src.read(1 << 20):
                copy.write(chunk)
    n = conn.execute("SELECT count(*) FROM weather.stg_raw").fetchone()[0]
    print(f"           {n:,} raw rows")
    done(t0)

    t0 = step("Cleaning and building dimension and fact tables (sql/02_clean_transform.sql)")
    conn.execute((HERE / "sql" / "02_clean_transform.sql").read_text(encoding="utf-8"))
    done(t0)

    t0 = step("Building indexes and materialized views (sql/03_views_indexes.sql)")
    conn.execute((HERE / "sql" / "03_views_indexes.sql").read_text(encoding="utf-8"))
    done(t0)

    print()
    for row in conn.execute("SELECT step, title, rows_affected FROM weather.cleaning_log ORDER BY step"):
        print(f"  {row[0]}. {row[1]:<22} {row[2]:>10,}")
    print("\nReady. Start the dashboard with:  python -m uvicorn app.main:app")
