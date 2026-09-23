# Weather Atlas 2022: PostgreSQL edition

The same Tamil Nadu & Puducherry 2022 weather dashboard, rebuilt so that **PostgreSQL does the data work**. The CSV is loaded into a database, cleaned and modelled with SQL, and every panel on the page is the result of a SQL query you can read.

**Smeet Kataria · Roll No. 16014225042 · Fundamentals of Data Science**

```
CSV → COPY → stg_raw → clean/transform (SQL) → star schema → indexes + materialized views
                                                         ↓
                              sql/queries/*.sql → FastAPI → dashboard (charts)
```

## Set up

### 1. Install PostgreSQL (Windows)

1. Download the PostgreSQL installer (version 12 or newer; 16 is a good choice) from https://www.postgresql.org/download/windows/.
2. Run it and keep the defaults: port **5432**, and tick *Command Line Tools*. When asked, set a password for the `postgres` user and remember it.
3. Check it is running: open PowerShell and run `psql --version`.

### 2. Load the data

From the repository root:

```powershell
cd postgres-dashboard
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

$env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@localhost:5432/fds_weather"
python load_db.py
```

`load_db.py` creates the `fds_weather` database if it does not exist, loads `data/Tamilnadu_and_Puducherry_weather_2022.zip` straight from the zip with `COPY`, then runs the three SQL scripts. It takes about 1–2 minutes and prints the cleaning summary at the end (0 nulls, 0 duplicates, 2,100 out-of-year rows removed, 766,500 clean rows).

If you skip the `DATABASE_URL` line, the default is `postgresql://postgres:postgres@localhost:5432/fds_weather`.

### 3. Run the dashboard

```powershell
python -m uvicorn app.main:app
```

Open http://127.0.0.1:8000. The header pill shows the PostgreSQL version and row count when the connection works.

The server only listens on your own machine. It is meant for local use and presentations, not for putting on the internet (the SQL console runs whatever read-only query it is given).

## Where the SQL is

| File | What it does |
|---|---|
| `sql/01_schema.sql` | Creates the `weather` schema: staging table, `dim_district`, `dim_cell`, `dim_rain_class`, `fact_weather`, `cleaning_log`. |
| `sql/02_clean_transform.sql` | Cleans and converts the data with SQL (trimming, date filter, kelvin to °C, wind speed and direction, label decoding) and logs every step. |
| `sql/03_views_indexes.sql` | Indexes, four materialized views, and the descriptive-statistics table (built with a PL/pgSQL loop). |
| `sql/queries/*.sql` | One file per dashboard panel. Placeholders like `%(district)s` are bound parameters; `{col}` is a column name chosen from a fixed whitelist. |

Every panel has a **Show SQL** drawer with the exact query and how long it took, and the **SQL console** at the bottom lets you run your own read-only `SELECT`.

## Data model

```
dim_district (40) ──< dim_cell (2,100) ──< fact_weather (766,500)  >── dim_rain_class (4)
```

`fact_weather` holds one row per grid cell per day, already in analysis units (°C, km/h, hPa, km, degrees). Materialized views pre-aggregate it to district × day, district × month, cell × month and district × month × rain class, so most panels answer in milliseconds.

## SQL techniques used

| Panel | SQL |
|---|---|
| KPI strip | aggregates, `FILTER`, CTEs |
| Map | materialized view, weighted average |
| Time series | window function `AVG() OVER (ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING)`, `percentile_cont` |
| Rain classes | materialized view, joins to a dimension table |
| Distribution | `width_bucket`, `percentile_cont`, `mode() WITHIN GROUP`, `stddev_samp`, moment skewness |
| Correlation | `corr()` for all 28 variable pairs in one pass |
| Regression | `regr_slope`, `regr_intercept`, `regr_r2`, `regr_syy`, `TABLESAMPLE BERNOULLI` |
| League table | `RANK() OVER`, `array_agg` for the sparklines |
| Wind rose | `atan2` + `width_bucket` with a threshold array |
| Anomalies | leave-one-out rolling z-score from running `count`, `sum` and `sum of squares` over a window |
| t-test | Welch's t, degrees of freedom and Cohen's d computed in SQL |
| Cleaning | `INSERT ... SELECT` into a log table, `string_agg`, `format` |

The one thing done outside SQL is the t-test **p-value and confidence interval**, because PostgreSQL has no Student-t distribution. SQL produces `t` and the degrees of freedom; `app/main.py` passes them to `scipy.stats.t`.

## Checked against the original pipeline

The descriptive statistics and correlations computed by these SQL queries were compared with the pandas results in `dashboard/data.js`: means, standard deviations, quartiles, skewness, correlations and outlier counts agree. The single difference is the rain outlier count (88,416 in SQL, 88,532 in pandas): the source stores rainfall as 4-byte floats, and values sitting exactly on the outlier fence fall on either side of it depending on the precision used.

## Not included

The original dashboard's machine-learning panels (multiple regression, logistic regression, k-means and PCA), the live Open-Meteo panel and the guided presentation mode are not part of this edition. The panels here concentrate on what SQL does well.
