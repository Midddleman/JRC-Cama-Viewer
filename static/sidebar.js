const sidebarTabs = [...document.querySelectorAll('.sidebar-tabs [role="tab"]')];
// Keep the second sticky row immediately below the first in every language.
const sidebarTabRow = document.querySelector('.sidebar-tabs');
const updateSidebarTabHeight = () => {
  document.querySelector('.detail-panel').style.setProperty(
    '--sidebar-tabs-height', `${sidebarTabRow.getBoundingClientRect().height}px`);
};
new ResizeObserver(updateSidebarTabHeight).observe(sidebarTabRow);
updateSidebarTabHeight();
function activateSidebarTab(activeTab) {
  for (const tab of sidebarTabs) {
    const active = tab === activeTab;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  }
  if (activeTab.id === 'data-tab') renderChart();
}
sidebarTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateSidebarTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = sidebarTabs[1 - index];
    if (event.key === 'Home') next = sidebarTabs[0];
    if (event.key === 'End') next = sidebarTabs[sidebarTabs.length - 1];
    if (!next) return;
    event.preventDefault();
    activateSidebarTab(next);
    next.focus();
  });
});
