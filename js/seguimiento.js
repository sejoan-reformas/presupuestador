// ============================================================
// SEGUIMIENTO DE PRESUPUESTOS: estados y panel "Mis presupuestos"
//   proj.status       = 'borrador' | 'enviado' | 'aceptado' | 'rechazado'
//   proj.statusDates  = { enviado: 'AAAA-MM-DD', aceptado: ..., ... }
// ============================================================
const PROJ_STATUS = {
  borrador:  { icon: '📝', label: 'Borrador',  cls: 'st-borrador' },
  enviado:   { icon: '📨', label: 'Enviado',   cls: 'st-enviado' },
  aceptado:  { icon: '✅', label: 'Aceptado',  cls: 'st-aceptado' },
  rechazado: { icon: '❌', label: 'Rechazado', cls: 'st-rechazado' }
};
const FOLLOWUP_DAYS = 7; // días sin respuesta para avisar de llamar al cliente

function getProjStatus(p) { return PROJ_STATUS[p.status] ? p.status : 'borrador'; }
function statusBadge(st) {
  const s = PROJ_STATUS[st] || PROJ_STATUS.borrador;
  return `<span class="st-badge ${s.cls}">${s.icon} ${s.label}</span>`;
}
function fmtDateEs(d) { return d ? new Date(d + 'T12:00:00').toLocaleDateString('es-ES') : ''; }
function daysSince(d) {
  if (!d) return null;
  const a = new Date(d + 'T12:00:00'), b = new Date(todayLocalStr() + 'T12:00:00');
  return Math.round((b - a) / 86400000);
}

function setProjectStatus(status, projId) {
  const p = projId ? appState.projects.find(x => x.id === projId) : getCurrentProject();
  if (!p || !PROJ_STATUS[status]) return;
  p.status = status;
  if (!p.statusDates) p.statusDates = {};
  p.statusDates[status] = todayLocalStr();
  saveState(); renderAll();
  if (document.getElementById('projectsOverviewModal').classList.contains('open')) renderProjectsOverview();
}

// Al facturar, si el presupuesto no estaba aceptado, se marca solo
function markAcceptedIfNeeded(p) {
  if (getProjStatus(p) === 'aceptado') return;
  p.status = 'aceptado';
  if (!p.statusDates) p.statusDates = {};
  p.statusDates.aceptado = todayLocalStr();
}

// Imprimir presupuesto y ofrecer marcarlo como enviado
function printBudget() {
  window.print();
  const p = getCurrentProject();
  if (getProjStatus(p) === 'borrador' && confirm('¿Hemos enviado este presupuesto al cliente?\n\nSi pulsamos Aceptar se marca como 📨 ENVIADO con la fecha de hoy.')) {
    setProjectStatus('enviado');
  }
}

function renderStatusField(proj) {
  const sel = document.getElementById('projStatus');
  if (!sel) return;
  const st = getProjStatus(proj);
  sel.value = st;
  const d = proj.statusDates && proj.statusDates[st];
  document.getElementById('projStatusDate').textContent = d ? `desde el ${fmtDateEs(d)}` : '';
}

// ---------------- PANEL "MIS PRESUPUESTOS" ----------------
let overviewFilter = 'todos';
function openProjectsOverview() { overviewFilter = 'todos'; renderProjectsOverview(); document.getElementById('projectsOverviewModal').classList.add('open'); }
function closeProjectsOverview() { document.getElementById('projectsOverviewModal').classList.remove('open'); }
function setOverviewFilter(f) { overviewFilter = f; renderProjectsOverview(); }
function openProjectFromOverview(id) { closeProjectsOverview(); selectProject(id); switchTab('checklist'); }

