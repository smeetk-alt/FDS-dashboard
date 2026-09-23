-- Pearson correlation of all 8 variables (28 pairs) over the selection, using corr().
SELECT count(*) AS n,
       corr(f.temp_c, f.rh) AS temp_rh,
       corr(f.temp_c, f.rain_mm) AS temp_rain,
       corr(f.temp_c, f.gust_kmh) AS temp_gust,
       corr(f.temp_c, f.cloud) AS temp_cloud,
       corr(f.temp_c, f.vis_km) AS temp_vis,
       corr(f.temp_c, f.slp_hpa) AS temp_slp,
       corr(f.temp_c, f.wind_kmh) AS temp_wind,
       corr(f.rh, f.rain_mm) AS rh_rain,
       corr(f.rh, f.gust_kmh) AS rh_gust,
       corr(f.rh, f.cloud) AS rh_cloud,
       corr(f.rh, f.vis_km) AS rh_vis,
       corr(f.rh, f.slp_hpa) AS rh_slp,
       corr(f.rh, f.wind_kmh) AS rh_wind,
       corr(f.rain_mm, f.gust_kmh) AS rain_gust,
       corr(f.rain_mm, f.cloud) AS rain_cloud,
       corr(f.rain_mm, f.vis_km) AS rain_vis,
       corr(f.rain_mm, f.slp_hpa) AS rain_slp,
       corr(f.rain_mm, f.wind_kmh) AS rain_wind,
       corr(f.gust_kmh, f.cloud) AS gust_cloud,
       corr(f.gust_kmh, f.vis_km) AS gust_vis,
       corr(f.gust_kmh, f.slp_hpa) AS gust_slp,
       corr(f.gust_kmh, f.wind_kmh) AS gust_wind,
       corr(f.cloud, f.vis_km) AS cloud_vis,
       corr(f.cloud, f.slp_hpa) AS cloud_slp,
       corr(f.cloud, f.wind_kmh) AS cloud_wind,
       corr(f.vis_km, f.slp_hpa) AS vis_slp,
       corr(f.vis_km, f.wind_kmh) AS vis_wind,
       corr(f.slp_hpa, f.wind_kmh) AS slp_wind
FROM fact_weather f
JOIN dim_cell c USING (cell_id)
JOIN dim_district d USING (district_id)
WHERE f.month = ANY(%(months)s)
  AND (%(district)s::text IS NULL OR d.district_name = %(district)s::text)
