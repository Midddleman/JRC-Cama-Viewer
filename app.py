"""Read-only viewer for direct CaMa downstream-link / JRC classifications."""

import csv
import io
import json
import math
import sqlite3
from functools import lru_cache
from contextlib import closing
from pathlib import Path

from flask import Flask, Response, abort, jsonify, render_template, send_file, request


HERE = Path(__file__).resolve().parent
DB_PATH = HERE / "data" / "cama_links.sqlite"
CLASSIFICATION_PATH = HERE / "data" / "mainstem.sqlite"
JRC_PATH = HERE / "data" / "jrc.png"
REFERENCE_CATCHMENT_ID = 5517354

HERE = Path(__file__).resolve().parent
app = Flask(__name__, template_folder=str(HERE / "templates"), static_folder=str(HERE / "static"))


def database():
    connection = sqlite3.connect(f"file:{DB_PATH.as_posix()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def classification_database():
    connection = sqlite3.connect(f"file:{CLASSIFICATION_PATH.as_posix()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/overview")
def overview():
    with closing(database()) as connection:
        links = [dict(row) for row in connection.execute(
            "SELECT l.catchment_id, l.downstream_id, l.longitude, l.latitude, "
            "l.downstream_longitude, l.downstream_latitude, l.jrc_status, l.jrc_label, "
            "m.basin_id AS major_basin_id, b.display_name AS major_basin_name "
            "FROM catchment_links l "
            "LEFT JOIN catchment_major_basins m USING (catchment_id) "
            "LEFT JOIN major_river_basins b ON b.basin_id = m.basin_id "
            "ORDER BY l.catchment_id"
        )]
        reference = connection.execute(
            "SELECT catchment_id, river_width_m, river_height_m "
            "FROM channel_geometry WHERE catchment_id = ?", (REFERENCE_CATCHMENT_ID,)
        ).fetchone()
        basins = []
        for row in connection.execute("""
            SELECT b.*, COUNT(m.catchment_id) AS catchment_count,
                   SUM(CASE WHEN l.jrc_status = 2 THEN 1 ELSE 0 END) AS perennial_count,
                   SUM(CASE WHEN l.jrc_status = 1 THEN 1 ELSE 0 END) AS nonperennial_count,
                   SUM(CASE WHEN l.jrc_status IS NULL OR l.jrc_status NOT IN (1, 2)
                       THEN 1 ELSE 0 END) AS unresolved_count
            FROM major_river_basins b
            JOIN catchment_major_basins m USING (basin_id)
            JOIN catchment_links l USING (catchment_id)
            GROUP BY b.basin_id
            ORDER BY b.display_name
        """):
            basin = dict(row)
            basin["geometry"] = json.loads(basin.pop("geometry_json"))
            basins.append(basin)
    with closing(classification_database()) as connection:
        classifications = {
            row["catchment_id"]: dict(row) for row in connection.execute(
                "SELECT catchment_id, basin_outlet_id, is_dominant_upstream, dominance_tie, "
                "basin_mainstem, stream_id, parent_stream_id, stream_join_catchment_id "
                "FROM catchment_classification"
            )
        }
    for link in links:
        link.update(classifications[link["catchment_id"]])
    return jsonify({"links": links, "basins": basins,
                    "channel_reference": dict(reference) if reference else None})


@app.get("/api/jrc.png")
def jrc_image():
    return send_file(JRC_PATH, mimetype="image/png", conditional=True)


FILTER_FIELDS = [
    ("discharge", "Annual mean discharge, 2019", "m3/s", "f.mean_discharge"),
    ("runoff", "Annual mean runoff, 2019", "m/s", "r.mean_runoff_mps"),
    ("min_discharge", "Minimum daily discharge, 2019", "m3/s", "f.min_discharge"),
    ("min_runoff", "Minimum daily runoff, 2019", "m/s", "f.min_discharge / NULLIF(l.upstream_area_km2 * 1000000.0, 0)"),
    ("upstream_area", "Upstream area", "km2", "l.upstream_area_km2"),
    ("slope", "Derived channel slope", "m/km", "g.channel_slope_m_per_m * 1000.0"),
    ("width", "Channel width", "m", "g.river_width_m"),
    ("depth", "Model bankfull depth", "m", "g.river_height_m"),
    ("channel_length", "Model channel length", "km", "g.river_length_m / 1000.0"),
    ("link_length", "Link length", "km", "l.link_length_m / 1000.0"),
    ("elevation", "Catchment elevation", "m", "g.catchment_elevation_m"),
    ("elevation_drop", "Elevation drop", "m", "g.elevation_drop_m"),
]
FILTER_CHOICES = {
    "network_role": ("Network role", "n.basin_mainstem", [(1, "Basin mainstem"), (0, "Tributary stream")]),
    "local_role": ("Local confluence role", "CASE WHEN n.is_dominant_upstream=1 THEN 'dominant' WHEN n.is_dominant_upstream=0 THEN 'tributary' WHEN l.catchment_id=l.downstream_id THEN 'outlet' ELSE 'none' END",
                   [("dominant", "Dominant upstream"), ("tributary", "Tributary at confluence"), ("outlet", "Basin outlet"), ("none", "No downstream confluence")]),
    "jrc_status": ("JRC status", "COALESCE(l.jrc_status, 0)", [(2, "Perennial"), (1, "Non-perennial"), (0, "Unresolved")]),
}


@app.get("/api/filter-fields")
def filter_fields():
    fields = [dict(key=key, label=label, unit=unit, kind="number")
              for key, label, unit, _ in FILTER_FIELDS]
    fields.extend(dict(key=key, label=label, unit="", kind="choice",
                       choices=[dict(value=value, label=text) for value, text in choices])
                  for key, (label, _, choices) in FILTER_CHOICES.items())
    return jsonify({"fields": fields})


@app.post("/api/filter")
def filter_points():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Expected a JSON filter object")
    rules = payload.get("rules", [])
    if not isinstance(rules, list) or len(rules) > 32:
        abort(400, description="Use at most 32 filter conditions")
    numeric = {key: expr for key, _, _, expr in FILTER_FIELDS}
    operators = {"gt": ">", "eq": "=", "lt": "<"}
    conditions, parameters = [], []
    basin = payload.get("basin", "")
    if basin == "unassigned":
        conditions.append("m.basin_id IS NULL")
    elif basin not in ("", None):
        if isinstance(basin, bool) or str(basin).strip() != str(basin) or not str(basin).isdigit():
            abort(400, description="Invalid major river basin")
        basin = int(basin)
        with closing(database()) as c:
            if not c.execute("SELECT 1 FROM major_river_basins WHERE basin_id=?", (basin,)).fetchone():
                abort(400, description="Unknown major river basin")
        conditions.append("m.basin_id = ?")
        parameters.append(basin)
    for rule in rules:
        if not isinstance(rule, dict):
            abort(400, description="Invalid filter condition")
        field, operator, value = rule.get("field"), rule.get("operator"), rule.get("value")
        if not isinstance(field, str) or not isinstance(operator, str):
            abort(400, description="Invalid field or operator")
        if field in numeric:
            if operator not in operators or isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                abort(400, description="Numeric filters require >, = or < and a finite number")
            conditions.append(f"({numeric[field]}) {operators[operator]} ?")
            parameters.append(value)
        elif field in FILTER_CHOICES:
            _, expression, choices = FILTER_CHOICES[field]
            allowed = {str(v): v for v, _ in choices}
            if operator != "eq" or isinstance(value, bool) or str(value) not in allowed:
                abort(400, description="Invalid categorical option")
            conditions.append(f"({expression}) = ?")
            parameters.append(allowed[str(value)])
        else:
            abort(400, description="Unknown filter field")
    where = " AND ".join(conditions) or "1=1"
    with closing(database()) as c:
        c.execute("ATTACH DATABASE ? AS network", (f"file:{CLASSIFICATION_PATH.as_posix()}?mode=ro",))
        rows = c.execute(f"""
            WITH annual_flow AS (
                SELECT catchment_id,
                       SUM(mean_flow_cms * valid_days) / NULLIF(SUM(CASE WHEN mean_flow_cms IS NOT NULL THEN valid_days ELSE 0 END), 0) AS mean_discharge,
                       MIN(min_flow_cms) AS min_discharge
                FROM monthly_flow_stats WHERE year=2019 GROUP BY catchment_id
            )
            SELECT l.catchment_id, l.jrc_status
            FROM catchment_links l
            LEFT JOIN catchment_major_basins m USING(catchment_id)
            LEFT JOIN channel_geometry g USING(catchment_id)
            LEFT JOIN annual_flow f USING(catchment_id)
            LEFT JOIN annual_runoff r ON r.catchment_id=l.catchment_id AND r.year=2019
            LEFT JOIN network.catchment_classification n ON n.catchment_id=l.catchment_id
            WHERE {where} ORDER BY l.catchment_id
        """, parameters).fetchall()
    perennial = sum(row["jrc_status"] == 2 for row in rows)
    nonperennial = sum(row["jrc_status"] == 1 for row in rows)
    return jsonify({"ids": [row["catchment_id"] for row in rows], "count": len(rows),
                    "perennial": perennial, "nonperennial": nonperennial,
                    "unresolved": len(rows) - perennial - nonperennial})


def catchment_data(catchment_id):
    with closing(database()) as connection:
        link = connection.execute(
            "SELECT l.*, m.basin_id AS major_basin_id, "
            "b.display_name AS major_basin_name, b.source_name AS major_basin_source_name "
            "FROM catchment_links l "
            "LEFT JOIN catchment_major_basins m USING (catchment_id) "
            "LEFT JOIN major_river_basins b ON b.basin_id = m.basin_id "
            "WHERE l.catchment_id = ?", (catchment_id,)
        ).fetchone()
        if link is None:
            return None
        months = [dict(row) for row in connection.execute(
            "SELECT f.*, r.min_runoff_mps, r.q25_runoff_mps, r.median_runoff_mps, r.mean_runoff_mps, r.q75_runoff_mps, r.max_runoff_mps, r.mode_runoff_mps FROM monthly_flow_stats f JOIN monthly_runoff r USING (catchment_id, year, month) WHERE catchment_id = ? "
            "ORDER BY year, month", (catchment_id,)
        )]
        geometry = connection.execute(
            "SELECT river_width_m, river_height_m, river_length_m, "
            "catchment_elevation_m, downstream_elevation_m, elevation_drop_m, "
            "channel_slope_m_per_m "
            "FROM channel_geometry WHERE catchment_id = ?", (catchment_id,)
        ).fetchone()
        annual_runoff = connection.execute(
            "SELECT mean_runoff_mps FROM annual_runoff "
            "WHERE catchment_id = ? AND year = 2019", (catchment_id,)
        ).fetchone()
    record = dict(link)
    record["annual_mean_runoff_mps"] = annual_runoff[0] if annual_runoff else None
    with closing(classification_database()) as connection:
        classification = connection.execute(
            "SELECT * FROM catchment_classification WHERE catchment_id = ?", (catchment_id,)
        ).fetchone()
    if classification is None:
        raise RuntimeError(f"Missing mainstem classification for catchment {catchment_id}.")
    record.update(dict(classification))
    record["corridor"] = json.loads(record.pop("corridor_json")) if record["corridor_json"] else None
    return {"link": record, "months": months, "channel": dict(geometry) if geometry else None}


@app.get("/api/catchment/<int:catchment_id>")
def catchment(catchment_id):
    data = catchment_data(catchment_id)
    if data is None:
        abort(404)
    return jsonify(data)


@app.get("/api/catchment/<int:catchment_id>/csv")
def catchment_csv(catchment_id):
    data = catchment_data(catchment_id)
    if data is None:
        abort(404)
    fields = [
        "catchment_id", "downstream_id", "jrc_status", "jrc_label", "link_length_m",
        "major_basin_id", "major_basin_name", "major_basin_source_name",
        "cama_basin_id", "basin_outlet_id", "direct_upstream_count",
        "downstream_upstream_count", "is_dominant_upstream", "dominance_tie",
        "basin_mainstem", "stream_id", "parent_stream_id", "stream_join_catchment_id",
        "river_width_m", "river_height_m", "river_length_m",
        "catchment_elevation_m", "downstream_elevation_m", "elevation_drop_m",
        "channel_slope_m_per_m",
        "upstream_area_km2", "annual_mean_runoff_mps", "mean_runoff_mps", "min_runoff_mps", "q25_runoff_mps", "median_runoff_mps", "q75_runoff_mps", "max_runoff_mps", "mode_runoff_mps",
        "sampled_cell_count", "valid_cell_count", "perennial_count", "intermittent_count",
        "connected_path_cells", "year", "month", "days_in_month", "valid_days",
        "min_flow_cms", "q25_flow_cms", "median_flow_cms", "mean_flow_cms",
        "q75_flow_cms", "max_flow_cms", "mode_flow_cms", "mode_frequency",
    ]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    for month in data["months"]:
        writer.writerow({key: month.get(key, data["link"].get(key, (data["channel"] or {}).get(key))) for key in fields})
    return Response(
        "\ufeff" + output.getvalue(),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=cama_{catchment_id}_jrc_link.csv"},
    )


FLOW_EDGES = [-math.inf, 0, .01, .1, 1, 10, 100, 1000, 10000, math.inf]
FLOW_LABELS = ["<0", "0–0.01", "0.01–0.1", "0.1–1", "1–10", "10–100",
               "100–1k", "1k–10k", "≥10k"]


@lru_cache(maxsize=1)
def analysis_records(path, modified):
    """Cache source rows, invalidated when the SQLite file changes."""
    with closing(database()) as connection:
        rows = connection.execute("""
            SELECT l.catchment_id, l.jrc_status, b.basin_id, f.month,
                   f.mean_flow_cms, f.valid_days, f.days_in_month
            FROM catchment_links l
            LEFT JOIN catchment_major_basins b USING (catchment_id)
            LEFT JOIN monthly_flow_stats f ON f.catchment_id=l.catchment_id AND f.year=2019
            ORDER BY l.catchment_id, f.month
        """)
        grouped = {}
        for row in rows:
            record = grouped.setdefault(row['catchment_id'], {
                'status': row['jrc_status'], 'basin': row['basin_id'], 'months': []})
            record['months'].append((row['month'], row['mean_flow_cms'],
                                     row['valid_days'], row['days_in_month']))
    valid = []
    for record in grouped.values():
        months = record['months']
        if (len(months) != 12 or {m[0] for m in months} != set(range(1, 13))
                or any(m[1] is None or not math.isfinite(m[1]) or m[2] != m[3]
                       or not m[2] for m in months)):
            continue
        record['annual'] = sum(m[1]*m[2] for m in months)/sum(m[2] for m in months)
        record['months'] = [m[1] for m in months]
        valid.append(record)
    return valid, len(grouped)-len(valid)


def proportion_bins(records, labels, group):
    bins = [dict(label=label, total=0, perennial=0, nonperennial=0, unresolved=0)
            for label in labels]
    for record in records:
        item = bins[group(record)]
        item['total'] += 1
        key = {2: 'perennial', 1: 'nonperennial'}.get(record['status'], 'unresolved')
        item[key] += 1
    for item in bins:
        n = item['perennial'] + item['nonperennial']
        item['known'] = n
        item['percent'] = 100*item['perennial']/n if n else None
        # Wilson 95% interval exposes uncertainty in small groups.
        if n:
            p, z = item['perennial']/n, 1.959963984540054
            center = (p+z*z/(2*n))/(1+z*z/n)
            half = z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/(1+z*z/n)
            item['low'], item['high'] = 100*(center-half), 100*(center+half)
        else:
            item['low'] = item['high'] = None
    return bins


def flow_analysis(records, absolute, normalized, basin=None):
    selected = records if basin is None else [r for r in records if r['basin'] == basin]
    national_mean = sum(r['annual'] for r in records)/len(records) if records else None
    basin_groups = {}
    for record in records:
        if record['basin'] is not None:
            basin_groups.setdefault(record['basin'], []).append(record['annual'])
    basin_means = {key: sum(values)/len(values) for key, values in basin_groups.items()}
    charts = []
    def add_months(title, threshold, population, reference=None, normalization=None):
        charts.append(dict(title=title, threshold_cms=threshold, reference_mean_cms=reference,
                           excluded=len(selected)-len(population), kind='months',
                           normalization=normalization,
                           bins=proportion_bins(population, [str(i) for i in range(13)],
                               lambda r: sum(q > (threshold(r) if callable(threshold) else threshold)
                                             for q in r['months']))))
        # Do not serialize the per-basin threshold function.
        if callable(threshold):
            charts[-1]['threshold_cms'] = None
    charts.append(dict(title='Annual mean discharge (m³/s)', kind='flow', excluded=0, normalization=None,
        bins=proportion_bins(selected, FLOW_LABELS,
            lambda r: next(i for i in range(len(FLOW_LABELS))
                           if FLOW_EDGES[i] <= r['annual'] < FLOW_EDGES[i+1]))))
    for threshold in absolute:
        add_months(f'Q > {threshold:g} m³/s', threshold, selected)
    for coefficient in normalized:
        eligible = selected if national_mean is not None and national_mean > 0 else []
        add_months(f'Q / study-wide mean > {coefficient:g}',
                   coefficient*national_mean if eligible else None, eligible, national_mean,
                   normalization='study')
        eligible = [r for r in selected if basin_means.get(r['basin'], 0) > 0]
        add_months(f'Q / basin mean > {coefficient:g}',
                   lambda r: coefficient*basin_means[r['basin']], eligible,
                   basin_means.get(basin), normalization='basin')
    return dict(charts=charts, catchments=len(selected), national_mean_cms=national_mean,
                basin_mean_cms=basin_means.get(basin),
                unresolved=sum(r['status'] not in (1, 2) for r in selected))


@app.get('/api/flow-analysis')
def flow_analysis_api():
    def thresholds(name, default):
        try:
            values = sorted(set(float(v.strip()) for v in request.args.get(name, default).split(',')))
            if not 1 <= len(values) <= 8 or any(not math.isfinite(v) or v < 0 for v in values):
                raise ValueError
            return values
        except ValueError:
            abort(400, description=f'{name}: enter 1–8 finite nonnegative numbers separated by commas')
    absolute = thresholds('absolute', '0.01,0.1,1,10')
    normalized = thresholds('normalized', '0.01,0.1,0.5,1')
    try:
        basin = int(request.args['basin']) if request.args.get('basin') else None
    except ValueError:
        abort(400, description='Invalid basin ID')
    if basin is not None:
        with closing(database()) as connection:
            if not connection.execute('SELECT 1 FROM major_river_basins WHERE basin_id=?', (basin,)).fetchone():
                abort(404, description='Unknown basin')
    records, incomplete = analysis_records(str(DB_PATH), DB_PATH.stat().st_mtime_ns)
    result = flow_analysis(records, absolute, normalized, basin)
    result['incomplete_national'] = incomplete
    return jsonify(result)


@app.get("/health")
def health():
    return jsonify({"classification": CLASSIFICATION_PATH.exists(),
                    "database": DB_PATH.exists(), "jrc": JRC_PATH.exists()})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5008, debug=False)
