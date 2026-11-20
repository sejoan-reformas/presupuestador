// ============================================================
// PERSONAL, CALENDARIO DE DÍAS Y PAGOS (pestaña «Días y pagos»)
//   appState.company.people = [{ id, name, roleId, wage, active }]     (sueldo por día de cada persona)
//   proj.workLog        = { 'AAAA-MM-DD': [{ personId, roleId, frac }] }  (frac 1 = jornada, 0.5 = media)
//   proj.staffPayments  = [{ id, date, personId, amount, kind:'sueldo'|'otro', note }]
//   proj.staffAgreements= { personId: { amount, note } }   (trato especial: cobra distinto de lo que le toca)
// ============================================================
let staffDayOpen = null;

function ensureStaffData(proj) {
  if (!Array.isArray(appState.company.people)) appState.company.people = [];
  if (!proj.workLog || typeof proj.workLog !== 'object') proj.workLog = {};
  if (!Array.isArray(proj.staffPayments)) proj.staffPayments = [];
  if (!proj.staffAgreements || typeof proj.staffAgreements !== 'object') proj.staffAgreements = {};
}
const staffPeople = () => appState.company.people || [];
const staffPerson = id => staffPeople().find(p => p.id === id);
const staffRole = id => (appState.company.roles || []).find(r => r.id === id);
function dateObj(s) { return new Date(s + 'T12:00:00'); }

// ---------- Cuentas por persona ----------
function staffAccounts(proj) {
  ensureStaffData(proj);
  const acc = {};
  const get = id => acc[id] || (acc[id] = { personId: id, days: 0, earned: 0, paid: 0, other: 0 });
  Object.values(proj.workLog).forEach(list => list.forEach(e => {
    const p = staffPerson(e.personId); const a = get(e.personId);
    const f = Number(e.frac) || 0;
    a.days += f; a.earned += f * (p ? Number(p.wage) || 0 : 0);
  }));
  proj.staffPayments.forEach(pay => {
    const a = get(pay.personId);
    if (pay.kind === 'otro') a.other += Number(pay.amount) || 0; else a.paid += Number(pay.amount) || 0;
  });
  Object.keys(proj.staffAgreements).forEach(id => get(id));
  staffPeople().filter(p => p.active !== false).forEach(p => get(p.id));
  return Object.values(acc).map(a => {
    const ag = proj.staffAgreements[a.personId];
    const agreed = ag && ag.amount !== null && ag.amount !== undefined && ag.amount !== '' ? Number(ag.amount) : a.earned;
    return { ...a, earned: r2(a.earned), paid: r2(a.paid), other: r2(a.other), agreed: r2(agreed), agreement: ag || null, pending: r2(agreed - a.paid), person: staffPerson(a.personId) };
  }).filter(a => a.person || a.days || a.paid);
}

// Nombre corto para el calendario; si dos se llaman igual, va el nombre completo
function staffShortName(p) {
  const first = p.name.split(' ')[0];
  return staffPeople().filter(x => x.name.split(' ')[0] === first).length > 1 ? p.name : first;
}
// ---------- Calendario ----------
function staffRange(proj, econ) {
  ensureStaffData(proj);
  const logged = Object.keys(proj.workLog).filter(k => (proj.workLog[k] || []).length).sort();
  let start = proj.startDate || logged[0] || todayLocalStr();
  if (logged[0] && logged[0] < start) start = logged[0];
  // Fin previsto: días laborables del roadmap desde el inicio
  let end = start;
  try {
    const span = buildRoadmapData(proj, econ, false).totalSpanDays || 0;
    const hol = holidaySet(); const d = dateObj(proj.startDate || start); let added = 0;
    while (added < Math.ceil(span)) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w === 0 || w === 6 || hol.has(todayLocalStr(d))) continue; added++; }
    end = todayLocalStr(d);
  } catch (e) {}
  if (logged.length && logged[logged.length - 1] > end) end = logged[logged.length - 1];
  const today = todayLocalStr();
  if (today > start && today > end && logged.length && today <= todayLocalStr(new Date(dateObj(end).getTime() + 30 * 86400000))) end = today;
  if (end < start) end = start;
  // Límite de seguridad: 1 año
  const max = todayLocalStr(new Date(dateObj(start).getTime() + 366 * 86400000));
  if (end > max) end = max;
  return { start, end };
}

