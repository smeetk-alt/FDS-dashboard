-- Rain-intensity classes by month, read from a materialized view.
SELECT r.month, r.rain_class, k.label, sum(r.n) AS n
FROM mv_rain_class_month r
JOIN dim_rain_class k USING (rain_class)
JOIN dim_district d USING (district_id)
WHERE %(district)s::text IS NULL OR d.district_name = %(district)s::text
GROUP BY r.month, r.rain_class, k.label
ORDER BY r.month, r.rain_class
