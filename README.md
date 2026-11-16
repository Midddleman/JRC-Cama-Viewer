# JRC–CaMa Interactive Viewer

English | [中文](#中文) | [日本語](#日本語)

## English

A local viewer for CaMa-Flood river networks and JRC surface-water classifications.

### Features

- Interactive map, catchment search and basin/attribute filters
- Monthly discharge and runoff statistics, comparison charts and CSV export
- Mainstem/tributary information and Chinese, English and Japanese interfaces

### Install and run

Requires Python 3.10+ and Git.

```bash
git clone https://github.com/Midddleman/JRC-Cama-Viewer.git
cd JRC-Cama-Viewer
python -m pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5008/ in your browser. Required viewer data is included.

### Update

Stop the viewer with `Ctrl+C`, then run in the repository folder:

```bash
git pull --ff-only
python -m pip install -r requirements.txt
python app.py
```

Hard-refresh the browser after updating. ZIP users can download and run the latest copy in a new folder.

### Files and data

`app.py` runs the viewer; `templates/` and `static/` contain the interface; `data/` contains the packaged SQLite databases and JRC image. `runoff.sql` prepares runoff data; `requirements.txt` lists Python dependencies.

Packaged data is processed for visualization and is not the complete original research dataset.

## 中文

用于查看 CaMa-Flood 河网与 JRC 水域分类的本地交互式工具。

### 主要功能

- 交互式地图、河段查询及流域与属性筛选
- 月流量与径流统计、比较图表及 CSV 导出
- 主干与支流信息，中英日界面切换

### 安装与运行

需要 Python 3.10 或更新版本和 Git。

```bash
git clone https://github.com/Midddleman/JRC-Cama-Viewer.git
cd JRC-Cama-Viewer
python -m pip install -r requirements.txt
python app.py
```

浏览器打开 http://127.0.0.1:5008/ 。运行所需数据已包含在仓库中。

### 更新

按 `Ctrl+C` 停止程序，在仓库目录执行：

```bash
git pull --ff-only
python -m pip install -r requirements.txt
python app.py
```

更新后强制刷新浏览器。ZIP 用户可将最新版解压到新目录后运行。

### 文件与数据

`app.py` 为启动程序，`templates/` 和 `static/` 为界面文件，`data/` 包含 SQLite 数据库和 JRC 背景图。`runoff.sql` 用于准备径流数据，`requirements.txt` 为 Python 依赖。

仓库数据为可视化处理结果，不包含完整原始研究数据集。

## 日本語

CaMa-Flood の河川網と JRC の水域分類を表示するローカルビューアです。

### 主な機能

- インタラクティブマップ、河川検索、流域・属性フィルター
- 月別流量・比流量の統計、比較グラフ、CSV 出力
- 本川・支川情報、中国語・英語・日本語の表示切り替え

### インストールと起動

Python 3.10 以降と Git が必要です。

```bash
git clone https://github.com/Midddleman/JRC-Cama-Viewer.git
cd JRC-Cama-Viewer
python -m pip install -r requirements.txt
python app.py
```

ブラウザで http://127.0.0.1:5008/ を開きます。必要なデータは同梱されています。

### 更新

`Ctrl+C` で停止し、リポジトリ内で実行します。

```bash
git pull --ff-only
python -m pip install -r requirements.txt
python app.py
```

更新後はブラウザを強制再読み込みしてください。ZIP の場合は最新版を新しいフォルダに展開して実行できます。

### ファイルとデータ

`app.py` は起動用、`templates/` と `static/` は画面用、`data/` は SQLite データベースと JRC 背景画像です。`runoff.sql` は比流量データの準備用、`requirements.txt` は Python 依存パッケージの一覧です。

同梱データは可視化用の加工結果であり、研究の元データすべてを含むものではありません。

## References / 参考资料 / 参考文献

- [CaMa-Flood](https://hydro.iis.u-tokyo.ac.jp/~yamadai/cama-flood/)
- [JRC Global Surface Water](https://global-surface-water.appspot.com/)
