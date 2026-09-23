-- Time series: daily mean, spread band (10th-90th percentile across grid cells)
-- and a centred 7-day rolling mean using a window function.
WITH daily AS (
    SELECT f.obs_date,
           avg(f.{col})                                          AS v,
           percentile_cont(0.1) WITHIN GROUP (ORDER BY f.{col})  AS p10,
           percentile_cont(0.9) WITHIN GROUP (ORDER BY f.{col})  AS p90
    FROM fact_weather f
    JOIN dim_cell c USING (cell_id)
    JOIN dim_district d USING (district_id)
    WHERE %(district)s::text IS NULL OR d.district_name = %(district)s::text
    GROUP BY f.obs_date
)
SELECT obs_date,
       EXTRACT(month FROM obs_date)::int AS month,
       v, p10, p90,
       avg(v) OVER (ORDER BY obs_date ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING) AS roll7
FROM daily
ORDER BY obs_date
