/* Apply all filter conditions together; leave the loaded map population intact. */
let filterFields = [];
let filterSequence = 0;
let filterResult = null;
let filterPending = false;
let filterReady = false;
let filterRevision = 0;
const filterText = text => window.viewerI18n.translate(text);

function updateFilterResultText() {
  if (!filterResult) return;
  const count = `${number.format(filterResult.count)} / ${number.format(state.links.length)}`;
  $("filter-map-count").textContent = `${filterText("Map points")}: ${count}`;
  $("filter-status").textContent = `${filterText("Matching points")}: ${count}${filterPending ? ` · ${filterText("Changes not applied")}` : ""}`;
  $("map-count").textContent = `${filterText("Perennial")}: ${number.format(filterResult.perennial)} | ${filterText("Non-perennial")}: ${number.format(filterResult.nonperennial)} | ${filterText("Unresolved")}: ${number.format(filterResult.unresolved)}`;
}

function markFilterPending() {
  ++filterRevision;
  filterPending = true;
  updateFilterResultText();
}

function addFilterRule() {
  if (!filterFields.length) return;
  if ($("filter-rules").children.length >= 32) return;
  const row = document.createElement("div");
  row.className = "filter-rule";
  const field = document.createElement("select");
  field.className = "filter-field";
  field.setAttribute("aria-label", "Filter field");
  for (const definition of filterFields) {
    field.add(new Option(definition.label, definition.key));
  }
  const controls = document.createElement("div");
  controls.className = "filter-rule-controls";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Remove condition");
  remove.title = "Remove condition";
  remove.addEventListener("click", () => { row.remove(); markFilterPending(); });
  const configure = () => {
    controls.replaceChildren();
    const definition = filterFields.find(item => item.key === field.value);
    const operator = document.createElement("select");
    operator.className = "filter-operator";
    operator.setAttribute("aria-label", "Comparison");
    let value;
    if (definition.kind === "number") {
      for (const [key, label] of [["gt", ">"], ["eq", "="], ["lt", "<"]]) operator.add(new Option(label, key));
      value = document.createElement("input");
      value.type = "number";
      value.step = "any";
      value.placeholder = "Value";
      value.required = true;
    } else {
      operator.add(new Option("=", "eq"));
      value = document.createElement("select");
      for (const choice of definition.choices) value.add(new Option(choice.label, choice.value));
    }
    value.className = "filter-value";
    value.setAttribute("aria-label", "Filter value");
    const unit = document.createElement("span");
    unit.className = "filter-unit";
    unit.textContent = definition.unit;
    unit.setAttribute("translate", "no");
    controls.append(operator, value, unit);
    markFilterPending();
  };
  field.addEventListener("change", configure);
  row.addEventListener("input", markFilterPending);
  row.addEventListener("change", markFilterPending);
  row.append(field, controls, remove);
  $("filter-rules").appendChild(row);
  configure();
}

function fitFilterResults() {
  const links = state.links.filter(isLinkVisible);
  if (!links.length) return;
  let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
  for (const link of links) {
    for (const [lon, lat] of [[link.longitude, link.latitude], [link.downstream_longitude, link.downstream_latitude]]) {
      if (lon == null || lat == null) continue;
      west = Math.min(west, lon); east = Math.max(east, lon);
      south = Math.min(south, lat); north = Math.max(north, lat);
    }
  }
  state.centerLon = (west + east) / 2;
  state.centerLat = (south + north) / 2;
  state.scale = Math.min(state.width / Math.max(east - west, .2), state.height / Math.max(north - south, .2), 2000) * .88;
  queueRender();
}

function showFilterResult(result, basin, active) {
  state.visibleIds = active ? new Set(result.ids) : null;
  state.selectedBasinId = basin && basin !== "unassigned" ? Number(basin) : null;
  state.streamFocus = null;
  $("map-tooltip").hidden = true;
  $("catchment-search").setCustomValidity("");
  if (state.selectedId != null && !state.visibleIds?.has(state.selectedId) && active) {
    state.selectedId = null;
    state.detail = null;
    $("catchment-id").textContent = "-";
    for (const id of ["link-status", "link-facts", "channel-facts", "stream-focus-note"]) $(id).replaceChildren();
    $("stream-focus-button").hidden = true;
    $("download-link").hidden = true;
    $("catchment-search").value = "";
    renderChart();
  } else if (state.detail) {
    updateStreamFocusControl(state.detail.link);
  }
  filterResult = result;
  filterPending = false;
  updateFilterResultText();
  renderBasinStatistics(result.count, result.perennial, result.nonperennial, result.unresolved);
  $("fit-filter-results").disabled = result.count === 0;
  document.dispatchEvent(new Event("basin-focus-changed"));
  queueRender();
}

$("filter-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!filterReady || !$("filter-form").reportValidity()) return;
  const rules = [...$("filter-rules").children].map(row => {
    const field = row.querySelector(".filter-field").value;
    const input = row.querySelector(".filter-value");
    return {field, operator: row.querySelector(".filter-operator").value,
            value: input.tagName === "INPUT" ? input.valueAsNumber : input.value};
  });
  const basin = $("basin-select").value;
  const revision = filterRevision;
  const sequence = ++filterSequence;
  $("apply-filters").disabled = true;
  $("filter-status").textContent = filterText("Applying filters...");
  try {
    const response = await fetch("/api/filter", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({basin, rules})});
    if (!response.ok) throw new Error("Could not apply filters. Check the values.");
    const result = await response.json();
    if (sequence !== filterSequence) return;
    showFilterResult(result, basin, Boolean(basin || rules.length));
    filterPending = revision !== filterRevision;
    updateFilterResultText();
  } catch (error) {
    if (sequence === filterSequence) $("filter-status").textContent = filterText(error.message);
  } finally {
    if (sequence === filterSequence) $("apply-filters").disabled = false;
  }
});
$("add-filter-rule").addEventListener("click", addFilterRule);
$("basin-select").addEventListener("change", markFilterPending);
$("fit-filter-results").addEventListener("click", fitFilterResults);
$("reset-filters").addEventListener("click", () => {
  ++filterSequence;
  $("apply-filters").disabled = !filterReady;
  $("basin-select").value = "";
  $("filter-rules").replaceChildren();
  showFilterResult({count: state.links.length,
    perennial: state.links.filter(link => link.jrc_status === 2).length,
    nonperennial: state.links.filter(link => link.jrc_status === 1).length,
    unresolved: state.links.filter(link => ![1, 2].includes(link.jrc_status)).length}, "", false);
});

async function initializeFilters() {
  try {
    const response = await fetch("/api/filter-fields");
    if (!response.ok) throw new Error("Could not load filter fields");
    filterFields = (await response.json()).fields;
    const ready = () => {
      filterReady = true;
      $("apply-filters").disabled = false;
      $("reset-filters").disabled = false;
      $("reset-filters").click();
    };
    if (state.links.length) ready(); else document.addEventListener("viewer-ready", ready, {once: true});
  } catch (error) {
    $("filter-status").textContent = filterText(error.message);
  }
}
document.addEventListener("viewer-language-changed", updateFilterResultText);
initializeFilters();
