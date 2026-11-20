// ============================================================
// PUESTOS DE TRABAJO (catálogo en Empresa) y EQUIPO DE CADA OBRA
//   appState.company.roles = [{ id, name, icon, wage, ss, type }]
//     type: 'oficial'  → trabaja y lleva herramientas de oficial
//           'ayudante' → trabaja (peón, ayudante…)
//           'supervisa'→ cuesta dinero pero NO suma horas de trabajo (encargado a ratos)
//   proj.crew.members = [{ id, roleId, count, wage, ss }]   (wage/ss = null → los de la empresa)
// Los campos antiguos (officials, workers, officialDailyWage…) NO se borran: sirven para volver atrás.
// ============================================================
const ROLE_ICONS = ['👷', '🧑‍🔧', '🦺', '⚡', '🔧', '🚿', '🎨', '🪚', '🧱', '🔨', '🧹', '📐', '🚚'];
const ROLE_TYPES = {
  oficial:   { label: 'Oficial (trabaja y lleva herramientas de oficial)', short: 'Oficial' },
  ayudante:  { label: 'Ayudante / peón (trabaja)', short: 'Ayudante' },
  supervisa: { label: 'Supervisa (cuesta, pero no suma horas de trabajo)', short: 'Supervisa' }
};
// El mínimo de fábrica al que siempre se puede volver
const DEFAULT_ROLES = [
  { id: 'r_oficial', name: 'Oficial', icon: '👷', wage: 90, ss: 580, type: 'oficial' },
  { id: 'r_peon', name: 'Peón', icon: '🧑‍🔧', wage: 65, ss: 460, type: 'ayudante' }
];
const ROLES_BACKUP_KEY = 'presupuestador_antes_de_puestos';
let pendingRolesBackup = null;

function migrateCrewObj(crew, roles) {
  if (!crew || Array.isArray(crew.members)) return false;
  const of = roles.find(r => r.id === 'r_oficial') || roles[0];
  const pe = roles.find(r => r.id === 'r_peon') || roles[1] || roles[0];
  const mk = (role, count, wage, ss) => ({
    id: 'm_' + Math.random().toString(36).slice(2, 9), roleId: role.id, count: Number(count) || 0,
    wage: Number(wage) === Number(role.wage) ? null : (Number(wage) || 0),
    ss: Number(ss) === Number(role.ss) ? null : (Number(ss) || 0)
  });
  crew.members = [
    mk(of, crew.officials, crew.officialDailyWage, crew.officialMonthlySS),
    mk(pe, crew.workers, crew.workerDailyWage, crew.workerMonthlySS)
  ];
  return true;
}

// Se llama al principio de cada renderAll
function ensureCrewRoles() {
  const comp = appState.company;
  const needs = !Array.isArray(comp.roles) || (appState.projects || []).some(p => p.crew && !Array.isArray(p.crew.members));
  if (!needs) return;
  // Red de seguridad: copia exacta de los datos ANTES de convertir (la última versión manda)
  pendingRolesBackup = JSON.stringify(appState);
  try { localStorage.setItem(ROLES_BACKUP_KEY, pendingRolesBackup); } catch (e) {}
  if (!Array.isArray(comp.roles)) {
    // Los puestos de la empresa salen de los sueldos que ya usabas en nuestro primer presupuesto
    const c0 = (appState.projects[0] || {}).crew || {};
    comp.roles = DEFAULT_ROLES.map(r => ({ ...r }));
    if (c0.officialDailyWage !== undefined) { comp.roles[0].wage = Number(c0.officialDailyWage) || 0; comp.roles[0].ss = Number(c0.officialMonthlySS) || 0; }
    if (c0.workerDailyWage !== undefined) { comp.roles[1].wage = Number(c0.workerDailyWage) || 0; comp.roles[1].ss = Number(c0.workerMonthlySS) || 0; }
  }
  appState.projects.forEach(p => migrateCrewObj(p.crew, comp.roles));
  (appState.templates || []).forEach(t => migrateCrewObj(t.crew, comp.roles));
  if (typeof fsWriteExtraFile === 'function') fsWriteExtraFile(`antes_de_puestos_${todayLocalStr()}.json`, pendingRolesBackup);
}

// Resumen del equipo de una obra (lo usa el motor de cálculo)
function crewSummary(proj) {
  if (proj.crew && Array.isArray(proj.crew.team) && typeof teamSummary === 'function') return teamSummary(proj);
  const comp = appState.company;
  const wd = Math.max(1, Number(comp.workDaysPerMonth) || 21);
  const roles = comp.roles || DEFAULT_ROLES;
  const c = proj.crew || {};
  if (!Array.isArray(c.members)) migrateCrewObj(c, roles);
  const members = c.members.map(m => {
    const role = roles.find(r => r.id === m.roleId) || { id: m.roleId, name: 'Puesto borrado', icon: '❔', wage: 0, ss: 0, type: 'ayudante' };
    const wage = m.wage === null || m.wage === undefined ? Number(role.wage) || 0 : Number(m.wage) || 0;
    const ss = m.ss === null || m.ss === undefined ? Number(role.ss) || 0 : Number(m.ss) || 0;
    const count = Math.max(0, Number(m.count) || 0);
    const perPerson = wage + ss / wd;
    return { ...m, role, count, wage, ss, perPerson, daily: count * perPerson, overridden: (m.wage !== null && m.wage !== undefined) || (m.ss !== null && m.ss !== undefined) };
  });
  const sum = f => members.reduce((s, m) => s + f(m), 0);
  return {
    members,
    nOfficial: sum(m => m.role.type === 'oficial' ? m.count : 0),
    nWorking: sum(m => m.role.type !== 'supervisa' ? m.count : 0),
    nTotal: sum(m => m.count),
    laborDaily: sum(m => m.daily)
  };
}

