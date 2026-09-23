# Tamil Nadu & Puducherry Weather Atlas 2022

**Smeet Kataria · Roll No. 16014225042**

An interactive data-science dashboard built on a full year of gridded daily weather for Tamil Nadu and Puducherry: 768,600 observations, 2,100 grid cells, 40 districts, 8 weather variables. Every panel responds to one shared filter bar (district, season or month, and variable).

## Open the dashboard

**Live site:** https://smeetk-alt.github.io/FDS-dashboard/dashboard/

Or download the repository and open **`dashboard/index.html`** in any modern browser; no server or install is needed. An internet connection is used for the Google Fonts and the live weather panel (Open-Meteo, no API key); everything else works offline. **Export CSV** and **Export JSON** in the filter bar download the district-day rows for the current selection.

**Presenting it:** press **▶ Present** in the filter bar for an 11-step guided tour that spotlights each section with talking points. Use the arrow keys (or Page Up / Page Down on a clicker) to move and Esc to exit.

An alternative layout is in **`versions/heatwave-watch/index.html`** (see below).

**Design:** a royal metallic colour system with **primary rose gold** (selected filters, links, focus), **secondary silver** (Present button, section labels) and **tertiary gold** (key figures and highlights), in light and dark modes. Headings use Playfair Display, body text Manrope and figures JetBrains Mono. The logo (`dashboard/favicon.svg`) is a sun over wind lines inside a rose gold ring.

## What the dashboard covers

| Panel | Data-science fundamental |
|---|---|
| KPI strip | Aggregation: mean temperature, hottest day, rain frequency, humidity, wind gust, with monthly sparklines |
| Where it happens | Geospatial analysis: grid map of all 2,100 cells, click a cell to filter to its district |
| Through the year | Time series with a centred 7-day rolling mean and a spread band |
| How often it rained | Categorical encoding: the decoded rain-intensity classes by month |
| Shape of the data | Distribution: histogram with kernel density estimate, box plot, mode, variance, coefficient of variation, percentiles, skewness and outliers (Tukey's 1.5 × IQR fences) |
| What moves together | Correlation: Pearson matrix of all 8 variables, click a cell to plot that pair |
| Fitting a line | Linear regression: least-squares line, R², r, RMSE and a plain-language reading |
| District league table | Ranking and aggregation: sortable table with monthly sparklines |
| The numbers behind it all | Descriptive statistics: mean, std, quartiles, skew, kurtosis, outlier counts |
| From raw CSV to clean data | Data cleaning: every wrangling step, in order |
| Right now, and what stands out | Live data and an insight engine: current conditions, 24-hour trend, 7-day forecast and air quality from Open-Meteo, compared with the same date in 2022, plus automatically generated findings for the selection |
| Every day of 2022 | Calendar heatmap of all 365 days with anomaly markers |
| Where the wind comes from | Directional statistics: wind rose by direction and speed class |
| Modelling lab | Machine learning with validation: a harmonic seasonal model tested on a held-out Nov–Dec period, upgraded with an AR(1) residual term for one-day-ahead forecasts and compared against persistence and climatology baselines; multiple regression with an 80/20 split, standardised coefficients, VIF and a model comparison table |
| Can we tell a rainy day? | Classification: logistic regression (IRLS) predicting rainy district-days, ROC curve and AUC, a confusion matrix with a live decision-threshold slider, precision/recall/F1, odds ratios and a what-if simulator |
| Districts that behave alike | Unsupervised learning: k-means clustering of districts, elbow and silhouette analysis, cluster profiles and a PCA biplot |
| Days that broke the pattern | Anomaly detection with leave-one-out rolling z-scores |
| Is the difference real? | Hypothesis testing: Welch's t-test with p-value, 95% confidence interval and Cohen's d |

## Dataset

`data/Tamilnadu_and_Puducherry_weather_2022.zip` contains the original `Tamilnadu_and_Puducherry_weather_2022.csv` (208 MB). It is zipped because GitHub does not accept files over 100 MB. Unzip it to use the CSV directly; the scripts read the zip as-is.

- 768,600 rows × 28 columns, one row per grid cell per day
- Grid spacing 0.12° (about 13 km), latitude 8.04–13.92° N, longitude 76.08–81.00° E
- Variables used: `TMP_2m`, `RH_2m`, `APCP_sfc`, `GUST_10m`, `UGRD_10m` / `VGRD_10m`, `TCDCRO_atmc`, `VIS_2m`, `PRMSL_msl`, `Condition_encoded`

### Cleaning steps

1. **Completeness:** 0 missing values and 0 duplicate (cell, day) pairs.
2. **Text standardisation:** `Country` appeared as `" India"`, `"India"` and `"  India"`; four district names (Ariyalur, Chengalpattu, Karaikal, Tenkasi) had leading spaces. All were trimmed.
3. **Time range:** 2,100 rows dated 2023-01-01 were removed, leaving 766,500 rows for 2022.
4. **Unit conversion:** kelvin → °C, m/s → km/h, Pa → hPa, m → km, and wind speed from √(u² + v²).
5. **Label decoding:** `Condition_encoded` is a rain-intensity class, inferred from the rainfall range inside each code: 3 = dry (< 0.1 mm), 1 = light (0.1–2.5 mm), 2 = moderate (2.5–7.6 mm), 0 = heavy (≥ 7.6 mm).

Rainfall (`APCP_sfc`) is assumed to be in millimetres.

## Repository layout

```
dashboard/                 main dashboard (index.html + pre-aggregated data.js)
versions/heatwave-watch/   alternative Heatwave Watch layout (index.html, data.js, temps.js)
data/                      zipped dataset and the land mask used by the Heatwave Watch version
scripts/                   Python scripts that rebuild the data files from the raw dataset
postgres-dashboard/        PostgreSQL edition: SQL schema, per-panel queries, FastAPI backend (see its README)
```

## Rebuild the data files

The browser cannot load 208 MB, so the scripts pre-aggregate the dataset into compact JavaScript files.

```bash
pip install -r requirements.txt
python scripts/prep.py
```

This regenerates `dashboard/data.js` (about 2.3 MB) with cell × month means, district × day means, binned histograms, exact descriptive statistics and the correlation matrix. It takes a few minutes.

## Heatwave Watch version

`versions/heatwave-watch/` is a second layout inspired by heatwave early-warning portals. It has a district alert map, temperature and anomaly maps, a date picker with a seven-day window, a playable season timeline, the analytics panels and a Method page.

Two differences from the main dashboard:

- **Land cells only.** The 2,100 points form a full rectangle that includes the sea and neighbouring states. 663 sea cells are detected because their soil temperature (`TSOIL_l4`) never changes, and 677 land cells fall outside an approximate state outline. The remaining 760 cells cover about 1,33,000 km², within 2 % of the official area of Tamil Nadu and Puducherry.
- **Percentile-based alerts.** IMD's 40 °C criterion is defined on daily *maximum* station temperature, but this dataset has daily *mean* grid temperature (peak 34.9 °C). Each cell is compared with its own year instead: **Heat Watch** at or above its 90th percentile, **Heatwave Alert** at or above its 95th percentile on two consecutive days. A district takes a status when at least 25 % of its cells reach it.

Rebuild its data files with:

```bash
python scripts/mask.py
python scripts/prep.py --land-only
python scripts/temps.py
```

This is an academic data-science project, not an official weather or heatwave warning service.
