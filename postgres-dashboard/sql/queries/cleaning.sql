-- The cleaning log written by 02_clean_transform.sql.
SELECT step, title, detail, rows_affected
FROM cleaning_log
ORDER BY step
