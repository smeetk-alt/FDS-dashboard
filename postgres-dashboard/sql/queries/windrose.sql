-- Wind rose: 16 direction sectors (the direction the wind blows FROM) x 4 speed classes.
SELECT mod(floor((f.wind_dir + 11.25) / 22.5)::int, 16)              AS sector,
       width_bucket(f.wind_kmh::float8, ARRAY[10, 20, 30]::float8[]) AS speed_class,
       count(*)                                                      AS n
FROM fact_weather f
JOIN dim_cell c USING (cell_id)
JOIN dim_district d USING (district_id)
WHERE f.month = ANY(%(months)s)
  AND (%(district)s::text IS NULL OR d.district_name = %(district)s::text)
GROUP BY sector, speed_class
ORDER BY sector, speed_class
