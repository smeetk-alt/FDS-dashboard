-- Health check shown in the header.
SELECT version() AS version,
       (SELECT count(*) FROM fact_weather) AS rows,
       (SELECT count(*) FROM dim_cell)     AS cells,
       (SELECT count(*) FROM dim_district) AS districts
