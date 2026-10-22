"""Read-only viewer for direct CaMa downstream-link / JRC classifications."""

import csv
import io
import json
import sqlite3
from contextlib import closing
from pathlib import Path

from flask import Flask, Response, abort, jsonify, render_template, send_file


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
            "SELECT * FROM monthly_flow_stats WHERE catchment_id = ? "
            "ORDER BY year, month", (catchment_id,)
        )]
        geometry = connection.execute(
            "SELECT river_width_m, river_height_m, river_length_m, "
            "catchment_elevation_m, downstream_elevation_m, elevation_drop_m, "
            "channel_slope_m_per_m "
            "FROM channel_geometry WHERE catchment_id = ?", (catchment_id,)
        ).fetchone()
    record = dict(link)
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


@app.get("/health")
def health():
    return jsonify({"classification": CLASSIFICATION_PATH.exists(),
                    "database": DB_PATH.exists(), "jrc": JRC_PATH.exists()})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5008, debug=False)