function renderStaffTab(proj, econ) {
  const box = document.getElementById('staffView');
  if (!box) return;
  ensureStaffData(proj);
  const people = staffPeople().filter(p => p.active !== false);
  if (!staffPeople().length) {
    box.innerHTML = `<div class="card eq-card"><div class="eq-head"><span class="eq-icon">👤</span><div><div class="eq-name">Primero, apunta a nuestra gente</div><div class="eq-sub">Nombre, puesto habitual y sueldo por día</div></div></div>
      <p>En <strong>⚙️ Datos de cálculo</strong>, sección <strong>"1 · Personas y sueldos"</strong>, añade a cada uno (por ejemplo: Sergio, oficial, 130 €/día). Luego vuelve aquí y marca los días.</p>
      <button class="btn btn-primary" onclick="switchTab('calcdata')">👤 Ir a Datos de cálculo</button></div>`;
    return;
  }
  const { start, end } = staffRange(proj, econ);
  const hol = holidaySet();
  const holName = d => ((appState.company.holidays || []).find(h => h.date === d) || {}).name || 'Festivo';
  const today = todayLocalStr();
  // Meses
  let html = '';
  const s = dateObj(start), e = dateObj(end);
  const cur = new Date(s.getFullYear(), s.getMonth(), 1, 12);
  let activeDays = 0, totalJornadas = 0;
  while (cur <= e) {
    const y = cur.getFullYear(), m = cur.getMonth();
    const monthName = cur.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const first = new Date(y, m, 1, 12); const lead = (first.getDay() + 6) % 7;
    const daysIn = new Date(y, m + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += `<div class="cal-cell cal-void"></div>`;
    for (let d = 1; d <= daysIn; d++) {
      const ds = todayLocalStr(new Date(y, m, d, 12));
      const inRange = ds >= start && ds <= end;
      const list = proj.workLog[ds] || [];
      const n = list.length, jorn = list.reduce((t, x) => t + (Number(x.frac) || 0), 0);
      if (n) { activeDays++; totalJornadas += jorn; }
      const w = new Date(y, m, d, 12).getDay();
      const weekend = w === 0 || w === 6, isHol = hol.has(ds);
      const cls = ['cal-cell', inRange ? 'cal-in' : 'cal-out', n ? 'cal-active' : '', weekend ? 'cal-weekend' : '', isHol ? 'cal-hol' : '', ds === today ? 'cal-today' : ''].join(' ');
      const tag = isHol ? `<span class="cal-tag">🎉 ${esc(holName(ds))}</span>` : (weekend ? `<span class="cal-tag">${w === 6 ? 'Sáb' : 'Dom'}</span>` : '');
      const names = list.map(x => { const p = staffPerson(x.personId); return p ? staffShortName(p) + (Number(x.frac) < 1 ? ' ½' : '') : '?'; }).join(', ');
      cells += `<button type="button" class="${cls}" onclick="openStaffDay('${ds}')" title="${esc(names || 'Nadie apuntado')}">
        <span class="cal-num">${d}${ds === today ? ' <b>HOY</b>' : ''}</span>${tag}
        ${n ? `<span class="cal-people">👥 ${n}${jorn !== n ? ` <small>(${fmtNum(jorn, 1)} jorn.)</small>` : ''}</span><span class="cal-names">${esc(names)}</span>` : (inRange && !weekend && !isHol && ds <= today ? '<span class="cal-empty">— sin apuntar</span>' : '')}
      </button>`;
    }
    html += `<div class="cal-month"><div class="cal-month-title">${monthName}</div>
      <div class="cal-grid">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<div class="cal-dow">${x}</div>`).join('')}${cells}</div></div>`;
    cur.setMonth(cur.getMonth() + 1);
  }
  const accs = staffAccounts(proj);
  const tot = accs.reduce((t, a) => ({ earned: t.earned + a.earned, agreed: t.agreed + a.agreed, paid: t.paid + a.paid, other: t.other + a.other }), { earned: 0, agreed: 0, paid: 0, other: 0 });
  const ceded = accs.filter(a => a.agreement && r2(a.earned - a.agreed) !== 0);
  const budgetLabor = r2(econ.baseLaborCost || 0);

  box.innerHTML = `
    <div class="card eq-card">
      <div class="card-header"><h2 class="card-title">📅 Calendario de la obra <i class="info-icon" data-help="calendarioObra">i</i></h2>
        <div class="eq-sub">Del <strong>${dateObj(start).toLocaleDateString('es-ES')}</strong> al <strong>${dateObj(end).toLocaleDateString('es-ES')}</strong> (fin previsto del Roadmap) · <strong>${activeDays}</strong> días con gente · <strong>${fmtNum(totalJornadas, 1)}</strong> jornadas</div></div>
      <p class="modal-intro">Pulsa un día y marca <strong>quién fue</strong>, si fue <strong>jornada completa o media</strong> y <strong>de qué trabajó</strong>. Los sábados, domingos y festivos también se pueden marcar.</p>
      ${html}
    </div>

    <div class="eq-section-title">👤 Cuentas de cada persona en esta obra <i class="info-icon" data-help="cuentasPersona">i</i></div>
    <div class="eq-grid">${accs.map(a => staffCardHtml(a)).join('')}</div>

    <div class="card eq-card" style="margin-top:1.2rem;">
      <div class="card-header"><h2 class="card-title">💶 Pagos apuntados <i class="info-icon" data-help="pagosLista">i</i></h2>
        <button class="btn btn-primary" onclick="openStaffPayment()"><b class="plus">+</b> Apuntar un pago</button></div>
      ${proj.staffPayments.length ? `<div class="table-wrap"><table class="items-table">
        <thead><tr><th>Fecha</th><th>Persona</th><th>Tipo</th><th style="text-align:right;">Importe</th><th>Nota</th><th></th></tr></thead>
        <tbody>${proj.staffPayments.slice().sort((x, y) => y.date.localeCompare(x.date)).map(p => {
          const per = staffPerson(p.personId);
          return `<tr><td>${dateObj(p.date).toLocaleDateString('es-ES')}</td><td><strong>${esc(per ? per.name : '?')}</strong></td>
            <td>${p.kind === 'otro' ? '📎 Otro (S.S., gastos…)' : '💶 Sueldo / anticipo'}</td><td style="text-align:right; font-weight:800;">${fmt(p.amount)}</td>
            <td>${esc(p.note || '')}</td>
            <td style="white-space:nowrap;"><button class="btn btn-sm" onclick="printStaffReceipt('${p.id}')" title="Imprimir justificante para firmar">🧾 Recibí</button>
            <button class="btn btn-sm btn-danger" onclick="deleteStaffPayment('${p.id}')" title="Borrar este pago">🗑</button></td></tr>`;
        }).join('')}</tbody></table></div>` : '<p class="eq-sub">Todavía no hay pagos apuntados.</p>'}
    </div>

    <div class="card eq-card eq-summary">
      <div class="eq-head"><span class="eq-icon">📊</span><div><div class="eq-name">Presupuestado frente a real <i class="info-icon" data-help="staffResumen">i</i></div><div class="eq-sub">Sueldos de esta obra</div></div></div>
      <table class="pdf-table">
        <tbody>
          <tr><td>💼 Presupuestado en sueldos + S.S. (mano de obra propia, base)</td><td style="text-align:right;">${fmt(budgetLabor)}</td></tr>
          <tr><td>🧮 Le corresponde a la gente por los días apuntados</td><td style="text-align:right;">${fmt(tot.earned)}</td></tr>
          <tr><td>🤝 Acordado (con tratos especiales)</td><td style="text-align:right;">${fmt(tot.agreed)}</td></tr>
          <tr><td>✅ Ya cobrado</td><td style="text-align:right;">${fmt(tot.paid)}</td></tr>
          <tr class="row-summary-neutral"><td>⏳ Queda por pagar a la gente</td><td style="text-align:right;">${fmt(tot.agreed - tot.paid)}</td></tr>
          <tr><td>📎 Otros pagos (S.S., gastos…) — aparte del sueldo</td><td style="text-align:right;">${fmt(tot.other)}</td></tr>
          <tr class="${budgetLabor - tot.agreed >= 0 ? 'row-summary-green' : 'row-summary-red'}"><td>📈 ${budgetLabor - tot.agreed >= 0 ? 'Queda para la sociedad' : 'Nos pasamos de lo presupuestado'} (presupuestado − acordado)</td><td style="text-align:right;">${fmt(budgetLabor - tot.agreed)}</td></tr>
        </tbody>
      </table>
      ${ceded.length ? `<div class="man-tip" style="margin-top:0.8rem;">🤝 <strong>Tratos especiales en esta obra:</strong><br>${ceded.map(a => `• <strong>${esc(a.person ? a.person.name : '?')}</strong>: le correspondían ${fmt(a.earned)}, se acordó ${fmt(a.agreed)} (${a.earned - a.agreed >= 0 ? 'cede' : 'recibe de más'} ${fmt(Math.abs(a.earned - a.agreed))}). <em>${esc(a.agreement.note || '')}</em>`).join('<br>')}</div>` : ''}
      <p class="eq-sub" style="margin-top:0.6rem;">Ojo: lo "presupuestado" es para toda la obra; mientras la obra no termine es normal que lo real vaya por debajo.</p>
    </div>`;
}

function staffCardHtml(a) {
  const p = a.person || { name: '¿?', wage: 0, roleId: '' };
  const role = staffRole(p.roleId);
  const ag = a.agreement;
  const pend = a.pending;
  return `<div class="card eq-card">
    <div class="eq-head"><span class="eq-icon">${role ? role.icon : '👤'}</span>
      <div><div class="eq-name">${esc(p.name)}</div><div class="eq-sub">${role ? esc(role.name) : 'Sin puesto'} · ${fmt(p.wage)}/día</div></div></div>
    <div class="staff-lines">
      <div><span>📅 Días trabajados</span><strong>${fmtNum(a.days, 1)}</strong></div>
      <div><span>🧮 Le corresponde</span><strong>${fmt(a.earned)}</strong></div>
      <div><span>🤝 Acordado ${ag ? '<b class="eq-own">✏️ trato especial</b>' : ''}</span><strong>${fmt(a.agreed)}</strong></div>
      <div><span>✅ Cobrado</span><strong>${fmt(a.paid)}</strong></div>
      ${a.other ? `<div><span>📎 Otros pagos (aparte)</span><strong>${fmt(a.other)}</strong></div>` : ''}
    </div>
    ${ag && ag.note ? `<div class="eq-sub">📝 ${esc(ag.note)}</div>` : ''}
    <div class="eq-result staff-pending">${pend > 0 ? `⏳ <strong>Le debemos ${fmt(pend)}</strong>` : pend < 0 ? `⚠️ <strong>Se le ha adelantado ${fmt(-pend)} de más</strong>` : `✔️ <strong>Está al día</strong>`}</div>
    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
      <button class="btn btn-sm btn-primary" onclick="openStaffPayment('${a.personId}')">💶 Apuntar pago</button>
      <button class="btn btn-sm" onclick="openStaffAgreement('${a.personId}')">🤝 ${ag ? 'Cambiar trato' : 'Trato especial'}</button>
    </div>
  </div>`;
}

// ---------- Ventana: un día del calendario ----------
function openStaffDay(ds) {
  const proj = getCurrentProject(); ensureStaffData(proj);
  staffDayOpen = ds;
  const list = proj.workLog[ds] || [];
  const roles = appState.company.roles || [];
  const people = staffPeople().filter(p => p.active !== false || list.some(e => e.personId === p.id));
  const d = dateObj(ds);
  const prev = Object.keys(proj.workLog).filter(k => k < ds && proj.workLog[k].length).sort().pop();
  document.getElementById('staffModalBody').innerHTML = `
    <div class="card-header"><h3 class="card-title">📅 ${d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3><button class="btn btn-sm" onclick="closeStaffModal()">✕</button></div>
    <p class="modal-intro">Marca <strong>quién vino</strong> este día. <strong>Completa</strong> = un día entero de sueldo; <strong>Media</strong> = medio día (por ejemplo un sábado por la mañana). En <strong>"De qué trabajó"</strong> pon lo que hizo ese día (peón, pintor, gerente…): sirve para saber a qué se dedicó; <strong>lo que cobra sale siempre de su sueldo por día</strong>.</p>
    ${prev ? `<button class="btn btn-sm" onclick="copyStaffDay('${prev}')">📋 Copiar a la gente del ${dateObj(prev).toLocaleDateString('es-ES')}</button>` : ''}
    <div class="table-wrap"><table class="items-table">
      <thead><tr><th>Persona</th><th>¿Vino? <i class="info-icon" data-help="jornada">i</i></th><th>De qué trabajó <i class="info-icon" data-help="deQueTrabajo">i</i></th></tr></thead>
      <tbody>${people.map(p => {
        const e = list.find(x => x.personId === p.id);
        const f = e ? Number(e.frac) : 0;
        return `<tr><td><strong>${esc(p.name)}</strong><div class="eq-sub">${fmt(p.wage)}/día</div></td>
          <td><select id="sd_f_${p.id}"><option value="0" ${f === 0 ? 'selected' : ''}>— No vino</option><option value="0.5" ${f === 0.5 ? 'selected' : ''}>½ Media jornada</option><option value="1" ${f === 1 ? 'selected' : ''}>✔ Jornada completa</option></select></td>
          <td><select id="sd_r_${p.id}">${roles.map(r => `<option value="${r.id}" ${(e ? e.roleId : p.roleId) === r.id ? 'selected' : ''}>${r.icon} ${esc(r.name)}</option>`).join('')}</select></td></tr>`;
      }).join('')}</tbody></table></div>
    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:0.9rem;">
      <button class="btn" onclick="closeStaffModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveStaffDay()">💾 Guardar el día</button></div>`;
  document.getElementById('staffModal').classList.add('open');
}
function copyStaffDay(from) {
  const list = getCurrentProject().workLog[from] || [];
  staffPeople().forEach(p => {
    const e = list.find(x => x.personId === p.id);
    const fs = document.getElementById('sd_f_' + p.id), rs = document.getElementById('sd_r_' + p.id);
    if (fs) fs.value = e ? String(e.frac) : '0';
    if (rs && e) rs.value = e.roleId;
  });
}
function saveStaffDay() {
  const proj = getCurrentProject(); ensureStaffData(proj);
  const list = [];
  staffPeople().forEach(p => {
    const fs = document.getElementById('sd_f_' + p.id); if (!fs) return;
    const f = parseFloat(fs.value) || 0;
    if (f > 0) list.push({ personId: p.id, roleId: document.getElementById('sd_r_' + p.id).value, frac: f });
  });
  if (list.length) proj.workLog[staffDayOpen] = list; else delete proj.workLog[staffDayOpen];
  closeStaffModal(); saveState(); renderAll();
  showToast(list.length ? `📅 Día guardado: ${list.length} persona${list.length > 1 ? 's' : ''}` : '📅 Día vaciado');
}
function closeStaffModal() { document.getElementById('staffModal').classList.remove('open'); }

// ---------- Ventana: apuntar un pago ----------
function openStaffPayment(personId) {
  const people = staffPeople();
  const proj = getCurrentProject();
  const accs = staffAccounts(proj);
  const sel = personId || (people[0] && people[0].id);
  const pend = (accs.find(a => a.personId === sel) || {}).pending || 0;
  document.getElementById('staffModalBody').innerHTML = `
    <div class="card-header"><h3 class="card-title">💶 Apuntar un pago</h3><button class="btn btn-sm" onclick="closeStaffModal()">✕</button></div>
    <p class="modal-intro">Apunta <strong>cada vez que le das dinero</strong> a alguien por esta obra, con su fecha. Da igual que sea anticipo o cobro: <strong>todo se resta de lo que le queda</strong>. Si es Seguridad Social u otro gasto que pagamos por él, elige "Otro": se ve, pero <strong>no se resta de su sueldo</strong>.</p>
    <div class="form-grid">
      <div class="form-group"><label>👤 Persona</label><select id="spPerson" onchange="updateStaffPayHint()">${people.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>📅 Fecha del pago</label><input type="date" id="spDate" value="${todayLocalStr()}"></div>
      <div class="form-group"><label>💶 Importe (€) <i class="info-icon" data-help="importePago">i</i></label><input type="number" min="0" step="1" id="spAmount" value="${pend > 0 ? Math.round(pend) : ''}"></div>
      <div class="form-group"><label>📎 Tipo</label><select id="spKind"><option value="sueldo">💶 Sueldo / anticipo (se resta de lo que le debemos)</option><option value="otro">📎 Otro: S.S., gastos… (no se resta)</option></select></div>
      <div class="form-group" style="grid-column:1/-1;"><label>📝 Nota (opcional)</label><input type="text" id="spNote" placeholder="Ej.: quincena del 1 al 14, en efectivo"></div>
    </div>
    <div id="spHint" class="eq-result"></div>
    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:0.9rem;">
      <button class="btn" onclick="closeStaffModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveStaffPayment()">💾 Guardar pago</button></div>`;
  document.getElementById('staffModal').classList.add('open');
  updateStaffPayHint();
}
function updateStaffPayHint() {
  const id = document.getElementById('spPerson').value;
  const a = staffAccounts(getCurrentProject()).find(x => x.personId === id);
  const el = document.getElementById('spHint');
  if (el) el.innerHTML = a ? (a.pending > 0 ? `Ahora mismo le debemos <strong>${fmt(a.pending)}</strong>.` : a.pending < 0 ? `Ya se le ha adelantado <strong>${fmt(-a.pending)}</strong> de más.` : 'Está al día.') : '';
}
function saveStaffPayment() {
  const amount = parseFloat(document.getElementById('spAmount').value) || 0;
  const date = document.getElementById('spDate').value;
  if (amount <= 0) return alert('Pon el importe que le hemos dado.');
  if (!date) return alert('Pon la fecha del pago.');
  const proj = getCurrentProject(); ensureStaffData(proj);
  proj.staffPayments.push({ id: 'sp_' + Date.now(), date, personId: document.getElementById('spPerson').value, amount: r2(amount), kind: document.getElementById('spKind').value, note: document.getElementById('spNote').value.trim() });
  closeStaffModal(); saveState(); renderAll();
  showToast('💶 Pago apuntado');
}
function deleteStaffPayment(id) {
  const proj = getCurrentProject();
  const p = proj.staffPayments.find(x => x.id === id); if (!p) return;
  const per = staffPerson(p.personId);
  if (!confirm(`¿Borrar el pago de ${fmt(p.amount)} a ${per ? per.name : '?'} del ${dateObj(p.date).toLocaleDateString('es-ES')}?`)) return;
  proj.staffPayments = proj.staffPayments.filter(x => x.id !== id);
  saveState(); renderAll();
}

// ---------- Ventana: trato especial ----------
function openStaffAgreement(personId) {
  const proj = getCurrentProject(); ensureStaffData(proj);
  const a = staffAccounts(proj).find(x => x.personId === personId);
  const ag = proj.staffAgreements[personId] || {};
  const p = staffPerson(personId);
  document.getElementById('staffModalBody').innerHTML = `
    <div class="card-header"><h3 class="card-title">🤝 Trato especial: ${esc(p ? p.name : '')}</h3><button class="btn btn-sm" onclick="closeStaffModal()">✕</button></div>
    <p class="modal-intro">Si en esta obra hemos quedado en que <strong>cobre una cantidad distinta</strong> de lo que le toca por sus días, ponla aquí y <strong>explica el porqué</strong>. Así queda escrito y las cuentas siguen claras.<br>Por sus días le corresponden <strong>${fmt(a ? a.earned : 0)}</strong>.</p>
    <div class="form-grid">
      <div class="form-group"><label>🤝 Cantidad acordada para toda la obra (€)</label><input type="number" min="0" step="1" id="saAmount" value="${ag.amount ?? ''}" placeholder="Ej.: 1200"></div>
      <div class="form-group" style="grid-column:1/-1;"><label>📝 Motivo (obligatorio)</label><input type="text" id="saNote" value="${esc(ag.note || '')}" placeholder="Ej.: el sobrante va a la piscina de Sergio, acordado entre los tres"></div>
    </div>
    <div style="display:flex; gap:0.5rem; justify-content:space-between; margin-top:0.9rem; flex-wrap:wrap;">
      ${proj.staffAgreements[personId] ? `<button class="btn btn-danger" onclick="clearStaffAgreement('${personId}')">↺ Quitar el trato (cobra lo que le toca)</button>` : '<span></span>'}
      <span style="display:flex; gap:0.5rem;"><button class="btn" onclick="closeStaffModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveStaffAgreement('${personId}')">💾 Guardar trato</button></span></div>`;
  document.getElementById('staffModal').classList.add('open');
}
function saveStaffAgreement(personId) {
  const v = document.getElementById('saAmount').value;
  const note = document.getElementById('saNote').value.trim();
  if (v === '') return alert('Pon la cantidad acordada.');
  if (!note) return alert('Escribe el motivo del trato: así nadie lo olvida.');
  getCurrentProject().staffAgreements[personId] = { amount: r2(parseFloat(v) || 0), note };
  closeStaffModal(); saveState(); renderAll();
}
function clearStaffAgreement(personId) {
  delete getCurrentProject().staffAgreements[personId];
  closeStaffModal(); saveState(); renderAll();
}

// ---------- Justificante "Recibí" ----------
function printStaffReceipt(payId) {
  const proj = getCurrentProject();
  const pay = proj.staffPayments.find(x => x.id === payId); if (!pay) return;
  const per = staffPerson(pay.personId) || { name: '' };
  const comp = appState.company;
  const w = window.open('', '_blank');
  if (!w) return alert('El navegador ha bloqueado la ventana. Permite ventanas emergentes para imprimir el justificante.');
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Recibí - ${esc(per.name)}</title>
    <style>body{font-family:system-ui,Segoe UI,sans-serif;color:#0f172a;max-width:42rem;margin:2rem auto;font-size:15px;line-height:1.6}
    h1{font-size:1.4rem;border-bottom:2px solid #0f172a;padding-bottom:.4rem}.amount{font-size:1.6rem;font-weight:800}
    .sign{display:flex;justify-content:space-between;gap:2rem;margin-top:4rem}.sign div{flex:1;border-top:1px solid #0f172a;padding-top:.4rem;text-align:center}
    @media print{button{display:none}}</style></head><body>
    <h1>RECIBÍ</h1>
    <p><strong>${esc(comp.name || '')}</strong>${comp.cif ? ' · ' + esc(comp.cif) : ''}</p>
    <p>Yo, <strong>${esc(per.name)}</strong>, he recibido de ${esc(comp.name || 'la empresa')} la cantidad de</p>
    <p class="amount">${fmt(pay.amount)}</p>
    <p>en concepto de <strong>${pay.kind === 'otro' ? 'otros pagos' : 'sueldo / anticipo a cuenta'}</strong> por los trabajos en la obra <strong>${esc(proj.code || '')} ${esc(proj.title || '')}</strong>${pay.note ? ` (${esc(pay.note)})` : ''}.</p>
    <p>Fecha: <strong>${dateObj(pay.date).toLocaleDateString('es-ES')}</strong></p>
    <div class="sign"><div>Firma de quien recibe<br>${esc(per.name)}</div><div>Firma de quien paga</div></div>
    <p><button onclick="window.print()">🖨️ Imprimir</button></p></body></html>`);
  w.document.close();
}

// ---------- Personas del equipo (pestaña «Empresa») ----------
function addPerson() {
  if (!Array.isArray(appState.company.people)) appState.company.people = [];
  const r = (appState.company.roles || [])[0];
  appState.company.people.push({ id: 'pe_' + Date.now(), name: 'Nombre', roleId: r ? r.id : '', wage: 60, ss: 0, type: 'ayudante', partner: false, active: true });
  saveState(); renderAll();
  showToast('👤 Persona añadida: pon su nombre, sueldo por día y S.S.');
}
function updatePerson(id, f, v) { const p = staffPerson(id); if (!p) return; p[f] = v; saveState(); renderAll(); }
function personInUse(id) {
  return appState.projects.filter(pr => Object.values(pr.workLog || {}).some(l => l.some(e => e.personId === id)) || (pr.staffPayments || []).some(x => x.personId === id) || ((pr.crew || {}).team || []).includes(id));
}
function deletePerson(id) {
  const p = staffPerson(id); if (!p) return;
  const used = personInUse(id);
  if (used.length) return alert(`${p.name} tiene días o pagos apuntados en:\n\n${used.map(x => '• ' + x.code + ' ' + x.title).join('\n')}\n\nNo se borra para no perder las cuentas. Si ya no trabaja con nosotros, desmarca "Activo".`);
  if (!confirm(`¿Borrar a ${p.name}?`)) return;
  appState.company.people = appState.company.people.filter(x => x.id !== id);
  appState.projects.forEach(pr => { if (pr.crew && Array.isArray(pr.crew.team)) pr.crew.team = pr.crew.team.filter(x => x !== id); });
  saveState(); renderAll();
}
function renderPeopleManager() {
  const box = document.getElementById('peopleManagerView'); if (!box) return;
  const people = appState.company.people || [];
  const roles = appState.company.roles || [];
  box.innerHTML = people.length ? `<div class="table-wrap"><table class="items-table">
    <thead><tr><th>Nombre</th><th>Puesto habitual ${helpIcon('puestoHabitual')}</th><th>Sueldo por día ${helpIcon('sueldoPersona')}</th><th>Activo ${helpIcon('personaActiva')}</th><th></th></tr></thead>
    <tbody>${people.map(p => `<tr>
      <td><input type="text" class="inline-input" style="font-weight:700;" value="${esc(p.name)}" onchange="updatePerson('${p.id}','name',this.value.trim()||'Sin nombre')"></td>
      <td><select class="inline-input" onchange="updatePerson('${p.id}','roleId',this.value)">${roles.map(r => `<option value="${r.id}" ${r.id === p.roleId ? 'selected' : ''}>${r.icon} ${esc(r.name)}</option>`).join('')}</select></td>
      <td><input type="number" min="0" step="1" class="inline-input" style="width:6rem;" value="${p.wage}" onchange="updatePerson('${p.id}','wage',parseFloat(this.value)||0)"> €</td>
      <td><input type="checkbox" ${p.active !== false ? 'checked' : ''} onchange="updatePerson('${p.id}','active',this.checked)"></td>
      <td><button class="btn btn-sm btn-danger" onclick="deletePerson('${p.id}')" title="Borrar persona">🗑</button></td></tr>`).join('')}</tbody></table></div>`
    : '<p class="eq-sub">Todavía no hay nadie. Pulsa "+ Añadir persona".</p>';
}
