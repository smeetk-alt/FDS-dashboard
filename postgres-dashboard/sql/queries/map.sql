-- Map: one row per grid cell, averaged over the selected months.
SELECT c.cell_id,
       c.latitude      AS lat,
       c.longitude     AS lon,
       d.district_name AS district,
       sum(m.{col} * m.n) / sum(m.n) AS value
FROM mv_cell_month m
JOIN dim_cell c USING (cell_id)
JOIN dim_district d USING (district_id)
WHERE m.month = ANY(%(months)s)
GROUP BY c.cell_id, c.latitude, c.longitude, d.district_name
ORDER BY c.cell_id
