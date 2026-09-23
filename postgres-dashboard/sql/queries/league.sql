-- District league table: aggregation over the selected months, RANK() window functions,
-- and an array of monthly means for each sparkline.
WITH agg AS (
    SELECT d.district_id, d.district_name, d.state,
           sum(m.n)                          AS n,
           sum(m.temp_c * m.n) / sum(m.n)    AS temp,
           sum(m.rh * m.n) / sum(m.n)        AS rh,
           sum(m.rain_mm * m.n) / sum(m.n)   AS rain,
           100.0 * sum(m.rainy) / sum(m.n)   AS rain_freq,
           max(m.gust_max)                   AS gust_max
    FROM mv_district_month m
    JOIN dim_district d USING (district_id)
    WHERE m.month = ANY(%(months)s)
    GROUP BY d.district_id, d.district_name, d.state
)
SELECT a.district_name AS district, a.state, a.temp, a.rh, a.rain, a.rain_freq, a.gust_max,
       RANK() OVER (ORDER BY a.temp DESC)       AS temp_rank,
       RANK() OVER (ORDER BY a.rain_freq DESC)  AS rain_rank,
       (SELECT array_agg(m2.{col} ORDER BY m2.month)
          FROM mv_district_month m2
         WHERE m2.district_id = a.district_id) AS spark
FROM agg a
ORDER BY a.temp DESC
