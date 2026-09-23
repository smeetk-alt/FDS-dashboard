-- 03_views_indexes.sql
-- Indexes, pre-aggregated materialized views, and the whole-dataset descriptive statistics.
SET search_path TO weather, public;

CREATE INDEX ix_cell_district ON dim_cell (district_id);
CREATE INDEX ix_fact_date     ON fact_weather (obs_date);
CREATE INDEX ix_fact_month    ON fact_weather (month);

-- District x day means (14,600 rows). Used for the calendar, anomalies and the t-test.
CREATE MATERIALIZED VIEW mv_district_day AS
SELECT c.district_id, f.obs_date, f.doy, f.month,
       count(*)         AS n,
       avg(f.temp_c)    AS temp_c,
       avg(f.rh)        AS rh,
       avg(f.rain_mm)   AS rain_mm,
       avg(f.gust_kmh)  AS gust_kmh,
       avg(f.wind_kmh)  AS wind_kmh,
       avg(f.cloud)     AS cloud,
       avg(f.vis_km)    AS vis_km,
       avg(f.slp_hpa)   AS slp_hpa
FROM fact_weather f
JOIN dim_cell c USING (cell_id)
GROUP BY c.district_id, f.obs_date, f.doy, f.month;
CREATE UNIQUE INDEX ON mv_district_day (district_id, obs_date);

-- District x month means (480 rows). Used for KPI sparklines and the league table.
CREATE MATERIALIZED VIEW mv_district_month AS
SELECT c.district_id, f.month,
       count(*)                                  AS n,
       avg(f.temp_c)                             AS temp_c,
       avg(f.rh)                                 AS rh,
       avg(f.rain_mm)                            AS rain_mm,
       avg(f.gust_kmh)                           AS gust_kmh,
       avg(f.wind_kmh)                           AS wind_kmh,
       avg(f.cloud)                              AS cloud,
       avg(f.vis_km)                             AS vis_km,
       avg(f.slp_hpa)                            AS slp_hpa,
       max(f.gust_kmh)                           AS gust_max,
       max(f.temp_c)                             AS temp_max,
       count(*) FILTER (WHERE f.rain_class > 0)  AS rainy
FROM fact_weather f
JOIN dim_cell c USING (cell_id)
GROUP BY c.district_id, f.month;
CREATE UNIQUE INDEX ON mv_district_month (district_id, month);

-- Grid cell x month means (25,200 rows). Used for the map.
CREATE MATERIALIZED VIEW mv_cell_month AS
SELECT f.cell_id, f.month,
       count(*)         AS n,
       avg(f.temp_c)    AS temp_c,
       avg(f.rh)        AS rh,
       avg(f.rain_mm)   AS rain_mm,
       avg(f.gust_kmh)  AS gust_kmh,
       avg(f.wind_kmh)  AS wind_kmh,
       avg(f.cloud)     AS cloud,
       avg(f.vis_km)    AS vis_km,
       avg(f.slp_hpa)   AS slp_hpa
FROM fact_weather f
GROUP BY f.cell_id, f.month;
CREATE UNIQUE INDEX ON mv_cell_month (cell_id, month);

-- District x month x rain class counts. Used for the rain-frequency chart.
CREATE MATERIALIZED VIEW mv_rain_class_month AS
SELECT c.district_id, f.month, f.rain_class, count(*) AS n
FROM fact_weather f
JOIN dim_cell c USING (cell_id)
GROUP BY c.district_id, f.month, f.rain_class;
CREATE UNIQUE INDEX ON mv_rain_class_month (district_id, month, rain_class);

-- Descriptive statistics of every variable over the whole dataset --------------
CREATE TABLE stat_describe (
    ord       smallint PRIMARY KEY,
    variable  text NOT NULL,
    n         bigint,
    mean      double precision,
    std       double precision,
    min       double precision,
    q1        double precision,
    median    double precision,
    q3        double precision,
    max       double precision,
    skew      double precision,
    kurt      double precision,
    fence_lo  double precision,
    fence_hi  double precision,
    outliers  bigint
);

DO $$
DECLARE
    cols text[] := ARRAY['temp_c','rh','rain_mm','gust_kmh','wind_kmh','cloud','vis_km','slp_hpa'];
    keys text[] := ARRAY['temp','rh','rain','gust','wind','cloud','vis','slp'];
    i int;
BEGIN
    FOR i IN 1 .. array_length(cols, 1) LOOP
        EXECUTE format($q$
            INSERT INTO stat_describe
            WITH s AS (SELECT %1$I::float8 AS x FROM fact_weather),
            b AS (
                SELECT count(*) AS n, avg(x) AS mean, stddev_samp(x) AS std, stddev_pop(x) AS sd_pop,
                       min(x) AS mn, max(x) AS mx,
                       percentile_cont(ARRAY[0.25, 0.5, 0.75]) WITHIN GROUP (ORDER BY x) AS q
                FROM s
            )
            SELECT %2$s, %3$L, b.n, b.mean, b.std, b.mn, b.q[1], b.q[2], b.q[3], b.mx,
                   (SELECT avg(power((x - b.mean) / nullif(b.sd_pop, 0), 3)) FROM s),
                   (SELECT avg(power((x - b.mean) / nullif(b.sd_pop, 0), 4)) - 3 FROM s),
                   b.q[1] - 1.5 * (b.q[3] - b.q[1]),
                   b.q[3] + 1.5 * (b.q[3] - b.q[1]),
                   (SELECT count(*) FROM s
                     WHERE x < b.q[1] - 1.5 * (b.q[3] - b.q[1]) OR x > b.q[3] + 1.5 * (b.q[3] - b.q[1]))
            FROM b
        $q$, cols[i], i, keys[i]);
    END LOOP;
END $$;

ANALYZE;
