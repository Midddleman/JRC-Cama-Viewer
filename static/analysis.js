/* Basin selection and threshold changes share one population-analysis view. */
let analysisRequest = 0;
let analysisComparison = 'direct';
let analysisData = null;
let analysisBasin = '';
function renderAnalysisCharts() {
  const container = $('analysis-charts');
  container.replaceChildren();
  if (!analysisData) return;
  const normalization = analysisBasin ? 'basin' : 'study';
  for (const chart of analysisData.charts) {
    const visible = analysisComparison === 'direct'
      ? chart.normalization == null : chart.normalization === normalization;
    if (visible) container.appendChild(proportionChart(chart));
  }
}
function selectAnalysisComparison(tab) {
  analysisComparison = tab.dataset.comparison;
  for (const button of document.querySelectorAll('[data-comparison]')) {
    const active = button === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  }
  $('analysis-charts').setAttribute('aria-labelledby', tab.id);
  renderAnalysisCharts();
}
async function loadFlowAnalysis() {
  const sequence = ++analysisRequest;
  const status = $('analysis-status');
  const container = $('analysis-charts');
  container.replaceChildren();
  analysisData = null;
  status.textContent = '正在计算…';
  const params = new URLSearchParams({
    absolute: $('absolute-thresholds').value,
    normalized: $('normalized-thresholds').value,
    basin: $('basin-select').value,
  });
  try {
    const response = await fetch(`/api/flow-analysis?${params}`);
    if (!response.ok) throw new Error(response.status === 400
      ? '每类请输入1–8个非负有限数字，用英文逗号分隔。'
      : `分析读取失败（${response.status}）`);
    const data = await response.json();
    if (sequence !== analysisRequest) return;
    analysisData = data;
    analysisBasin = params.get('basin');
    const scope = $('basin-select').value
      ? $('basin-select').selectedOptions[0].textContent : '全部研究点（包括未分配流域的点）';
    const reference = analysisBasin
      ? `流域平均 ${format(data.basin_mean_cms, 3)} m³/s`
      : `全部研究点平均 ${format(data.national_mean_cms, 3)} m³/s`;
    const summary = document.createElement('ul');
    summary.className = 'analysis-notes';
    for (const text of [scope, `${format(data.catchments, 0)} 个完整流量点`,
      `${format(data.unresolved, 0)} 个未知分类`, reference,
      `全范围缺失/不完整流量排除 ${data.incomplete_national} 点`]) {
      const item = document.createElement('li');
      item.textContent = text;
      summary.appendChild(item);
    }
    status.replaceChildren(summary);
    renderAnalysisCharts();
  } catch (error) {
    if (sequence === analysisRequest) status.textContent = error.message;
  }
}
function proportionChart(chart) {
  const card = document.createElement('article');
  card.className = 'proportion-card';
  const heading = document.createElement('h3');
  heading.textContent = chart.title;
  card.appendChild(heading);
  const svg = svgElement('svg', {viewBox: '0 0 600 265', role: 'img', 'aria-label': chart.title});
  const left = 48, top = 20, height = 170, width = 535;
  const y = (p) => top + height * (1 - p / 100);
  for (const p of [0, 25, 50, 75, 100]) {
    svg.append(svgElement('line', {x1: left, x2: left + width, y1: y(p), y2: y(p), stroke: '#dce5e1'}),
      svgElement('text', {x: left - 6, y: y(p) + 4, 'text-anchor': 'end', class: 'axis-label'}, `${p}%`));
  }
  const step = width / chart.bins.length;
  chart.bins.forEach((bin, i) => {
    const x = left + step * (i + .5);
    const title = `${bin.label}: ${bin.percent == null ? '无已知分类' : bin.percent.toFixed(1) + '%'}; 常年 ${bin.perennial}; 非常年 ${bin.nonperennial}; 未知 ${bin.unresolved}; 总计 ${bin.total}`;
    const group = svgElement('g', {tabindex: 0, 'aria-label': title});
    group.appendChild(svgElement('title', {}, title));
    if (bin.percent != null) {
      group.appendChild(svgElement('rect', {x: x-step*.34, y: y(bin.percent), width: step*.68,
        height: height*bin.percent/100, fill: '#118069'}));
      group.appendChild(svgElement('line', {x1: x, x2: x, y1: y(bin.low), y2: y(bin.high), stroke: '#234f45'}));
      for (const bound of [bin.low, bin.high]) group.appendChild(svgElement('line',
        {x1: x-4, x2: x+4, y1: y(bound), y2: y(bound), stroke: '#234f45'}));
      group.appendChild(svgElement('text', {x, y: Math.max(12, y(bin.percent)-5), 'text-anchor': 'middle', class: 'axis-label'}, `${bin.percent.toFixed(0)}%`));
    } else {
      group.appendChild(svgElement('text', {x, y: y(0)-8, 'text-anchor': 'middle', class: 'axis-label'}, '—'));
    }
    group.appendChild(svgElement('text', {x, y: 208, 'text-anchor': 'middle', class: 'axis-label'}, bin.label));
    group.appendChild(svgElement('text', {x, y: 225, 'text-anchor': 'middle', class: 'axis-label'}, `n=${bin.known}`));
    svg.appendChild(group);
  });
  svg.appendChild(svgElement('text', {x: 315, y: 252, 'text-anchor': 'middle', class: 'axis-label'},
    chart.kind === 'months' ? 'Months with Q > threshold (2019)' : 'Annual mean Q (m³/s), fixed bins'));
  card.appendChild(svg);
  const note = document.createElement('p');
  note.className = 'section-note';
  note.textContent = `n = 已知分类点数；悬停柱子查看计数。标准化/流域缺失排除 ${chart.excluded} 点。` +
    (chart.reference_mean_cms == null ? '' : ` 参考均值 ${format(chart.reference_mean_cms, 3)} m³/s。`);
  card.appendChild(note);
  const details = document.createElement('details');
  const summary = document.createElement('summary'); summary.textContent = '查看分组数值';
  details.appendChild(summary);
  const wrapper = document.createElement('div'); wrapper.className = 'table-wrap';
  const table = document.createElement('table');
  table.innerHTML = '<thead><tr><th>组</th><th>常年%</th><th>常年</th><th>非常年</th><th>未知</th></tr></thead>';
  const body = document.createElement('tbody');
  chart.bins.forEach(bin => {
    const row = document.createElement('tr');
    for (const value of [bin.label, bin.percent == null ? '—' : bin.percent.toFixed(2), bin.perennial, bin.nonperennial, bin.unresolved]) {
      const cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell);
    }
    body.appendChild(row);
  });
  table.appendChild(body); wrapper.appendChild(table); details.appendChild(wrapper); card.appendChild(details);
  return card;
}
$('analysis-controls').addEventListener('submit', event => { event.preventDefault(); loadFlowAnalysis(); });
document.addEventListener('basin-focus-changed', loadFlowAnalysis);
const comparisonTabs = [...document.querySelectorAll('[data-comparison]')];
comparisonTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectAnalysisComparison(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') next = comparisonTabs[1-index];
    if (event.key === 'Home') next = comparisonTabs[0];
    if (event.key === 'End') next = comparisonTabs[1];
    if (!next) return;
    event.preventDefault();
    selectAnalysisComparison(next);
    next.focus();
  });
});
loadFlowAnalysis();
