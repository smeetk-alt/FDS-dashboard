-- Monthly series behind the KPI sparklines (weighted by grid-days per district).
SELECT m.month,
       sum(m.temp_c * m.n) / sum(m.n)   AS mean_temp,
       max(m.temp_max)                  AS hot_temp,
       100.0 * sum(m.rainy) / sum(m.n)  AS rain_freq_pct,
       sum(m.rh * m.n) / sum(m.n)       AS mean_rh,
       max(m.gust_max)                  AS max_gust
FROM mv_district_month m
JOIN dim_district d USING (district_id)
WHERE %(district)s::text IS NULL OR d.district_name = %(district)s::text
GROUP BY m.month
ORDER BY m.month
