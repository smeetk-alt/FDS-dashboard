-- District list for the filter bar.
SELECT d.district_name AS name, d.state, count(c.cell_id) AS cells
FROM dim_district d
JOIN dim_cell c USING (district_id)
GROUP BY d.district_name, d.state
ORDER BY d.district_name
