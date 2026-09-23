-- Anomaly detection: leave-one-out rolling z-score. Each day is compared with the 7 days
-- either side of it, excluding the day itself, using running sums (count, sum, sum of squares).
WITH daily AS (
    SELECT m.obs_date, sum(m.{col} * m.n) / sum(m.n) AS v
    FROM mv_district_day m
    JOIN dim_district d USING (district_id)
    WHERE %(district)s::text IS NULL OR d.district_name = %(district)s::text
    GROUP BY m.obs_date
),
w AS (
    SELECT obs_date, v,
           count(*)   OVER win AS n,
           sum(v)     OVER win AS s,
           sum(v * v) OVER win AS ss
    FROM daily
    WINDOW win AS (ORDER BY obs_date ROWS BETWEEN 7 PRECEDING AND 7 FOLLOWING)
),
loo AS (
    SELECT obs_date, v, n,
           (s - v) / (n - 1) AS mu,
           ((ss - v * v) - (n - 1) * power((s - v) / (n - 1), 2)) / (n - 2) AS var
    FROM w
    WHERE n >= 8
)
SELECT obs_date, v, mu,
       sqrt(nullif(greatest(var, 0), 0))                                     AS sd,
       (v - mu) / sqrt(nullif(greatest(var, 0), 0))                          AS z,
       abs((v - mu) / sqrt(nullif(greatest(var, 0), 0))) > %(zthr)s::float8  AS is_anomaly
FROM loo
ORDER BY obs_date
