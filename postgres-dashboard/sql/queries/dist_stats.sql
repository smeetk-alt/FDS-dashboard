-- Distribution: exact descriptive statistics for the selection.
-- Skewness is the moment coefficient; fences are Tukey's 1.5 x IQR rule.
WITH sel AS (
    SELECT f.{col}::float8 AS x
    FROM fact_weather f
    JOIN dim_cell c USING (cell_id)
    JOIN dim_district d USING (district_id)
    WHERE f.month = ANY(%(months)s)
      AND (%(district)s::text IS NULL OR d.district_name = %(district)s::text)
),
b AS (
    SELECT count(*) AS n, avg(x) AS mean, stddev_samp(x) AS std, var_samp(x) AS var,
           stddev_pop(x) AS sd_pop, min(x) AS min, max(x) AS max,
           percentile_cont(ARRAY[0.05, 0.25, 0.5, 0.75, 0.95]) WITHIN GROUP (ORDER BY x) AS q
    FROM sel
),
m AS (
    SELECT avg(power((x - b.mean) / nullif(b.sd_pop, 0), 3)) AS skew,
           count(*) FILTER (WHERE x < b.q[2] - 1.5 * (b.q[4] - b.q[2])
                               OR x > b.q[4] + 1.5 * (b.q[4] - b.q[2])) AS outliers
    FROM sel, b
),
mo AS (
    SELECT mode() WITHIN GROUP (ORDER BY round(x::numeric, 1)) AS mode FROM sel
)
SELECT b.n, b.mean, b.std, b.var, b.min, b.max,
       b.q[1] AS p05, b.q[2] AS q1, b.q[3] AS median, b.q[4] AS q3, b.q[5] AS p95,
       100 * b.std / nullif(b.mean, 0)   AS cv_pct,
       mo.mode,
       m.skew,
       b.q[2] - 1.5 * (b.q[4] - b.q[2])  AS fence_lo,
       b.q[4] + 1.5 * (b.q[4] - b.q[2])  AS fence_hi,
       m.outliers
FROM b, m, mo
