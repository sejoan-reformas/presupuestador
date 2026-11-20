// ============================================================
// ⚙️ DATOS DE CÁLCULO: un solo sitio para todos los datos que usan los presupuestos.
// En cada obra solo se toca: QUIÉN VA, los KILÓMETROS y el AJUSTE DEL PLAZO.
//   appState.company.pricing  → todos los datos generales (comidas, €/km, recargo, cobro, mínimos, plazos…)
//   appState.company.people   → [{ id, name, wage, ss, type, partner, active, roleId }]
//   proj.crew.team            → [personId, …]   proj.crew.kmRoundTrip   proj.planning.plazoAdjust
// ============================================================
const CALC_DEFAULTS = { mealPerPersonDay: 10, costPerKm: 0.1875, ownMarginPct: 25, advancePct: 25, paymentFreq: 'semanal', defaultMatQuality: 'basica' };
const PERSON_TYPES = {
  oficial: { label: 'Trabaja en obra (oficial)', icon: '👷' },
  ayudante: { label: 'Trabaja en obra (ayudante / peón)', icon: '🧑‍🔧' },
  supervisa: { label: 'Solo supervisa (no suma horas de obra)', icon: '📐' }
};
function calcG() { return { ...CALC_DEFAULTS, ...(appState.company.pricing || {}) }; }
function setCalc(f, v) { const c = appState.company; c.pricing = c.pricing || {}; c.pricing[f] = v; saveState(); renderAll(); }
function payFreqOf() { return calcG().paymentFreq === 'quincenal' ? 'quincenal' : 'semanal'; }

// ---------- Paso de lo antiguo (puestos y datos repetidos en cada obra) a un solo sitio ----------
function personFromRole(role, n) {
  return { id: 'pe_' + Date.now().toString(36) + n + Math.random().toString(36).slice(2, 5), name: `${role.name} ${n}`, wage: Number(role.wage) || 0, ss: Number(role.ss) || 0,
    type: role.type === 'oficial' ? 'oficial' : role.type === 'supervisa' ? 'supervisa' : 'ayudante', partner: false, active: true, roleId: role.id };
}
function crewToTeam(crew) {
  if (!crew || Array.isArray(crew.team)) return;
  const people = appState.company.people;
  const roles = appState.company.roles || [];
  const team = [];
  (crew.members || []).forEach(m => {
    const role = roles.find(r => r.id === m.roleId) || { type: 'ayudante', name: 'Persona', wage: 0, ss: 0, id: m.roleId };
    const type = role.type === 'oficial' ? 'oficial' : role.type === 'supervisa' ? 'supervisa' : 'ayudante';
    for (let k = 0; k < (Number(m.count) || 0); k++) {
      let p = people.find(x => x.type === type && !team.includes(x.id));
      if (!p) { p = personFromRole(role, people.filter(x => x.type === type).length + 1); people.push(p); }
      team.push(p.id);
    }
  });
  crew.team = team;
}
function ensureCalcData() {
  const comp = appState.company;
  comp.pricing = comp.pricing || {};
  if (!comp.pricing.calc3) {
    const backup = JSON.stringify(appState);
    try { localStorage.setItem('presupuestador_antes_de_datos_unicos', backup); } catch (e) {}
    if (typeof fsWriteExtraFile === 'function') fsWriteExtraFile(`antes_de_datos_unicos_${todayLocalStr()}.json`, backup);
    const p0 = appState.projects[0];
    const c0 = (p0 && p0.crew) || {};
    const km0 = Number(c0.kmRoundTrip) || 0;
    const pr = comp.pricing;
    if (pr.mealPerPersonDay === undefined) pr.mealPerPersonDay = Number(c0.mealPerPersonDay) || CALC_DEFAULTS.mealPerPersonDay;
    if (pr.costPerKm === undefined) pr.costPerKm = Number(c0.vanDailyFixed) > 0 && km0 > 0 ? Math.round(Number(c0.vanDailyFixed) / km0 * 10000) / 10000 : (Number(c0.costPerKm) || CALC_DEFAULTS.costPerKm);
    if (pr.ownMarginPct === undefined) pr.ownMarginPct = Number(c0.ownMarginPct) || CALC_DEFAULTS.ownMarginPct;
    if (pr.advancePct === undefined) pr.advancePct = p0 && p0.advancePct !== undefined ? Number(p0.advancePct) : CALC_DEFAULTS.advancePct;
    if (pr.paymentFreq === undefined) pr.paymentFreq = (p0 && p0.paymentFreq) || 'semanal';
    // Personas con su sueldo y S.S. reales (de la primera obra, que es la que estaba ajustada)
    if (!Array.isArray(comp.people)) comp.people = [];
    if (!comp.people.length && p0) {
      const roles = comp.roles || [];
      (c0.members || []).forEach(m => {
        const role = roles.find(r => r.id === m.roleId) || { type: 'ayudante', name: 'Persona', wage: 0, ss: 0, id: m.roleId };
        for (let k = 0; k < (Number(m.count) || 0); k++) {
          const p = personFromRole(role, k + 1);
          if (m.wage !== null && m.wage !== undefined) p.wage = Number(m.wage) || 0;
          if (m.ss !== null && m.ss !== undefined) p.ss = Number(m.ss) || 0;
          comp.people.push(p);
        }
      });
      // Nombres y S.S. que nos contaste (Sergio oficial; Antonio peón autónomo con 80 €/mes; nosotros, sin S.S. estos meses)
      const of = comp.people.filter(p => p.type === 'oficial'), ay = comp.people.filter(p => p.type === 'ayudante');
      if (of.length === 1 && ay.length === 2) {
        const ssTotal = ay.reduce((t, p) => t + p.ss, 0) + of[0].ss;
        Object.assign(of[0], { name: 'Sergio', partner: true });
        Object.assign(ay[0], { name: 'Antonio (peón)', partner: true, ss: ssTotal - of[0].ss });
        Object.assign(ay[1], { name: 'Antonio (gerente)', partner: true, ss: 0 });
      }
      c0.team = comp.people.map(p => p.id);
    }
    comp.people.forEach(p => { if (!p.type) p.type = 'ayudante'; if (p.ss === undefined) p.ss = 0; if (p.partner === undefined) p.partner = false; });
    pr.calc3 = true;
  }
  if (!Array.isArray(comp.fixedCosts)) {
    comp.fixedCosts = [['📞 Teléfonos'], ['🌐 Internet'], ['🏢 Alquiler oficina (piso)'], ['🧰 Trastero (herramientas)']]
      .map(([name], i) => ({ id: 'fc_' + i + Date.now().toString(36), name, amount: 0 }));
  }
  if (!comp.pricing.calc5) {
    // El alquiler de Antonio (peón) lo pagan los socios de su bolsillo, fuera de la empresa: no es coste de obra
    const ap = (comp.people || []).find(p => p.name === 'Antonio (peón)');
    if (ap && Number(ap.extraMonthly) === 350) ap.extraMonthly = 0;
    comp.pricing.calc5 = true;
  }
  appState.projects.forEach(p => crewToTeam(p.crew));
  (appState.templates || []).forEach(t => crewToTeam(t.crew));
}

