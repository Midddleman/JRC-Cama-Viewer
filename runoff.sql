-- Materialized runoff in m/s: signed discharge / accumulated upstream area in m2.
BEGIN;
DROP VIEW IF EXISTS annual_runoff_stats;
DROP VIEW IF EXISTS monthly_runoff_stats;
CREATE TABLE IF NOT EXISTS monthly_runoff (
    catchment_id INTEGER NOT NULL REFERENCES catchment_links(catchment_id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    min_runoff_mps REAL,
    q25_runoff_mps REAL,
    median_runoff_mps REAL,
    mean_runoff_mps REAL,
    q75_runoff_mps REAL,
    max_runoff_mps REAL,
    mode_runoff_mps REAL,
    PRIMARY KEY (catchment_id, year, month)
);
CREATE TABLE IF NOT EXISTS annual_runoff (
    catchment_id INTEGER NOT NULL REFERENCES catchment_links(catchment_id),
    year INTEGER NOT NULL,
    mean_runoff_mps REAL,
    PRIMARY KEY (catchment_id, year)
);
DELETE FROM monthly_runoff;
INSERT INTO monthly_runoff
SELECT f.catchment_id, f.year, f.month,
       f.min_flow_cms / (CASE WHEN l.upstream_area_km2 > 0 THEN l.upstream_area_km2 * 1000000.0 END),
       f.q25_flow_cms / (CASE WHEN l.upstream_area_km2 > 0 THEN l.upstream_area_km2 * 1000000.0 END),
       f.median_flow_cms / (CASE WHEN l.upstream_area_km2 > 0 THEN l.upstream_area_km2 * 1000000.0 END),
       f.mean_flow_cms / (CASE WHEN l.upstream_area_km2 > 0 THEN l.upstream_area_km2 * 1000000.0 END),
       f.q75_flow_cms / (CASE WHEN l.upstream_area_km2 > 0 THEN l.upstream_area_km2 * 1000000.0 END),
       f.max_flow_cms / (CASE WHEN l.upstream_area_km2 > 0 THEN l.upstream_area_km2 * 1000000.0 END),
       f.mode_flow_cms / (CASE WHEN l.upstream_area_km2 > 0 THEN l.upstream_area_km2 * 1000000.0 END)
FROM monthly_flow_stats f JOIN catchment_links l USING (catchment_id);
DELETE FROM annual_runoff;
INSERT INTO annual_runoff
SELECT r.catchment_id, r.year,
       SUM(r.mean_runoff_mps * f.valid_days) /
       NULLIF(SUM(CASE WHEN r.mean_runoff_mps IS NOT NULL THEN f.valid_days ELSE 0 END), 0)
FROM monthly_runoff r JOIN monthly_flow_stats f USING (catchment_id, year, month)
GROUP BY r.catchment_id, r.year;
INSERT OR REPLACE INTO metadata VALUES ('runoff_definition', 'Materialized signed stored discharge statistics (m3/s) / accumulated upstream area (km2) / 1000000; units m/s; annual mean weighted by valid days; nonpositive area gives NULL. Re-run runoff.sql after source updates. Not local surface runoff.');
COMMIT;