function renderProjectsOverview() {
  const rows = appState.projects.map(p => {
    const e = calculateProjectEconomics(p);
    const st = getProjStatus(p);
    const billed = (p.invoices || []).reduce((s, inv) => s + (Number(inv.baseAmount) || 0), 0);
    const sentDate = p.statusDates && p.statusDates.enviado;
    const ds = st === 'enviado' ? daysSince(sentDate) : null;
    return { p, st, base: e.baseClientBase, billed: r2(billed), pending: st === 'aceptado' ? r2(Math.max(0, e.baseClientBase - billed)) : 0, ds };
  });

  const sum = st => rows.filter(r => r.st === st);
  const tot = arr => arr.reduce((s, r) => s + r.base, 0);
  const decided = sum('aceptado').length + sum('rechazado').length;
  const ratio = decided ? Math.round(sum('aceptado').length / decided * 100) : null;
  const pendingAll = rows.reduce((s, r) => s + r.pending, 0);
  const toCall = rows.filter(r => r.ds !== null && r.ds >= FOLLOWUP_DAYS);

  const kpi = (st) => `
    <button class="ov-kpi ${overviewFilter === st ? 'ov-kpi-on' : ''}" onclick="setOverviewFilter('${st}')">
      <div>${statusBadge(st)}</div>
      <div class="ov-kpi-n">${sum(st).length}</div>
      <div class="ov-kpi-sub">${fmt(tot(sum(st)))} sin IVA</div>
    </button>`;

  const shown = rows.filter(r => overviewFilter === 'todos' || r.st === overviewFilter)
    .sort((a, b) => String(b.p.date || '').localeCompare(String(a.p.date || '')));

  document.getElementById('projectsOverviewBody').innerHTML = `
    <div class="ov-kpis">
      <button class="ov-kpi ${overviewFilter === 'todos' ? 'ov-kpi-on' : ''}" onclick="setOverviewFilter('todos')">
        <div><strong>📋 Todos</strong></div><div class="ov-kpi-n">${rows.length}</div><div class="ov-kpi-sub">${fmt(tot(rows))} sin IVA</div>
      </button>
      ${kpi('borrador')}${kpi('enviado')}${kpi('aceptado')}${kpi('rechazado')}
    </div>
    <div class="ov-summary">
      <div>🎯 <strong>Tasa de cierre:</strong> ${ratio === null ? 'aún sin datos (ningún presupuesto aceptado o rechazado)' : `${ratio}% (${sum('aceptado').length} aceptados de ${decided} con respuesta)`}</div>
      <div>💶 <strong>Aceptado pendiente de facturar:</strong> ${fmt(pendingAll)} sin IVA</div>
      ${toCall.length ? `<div class="ov-call">📞 <strong>Llamar al cliente:</strong> ${toCall.map(r => `${esc(r.p.code)} (${r.ds} días sin respuesta)`).join(' · ')}</div>` : ''}
    </div>
    <div class="table-wrap">
      <table class="items-table">
        <thead><tr><th>Nº</th><th>Cliente / Obra</th><th>Fecha</th><th>Estado</th><th style="text-align:right;">Presupuesto (sin IVA)</th><th style="text-align:right;">Facturado</th><th style="text-align:right;">Pendiente</th><th></th></tr></thead>
        <tbody>
          ${shown.length ? shown.map(r => `
            <tr class="${r.p.id === appState.currentProjectId ? 'ov-current' : ''}">
              <td style="white-space:nowrap;"><strong>${esc(r.p.code)}</strong></td>
              <td><strong>${esc(r.p.title)}</strong><div style="font-size:0.8em; color:var(--text-muted);">${esc(r.p.client.projectAddress || r.p.client.name || '')}</div></td>
              <td>${fmtDateEs(r.p.date)}</td>
              <td>
                <select class="inline-input" style="width:auto;" onchange="setProjectStatus(this.value, '${r.p.id}')">
                  ${Object.entries(PROJ_STATUS).map(([k, s]) => `<option value="${k}" ${k === r.st ? 'selected' : ''}>${s.icon} ${s.label}</option>`).join('')}
                </select>
                ${r.ds !== null ? `<div style="font-size:0.78em; ${r.ds >= FOLLOWUP_DAYS ? 'font-weight:800;' : 'color:var(--text-muted);'}">${r.ds >= FOLLOWUP_DAYS ? '📞 ' : ''}enviado hace ${r.ds} días</div>` : ''}
              </td>
              <td style="text-align:right; font-weight:700;">${fmt(r.base)}</td>
              <td style="text-align:right;">${fmt(r.billed)}</td>
              <td style="text-align:right; white-space:nowrap;">${r.st === 'aceptado' ? `<strong>${fmt(r.pending)}</strong>` : '—'}</td>
              <td><button class="btn btn-sm btn-primary" onclick="openProjectFromOverview('${r.p.id}')">Abrir</button></td>
            </tr>`).join('') : `<tr><td colspan="8" style="color:var(--text-muted);">No hay presupuestos en este estado.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}