// ---------- Equipo de una obra (lo usa el motor) ----------
function teamSummary(proj) {
  const wd = Math.max(1, Number(appState.company.workDaysPerMonth) || 21);
  const people = appState.company.people || [];
  const members = (proj.crew.team || []).map(id => people.find(p => p.id === id)).filter(Boolean).map(p => {
    // Lo que paga la empresa por cada persona: sueldo del día + (S.S. + otros pagos del mes, p. ej. alquiler) repartidos por día
    const wage = Number(p.wage) || 0, ss = Number(p.ss) || 0, extra = Number(p.extraMonthly) || 0, perPerson = wage + (ss + extra) / wd;
    return { id: p.id, roleId: p.roleId, person: p, role: { name: p.name, icon: PERSON_TYPES[p.type]?.icon || '👷', type: p.type, wage, ss }, count: 1, wage, ss, perPerson, daily: perPerson, overridden: false };
  });
  const sum = f => members.reduce((s, m) => s + f(m), 0);
  return { members, nOfficial: sum(m => m.role.type === 'oficial' ? 1 : 0), nWorking: sum(m => m.role.type !== 'supervisa' ? 1 : 0), nTotal: members.length, laborDaily: sum(m => m.daily) };
}
function toggleTeam(personId) {
  const c = getCurrentProject().crew; c.team = c.team || [];
  c.team = c.team.includes(personId) ? c.team.filter(x => x !== personId) : c.team.concat(personId);
  saveState(); renderAll();
}
function setObraKm(v) { getCurrentProject().crew.kmRoundTrip = Math.max(0, parseFloat(v) || 0); saveState(); renderAll(); }
function adjustPlazo(delta) { const p = getCurrentProject(); p.planning = p.planning || {}; p.planning.plazoAdjust = (Number(p.planning.plazoAdjust) || 0) + delta; saveState(); renderAll(); }
function resetPlazo() { const p = getCurrentProject(); p.planning = p.planning || {}; p.planning.plazoAdjust = 0; saveState(); renderAll(); }

