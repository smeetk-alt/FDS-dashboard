-- Simple linear regression y ~ x with the built-in regression aggregates.
-- RMSE = sqrt(residual sum of squares / n), where RSS = regr_syy * (1 - R^2).
SELECT count(*)                                   AS n,
       regr_slope(f.{ycol}, f.{xcol})             AS slope,
       regr_intercept(f.{ycol}, f.{xcol})         AS intercept,
       regr_r2(f.{ycol}, f.{xcol})                AS r2,
       corr(f.{ycol}, f.{xcol})                   AS r,
       sqrt(regr_syy(f.{ycol}, f.{xcol}) * (1 - regr_r2(f.{ycol}, f.{xcol})) / count(*)) AS rmse,
       min(f.{xcol})                              AS x_min,
       max(f.{xcol})                              AS x_max
FROM fact_weather f
JOIN dim_cell c USING (cell_id)
JOIN dim_district d USING (district_id)
WHERE f.month = ANY(%(months)s)
  AND (%(district)s::text IS NULL OR d.district_name = %(district)s::text)
