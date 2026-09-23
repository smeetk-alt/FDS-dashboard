-- Calendar heatmap: one value per day, plus its z-score against the whole year.
WITH daily AS (
    SELECT m.obs_date, m.doy, sum(m.{col} * m.n) / sum(m.n) AS v
    FROM mv_district_day m
    JOIN dim_district d USING (district_id)
    WHERE %(district)s::text IS NULL OR d.district_name = %(district)s::text
    GROUP BY m.obs_date, m.doy
)
SELECT obs_date, doy, v,
       (v - avg(v) OVER ()) / nullif(stddev_samp(v) OVER (), 0) AS z
FROM daily
ORDER BY obs_date