// ---------- Pestaña «Equipo y plazo» de cada obra: solo 3 cosas ----------
function renderTeamView(proj, econ) {
  const box = document.getElementById('teamView'); if (!box) return;
  const people = (appState.company.people || []).filter(p => p.active !== false || (proj.crew.team || []).includes(p.id));
  const team = proj.crew.team || [];
  const adj = Number((proj.planning || {}).plazoAdjust) || 0;
  const calc = econ.plazoDays - adj;
  const ph = econ.rmPlazo.activePhases;
  const waits = ph.slice(0, -1).reduce((t, f) => t + (f.waitDays || 0), 0);
  const G = calcG();
  box.innerHTML = `<div class="eq-grid">
    <div class="card eq-card"><div class="eq-head"><span class="eq-icon">👥</span><div><div class="eq-name">Quién va a esta obra ${helpIcon('quienVa')}</div><div class="eq-sub">Pulsa para marcar o quitar</div></div></div>
      <div class="visit-chips">${people.map(p => { const on = team.includes(p.id); return `<button class="visit-chip ${on ? 'on' : ''}" onclick="toggleTeam('${p.id}')">${on ? '✔ ' : ''}${PERSON_TYPES[p.type]?.icon || '👷'} ${esc(p.name)} <small>${fmt(p.wage)}/día</small></button>`; }).join('') || '<span class="eq-sub">Aún no hay personas: añádelas en «Datos de cálculo».</span>'}</div>
      <div class="eq-result">${econ.crewInfo.nTotal} persona${econ.crewInfo.nTotal === 1 ? '' : 's'} · sueldos, S.S. y otros pagos: <strong>${fmt(econ.crewDailyLaborCost)}/día</strong></div></div>
    <div class="card eq-card"><div class="eq-head"><span class="eq-icon">🛣️</span><div><div class="eq-name">Kilómetros de esta obra ${helpIcon('kmObra')}</div><div class="eq-sub">Ida y vuelta al día</div></div></div>
      <label class="eq-field"><span>🛣️ Km ida y vuelta</span><input type="number" min="0" step="1" value="${Number(proj.crew.kmRoundTrip) || 0}" onchange="setObraKm(this.value)"></label>
      <div class="eq-result">Furgoneta: <strong>${fmt(econ.dailyTravelCost)}/día</strong> <span class="eq-sub">(${fmtNum(G.costPerKm, 3)} €/km)</span></div></div>
    <div class="card eq-card"><div class="eq-head"><span class="eq-icon">⏳</span><div><div class="eq-name">Plazo de esta obra ${helpIcon('ajustePlazo')}</div><div class="eq-sub">La app lo calcula; lo acortamos o alargamos si conocemos la obra</div></div></div>
      <div class="eq-sub">Calculado: <strong>${calc} días</strong> (trabajo ${fmtNum(calc - waits, 0)} + esperas de secado ${fmtNum(waits, 0)})</div>
      <div class="plazo-adj">
        <button class="btn" onclick="adjustPlazo(-5)">− 1 semana</button><button class="btn" onclick="adjustPlazo(-1)">− 1 día</button>
        <span class="plazo-val">Ajuste: ${adj > 0 ? '+' : ''}${adj} día${Math.abs(adj) === 1 ? '' : 's'}</span>
        <button class="btn" onclick="adjustPlazo(1)">+ 1 día</button><button class="btn" onclick="adjustPlazo(5)">+ 1 semana</button>
      </div>
      ${adj ? `<button class="btn btn-sm" onclick="resetPlazo()">↺ Volver al plazo calculado</button>` : ''}
      <div class="eq-result">Plazo de la obra: <strong>${econ.plazoDays} días laborables</strong> (≈ ${fmtNum(econ.plazoDays / 5, 1)} semanas)</div></div>
  </div>
  <div class="eq-sub" style="margin:0.6rem 0 0;">Sueldos, comidas, €/km, recargo, cobro y mínimos son iguales para todas las obras: se cambian en <button class="btn btn-sm" onclick="switchTab('calcdata')">⚙️ Datos de cálculo</button></div>`;
}