// ---------- Acciones de la pestaña Equipo ----------
function updateMember(memberId, field, value) {
  const m = getCurrentProject().crew.members.find(x => x.id === memberId);
  if (!m) return;
  m[field] = value;
  saveState(); renderAll();
}
function resetMemberWage(memberId) {
  const m = getCurrentProject().crew.members.find(x => x.id === memberId);
  if (!m) return;
  m.wage = null; m.ss = null;
  saveState(); renderAll();
}
function removeMember(memberId) {
  const crew = getCurrentProject().crew;
  const m = crew.members.find(x => x.id === memberId);
  const role = m && (appState.company.roles || []).find(r => r.id === m.roleId);
  if (!confirm(`¿Quitar "${role ? role.name : 'este puesto'}" del equipo de ESTA obra?\n\n(El puesto sigue en nuestra empresa.)`)) return;
  crew.members = crew.members.filter(x => x.id !== memberId);
  saveState(); renderAll();
}
function addMemberToProject() {
  const sel = document.getElementById('addMemberRole');
  if (!sel || !sel.value) return;
  getCurrentProject().crew.members.push({ id: 'm_' + Date.now(), roleId: sel.value, count: 1, wage: null, ss: null });
  saveState(); renderAll();
}

// ---------- Catálogo de puestos (pestaña Empresa) ----------
function updateRole(roleId, field, value) {
  const r = appState.company.roles.find(x => x.id === roleId);
  if (!r) return;
  r[field] = value;
  saveState(); renderAll();
}
function addRole() {
  appState.company.roles.push({ id: 'r_' + Date.now(), name: 'Nuevo puesto', icon: '🔧', wage: 80, ss: 520, type: 'oficial' });
  saveState(); renderAll();
  showToast('🆕 Puesto creado: cambia su nombre, sueldo y tipo');
}
function rolesInUse(roleId) {
  return appState.projects.filter(p => (p.crew.members || []).some(m => m.roleId === roleId && Number(m.count) > 0));
}
function deleteRole(roleId) {
  const r = appState.company.roles.find(x => x.id === roleId);
  if (!r) return;
  const used = rolesInUse(roleId);
  if (used.length) return alert(`No se puede borrar "${r.name}": lo usan estos presupuestos:\n\n${used.map(p => '• ' + p.code + ' ' + p.title).join('\n')}\n\nQuítalo primero de su equipo (pestaña «Equipo y gastos»).`);
  if (!confirm(`¿Borrar el puesto "${r.name}"?`)) return;
  appState.company.roles = appState.company.roles.filter(x => x.id !== roleId);
  appState.projects.forEach(p => { p.crew.members = (p.crew.members || []).filter(m => m.roleId !== roleId); });
  saveState(); renderAll();
}
function resetRolesToDefault() {
  const extra = appState.company.roles.filter(r => !DEFAULT_ROLES.some(d => d.id === r.id));
  const blocked = extra.filter(r => rolesInUse(r.id).length);
  if (blocked.length) return alert(`No se puede volver a los puestos por defecto: estos puestos están en uso:\n\n${blocked.map(r => '• ' + r.name).join('\n')}\n\nQuítalos primero del equipo de esas obras.`);
  if (!confirm('¿Volver a los puestos por defecto?\n\nQuedarán solo "Oficial" (90 €/día, 580 € S.S.) y "Peón" (65 €/día, 460 € S.S.).\nLos sueldos de nuestros presupuestos se recalcularán con estos valores, salvo los que tengan un sueldo propio ✏️.')) return;
  appState.company.roles = DEFAULT_ROLES.map(r => ({ ...r }));
  saveState(); renderAll();
}

function renderRolesManager() {
  const box = document.getElementById('rolesManagerView');
  if (!box) return;
  const roles = appState.company.roles || [];
  box.innerHTML = `
    <div class="table-wrap"><table class="items-table">
      <thead><tr><th>Icono</th><th>Puesto ${helpIcon('puestoNombre')}</th><th>Sueldo/día ${helpIcon('sueldoDia')}</th><th>S.S./mes ${helpIcon('ssMes')}</th><th>Tipo ${helpIcon('tipoPuesto')}</th><th>En uso</th><th></th></tr></thead>
      <tbody>${roles.map(r => {
        const used = rolesInUse(r.id).length;
        return `<tr>
          <td><select class="inline-input icon-select" onchange="updateRole('${r.id}','icon',this.value)">${ROLE_ICONS.map(i => `<option ${i === r.icon ? 'selected' : ''}>${i}</option>`).join('')}</select></td>
          <td><input type="text" class="inline-input" style="font-weight:700;" value="${esc(r.name)}" onchange="updateRole('${r.id}','name',this.value.trim()||'Puesto')"></td>
          <td><input type="number" min="0" step="1" class="inline-input" style="width:6rem;" value="${r.wage}" onchange="updateRole('${r.id}','wage',parseFloat(this.value)||0)"> €</td>
          <td><input type="number" min="0" step="1" class="inline-input" style="width:6rem;" value="${r.ss}" onchange="updateRole('${r.id}','ss',parseFloat(this.value)||0)"> €</td>
          <td><select class="inline-input" onchange="updateRole('${r.id}','type',this.value)">${Object.entries(ROLE_TYPES).map(([k, t]) => `<option value="${k}" ${k === r.type ? 'selected' : ''}>${t.label}</option>`).join('')}</select></td>
          <td>${used ? `${used} obra${used > 1 ? 's' : ''}` : '—'}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteRole('${r.id}')" title="Borrar puesto">🗑</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
}
