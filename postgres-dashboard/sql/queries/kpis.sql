-- KPI strip: aggregates over the current selection (district x months).
WITH sel AS (
    SELECT f.obs_date, f.cell_id, f.temp_c, f.rh, f.gust_kmh, f.rain_class
    FROM fact_weather f
    JOIN dim_cell c USING (cell_id)
    JOIN dim_district d USING (district_id)
    WHERE f.month = ANY(%(months)s)
      AND (%(district)s::text IS NULL OR d.district_name = %(district)s::text)
),
hot AS (
    SELECT obs_date, avg(temp_c) AS t FROM sel GROUP BY obs_date ORDER BY t DESC LIMIT 1
)
SELECT count(*)                            AS n_obs,
       avg(temp_c)                         AS mean_temp,
       (SELECT t FROM hot)                 AS hot_temp,
       (SELECT obs_date FROM hot)          AS hot_day,
       100.0 * avg((rain_class > 0)::int)  AS rain_freq_pct,
       avg(rh)                             AS mean_rh,
       max(gust_kmh)                       AS max_gust
FROM sel
