-- Welch t-test between two groups of days (group A months vs group B months), using daily
-- district-mean values as the observations. The sufficient statistics, t, degrees of freedom
-- and Cohen's d are computed here; the p-value and confidence interval need the t
-- distribution, which PostgreSQL does not have (see app/main.py).
WITH daily AS (
    SELECT m.obs_date, m.month, sum(m.{col} * m.n) / sum(m.n) AS v
    FROM mv_district_day m
    JOIN dim_district d USING (district_id)
    WHERE %(district)s::text IS NULL OR d.district_name = %(district)s::text
    GROUP BY m.obs_date, m.month
),
a AS (SELECT count(*) AS n, avg(v) AS mean, var_samp(v) AS var FROM daily WHERE month = ANY(%(months_a)s)),
b AS (SELECT count(*) AS n, avg(v) AS mean, var_samp(v) AS var FROM daily WHERE month = ANY(%(months_b)s)),
t AS (
    SELECT a.n AS n_a, a.mean AS mean_a, a.var AS var_a,
           b.n AS n_b, b.mean AS mean_b, b.var AS var_b,
           a.mean - b.mean AS diff,
           sqrt(a.var / a.n + b.var / b.n) AS se,
           sqrt(((a.n - 1) * a.var + (b.n - 1) * b.var) / (a.n + b.n - 2)) AS pooled_sd
    FROM a, b
    WHERE a.n > 1 AND b.n > 1
)
SELECT t.*,
       t.diff / nullif(t.se, 0) AS t_stat,
       power(t.se, 4) / (power(t.var_a / t.n_a, 2) / (t.n_a - 1)
                       + power(t.var_b / t.n_b, 2) / (t.n_b - 1)) AS df,
       t.diff / nullif(t.pooled_sd, 0) AS cohens_d
FROM t
