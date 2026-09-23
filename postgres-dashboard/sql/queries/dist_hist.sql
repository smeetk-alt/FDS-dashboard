-- Distribution: histogram with width_bucket().
-- Bucket 0 is below the range, bins + 1 is at or above it.
SELECT width_bucket(f.{col}::float8, %(lo)s::float8, %(hi)s::float8, %(bins)s::int) AS bucket,
       count(*) AS n
FROM fact_weather f
JOIN dim_cell c USING (cell_id)
JOIN dim_district d USING (district_id)
WHERE f.month = ANY(%(months)s)
  AND (%(district)s::text IS NULL OR d.district_name = %(district)s::text)
GROUP BY bucket
ORDER BY bucket
