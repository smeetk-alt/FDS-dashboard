-- Scatter sample for the regression panel: a repeatable 0.25 percent Bernoulli sample of the rows.
SELECT f.{xcol} AS x, f.{ycol} AS y
FROM fact_weather f TABLESAMPLE BERNOULLI (0.25) REPEATABLE (42)
JOIN dim_cell c USING (cell_id)
JOIN dim_district d USING (district_id)
WHERE f.month = ANY(%(months)s)
  AND (%(district)s::text IS NULL OR d.district_name = %(district)s::text)
LIMIT 2500
