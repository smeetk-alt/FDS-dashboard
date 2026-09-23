-- 01_schema.sql
-- Star schema for the Tamil Nadu & Puducherry 2022 weather data.
--   stg_raw         staging table, a 1:1 copy of the CSV (loaded with COPY)
--   dim_district    40 districts
--   dim_cell        2,100 grid cells (0.12 degree spacing), each belonging to one district
--   dim_rain_class  the four decoded rain-intensity classes
--   fact_weather    one row per grid cell per day, in analysis units (deg C, km/h, hPa, km)
--   cleaning_log    what the cleaning step found and did (shown on the dashboard)

DROP SCHEMA IF EXISTS weather CASCADE;
CREATE SCHEMA weather;
SET search_path TO weather, public;

CREATE TABLE stg_raw (
    obs_date         text,
    latitude         double precision,
    longitude        double precision,
    city             text,
    district         text,
    state            text,
    pincode          text,
    country          text,
    rh_2m            double precision,
    tmp_2m           double precision,   -- kelvin
    vis_2m           double precision,   -- metres
    gust_10m         double precision,   -- m/s
    hcdc_atmc        double precision,
    lcdc_atmc        double precision,
    mcdc_atmc        double precision,
    prmsl_msl        double precision,   -- Pa
    pres_sfc         double precision,
    tmp_sfc          double precision,
    tcdcro_atmc      double precision,
    apcp_sfc         double precision,   -- mm
    ugrd_10m         double precision,   -- m/s
    ugrd_50m         double precision,
    vgrd_10m         double precision,   -- m/s
    vgrd_50m         double precision,
    vlcdc_atmc       double precision,
    tsoil_l4         double precision,
    month            integer,
    condition_encoded integer
);

CREATE TABLE dim_district (
    district_id   smallserial PRIMARY KEY,
    district_name text NOT NULL UNIQUE,
    state         text NOT NULL
);

CREATE TABLE dim_cell (
    cell_id     smallserial PRIMARY KEY,
    latitude    double precision NOT NULL,
    longitude   double precision NOT NULL,
    city        text,
    pincode     text,
    district_id smallint NOT NULL REFERENCES dim_district,
    UNIQUE (latitude, longitude)
);

CREATE TABLE dim_rain_class (
    rain_class smallint PRIMARY KEY,   -- 0 dry .. 3 heavy (ordered by intensity)
    label      text NOT NULL,
    rule       text NOT NULL,
    raw_code   smallint NOT NULL       -- the original Condition_encoded value
);
INSERT INTO dim_rain_class VALUES
    (0, 'Dry',        '< 0.1 mm',    3),
    (1, 'Light rain', '0.1-2.5 mm',  1),
    (2, 'Moderate',   '2.5-7.6 mm',  2),
    (3, 'Heavy',      '>= 7.6 mm',   0);

CREATE TABLE fact_weather (
    cell_id    smallint NOT NULL REFERENCES dim_cell,
    obs_date   date     NOT NULL,
    month      smallint NOT NULL,
    doy        smallint NOT NULL,       -- day of year, 0-based
    temp_c     real,
    rh         real,
    rain_mm    real,
    gust_kmh   real,
    wind_kmh   real,
    wind_dir   real,                    -- direction the wind blows FROM, degrees clockwise from north
    cloud      real,
    vis_km     real,
    slp_hpa    real,
    rain_class smallint NOT NULL REFERENCES dim_rain_class,
    PRIMARY KEY (cell_id, obs_date)
);

CREATE TABLE cleaning_log (
    step          smallint PRIMARY KEY,
    title         text NOT NULL,
    detail        text NOT NULL,
    rows_affected bigint
);
