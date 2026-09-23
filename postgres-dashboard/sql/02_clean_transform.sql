-- 02_clean_transform.sql
-- Cleans stg_raw and fills the dimension and fact tables. Every step is logged
-- into cleaning_log so the dashboard can show what happened.
SET search_path TO weather, public;

-- Step 1: completeness --------------------------------------------------------
INSERT INTO cleaning_log
SELECT 1, 'Completeness',
       'Rows with any NULL value, and duplicate (cell, day) pairs',
       count(*) FILTER (WHERE NOT (r IS NOT NULL))
         + (count(*) - count(DISTINCT (r.latitude, r.longitude, r.obs_date)))
FROM stg_raw r;

-- Step 2: text standardisation ------------------------------------------------
INSERT INTO cleaning_log
SELECT 2, 'Text standardisation',
       'Country appeared as ' ||
       (SELECT string_agg(format('%L (%s rows)', country, n), ', ' ORDER BY n DESC)
          FROM (SELECT country, count(*) AS n FROM stg_raw GROUP BY country) c) ||
       '; districts with stray spaces: ' ||
       coalesce((SELECT string_agg(DISTINCT btrim(district), ', ')
                   FROM stg_raw WHERE district <> btrim(district)), 'none') ||
       '. All trimmed with btrim().',
       count(*) FILTER (WHERE district <> btrim(district) OR country <> btrim(country))
FROM stg_raw;

-- Step 3: time range ----------------------------------------------------------
INSERT INTO cleaning_log
SELECT 3, 'Time range',
       'Rows dated outside 2022 were removed (all fall on 2023-01-01)',
       count(*) FILTER (WHERE obs_date::date NOT BETWEEN DATE '2022-01-01' AND DATE '2022-12-31')
FROM stg_raw;

-- Dimensions ------------------------------------------------------------------
INSERT INTO dim_district (district_name, state)
SELECT btrim(district), min(btrim(state))
FROM stg_raw
GROUP BY btrim(district)
ORDER BY btrim(district);

INSERT INTO dim_cell (latitude, longitude, city, pincode, district_id)
SELECT r.latitude, r.longitude, min(btrim(r.city)), min(btrim(r.pincode)), min(d.district_id)
FROM stg_raw r
JOIN dim_district d ON d.district_name = btrim(r.district)
GROUP BY r.latitude, r.longitude
ORDER BY r.latitude, r.longitude;

-- Fact table: unit conversion and label decoding -------------------------------
--   kelvin -> deg C, m/s -> km/h, Pa -> hPa, m -> km, wind speed = sqrt(u^2 + v^2)
--   Condition_encoded is a rain-intensity class inferred from the rain range inside
--   each code: 3 = dry, 1 = light, 2 = moderate, 0 = heavy (re-ordered to 0..3).
INSERT INTO fact_weather
SELECT c.cell_id,
       r.obs_date::date,
       EXTRACT(month FROM r.obs_date::date)::smallint,
       (EXTRACT(doy FROM r.obs_date::date) - 1)::smallint,
       r.tmp_2m - 273.15,
       r.rh_2m,
       r.apcp_sfc,
       r.gust_10m * 3.6,
       sqrt(r.ugrd_10m ^ 2 + r.vgrd_10m ^ 2) * 3.6,
       dir.raw - 360 * floor(dir.raw / 360),
       r.tcdcro_atmc,
       r.vis_2m / 1000,
       r.prmsl_msl / 100,
       CASE r.condition_encoded WHEN 3 THEN 0 WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 0 THEN 3 END
FROM stg_raw r
JOIN dim_cell c ON c.latitude = r.latitude AND c.longitude = r.longitude
CROSS JOIN LATERAL (SELECT 270 - degrees(atan2(r.vgrd_10m, r.ugrd_10m)) AS raw) dir
WHERE r.obs_date::date BETWEEN DATE '2022-01-01' AND DATE '2022-12-31';

-- Step 4 and 5 ----------------------------------------------------------------
INSERT INTO cleaning_log
SELECT 4, 'Unit conversion',
       'kelvin to deg C, m/s to km/h, Pa to hPa, m to km; wind speed from sqrt(u^2 + v^2); wind direction from atan2(v, u)',
       count(*)
FROM fact_weather;

INSERT INTO cleaning_log
SELECT 5, 'Label decoding',
       'Condition_encoded is a rain-intensity class: 3 = dry (< 0.1 mm), 1 = light (0.1-2.5 mm), 2 = moderate (2.5-7.6 mm), 0 = heavy (>= 7.6 mm). '
       || 'The count on the right is rows whose class disagrees with their own rainfall value.',
       count(*) FILTER (WHERE rain_class <> CASE WHEN rain_mm < 0.1 THEN 0
                                                 WHEN rain_mm < 2.5 THEN 1
                                                 WHEN rain_mm < 7.6 THEN 2 ELSE 3 END)
FROM fact_weather;

INSERT INTO cleaning_log
SELECT 6, 'Result',
       'Clean fact_weather rows (' || (SELECT count(*) FROM dim_cell) || ' grid cells, '
       || (SELECT count(*) FROM dim_district) || ' districts, 365 days)',
       count(*)
FROM fact_weather;

TRUNCATE stg_raw;   -- the raw copy is no longer needed; frees the disk space
