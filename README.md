# JRC–CaMa Interactive Viewer

An interactive, read-only visualization of CaMa-Flood
river links and JRC surface-water classifications.

## Requirements

- Python 3.10 or newer
- Git

## Installation

Clone the repository:

```bash
git clone https://github.com/Midddleman/JRC-Cama-Viewer.git
cd JRC-Cama-Viewer
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the viewer:

```bash
python app.py
```

Open the following URL in your browser:

http://127.0.0.1:5008/

## Features

- Interactive river-link map
- JRC perennial and non-perennial classification
- Catchment search and selection
- Monthly CaMa-Flood discharge statistics
- River channel geometry
- Mainstem and tributary visualization
- CSV export

## Data

The `data/` directory contains the SQLite databases and
JRC background image required by the viewer.

The application runs locally and does not require
a separate database server.
