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

# JRC–CaMa Interactive Viewer

**CaMa-Flood × JRC 河川流量・水域分類インタラクティブビューア**

中文 | 日本語

---

## 中文说明

### 1. 项目简介

本项目是一个基于 Flask 的交互式可视化工具，用于展示和分析 CaMa-Flood 河流流量模拟结果与 JRC Global Surface Water 水域观测数据之间的关联。

通过交互式地图、河段查询和流量统计，可以直观地查看不同河段的流量特征、水域分类及其空间关系。

本项目提供独立运行版本，包含可视化程序及运行所需的数据文件，无需配置额外的数据库服务器。

### 2. 主要功能

- **交互式地图**：显示研究区域的河流及 JRC 水域分类背景图。
- **河段查询**：通过 Catchment ID 查询特定河段。
- **流量数据可视化**：查看 CaMa-Flood 模拟流量及相关统计信息。
- **河流结构分析**：查看主干河流（Mainstem）与支流（Tributary）的分类信息。
- **数据导出**：将指定河段的数据导出为 CSV 文件。

### 3. 运行环境

- Python 3.10 或更新版本
- Git（使用 `git clone` 下载时需要）
- 支持现代浏览器的操作系统（Windows、macOS 或 Linux）

### 4. 安装与运行

**步骤 1：克隆仓库**

```bash
git clone https://github.com/Midddleman/JRC-Cama-Viewer.git
cd JRC-Cama-Viewer
```

也可以在 GitHub 页面点击 **Code → Download ZIP** 下载并解压。

**步骤 2：安装依赖**

```bash
python -m pip install -r requirements.txt
```

**步骤 3：启动程序**

```bash
python app.py
```

**步骤 4：打开浏览器**

访问：

http://127.0.0.1:5008/

程序将在本地运行，无需连接外部数据库服务器。

### 5. 项目结构

```text
JRC-Cama-Viewer/
├── app.py                 # Flask 后端
├── requirements.txt       # Python 依赖
├── README.md              # 项目说明
├── data/
│   ├── cama_links.sqlite  # CaMa–JRC 河段关联数据库
│   ├── mainstem.sqlite    # 主干河流与支流分类数据库
│   └── jrc.png            # JRC 水域分类背景图
├── static/
│   ├── app.js             # 前端交互逻辑
│   └── style.css          # 页面样式
└── templates/
    └── index.html         # 网页模板
```

### 6. 数据说明

本项目使用以下研究数据：

- **CaMa-Flood**：用于河流流量模拟与河网分析。
- **JRC Global Surface Water**：用于分析地表水的时空分布及水域持续性。
- **CaMa–JRC 关联数据**：用于建立模拟河段与 JRC 水域信息之间的空间关联。
- **主干河流分类数据**：用于区分主干河流与支流。

仓库中的 SQLite 文件为可视化使用的处理结果，不代表完整原始研究数据集。

### 7. 注意事项

- 本工具主要用于科研、数据探索和可视化。
- 可视化结果受输入数据、模型假设、空间分辨率及分类阈值影响。
- CaMa-Flood 模拟结果与 JRC 遥感观测结果具有不同的数据来源和不确定性，不应直接视为完全一致。
- 本项目的代码及数据使用权限，应以仓库正式公布的许可证和原始数据提供方的使用条件为准。

---

## 日本語説明

### 1. プロジェクト概要

本プロジェクトは、CaMa-Flood による河川流量シミュレーション結果と、JRC Global Surface Water の水域観測データとの関係を可視化・分析するための、Flask ベースのインタラクティブビューアです。

インタラクティブマップ、河川流域の検索、流量統計などの機能を通じて、河川の流量特性、水域分類、およびそれらの空間的な関係を確認できます。

本リポジトリには、可視化アプリケーションと実行に必要なデータが含まれており、別途データベースサーバーを構築する必要はありません。

### 2. 主な機能

- **インタラクティブマップ**：対象地域の河川と JRC 水域分類の背景画像を表示します。
- **河川流域の検索**：Catchment ID を指定して対象河川を検索できます。
- **流量データの可視化**：CaMa-Flood によるシミュレーション流量と関連統計情報を確認できます。
- **河川構造の分析**：本川（Mainstem）と支川（Tributary）の分類情報を確認できます。
- **データのエクスポート**：対象河川のデータを CSV 形式で出力できます。

### 3. 動作環境

- Python 3.10 以降
- Git（`git clone` を使用する場合）
- モダンブラウザが利用可能な Windows、macOS または Linux

### 4. インストールと起動方法

**ステップ 1：リポジトリのクローン**

```bash
git clone https://github.com/Midddleman/JRC-Cama-Viewer.git
cd JRC-Cama-Viewer
```

GitHub の **Code → Download ZIP** からダウンロードすることもできます。

**ステップ 2：依存パッケージのインストール**

```bash
python -m pip install -r requirements.txt
```

**ステップ 3：アプリケーションの起動**

```bash
python app.py
```

**ステップ 4：ブラウザでアクセス**

以下の URL を開いてください。

http://127.0.0.1:5008/

アプリケーションはローカル環境で動作し、外部データベースサーバーへの接続は不要です。

### 5. ディレクトリ構成

```text
JRC-Cama-Viewer/
├── app.py                 # Flask バックエンド
├── requirements.txt       # Python 依存パッケージ
├── README.md              # プロジェクト説明
├── data/
│   ├── cama_links.sqlite  # CaMa–JRC 河川リンクデータ
│   ├── mainstem.sqlite    # 本川・支川分類データ
│   └── jrc.png            # JRC 水域分類背景画像
├── static/
│   ├── app.js             # フロントエンド処理
│   └── style.css          # スタイルシート
└── templates/
    └── index.html         # HTML テンプレート
```

### 6. 使用データ

本プロジェクトでは、以下のデータを使用しています。

- **CaMa-Flood**：河川流量のシミュレーションおよび河川ネットワークの解析に使用します。
- **JRC Global Surface Water**：地表水の時空間分布および水域の持続性の解析に使用します。
- **CaMa–JRC 対応データ**：シミュレーション河川と JRC 水域情報との空間的な対応関係を表します。
- **本川・支川分類データ**：河川ネットワークにおける本川と支川の区分に使用します。

リポジトリ内の SQLite ファイルは可視化用に加工されたデータであり、研究に使用したすべての元データを含むものではありません。

### 7. 注意事項

- 本ツールは主に研究、データ探索および可視化を目的としています。
- 可視化結果は、入力データ、モデルの仮定、空間解像度および分類閾値の影響を受けます。
- CaMa-Flood のシミュレーション結果と JRC の衛星観測データは、データの性質や不確実性が異なるため、完全に一致するものではありません。
- コードおよびデータの利用条件については、リポジトリに明示されたライセンスと元データ提供元の利用規約を確認してください。

---

## References / 参考资料・参考文献

- [CaMa-Flood](https://hydro.iis.u-tokyo.ac.jp/~yamadai/cama-flood/)
- [JRC Global Surface Water](https://global-surface-water.appspot.com/)

## Repository

https://github.com/Midddleman/JRC-Cama-Viewer