// ---------- Pestaña «⚙️ Datos de cálculo»: todo junto, por secciones ----------
const CALC_SECTIONS = [
  { icon: '🚐', name: 'Gastos de cada día de obra', fields: [['mealPerPersonDay', '🍽️ Comida por persona y día (€)', 0.5, 'comida'], ['costPerKm', '⛽ Furgoneta, € por km', 0.01, 'costeKm']] },
  { icon: '💰', name: 'Beneficio y objetivo', fields: [['ownMarginPct', '📈 Recargo sobre lo que nos cuesta (%)', 1, 'recargo'], ['coordPct', '🗂️ Medios auxiliares y coordinación (%)', 0.5, 'coordinacion'],
    ['targetMonthlyMin', '👥 Cada uno al mes, mínimo (€ brutos)', 100, 'objetivoMes'], ['targetMonthlyMax', '👥 Cada uno al mes, máximo (€ brutos)', 100, 'objetivoMes'],
    ['netWagePct', '🧾 Del sueldo bruto queda limpio (%)', 0.5, 'liquido'], ['netProfitPct', '🧾 Del beneficio repartido queda limpio (%)', 0.5, 'liquido']] },
  { icon: '⏳', name: 'Plazos', fields: [['realityFactor', '📏 Factor de realidad (× horas de libro)', 0.05, 'factorRealidad'], ['idlePctDefault', '🕳️ Tiempo improductivo (%)', 5, 'improductivo']], waits: true },
  { icon: '🛡️', name: 'Mínimos', fields: [['minJobLabor', '🧾 Mínimo de cualquier trabajo (€)', 10, 'minimoTrabajo'], ['minItemHours', '⏱️ Mínimo por partida propia (horas)', 0.5, 'minimoPartida'], ['minSubCharge', '🔧 Salida mínima de una subcontrata (€)', 10, 'minimoSub']] },
  { icon: '💳', name: 'Cómo cobramos', fields: [['advancePct', '💶 Entrada al aceptar (%)', 5, 'entradaPct']], freq: true }
];
function renderCalcDataTab() {
  renderFixedCosts();
  const box = document.getElementById('calcDataView'); if (!box) return;
  const G = { ...pricingSettings(), ...calcG() };
  const people = appState.company.people || [];
  const field = ([k, l, st, h]) => `<label class="eq-field"><span>${l} ${helpIcon(h)}</span><input type="number" min="0" step="${st}" value="${G[k]}" onchange="setCalc('${k}', Math.max(0, parseFloat(this.value)||0))"></label>`;
  box.innerHTML = `
    <p class="modal-intro">Aquí están <strong>todos los datos</strong> con los que se calculan los presupuestos, <strong>una sola vez cada uno</strong>. Valen para todas las obras. En cada obra solo elegimos <strong>quién va</strong>, los <strong>kilómetros</strong> y, si hace falta, <strong>ajustas el plazo</strong>.</p>
    <div class="card eq-card"><div class="eq-head"><span class="eq-icon">👥</span><div><div class="eq-name">1 · Personas y sueldos ${helpIcon('personasEquipo')}</div><div class="eq-sub">Cada persona con lo que cobra por día y lo que paga de Seguridad Social al mes</div></div>
      <button class="btn btn-primary" style="margin-left:auto;" onclick="addPerson()"><b class="plus">+</b> Añadir persona</button></div>
      <div class="table-wrap"><table class="items-table">
        <thead><tr><th>Nombre</th><th>Sueldo/día ${helpIcon('sueldoPersona')}</th><th>S.S./mes ${helpIcon('ssMes')}</th><th>Otros pagos/mes ${helpIcon('otrosPagosMes')}</th><th>Qué hace ${helpIcon('tipoPuesto')}</th><th>Socio ${helpIcon('socio')}</th><th>Activo ${helpIcon('personaActiva')}</th><th></th></tr></thead>
        <tbody>${people.map(p => `<tr>
          <td><input type="text" class="inline-input" style="font-weight:700;" value="${esc(p.name)}" onchange="updatePerson('${p.id}','name',this.value.trim()||'Sin nombre')"></td>
          <td><input type="number" min="0" step="1" class="inline-input" style="width:6rem;" value="${p.wage}" onchange="updatePerson('${p.id}','wage',parseFloat(this.value)||0)"> €</td>
          <td><input type="number" min="0" step="1" class="inline-input" style="width:6rem;" value="${p.ss || 0}" onchange="updatePerson('${p.id}','ss',parseFloat(this.value)||0)"> €</td>
          <td><input type="number" min="0" step="10" class="inline-input" style="width:6rem;" value="${p.extraMonthly || 0}" onchange="updatePerson('${p.id}','extraMonthly',parseFloat(this.value)||0)"> €</td>
          <td><select class="inline-input" onchange="updatePerson('${p.id}','type',this.value)">${Object.entries(PERSON_TYPES).map(([k, t]) => `<option value="${k}" ${k === p.type ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}</select></td>
          <td><input type="checkbox" ${p.partner ? 'checked' : ''} onchange="updatePerson('${p.id}','partner',this.checked)"></td>
          <td><input type="checkbox" ${p.active !== false ? 'checked' : ''} onchange="updatePerson('${p.id}','active',this.checked)"></td>
          <td><button class="btn btn-sm btn-danger" onclick="deletePerson('${p.id}')" title="Borrar persona">🗑</button></td></tr>`).join('')}</tbody></table></div></div>
    <div class="eq-grid" style="margin-top:1.1rem;">
      ${CALC_SECTIONS.map((s, i) => `<div class="card eq-card"><div class="eq-head"><span class="eq-icon">${s.icon}</span><div><div class="eq-name">${i + 2} · ${s.name}</div></div></div>
        <div class="eq-fields">${s.fields.map(field).join('')}
        ${s.freq ? `<label class="eq-field"><span>📆 El resto, cada… ${helpIcon('periodicidad')}</span><select onchange="setCalc('paymentFreq', this.value)"><option value="semanal" ${G.paymentFreq !== 'quincenal' ? 'selected' : ''}>Semana</option><option value="quincenal" ${G.paymentFreq === 'quincenal' ? 'selected' : ''}>Quincena</option></select></label>` : ''}
        ${s.waits ? `<div class="eq-sub" style="margin-top:0.4rem;"><strong>Esperas de secado y fraguado</strong> (días) ${helpIcon('esperas')}</div>${G.waitRules.map(r => `<label class="eq-field"><span>${esc(r.label)}</span><input type="number" min="0" step="0.5" value="${r.days}" onchange="setWaitRule('${r.key}', Math.max(0, parseFloat(this.value)||0))"></label>`).join('')}` : ''}
        </div></div>`).join('')}
    </div>`;
}

// ---------- Gastos fijos con nombre (teléfonos, internet, oficina, trastero…) ----------
function updateFixedCost(id, f, v) { const x = (appState.company.fixedCosts || []).find(c => c.id === id); if (!x) return; x[f] = v; saveState(); renderAll(); }
function addFixedCost() { appState.company.fixedCosts = appState.company.fixedCosts || []; appState.company.fixedCosts.push({ id: 'fc_' + Date.now().toString(36), name: 'Nuevo gasto', amount: 0 }); saveState(); renderAll(); }
function deleteFixedCost(id) { const x = (appState.company.fixedCosts || []).find(c => c.id === id); if (!x || !confirm(`¿Quitar "${x.name}" de los gastos fijos?`)) return; appState.company.fixedCosts = appState.company.fixedCosts.filter(c => c.id !== id); saveState(); renderAll(); }
function renderFixedCosts() {
  const box = document.getElementById('fixedCostsView'); if (!box) return;
  const c = appState.company, list = c.fixedCosts || [];
  const wd = Math.max(1, Number(c.workDaysPerMonth) || 21);
  const total = (Number(c.monthlyGestoria) || 0) + (Number(c.monthlyInsurance) || 0) + (Number(c.monthlyOtherOverhead) || 0) + list.reduce((t, f) => t + (Number(f.amount) || 0), 0);
  box.innerHTML = `<div class="fixed-list">${list.map(f => `<div class="fixed-row">
      <input type="text" class="inline-input" value="${esc(f.name)}" onchange="updateFixedCost('${f.id}','name',this.value.trim()||'Gasto')" aria-label="Nombre del gasto">
      <span><input type="number" min="0" step="5" class="inline-input" style="width:7rem;" value="${f.amount}" onchange="updateFixedCost('${f.id}','amount',Math.max(0,parseFloat(this.value)||0))" aria-label="Euros al mes"> €/mes</span>
      <button class="btn btn-sm btn-danger" onclick="deleteFixedCost('${f.id}')" title="Quitar">🗑</button></div>`).join('')}</div>
    <button class="btn btn-sm" onclick="addFixedCost()"><b class="plus">+</b> Añadir otro gasto fijo</button>
    <div class="eq-result" style="margin-top:0.6rem;">Total gastos fijos: <strong>${fmt(total)}/mes</strong> → cada día de obra paga <strong>${fmt(total / wd)}</strong></div>`;
}
