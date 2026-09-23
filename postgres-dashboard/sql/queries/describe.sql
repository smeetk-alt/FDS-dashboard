-- Descriptive statistics of all 8 variables over the whole dataset (built in 03_views_indexes.sql).
SELECT variable, n, mean, std, min, q1, median, q3, max, skew, kurt, fence_lo, fence_hi, outliers
FROM stat_describe
ORDER BY ord
