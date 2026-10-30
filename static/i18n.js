/* Local presentation-only translations. Source text is retained in weak maps so
 * switching languages never mutates data, recreates controls, or reloads APIs. */
(() => {
  const languages = ['en', 'zh', 'ja'];
  const phrases = [
    ['Scope: all study points or the selected basin.', '范围：全部研究点或所选流域。', '対象：全研究地点または選択した流域。'],
    ['Q: signed monthly mean discharge in 2019 (m³/s).', 'Q：2019年月平均流量（m³/s），保留正负号。', 'Q：符号付きの2019年月平均流量（m³/s）。'],
    ['Bar height: perennial points / known-status points.', '柱高：常年点数 ÷ 已知分类点数。', '棒の高さ：恒常流地点数 ÷ 分類既知の地点数。'],
    ['Empty groups: no known classifications, not 0%.', '空组：无已知分类，不表示0%。', '空の階級：既知分類なし。0%ではありません。'],
    ['Thin lines: 95% Wilson intervals.', '细线：95% Wilson区间。', '細線：95% Wilson区間。'],
    ['Direct comparison: bin raw discharge or count months with Q > QT.', '直接比较：对原始流量分箱，或统计 Q > QT 的月份数。', '直接比較：元の流量を階級分け、または Q > QT の月数を集計。'],
    ['Normalized: divide Q by the reference mean, then count months above the threshold (0–12).', '标准化：Q 除以参考均值后，统计超过阈值的月份数（0–12）。', '正規化：Qを基準平均値で割り、閾値を超える月数（0–12）を集計。'],
    ['Reference: study-wide mean for all points; basin mean for a selected basin.', '参考均值：全部范围用全部研究点均值；所选流域用该流域均值。', '基準平均値：全範囲では全研究地点の平均、流域選択時はその流域の平均。'],
    ['Mean: arithmetic average of day-weighted annual means. Nonpositive references are not normalized.', '均值：各点按天数加权年平均流量的算术平均。非正值不做标准化。', '平均値：日数加重年平均流量の算術平均。非正の場合は正規化しません。'],
    ['Only complete 12-month records with every day valid participate.', '仅使用完整12个月且每天有效的流量记录。', '12か月すべてで全日有効な流量記録のみを使用。'],
    ['Unknown JRC statuses are excluded from proportion denominators.', '未知JRC分类不计入比例分母。', 'JRC分類不明は割合の分母から除外。'],
    ['Each point has equal weight, not river-length weight.', '每点等权，不按河长加权。', '各地点は等重みで、河道長による重み付けはしません。'],
    ['2019 flow versus JRC 1984–2021 status: association, not same-year validation.', '2019流量与JRC 1984–2021状态：属于关联比较，不是同年验证。', '2019年流量とJRC 1984–2021年状態：関連の比較であり、同一年の検証ではありません。'],
    ['Direct comparison', '直接比较', '直接比較'],
    ['Normalized', '标准化', '正規化'],
    ['Comparison method', '比较方式', '比較方法'],
    ['Direct comparisons bin raw discharge or count months above an absolute threshold. Normalized comparisons divide Q by the reference mean before counting months above the threshold (0–12). All-study views use the study-wide mean; a selected basin uses only its own mean. Reference means are arithmetic averages of day-weighted annual means; nonpositive references are not normalized.',
     '直接比较按原始流量分箱或统计超过绝对阈值的月份数。标准化比较先用Q除以均值，再统计超过阈值的月份数（0–12）。全部范围使用全部研究点均值；选择流域后仅使用该流域均值。均值为各点按天数加权年平均Q的算术平均，非正时不做标准化。',
     '直接比較では元の流量を階級分けするか、絶対閾値を超える月数を数えます。正規化ではQを基準平均値で割り、閾値を超える月数（0–12）を数えます。全範囲では全研究地点の平均値、流域選択時はその流域の平均値のみを使います。基準値は日数加重年平均Qの算術平均で、非正の場合は正規化しません。'],
    ['CaMa Downstream Links', 'CaMa 下游连线', 'CaMa 下流リンク'],
    ['Catchment ID', '集水区 ID', '集水域 ID'],
    ['CATCHMENT ID', '集水区 ID', '集水域 ID'],
    ['Find', '查找', '検索'],
    ['JRC raster', 'JRC 栅格', 'JRC ラスター'],
    ['Opacity', '不透明度', '不透明度'],
    ['Links', '连线', 'リンク'],
    ['CaMa points', 'CaMa 点', 'CaMa 地点'],
    ['Basin boundaries', '流域边界', '流域境界'],
    ['Full extent', '全部范围', '全範囲'],
    ['Reset map extent', '重置地图范围', '地図範囲をリセット'],
    ['Major river basin', '主要流域', '主要河川流域'],
    ['All study points', '全部研究点', '全研究地点'],
    ['Clear focus', '清除流域筛选', '流域選択を解除'],
    ['Clear basin focus', '清除流域筛选', '流域選択を解除'],
    ['Loading basin statistics...', '正在加载流域统计…', '流域統計を読み込み中…'],
    ['Loading links...', '正在加载连线…', 'リンクを読み込み中…'],
    ['Pan', '平移', '移動'], ['Draw', '画笔', '描画'], ['Size', '笔宽', '太さ'],
    ['Pan map and select catchments', '平移地图并选择集水区', '地図を移動して集水域を選択'],
    ['Draw on map', '在地图上绘制', '地図に描画'],
    ['Dark green pen', '深绿色画笔', '濃緑のペン'], ['Red pen', '红色画笔', '赤のペン'],
    ['Yellow pen', '黄色画笔', '黄のペン'], ['White pen', '白色画笔', '白のペン'],
    ['Undo last stroke', '撤销上一笔', '直前の線を取り消す'],
    ['Clear all strokes', '清除所有笔迹', 'すべての描画を消去'],
    ['Download annotated map PNG', '下载标注地图 PNG', '注釈付き地図をPNGで保存'],
    ['Zoom in', '放大', '拡大'], ['Zoom out', '缩小', '縮小'], ['Zoom', '缩放', 'ズーム'],
    ['Perennial link', '常年连线', '恒常流リンク'],
    ['Non-perennial link', '非常年连线', '非恒常流リンク'],
    ['Unresolved link', '未确定连线', '未判定リンク'],
    ['Perennial catchment', '常年集水区', '恒常流の集水域'],
    ['Non-perennial catchment', '非常年集水区', '非恒常流の集水域'],
    ['Unresolved catchment', '未确定集水区', '未判定の集水域'],
    ['Data', '数据', 'データ'], ['Charts', '图表', 'グラフ'],
    ['Sidebar content', '侧栏内容', 'サイドバーの内容'],
    ['Download CSV', '下载 CSV', 'CSV を保存'],
    ['Clear stream highlight', '清除河流高亮', '河道の強調表示を解除'],
    ['Show basin mainstem', '显示流域干流', '流域の本川を表示'],
    ['Show tributary + mainstem', '显示支流与干流', '支川と本川を表示'],
    ['Basin mainstem', '流域干流', '流域の本川'],
    ['Tributary stream', '支流', '支川'],
    ['Mainstem', '干流', '本川'], ['Tributary', '支流', '支川'],
    ['Dominant upstream (tie resolved)', '主导上游（已处理并列）', '主上流（同順位を解決）'],
    ['Dominant upstream', '主导上游', '主上流'],
    ['Tributary (tied maximum)', '支流（面积并列最大）', '支川（面積が同率最大）'],
    ['Tributary at confluence', '汇流处支流', '合流点の支川'],
    ['Basin outlet', '流域出口', '流域出口'],
    ['No downstream confluence', '下游无汇流', '下流に合流点なし'],
    ['Not assigned to a named major basin', '未归属主要流域', '主要流域への割り当てなし'],
    ['Network role', '河网角色', '河川網での役割'],
    ['Local confluence role', '局部汇流角色', '合流点での役割'],
    ['Stream ID', '河流 ID', '河道 ID'], ['Downstream catchment', '下游集水区', '下流集水域'],
    ['Link length', '连线长度', 'リンク長'], ['Upstream area', '上游面积', '上流面積'],
    ['Corridor width', '走廊宽度', 'コリドー幅'],
    ['JRC perennial cells', 'JRC 常年水体像元', 'JRC 恒常水域セル'],
    ['JRC intermittent cells', 'JRC 季节性水体像元', 'JRC 季節性水域セル'],
    ['Connected blue path', '连通蓝色路径', '連結した青色経路'],
    ['Valid corridor cells', '走廊内有效像元', 'コリドー内の有効セル'],
    ['CaMa channel geometry', 'CaMa 河道几何', 'CaMa 河道形状'],
    ['Channel width', '河宽', '河道幅'], ['Model bankfull depth', '模型满岸深度', 'モデル満岸水深'],
    ['Model channel length', '模型河长', 'モデル河道長'],
    ['Derived channel slope', '推导河道坡度', '算出した河道勾配'],
    ['Elevation drop', '高程落差', '標高差'], ['Catchment elevation', '集水区高程', '集水域標高'],
    ['Channel geometry unavailable', '河道几何不可用', '河道形状データなし'],
    ['Width', '宽度', '幅'],
    ['Monthly flow, 2019', '2019年月流量', '2019年の月別流量'],
    ['Monthly statistics', '月度统计', '月別統計'],
    ['Statistic', '统计量', '統計量'], ['Mean', '平均值', '平均値'],
    ['Minimum', '最小值', '最小値'], ['Maximum', '最大值', '最大値'],
    ['Median', '中位数', '中央値'], ['Mode', '众数', '最頻値'],
    ['25th percentile', '第25百分位', '第25百分位数'],
    ['75th percentile', '第75百分位', '第75百分位数'],
    ['25th', '25%分位', '25%点'], ['75th', '75%分位', '75%点'],
    ['Min', '最小', '最小'], ['Max', '最大', '最大'], ['Month', '月份', '月'],
    ['Perennial river segment proportions', '常年河段比例', '恒常流河道区間の割合'],
    ['Absolute QT (m³/s, comma-separated)', '绝对阈值 QT（m³/s，逗号分隔）', '絶対閾値 QT（m³/s、カンマ区切り）'],
    ['Normalized threshold (Q / mean, comma-separated)', '标准化阈值（Q / 平均值，逗号分隔）', '正規化閾値（Q / 平均値、カンマ区切り）'],
    ['Update charts', '更新图表', 'グラフを更新'],
    ['Computing…', '正在计算…', '計算中…'],
    ['Enter 1–8 finite nonnegative numbers per field, separated by commas.', '每类请输入1–8个非负有限数字，用英文逗号分隔。', '各欄に有限の非負数を1〜8個、半角カンマで区切って入力してください。'],
    ['Analysis request failed', '分析读取失败', '解析データの読み込み失敗'],
    ['All study points (including unassigned basins)', '全部研究点（包括未分配流域的点）', '全研究地点（流域未割り当てを含む）'],
    ['complete-flow points', '个完整流量点', '地点（流量データ完備）'],
    ['unknown classifications', '个未知分类', '地点（分類不明）'],
    ['Study-wide mean', '全部研究点平均', '全研究地点の平均'],
    ['Basin mean', '流域平均', '流域平均'],
    ['Study-wide missing/incomplete exclusions', '全范围缺失/不完整流量排除', '全研究範囲の欠損・不完全データ除外'],
    ['Annual mean discharge (m³/s)', '年平均流量（m³/s）', '年平均流量（m³/s）'],
    ['study-wide mean', '全部研究点均值', '全研究地点の平均値'],
    ['basin mean', '流域均值', '流域の平均値'],
    ['Months with Q > threshold (2019)', 'Q 超过阈值的月份数（2019）', 'Q が閾値を超える月数（2019）'],
    ['Annual mean Q (m³/s), fixed bins', '年平均Q（m³/s），固定分箱', '年平均Q（m³/s）、固定階級'],
    ['No known classifications', '无已知分类', '既知分類なし'],
    ['n = known-status points; hover for counts. Normalization/basin exclusions', 'n = 已知分类点数；悬停柱子查看计数。标准化/流域缺失排除', 'n = 分類既知の地点数。各棒で件数を表示。正規化・流域情報による除外'],
    ['Reference mean', '参考均值', '参照平均値'],
    ['View bin values', '查看分组数值', '階級別の数値を見る'],
    ['Bin', '组', '階級'], ['Perennial%', '常年%', '恒常流%'],
    ['Perennial', '常年', '恒常流'], ['Non-perennial', '非常年', '非恒常流'],
    ['Unknown', '未知', '不明'], ['Total', '总计', '合計'],
    ['perennial', '常年', '恒常流'], ['non-perennial', '非常年', '非恒常流'],
    ['Unresolved', '未确定', '未判定'], ['unresolved', '未确定', '未判定'],
    ['catchments', '个集水区', '集水域'], ['displayed links', '条显示连线', '表示リンク'],
    ['links', '条连线', 'リンク'], ['cells', '个像元', 'セル'], ['stream', '河流', '河道'],
    ['Catchment ID not found', '未找到集水区 ID', '集水域 ID が見つかりません'],
    ['Could not load catchment', '无法加载集水区', '集水域を読み込めません'],
    ['Could not load link data', '无法加载连线数据', 'リンクデータを読み込めません'],
    ['to', '至', '→'],
    ['CaMa upstream area >10,000 km2 | direct downstream links | 5 km corridor half-width | JRC long-term status | CaMa monthly flow for 2019',
     'CaMa 上游面积 >10,000 km² | 直接下游连线 | 走廊半宽5 km | JRC 长期状态 | CaMa 2019年月流量',
     'CaMa 上流面積 >10,000 km² | 直接下流リンク | コリドー半幅5 km | JRC 長期状態 | CaMa 2019年月別流量'],
    ["Comparative schematic, not true aspect ratio. Depth uses CaMa's static river_height (bank-height) parameter, not measured bathymetry or daily water depth. Longitudinal slope is derived from CaMa catchment elevations and model channel length, not surveyed bed gradient.",
     '此为对比示意图，宽深比例不代表真实比例。深度为CaMa静态 river_height（岸高）参数，并非实测河床或每日水深。纵向坡度由CaMa集水区高程与模型河长推导，并非实测河床坡度。',
     '比較用の模式図で、縦横比は実寸比ではありません。深さはCaMaの静的な river_height（岸高）であり、実測河床や日々の水深ではありません。縦断勾配はCaMa集水域標高とモデル河道長から算出し、実測河床勾配ではありません。'],
    ['All study points / selected basin. Q is signed monthly mean discharge in 2019 (m³/s). Bars show perennial / known-status points; empty groups mean no known classifications, not 0%. Thin lines show 95% Wilson intervals.',
     '研究范围内全部点 / 所选流域。Q 为2019年月平均流量（m³/s），保留正负号。柱高为组内常年点 ÷ 已知分类点；灰色空组表示无已知分类，不是0%。细线为95% Wilson区间。',
     '全研究地点／選択流域。Qは符号付きの2019年月平均流量（m³/s）です。棒は恒常流地点数÷分類既知の地点数。空の階級は既知分類なしを示し、0%ではありません。細線は95% Wilson区間です。'],
    ['The first chart bins day-weighted annual mean Q (left-inclusive, right-exclusive). Other charts count months strictly above the threshold (0–12). The study-wide reference is the arithmetic mean of point annual means; basin references use study points in that basin. In the all-study basin-normalized charts, each point uses its own basin mean; unassigned points are excluded. Nonpositive reference means are not normalized.',
     '第一图按天数加权年平均Q分箱（左闭右开）。其余图横轴为严格超过阈值的月份数（0–12）。全部研究点平均值为各点年平均Q的算术平均；流域平均值使用该流域的研究点。全范围的流域标准化图中，每个点使用各自流域的平均值，未分配流域的点排除。均值非正时不做标准化。',
     '最初の図は日数加重年平均Qの階級別集計（下限を含み上限を含まない）です。他の図は閾値を厳密に超える月数（0–12）を示します。全研究地点の基準値は各地点の年平均Qの算術平均、流域基準値は当該流域内の研究地点の平均です。全範囲の流域正規化では各地点が属する流域の平均値を使い、流域未割り当ては除外します。基準平均値が非正の場合は正規化しません。'],
    ['Only complete 12-month records with every day valid participate. Unknown JRC statuses are excluded from proportion denominators. Points have equal weight, not river-length weight. Associations between 2019 flow and JRC 1984–2021 long-term status are not same-year validation.',
     '仅完整12个月且每天有效的记录参与分析；未知JRC分类不计入比例分母。每点等权，不按河长加权。2019流量与1984–2021 JRC长期状态的关联不代表同年验证。',
     '12か月すべてで全日有効な記録のみを使用します。JRC分類不明は割合の分母から除外します。各地点を等重みとし、河道長では重み付けしません。2019年流量と1984–2021年JRC長期状態の関連は、同一年の検証ではありません。'],
    ['Dashed reference: catchment', '虚线参考：集水区', '破線の基準：集水域'],
    ['m wide', 'm 宽', 'm 幅'], ['m deep', 'm 深', 'm 深'],
    ['Width and depth use fixed square-root scales, capped to fit.', '宽度与深度使用固定平方根尺度，并设置显示上限。', '幅と深さは固定平方根尺度を用い、表示上限を設けています。'],
    ['Interactive CaMa link map', '交互式 CaMa 连线地图', 'CaMa リンクの対話地図'],
    ['CaMa downstream link map', 'CaMa 下游连线地图', 'CaMa 下流リンク地図'],
    ['Catchment link details', '集水区连线详情', '集水域リンクの詳細'],
    ['Monthly flow chart', '月流量图', '月別流量グラフ'],
    ['Schematic CaMa channel cross-section', 'CaMa 河道横断面示意图', 'CaMa 河道横断模式図'],
    ['Perennial proportions', '常年比例', '恒常流の割合'],
    ['Map layers', '地图图层', '地図レイヤー'], ['Map drawing tools', '地图绘制工具', '地図描画ツール'],
    ['Map mode', '地图模式', '地図モード'], ['Pen color', '画笔颜色', 'ペンの色'],
    ['Drawing actions', '绘制操作', '描画操作'],
    ['CaMa-Flood / JRC direct links', 'CaMa-Flood / JRC 直接连线', 'CaMa-Flood / JRC 直接リンク'],
    ['Catchment', '集水区', '集水域'],
    ['points', '点', '地点'],
    ['nonperennial no connected path', '非常年：无连通路径', '非恒常流：連結経路なし'],
    ['unresolved outside raster', '未确定：栅格覆盖范围外', '未判定：ラスター範囲外'],
    ['perennial connected', '常年：路径连通', '恒常流：経路が連結'],
    ['nonperennial no water', '非常年：无水体像元', '非恒常流：水域セルなし'],
    ['unresolved zero length', '未确定：连线长度为零', '未判定：リンク長がゼロ'],
    ['unresolved below raster resolution', '未确定：低于栅格分辨率', '未判定：ラスター解像度未満'],
  ];
  // Exact matches handle prose; longest-first tokens handle numeric summaries.
  const exact = new Map();
  const tokens = new Map();
  for (const row of phrases) for (const source of row) {
    if (!exact.has(source)) exact.set(source, row);
    if (!tokens.has(source)) tokens.set(source, row);
  }
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokenPattern = new RegExp([...tokens.keys()].sort((a, b) => b.length-a.length)
    .map(source => /^[\x00-\x7f]/.test(source) && /[a-zA-Z]$/.test(source)
      ? `(?<![A-Za-z])${escape(source)}(?![A-Za-z])` : escape(source)).join('|'), 'g');
  let locale = 'zh';
  try { locale = localStorage.getItem('cama-viewer-language') || 'zh'; } catch (_) { /* storage may be disabled */ }
  if (!languages.includes(locale)) locale = 'zh';
  function translate(source) {
    const index = languages.indexOf(locale);
    const trimmed = source.trim();
    if (exact.has(trimmed)) return source.replace(trimmed, exact.get(trimmed)[index]);
    return source.replace(tokenPattern, token => tokens.get(token)[index]);
  }
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const attributes = ['title', 'aria-label', 'placeholder'];
  const skip = element => element.closest('script, style, [translate="no"]');
  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement || skip(node.parentElement) || !node.data.trim()) return;
      const previous = textSources.get(node);
      const source = previous && node.data === previous.output ? previous.source : node.data;
      const output = translate(source);
      textSources.set(node, {source, output});
      if (node.data !== output) node.data = output;
    } else if (node.nodeType === Node.ELEMENT_NODE && !skip(node)) {
      const saved = attributeSources.get(node) || {};
      for (const name of attributes) if (node.hasAttribute(name)) {
        const current = node.getAttribute(name);
        const source = saved[name] && current === saved[name].output ? saved[name].source : current;
        const output = translate(source);
        saved[name] = {source, output};
        if (current !== output) node.setAttribute(name, output);
      }
      attributeSources.set(node, saved);
      for (const child of node.childNodes) translateNode(child);
    }
  }
  const observer = new MutationObserver(records => {
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'childList') for (const node of record.addedNodes) translateNode(node);
      else translateNode(record.target);
    }
    observe();
  });
  function observe() {
    observer.observe(document.documentElement, {subtree: true, childList: true,
      characterData: true, attributes: true, attributeFilter: attributes});
  }
  function setLanguage(value) {
    if (!languages.includes(value)) return;
    locale = value;
    observer.disconnect();
    document.documentElement.lang = {zh: 'zh-CN', en: 'en', ja: 'ja'}[locale];
    translateNode(document.documentElement);
    document.querySelectorAll('[data-language]').forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.language === locale)));
    try { localStorage.setItem('cama-viewer-language', locale); } catch (_) { /* optional preference */ }
    observe();
    document.dispatchEvent(new Event('viewer-language-changed'));
  }
  document.querySelectorAll('[data-language]').forEach(button =>
    button.addEventListener('click', () => setLanguage(button.dataset.language)));
  window.viewerI18n = {translate, setLanguage, get language() { return locale; }};
  setLanguage(locale);
})();
