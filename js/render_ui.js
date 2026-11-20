function renderTopbar() {
  const comp = appState.company;
  document.getElementById('topbarCompanyName').textContent = comp.name || 'Presupuestador PRO';
  const logoDiv = document.getElementById('topbarLogoContainer');
  if (comp.logoBase64) logoDiv.innerHTML = `<img src="${comp.logoBase64}" style="width:100%;height:100%;object-fit:contain;">`;
  else logoDiv.textContent = (comp.name || 'RP').slice(0, 2).toUpperCase();

  document.getElementById('projectSelect').innerHTML = appState.projects.map(p =>
    `<option value="${p.id}" ${p.id === appState.currentProjectId ? 'selected' : ''}>${PROJ_STATUS[getProjStatus(p)].icon} ${esc(p.title)} (${esc(p.code)})</option>`
  ).join('');
}

function renderPrivateKpiBar(proj, econ) {
  const profitClass = econ.baseNetProfit >= 0 ? 'kpi-green' : 'kpi-red';
  const gama = (typeof MAT_QUALITIES !== 'undefined') ? MAT_QUALITIES[matQuality(proj)].txt : '';
  const hasExtras = econ.optClientBase > 0 || econ.matsData.optTotal > 0;
  let perMonth = '';
  if (typeof priceModel === 'function') { const m = priceModel(proj, econ); perMonth = `Cada uno: <strong>${fmt(m.perMonth(econ.baseClientBase, m.D))}</strong>/mes bruto · ≈ <strong>${fmt(m.netMonth(econ.baseClientBase, m.D))}</strong> líquido`; }
  document.getElementById('privateKpiBar').innerHTML = `
    <div class="kpi-card kpi-blue">
      <div class="kpi-label">👷 Mano de obra (sin IVA)</div>
      <div class="kpi-value">${fmt(econ.baseClientBase)}</div>
      <div class="kpi-sub">Con ${proj.ivaPct}% IVA: <strong>${fmt(econ.baseClientWithIva)}</strong> · Plazo: <strong>${econ.plazoDays} días</strong> · Facturado: <strong>${fmt(econ.totalNetBilledBase)}</strong></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">🧱 Materiales aprox. (${esc(gama)})</div>
      <div class="kpi-value">${fmt(econ.matsData.baseTotal)}</div>
      <div class="kpi-sub">Los elige y paga el cliente, aparte de la mano de obra</div>
    </div>
    <div class="kpi-card kpi-orange">
      <div class="kpi-label">➕ Extras opcionales (si el cliente los quiere)</div>
      ${hasExtras ? `<div class="kpi-lines"><div><span>👷 Mano de obra</span><strong>${fmt(econ.optClientBase)}</strong></div><div><span>🧱 Materiales aprox.</span><strong>${fmt(econ.matsData.optTotal)}</strong></div></div>` : '<div class="kpi-value">—</div><div class="kpi-sub">Esta obra no tiene extras</div>'}
    </div>
    <div class="kpi-card ${profitClass}">
      <div class="kpi-label">💰 Lo que ganamos (sin extras)</div>
      <div class="kpi-value">${fmt(econ.baseNetProfit)}</div>
      <div class="kpi-sub">Empresa: <strong>${fmtNum(econ.baseNetProfitPct, 1)} %</strong> de la venta<br>${perMonth}</div>
    </div>
  `;
}

// ===== Vista del checklist: compacta (1 línea + detalle al pulsar) o detallada (todo abierto) =====
let checklistView = (() => { try { return localStorage.getItem('presupuestador_vista') || 'compact'; } catch (e) { return 'compact'; } })();
const expandedItems = new Set();
function setChecklistView(v) {
  checklistView = v;
  try { localStorage.setItem('presupuestador_vista', v); } catch (e) {}
  renderAll();
}
function toggleItemDetail(id) {
  if (checklistView === 'detailed') return;
  if (expandedItems.has(id)) expandedItems.delete(id); else expandedItems.add(id);
  renderAll();
}

function renderItemRows(item, r, unitLabels) {
  const recCount = (item.matRecipe || []).length;
  const open = checklistView === 'detailed' || expandedItems.has(item.id);
  const ph = ROADMAP_PHASES.find(p => p.id === item.phase);
  const tip = `${item.name}${item.desc ? '\n\n' + item.desc : ''}\n\n${ph ? ph.name : 'Fase ' + item.phase} · ${fmt(r.clientUnit)} / ${item.unit}`;
  const rend = item.mode === 'own'
    ? `<input type="number" step="0.05" class="inline-input rend-input" value="${item.hoursPerUnit}" title="Horas por unidad" onchange="updateItem('${item.id}', 'hoursPerUnit', parseFloat(this.value)||0)"><span class="rend-u">h/${esc(item.unit)}</span>`
    : `<input type="number" step="1" class="inline-input rend-input" value="${item.subCost}" title="Lo que nos cobra el subcontratista por unidad" onchange="updateItem('${item.id}', 'subCost', parseFloat(this.value)||0)"><span class="rend-u">€/${esc(item.unit)}</span>`;

  const mainRow = `
    <tr class="item-row ${item.active ? '' : 'row-inactive'} ${open ? 'is-open' : ''}">
      <td>
        <div class="pill-toggle pill-sm">
          <button class="${item.active ? 'active-yes' : ''}" onclick="toggleItemActive('${item.id}', true)">SÍ</button>
          <button class="${!item.active ? 'active-no' : ''}" onclick="toggleItemActive('${item.id}', false)">NO</button>
        </div>
      </td>
      <td class="name-cell">
        <button type="button" class="item-name" title="${esc(tip)}" onclick="toggleItemDetail('${item.id}')" aria-expanded="${open}">${esc(item.name)}</button>
        <span class="lf-extra">${esc(item.desc || '')}</span>
      </td>
      <td class="nowrap">
        <input type="number" step="0.01" class="inline-input num-input" value="${item.qty}" onchange="updateItem('${item.id}', 'qty', parseFloat(this.value)||0)">
        <span class="rend-u">${esc(item.unit)}</span>
      </td>
      <td class="nowrap"><span class="exec-badge ${item.mode === 'sub' ? 'exec-sub' : 'exec-own'}">${item.mode === 'sub' ? '🔧 Subc.' : '👷 Propio'}</span></td>
      <td class="nowrap">${rend}</td>
      <td class="nowrap"><span class="badge badge-phase">${fmtNum(r.taskDays, 1)} d</span></td>
      <td class="nowrap" style="text-align:right;" title="${fmt(r.clientUnit)} / ${esc(item.unit)}"><strong>${fmt(r.clientTotal)}</strong></td>
      <td class="nowrap">
        ${checklistView === 'detailed' ? '' : `<button type="button" class="btn btn-sm caret-btn" onclick="toggleItemDetail('${item.id}')" title="${open ? 'Cerrar detalle' : 'Ver y editar todo'}" aria-expanded="${open}">${open ? '▾' : '▸'}</button>`}
      </td>
    </tr>`;
  if (!open) return mainRow;

  const subFields = item.mode === 'own' ? `
      <div class="det-f"><label>Horas por unidad ${helpIcon('horasUd')}</label><input type="number" step="0.05" class="inline-input" value="${item.hoursPerUnit}" onchange="updateItem('${item.id}', 'hoursPerUnit', parseFloat(this.value)||0)"></div>
      <div class="det-f"><label>Coste interno MO ${helpIcon('costeInterno')}</label><div class="det-val">${fmt(r.internalCost)}</div></div>
      <div class="det-f"><label>Materiales ${helpIcon('receta')}</label><button class="btn btn-sm" onclick="openRecipeModal('${item.id}')">🧱 Receta (${recCount})</button></div>
    ` : `
      <div class="det-f"><label>Subcontrata €/ud ${helpIcon('subCost')}</label><input type="number" step="1" class="inline-input" value="${item.subCost}" onchange="updateItem('${item.id}', 'subCost', parseFloat(this.value)||0)"></div>
      <div class="det-f"><label>Nuestro recargo % ${helpIcon('subRecargo')}</label><input type="number" step="1" class="inline-input" value="${item.subMarginPct}" onchange="updateItem('${item.id}', 'subMarginPct', parseFloat(this.value)||0)"></div>
      <div class="det-f"><label>Días que tarda ${helpIcon('subDias')}</label><input type="number" step="0.5" class="inline-input" value="${item.subDays}" onchange="updateItem('${item.id}', 'subDays', parseFloat(this.value)||0)"></div>
      <div class="det-f"><label>Material ${helpIcon('soloMO')}</label><button class="btn btn-sm" onclick="updateItem('${item.id}', 'subIncludesMat', ${!item.subIncludesMat})">${item.subIncludesMat ? '📦 Lo pone él' : '🧱 Solo MO'}</button></div>
      ${!item.subIncludesMat ? `<div class="det-f"><label>Materiales ${helpIcon('receta')}</label><button class="btn btn-sm" onclick="openRecipeModal('${item.id}')">🧱 Receta (${recCount})</button></div>` : ''}
    `;

  const detailRow = `
    <tr class="item-detail ${item.active ? '' : 'row-inactive'}">
      <td colspan="8">
        <div class="det-grid">
          <div class="det-f det-wide"><label>Nombre de la partida ${helpIcon('colPartida')}</label><input type="text" class="inline-input" style="font-weight:700;" value="${esc(item.name)}" onchange="updateItem('${item.id}', 'name', this.value)"></div>
          <div class="det-f"><label>Fase de obra ${helpIcon('fase')}</label>
            <select class="inline-input" onchange="updateItem('${item.id}', 'phase', parseInt(this.value))">
              ${ROADMAP_PHASES.map(p => `<option value="${p.id}" ${p.id === item.phase ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
            </select></div>
          <div class="det-f"><label>Unidad ${helpIcon('unidad')}</label>
            <select class="inline-input" onchange="updateItem('${item.id}', 'unit', this.value)">
              ${['m²', 'ml', 'ud', 'PA', 'h'].map(u => `<option value="${u}" ${item.unit === u ? 'selected' : ''}>${unitLabels[u]}</option>`).join('')}
            </select></div>
          <div class="det-f det-full"><label>Descripción (sale en el PDF del cliente) ${helpIcon('descripcion')}</label><textarea class="inline-input det-desc" rows="2" onchange="updateItem('${item.id}', 'desc', this.value)">${esc(item.desc || '')}</textarea></div>
          <div class="det-f"><label>Ejecución ${helpIcon('colEjecucion')}</label>
            <div class="pill-toggle">
              <button class="${item.mode === 'own' ? 'active-own' : ''}" onclick="updateItem('${item.id}', 'mode', 'own')">👷 Propio</button>
              <button class="${item.mode === 'sub' ? 'active-sub' : ''}" onclick="updateItem('${item.id}', 'mode', 'sub')">🔧 Subc.</button>
            </div></div>
          ${subFields}
          <div class="det-f"><label>Medir ${helpIcon('calculadora')}</label><button class="btn btn-sm" onclick="openMeasureModal('${item.id}')" title="Medir por habitaciones/paredes">📐 Calculadora</button></div>
          <div class="det-f"><label>Precio por unidad ${helpIcon('precioUd')}</label><div class="det-val">${fmt(r.clientUnit)} / ${esc(item.unit)}</div></div>
          <div class="det-f det-actions">
            <button class="btn btn-sm" onclick="saveItemToLibrary('${item.id}')" title="Guardar esta partida en mi biblioteca">📚 A mi biblioteca</button>${helpIcon('biblioteca')}
            <button class="btn btn-sm btn-danger" onclick="deleteItem('${item.id}')" title="Eliminar partida">🗑 Eliminar</button>
          </div>
        </div>
      </td>
    </tr>`;
  return mainRow + detailRow;
}

function renderChecklistTab(proj, econ) {
  document.getElementById('projTitle').value = proj.title || '';
  document.getElementById('projCode').value = proj.code || '';
  document.getElementById('projDate').value = proj.date || '';
  document.getElementById('clientName').value = proj.client.name || '';
  document.getElementById('clientNif').value = proj.client.nif || '';
  document.getElementById('clientPhone').value = proj.client.phone || '';
  document.getElementById('clientProjectAddress').value = proj.client.projectAddress || '';
  document.getElementById('projIva').value = String(proj.ivaPct || 10);
  renderStatusField(proj);

  const unitLabels = { 'm²': 'm²', 'ml': 'ml (lineal)', 'ud': 'ud', 'PA': 'PA (cerrado)', 'h': 'h (horas)' };

  const vt = document.getElementById('viewToggle');
  if (vt) vt.innerHTML = `
    <span class="vt-label">Vista: ${helpIcon('vistas')}</span>
    <div class="pill-toggle">
      <button class="${checklistView === 'compact' ? 'active-own' : ''}" onclick="setChecklistView('compact')" title="Una línea por partida; pulsa ▸ o el nombre para ver todo">☰ Compacta</button>
      <button class="${checklistView === 'detailed' ? 'active-own' : ''}" onclick="setChecklistView('detailed')" title="Todas las partidas abiertas con todos sus datos">▤ Detallada</button>
    </div>
    ${checklistView === 'compact' && expandedItems.size ? `<button class="btn btn-sm" onclick="expandedItems.clear(); renderAll();">Cerrar todas (${expandedItems.size})</button>` : ''}`;

  document.getElementById('chaptersContainer').innerHTML = proj.chapters.map(ch => {
    const chItems = proj.items.filter(i => i.chapterId === ch.id);
    const chClientTotal = chItems.reduce((acc, i) => acc + (econ.itemResults[i.id]?.clientTotal || 0), 0);
    const isOpt = !!ch.isOptional;

    return `
      <div class="chapter-box ${isOpt ? 'chapter-optional' : ''}">
        <div class="chapter-head">
          <h3>${esc(ch.name)} ${isOpt ? '<span class="badge badge-opt">EXTRA OPCIONAL</span>' : ''}</h3>
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <strong style="color:var(--accent);">Mano de Obra: ${fmt(chClientTotal)}</strong>
            <button class="btn btn-sm ${isOpt ? 'btn-optional-on' : ''}" onclick="toggleChapterOptional('${ch.id}')">${isOpt ? '✨ Extra Opcional' : '📌 En Base'}</button>${helpIcon('capituloTipo')}
            <button class="btn btn-sm" onclick="openAddItemModal('${ch.id}')"><b class="plus">+</b> Añadir Partida</button>
            <button class="btn btn-sm btn-danger" onclick="deleteChapter('${ch.id}')">🗑</button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="items-table items-compact">
            <thead>
              <tr>
                <th>¿Incl.? ${helpIcon('colIncl')}</th>
                <th>Partida ${helpIcon('colPartida')}</th>
                <th>Medición ${helpIcon('colMedicion')}</th>
                <th>Ejecución ${helpIcon('colEjecucion')}</th>
                <th>Rendimiento ${helpIcon('colRendimiento')}</th>
                <th>Días ${helpIcon('colDias')}</th>
                <th style="text-align:right;">Precio MO ${helpIcon('colPrecio')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${chItems.map(item => renderItemRows(item, econ.itemResults[item.id], unitLabels)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function renderMaterialsTab(proj, econ) {
  const mData = econ.matsData;
  const extraRows = (proj.extraMaterials || []);
  const cat = appState.materialsCatalog || [];

  let html = renderMaterialsSplit(proj, econ);

  function buildMatTable(rows, title) {
    if (!rows.length) return '';
    return `
      <h4 style="margin:1rem 0 0.4rem 0;">${title}</h4>
      <table class="pdf-table">
        <thead><tr><th>Categoría</th><th>Material Necesario</th><th style="text-align:right;">Cantidad (Editable)</th><th>Ud.</th><th style="text-align:right;">Precio Ref.</th><th style="text-align:right;">Estimado</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${esc(r.cat)}</td>
              <td><strong>${esc(r.name)}</strong> ${r.isOverridden ? '<span class="badge badge-opt">Ajustado manual</span>' : ''}</td>
              <td style="text-align:right; white-space:nowrap;">
                <input type="number" step="${r.roundUp?1:0.5}" class="inline-input num-input" value="${r.qty}" onchange="setMaterialOverride('${r.ovKey}', parseFloat(this.value))">
                ${r.isOverridden ? `<button class="btn btn-sm" title="Volver al cálculo de la receta (${r.autoQty})" onclick="clearMaterialOverride('${r.ovKey}')">↺</button>` : ''}
              </td>
              <td>${esc(r.unit)}</td>
              <td style="text-align:right;">${fmt(r.price)}</td>
              <td style="text-align:right; font-weight:700;">${fmt(r.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }


  if (extraRows.length) {
    html += `<h4 style="margin:1rem 0 0.4rem 0;">Materiales sueltos añadidos</h4>`;
    html += extraRows.map(em => {
      const m = cat.find(x => x.id === em.matId);
      return `<div class="extra-mat-row" style="display:flex; gap:10px; align-items:center; margin-bottom:4px;">
        <span>• ${esc(m ? m.name : em.matId)}: <strong>${em.qty} ${m ? m.unit : ''}</strong></span>
        <button class="btn btn-sm btn-danger" onclick="deleteExtraMat('${em.id}')">Quitar</button>
      </div>`;
    }).join('');
  }
  document.getElementById('projectMaterialsView').innerHTML = html;

  const query = (document.getElementById('catalogSearch')?.value || '').toLowerCase();
  const filtered = cat.filter(m => !query || m.name.toLowerCase().includes(query) || m.cat.toLowerCase().includes(query));
  document.getElementById('materialsCatalogView').innerHTML = `
    <table class="items-table">
      <thead><tr><th>Categoría</th><th>Material</th><th>Ud.</th><th>Precio Orientativo (€)</th><th></th></tr></thead>
      <tbody>
        ${filtered.map(m => `
          <tr>
            <td style="font-size:0.75rem; color:var(--text-muted);">${esc(m.cat)}</td>
            <td><input type="text" class="inline-input" value="${esc(m.name)}" onchange="updateCatalogMat('${m.id}','name',this.value)"></td>
            <td>${esc(m.unit)}</td>
            <td><input type="number" step="0.05" class="inline-input num-input" value="${m.price}" onchange="updateCatalogMat('${m.id}','price',parseFloat(this.value)||0)"></td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteCatalogMat('${m.id}')">🗑</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderCostsTab(proj, econ) {
  renderTeamView(proj, econ);

  const rmBase = buildRoadmapData(proj, econ, false);
  const periods = payFreqOf() === 'quincenal'
    ? Math.max(1, Math.ceil(rmBase.totalSpanDays / 10))
    : Math.max(1, Math.ceil(rmBase.totalSpanDays / 5));
  const advPct = advancePctOf(proj);
  const initial25 = r2(econ.baseClientWithIva * advPct / 100);
  const rest75 = r2(econ.baseClientWithIva - initial25);
  const perPeriod = rest75 / periods;
  renderCostsCardResults(proj, econ, { advPct, initial25, rest75, periods, perPeriod });
  const profitRowClass = econ.baseNetProfit >= 0 ? 'row-summary-green' : 'row-summary-red';

  const opexWarning = econ.unchargedOpex > 0
    ? `<div style="background:#fee2e2; color:#7f1d1d; border:2px solid #b91c1c; border-radius:8px; padding:10px 12px; margin-bottom:0.9rem; font-weight:700;">⚠️ "Repercutir desplazamiento, comidas y estructura" está DESMARCADO: <strong>${fmt(econ.unchargedOpex)}</strong> de gastos NO se cobran al cliente y salen de nuestro beneficio.</div>`
    : '';
  document.getElementById('financialBreakdown').innerHTML = opexWarning + `
    <div class="form-grid" style="margin-bottom:0.9rem;">
      <div class="pdf-box">
        <div style="font-size:0.78rem; color:var(--text-muted);">Coste diario equipo (${econ.totalPeople} personas) + Gastos</div>
        <div style="font-size:1.25rem; font-weight:800; margin:0.25rem 0;">${fmt(econ.crewDailyLaborCost + econ.totalDailyOperational)} / día</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">Sueldos+S.S.: <strong>${fmt(econ.crewDailyLaborCost)}/d</strong> | Furg.+Comidas+Gestoría: <strong>${fmt(econ.totalDailyOperational)}/d</strong></div>
      </div>
      <div class="pdf-box">
        <div style="font-size:0.78rem; color:var(--text-muted);">Plan de Cobro Mano de Obra Base (IVA incl.)</div>
        <div style="font-size:1.1rem; font-weight:800; color:var(--accent); margin:0.25rem 0;">${fmtNum(advPct,0)}% inicio: ${fmt(initial25)}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">${fmtNum(100-advPct,0)}% restante (${fmt(rest75)}) en <strong>${periods} pagos ${payFreqOf() === 'quincenal' ? 'quincenales' : 'semanales'}</strong> ≈ <strong>${fmt(perPeriod)}</strong> c/u</div>
      </div>
    </div>

    <table class="pdf-table">
      <thead><tr><th>Concepto Interno (Mano de Obra Base)</th><th>Cálculo</th><th style="text-align:right;">Importe</th></tr></thead>
      <tbody>
        <tr><td>Mano de obra propia Base (Sueldos + S.S.)</td><td>${fmtNum(econ.sumOwnBaseDays, 1)} días-equipo</td><td style="text-align:right;">${fmt(econ.baseLaborCost)}</td></tr>
        <tr><td>Subcontratas Base</td><td>Coste neto que nos facturan los terceros</td><td style="text-align:right;">${fmt(econ.baseSubCost)}</td></tr>
        <tr><td>Desplazamientos + Comidas + Gestoría/RC</td><td>${fmtNum(econ.realOwnBaseDays, 1)} días reales × ${fmt(econ.totalDailyOperational)}/día</td><td style="text-align:right;">${fmt(econ.baseOperationalExpenses)}</td></tr>
        <tr class="row-summary-neutral"><td colspan="2">TOTAL COSTE REAL EMPRESA (Mano de Obra Base)</td><td style="text-align:right;">${fmt(econ.baseInternalCostAll)}</td></tr>
        <tr class="row-summary-blue"><td colspan="2">TOTAL COBRADO AL CLIENTE BASE (Sin IVA)</td><td style="text-align:right;">${fmt(econ.baseClientBase)}</td></tr>
        <tr class="${profitRowClass}"><td colspan="2">BENEFICIO NETO LIMPIO BASE — ${fmtNum(econ.baseNetProfitPct, 1)}% sobre venta / ${fmtNum(econ.baseMarkupPct, 1)}% sobre coste</td><td style="text-align:right;">${fmt(econ.baseNetProfit)}</td></tr>
      </tbody>
    </table>
  `;
}

function renderToolsTab(proj) {
  const activePhaseIds = new Set([0]);
  proj.items.forEach(i => { if (i.active) activePhaseIds.add(Number(i.phase)); });

  const filterEl = document.getElementById('toolPhaseFilter');
  const currentFilter = filterEl.value || 'all';
  filterEl.innerHTML = `<option value="all">Ver todas las fases activas</option><option value="0">Generales y EPIs</option>` +
    ROADMAP_PHASES.filter(p => activePhaseIds.has(p.id)).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  filterEl.value = currentFilter;

  const allTools = [...(appState.toolsCatalog || [])];
  const csT = crewSummary(proj);
  const nPeople = Math.max(1, csT.nTotal);
  const nOff = Math.max(1, csT.nOfficial);

  const phasesToShow = [0, ...ROADMAP_PHASES.map(p => p.id)].filter(pid => {
    if (!activePhaseIds.has(pid)) return false;
    if (currentFilter !== 'all' && Number(currentFilter) !== pid) return false;
    return true;
  });

  document.getElementById('toolsListView').innerHTML = phasesToShow.map(pid => {
    const tools = allTools.filter(t => Number(t.phase) === pid);
    if (!tools.length) return '';
    const title = pid === 0 ? 'EPIs y Herramienta Individual / General' : ROADMAP_PHASES.find(p => p.id === pid).name;

    return `
      <div class="tool-phase-box">
        <div class="tool-phase-head"><span>${esc(title)}</span><span style="font-size:0.8rem; color:var(--accent);">Equipo: ${csT.members.filter(m=>m.count>0).map(m=>m.count+' '+esc(m.role.name)).join(' + ') || 'sin personal'}</span></div>
        ${tools.map(t => {
          const qty = t.scope === 'person' ? nPeople : (t.scope === 'official' ? nOff : 1);
          const scopeText = t.scope === 'person' ? `${qty} uds (1 por persona)` : (t.scope === 'official' ? `${qty} ud/s (por oficial)` : '1 equipo compartido');
          const isChecked = !!(proj.checkedTools && proj.checkedTools[t.id]);
          return `
            <div class="tool-row ${isChecked ? 'checked' : ''}">
              <label class="checkbox-label" style="flex:1;"><input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleToolChecked('${t.id}', this.checked)"><span><strong>${esc(t.name)}</strong></span></label>
              <span class="badge badge-phase">${scopeText}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');
}

function renderInvoicesTab(proj, econ) {
  const comp = appState.company;
  const nextNorm = `${comp.invNormalPrefix || 'F-2026-'}${String(comp.invNormalNext || 1).padStart(3, '0')}`;
  const nextRect = `${comp.invRectPrefix || 'R-2026-'}${String(comp.invRectNext || 1).padStart(3, '0')}`;
  const pendingBase = Math.max(0, econ.baseClientBase - econ.alreadyBilledAdvanceBase);

  document.getElementById('invoicesControlView').innerHTML = `
    <div class="form-grid" style="margin-bottom:1rem;">
      <div class="pdf-box">
        <div style="font-size:0.78rem; color:var(--text-muted);">Presupuesto Base Ajustado (Sin IVA)</div>
        <div style="font-size:1.3rem; font-weight:800;">${fmt(econ.baseClientBase)}</div>
        <div style="font-size:0.78rem; color:var(--text-muted);">Ya facturado en anticipos activos: <strong>${fmt(econ.alreadyBilledAdvanceBase)}</strong> | Pendiente: <strong style="color:var(--accent);">${fmt(pendingBase)}</strong></div>
      </div>
      <div class="pdf-box">
        <div style="font-size:0.78rem; color:var(--text-muted);">Próximos Números Correlativos</div>
        <div style="font-size:0.9rem; margin-top:4px;">
          • Serie Normal: <strong>${esc(nextNorm)}</strong><br>
          • Serie Abono / Rectificativa: <strong>${esc(nextRect)}</strong>
        </div>
      </div>
    </div>
    <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
      <button class="btn btn-primary" onclick="emitFinalInvoice(false)">🧾 Emitir Factura Final Base (${fmt(pendingBase)} + IVA)</button>
      ${econ.optClientBase > 0 ? `<button class="btn btn-orange" onclick="emitFinalInvoice(true)">🧾 Emitir Factura Final Base + Extras (${fmt(Math.max(0, econ.grandClientBase - econ.alreadyBilledAdvanceBase))} + IVA)</button>` : ''}
      <button class="btn" onclick="openAdvanceInvModal()">💶 Emitir Factura Anticipo / Pago Semanal</button>
    </div>
  `;

  const invs = proj.invoices || [];
  if (!invs.length) {
    document.getElementById('invoicesListView').innerHTML = '<p style="color:var(--text-muted);">Todavía no hemos emitido ninguna factura ni abono en esta obra.</p>';
    return;
  }

  document.getElementById('invoicesListView').innerHTML = `
    <table class="items-table">
      <thead><tr><th>Nº Factura</th><th>Tipo / Serie</th><th>Fecha</th><th>Concepto / Referencia</th><th style="text-align:right;">Base Imponible</th><th style="text-align:right;">Total (IVA incl.)</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>
        ${invs.map(inv => {
          const isRect = inv.type === 'rectificative';
          const statusBadge = isRect
            ? '<span class="badge badge-rect">Abono / Rectificativa</span>'
            : (inv.rectifiedBy ? `<span class="badge badge-opt">Abonada por ${esc(inv.rectifiedBy)}</span>` : '<span class="badge badge-ok">Vigente</span>');
          return `
            <tr>
              <td><strong>${esc(inv.code)}</strong></td>
              <td>${isRect ? 'Serie Rectificativa' : (inv.type === 'advance' ? 'Anticipo / Parcial' : 'Factura Final')}</td>
              <td>${inv.date ? new Date(inv.date+'T12:00:00').toLocaleDateString('es-ES') : ''}</td>
              <td>
                <strong>${esc(inv.concept)}</strong>
                ${isRect ? `<div style="font-size:0.74rem; color:var(--red);">Abona factura: <strong>${esc(inv.rectifiesCode)}</strong> (${esc(inv.rectifyReason)})</div>` : ''}
              </td>
              <td style="text-align:right;">${fmt(inv.baseAmount)}</td>
              <td style="text-align:right; font-weight:800;">${fmt(inv.totalAmount)}</td>
              <td>${statusBadge}</td>
              <td style="white-space:nowrap;">
                <button class="btn btn-sm btn-primary" onclick="viewInvoicePdf('${inv.id}')">🖨️ Ver / PDF</button>
                ${!isRect && !inv.rectifiedBy ? `<button class="btn btn-sm btn-danger" onclick="openRectifyModal('${inv.id}')">↩️ Abonar (R-)</button>` : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderImagesTab(proj) {
  const grid = document.getElementById('imagesGrid');
  if (!proj.images.length) {
    grid.innerHTML = `<div style="grid-column:1/-1; padding:1.8rem; text-align:center; border:2px dashed var(--border); border-radius:10px; color:var(--text-muted);">No hay planos ni fotos subidos todavía.</div>`;
    return;
  }
  grid.innerHTML = proj.images.map(img => `
    <div class="image-card">
      <img src="${img.dataBase64}" alt="${esc(img.title)}">
      <div class="image-card-body">
        <input type="text" placeholder="Título" value="${esc(img.title)}" onchange="updateImageField('${img.id}','title',this.value)">
        <textarea rows="2" placeholder="Descripción al pie..." onchange="updateImageField('${img.id}','caption',this.value)">${esc(img.caption)}</textarea>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:5px; cursor:pointer;"><input type="checkbox" ${img.includeInPdf ? 'checked' : ''} onchange="updateImageField('${img.id}','includeInPdf',this.checked)" style="width:1rem;height:1rem;"> Incluir en PDF</label>
          <button class="btn btn-sm btn-danger" onclick="deleteImage('${img.id}')">Eliminar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderRoadmapHtml(proj, econ, forPdf = false) {
  const rmBase = buildRoadmapData(proj, econ, false);
  const rmAll = buildRoadmapData(proj, econ, true);
  if (!rmAll.activePhases.length) return '<p>No hay partidas activas.</p>';

  const maxDays = Math.max(1, rmAll.totalSpanDays);
  const startText = proj.startDate ? new Date(proj.startDate + 'T12:00:00').toLocaleDateString('es-ES') : 'Por definir';
  const endInfo = proj.startDate ? businessDaysInfo(proj.startDate, rmBase.totalSpanDays) : null;
  const endText = endInfo ? `${endInfo.text}${endInfo.skipped ? ` <span style="font-weight:400;">(salta ${endInfo.skipped} festivo${endInfo.skipped > 1 ? 's' : ''})</span>` : ''}` : `Aprox. ${Math.ceil(rmBase.totalSpanDays/5)} semanas`;

  return `
    <div class="roadmap-summary-bar">
      <div><strong>Plazo Presupuesto Base:</strong> ${rmBase.totalSpanDays} días laborables · entre ${Math.max(1, Math.round(rmBase.totalSpanDays / 5))} y ${Math.ceil(rmBase.totalSpanDays * 1.15 / 5)} semanas <span style="font-weight:400;">(incluye esperas de secado y fraguado; puede variar por suministros, decisiones del cliente o causas ajenas)</span></div>
      <div><strong>Inicio:</strong> ${startText} &nbsp;|&nbsp; <strong>Entrega Base:</strong> ${endText}</div>
    </div>
    <div>
      ${rmAll.activePhases.map(ph => {
        const leftPct = (ph.startDay / maxDays) * 100;
        const widthPct = Math.max(3, (ph.durationDays / maxDays) * 100);
        const dStart = Math.floor(ph.startDay) + 1;
        const dEnd = Math.max(dStart, Math.ceil(ph.endDay));
        const intervalText = dStart === dEnd ? `Día ${dStart}` : `Días ${dStart} → ${dEnd}`;
        return `
          <div class="gantt-row">
            <div>
              <div style="font-weight:700; font-size:0.86rem;">${esc(ph.name)} ${ph.onlyOptional ? '<span class="badge badge-opt">Solo Extra</span>' : ''}</div>
              <div style="font-size:0.76rem; color:var(--text-muted);">${esc(ph.desc)}</div>
            </div>
            <div class="gantt-bar-col">
              <div class="gantt-meta"><span class="gantt-interval">${intervalText}</span><span class="gantt-duration">Duración: ${fmtNum(ph.durationDays, 1)} días</span></div>
              <div class="gantt-track"><div class="gantt-bar ${ph.hasSub ? 'has-sub' : ''}" style="left:${leftPct}%; width:${Math.min(100-leftPct, widthPct)}%;"></div></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRoadmapTab(proj, econ) {
  document.getElementById('projStartDate').value = proj.startDate || '';
  document.getElementById('roadmapInternalView').innerHTML = renderRoadmapHtml(proj, econ, false);
}

function renderSettingsTab() {
  renderPricingManager();
  renderRolesManager();
  renderPeopleManager();
  const c = appState.company;
  document.getElementById('compName').value = c.name || '';
  document.getElementById('compCif').value = c.cif || '';
  document.getElementById('compPhone').value = c.phone || '';
  document.getElementById('compEmail').value = c.email || '';
  document.getElementById('compAddress').value = c.address || '';
  document.getElementById('compIban').value = c.iban || '';
  document.getElementById('compInvPrefix').value = c.invNormalPrefix || 'F-2026-';
  document.getElementById('compInvNext').value = c.invNormalNext || 1;
  document.getElementById('compRectPrefix').value = c.invRectPrefix || 'R-2026-';
  document.getElementById('compRectNext').value = c.invRectNext || 1;
  document.getElementById('compWorkDays').value = c.workDaysPerMonth || 21;
  document.getElementById('compHoursDay').value = c.hoursPerDay || 8;
  document.getElementById('compGestoria').value = c.monthlyGestoria || 0;
  document.getElementById('compInsurance').value = c.monthlyInsurance || 0;
  document.getElementById('compOtherOverhead').value = c.monthlyOtherOverhead || 0;
  document.getElementById('compConditions').value = c.conditions || '';
  document.getElementById('compVariations').value = c.variationsText || DEFAULT_VARIATIONS_TEXT;
  const hEl = document.getElementById('compHolidays');
  if (hEl && document.activeElement !== hEl) hEl.value = holidaysToText(c.holidays);
  const hc = document.getElementById('holidayCount'); if (hc) hc.textContent = (c.holidays || []).length;

  const preview = document.getElementById('settingsLogoPreview');
  preview.innerHTML = c.logoBase64
    ? `<img src="${c.logoBase64}" style="max-height:65px; background:#fff; border:1px solid var(--border); padding:4px; border-radius:6px;"> <button class="btn btn-sm btn-danger" onclick="removeLogo()">Quitar</button>`
    : '<span style="font-size:0.8rem; color:var(--text-muted);">Sin logo subido.</span>';
}
// ---------- Pestaña 3 en tarjetas ----------
function advancePctOf(proj) {
  const v = Number(calcG().advancePct);
  return isFinite(v) ? Math.min(100, Math.max(0, v)) : 25;
}
function renderCrewMembers(proj, econ) {
  const box = document.getElementById('crewMembersView');
  if (!box) return;
  const cs = econ.crewInfo || crewSummary(proj);
  const roles = appState.company.roles || [];
  const cards = cs.members.map(m => {
    const typeTxt = (ROLE_TYPES[m.role.type] || {}).short || '';
    const ovr = m.overridden;
    return `<div class="card eq-card eq-person">
      <div class="eq-head"><span class="eq-icon">${m.role.icon || '👷'}</span>
        <div><div class="eq-name">${esc(m.role.name)}</div><div class="eq-sub">${esc(typeTxt)}${m.role.type === 'supervisa' ? ' · no suma horas' : ''}</div></div>
        <button class="btn btn-sm btn-danger eq-del" onclick="removeMember('${m.id}')" title="Quitar este puesto de esta obra">✕</button></div>
      <div class="eq-fields">
        <label class="eq-field"><span>👥 Personas <i class="info-icon" data-help="personasPuesto">i</i></span>
          <span class="eq-stepper"><button type="button" class="btn btn-sm" onclick="updateMember('${m.id}','count',Math.max(0,${m.count}-1))" aria-label="Una persona menos">−</button>
          <input type="number" min="0" step="1" value="${m.count}" onchange="updateMember('${m.id}','count',Math.max(0,parseInt(this.value)||0))">
          <button type="button" class="btn btn-sm" onclick="updateMember('${m.id}','count',${m.count}+1)" aria-label="Una persona más">+</button></span></label>
        <label class="eq-field"><span>💶 Sueldo/día ${ovr ? '<b class="eq-own" title="Sueldo propio de esta obra">✏️ propio</b>' : ''} <i class="info-icon" data-help="sueldoDia">i</i></span>
          <input type="number" min="0" step="1" value="${m.wage}" onchange="updateMember('${m.id}','wage',parseFloat(this.value)||0)"></label>
        <label class="eq-field"><span>🏛️ S.S./mes <i class="info-icon" data-help="ssMes">i</i></span>
          <input type="number" min="0" step="1" value="${m.ss}" onchange="updateMember('${m.id}','ss',parseFloat(this.value)||0)"></label>
      </div>
      ${ovr ? `<button class="btn btn-sm eq-reset" onclick="resetMemberWage('${m.id}')">↺ Usar el sueldo normal de la empresa (${fmt(m.role.wage)}/día)</button>` : ''}
      <div class="eq-result">Cada uno nos cuesta <strong>${fmt(m.perPerson)}/día</strong>${m.count ? ` · los ${m.count}: <strong>${fmt(m.daily)}/día</strong>` : ''}</div>
    </div>`;
  }).join('');
  const free = roles.filter(r => !cs.members.some(m => m.roleId === r.id));
  box.innerHTML = cards + `<div class="card eq-card eq-add">
      <div class="eq-head"><span class="eq-icon">+</span><div><div class="eq-name">Añadir un puesto</div><div class="eq-sub">De los puestos de nuestra empresa</div></div></div>
      ${free.length ? `<select id="addMemberRole">${free.map(r => `<option value="${r.id}">${r.icon} ${esc(r.name)}</option>`).join('')}</select>
      <button class="btn btn-primary" onclick="addMemberToProject()"><b class="plus">+</b> Añadir a esta obra</button>` : `<div class="eq-sub">Ya están todos. Crea más en la pestaña «Empresa».</div>`}
      <button class="btn btn-sm" onclick="switchTab('settings'); setTimeout(()=>document.getElementById('rolesManagerView')?.scrollIntoView({behavior:'smooth',block:'center'}),80)">⚙️ Crear o cambiar puestos (pestaña «Empresa»)</button>
      <div class="eq-result">Equipo: <strong>${cs.nWorking}</strong> trabajando${cs.nTotal > cs.nWorking ? ` + ${cs.nTotal - cs.nWorking} supervisando` : ''} · <strong>${fmt(cs.laborDaily)}/día</strong> en sueldos y S.S.</div>
    </div>`;
}
function setPlanning(f, v) { const p = getCurrentProject(); p.planning = p.planning || {}; p.planning[f] = v; saveState(); renderAll(); }
function renderPlazoCard(proj, econ) {
  const el = document.getElementById('eqPlazoView'); if (!el) return;
  const PL = econ.planning, PR = econ.pricing;
  const ph = econ.rmPlazo.activePhases;
  const waits = ph.slice(0, -1).reduce((t, f) => t + (f.waitDays || 0), 0);
  const work = econ.plazoDays - waits;
  const eh = econ.salePerHour, ok = eh >= PR.minHourRate;
  el.innerHTML = `
    <div class="eq-fields">
      <label class="eq-field"><span>🕳️ Tiempo improductivo (%) ${helpIcon('improductivo')}</span><input type="number" min="0" max="100" step="5" value="${PL.idlePct}" onchange="setPlanning('idlePct', Math.max(0, parseFloat(this.value)||0))"></label>
    </div>
    <label class="checkbox-label eq-check"><input type="checkbox" ${PL.crewFull ? 'checked' : ''} onchange="setPlanning('crewFull', this.checked)"> El equipo está en esta obra todo el plazo (también en las esperas) ${helpIcon('equipoTodoPlazo')}</label>
    <div class="eq-result">Plazo: <strong>${econ.plazoDays} días laborables</strong> (≈ ${fmtNum(econ.plazoDays / 5, 1)} semanas)<br>
      <span class="eq-sub">trabajo ${fmtNum(work, 0)} días · esperas de secado ${fmtNum(waits, 0)} días · con ${fmtNum(PL.idlePct, 0)}% improductivo</span></div>
    <div class="eq-result ${ok ? '' : 'eq-bad'}">${ok ? '🟢' : '🔴'} Cobramos <strong>${fmt(eh)} por hora y persona</strong> ${ok ? '' : `<br><span class="eq-warn">Por debajo de nuestro mínimo (${fmt(PR.minHourRate)}/h)</span>`}</div>`;
}
function renderCostsCardResults(proj, econ, pay) {
  renderPlazoCard(proj, econ);
  const c = proj.crew, cs = econ.crewInfo;
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('eqTravelRes', `Nos cuesta <strong>${fmt(econ.dailyTravelCost)}/día</strong>${Number(proj.crew.vanDailyFixed) > 0 ? ' (fijo; no se usan los km)' : ''}`);
  set('eqMealRes', `${cs.nWorking} persona${cs.nWorking === 1 ? '' : 's'} → <strong>${fmt(econ.dailyMealCost)}/día</strong>`);
  set('eqOverheadRes', c.includeOverhead ? `Cada día de obra paga <strong>${fmt(econ.dailyOverhead)}</strong>` : `<span class="eq-warn">⚠️ No se cuentan: esos gastos no los paga ninguna obra</span>`);
  set('eqParallelRes', econ.planning.crewFull ? `No hace falta: el <strong>plazo real</strong> ya cuenta los días que estamos en la obra` : `Días con gastos: <strong>${fmtNum(econ.realOwnBaseDays, 1)}</strong> de ${fmtNum(econ.sumOwnBaseDays, 1)}`);
  const m = Number(c.ownMarginPct) || 0;
  set('eqMarginRes', `Un ${fmtNum(m, 0)}% sobre coste = <strong>${fmtNum(m / (100 + m) * 100, 1)}% del precio</strong> de venta`);
  set('eqDistribRes', c.distributeExpenses ? `✅ Incluidos en el precio` : `<span class="eq-warn">⚠️ Los pagamos nosotros: ${fmt(econ.unchargedOpex)} menos de beneficio</span>`);
  set('eqPayRes', `Entrada <strong>${fmt(pay.initial25)}</strong> + ${pay.periods} pagos de <strong>${fmt(pay.perPeriod)}</strong> (IVA incl.)`);
  { const wages = (econ.crewInfo.members.reduce((t, m) => t + m.count * m.wage, 0)) * (econ.planning.crewFull ? econ.plazoDays : 0);
    set('eqSummaryLine', `Cobramos <strong>${fmt(econ.baseClientBase)}</strong> (sin IVA) · nos cuesta <strong>${fmt(econ.baseInternalCostAll)}</strong> (incluye nuestros sueldos) · la empresa gana <strong class="${econ.baseNetProfit >= 0 ? 'eq-good' : 'eq-warn'}">${fmt(econ.baseNetProfit)}</strong>${wages ? `<br>👥 Para el equipo: sueldos <strong>${fmt(wages)}</strong> + beneficio <strong>${fmt(econ.baseNetProfit)}</strong> = <strong>${fmt(wages + econ.baseNetProfit)}</strong> entre todos` : ''}`); }
}

// ---------- Precios mínimos y plazos reales (pestaña «Empresa») ----------
const PRICING_FIELDS = [
  ['realityFactor', '📏 Factor de realidad (× horas de libro)', 0.05, 'factorRealidad'],
  ['minHourRate', '💶 Tarifa mínima media (€/hora y persona)', 1, 'tarifaMinima'],
  ['minJobLabor', '🧾 Mínimo de cualquier trabajo (€ de mano de obra)', 10, 'minimoTrabajo'],
  ['minItemHours', '⏱️ Mínimo por partida propia (horas)', 0.5, 'minimoPartida'],
  ['minSubCharge', '🔧 Salida mínima de una subcontrata (€)', 10, 'minimoSub'],
  ['coordPct', '🗂️ Medios auxiliares y coordinación (%)', 0.5, 'coordinacion'],
  ['idlePctDefault', '🕳️ Tiempo improductivo en obras nuevas (%)', 5, 'improductivo'],
  ['targetMonthlyMin', '👥 Objetivo: cada uno al mes, mínimo (€)', 100, 'objetivoMes'],
  ['targetMonthlyMax', '👥 Objetivo: cada uno al mes, máximo (€)', 100, 'objetivoMes'],
  ['netWagePct', '🧾 Del sueldo bruto queda limpio (%)', 0.5, 'liquido'],
  ['netProfitPct', '🧾 Del beneficio repartido queda limpio (%)', 0.5, 'liquido']
];
function setPricing(f, v) { const c = appState.company; c.pricing = c.pricing || {}; c.pricing[f] = v; saveState(); renderAll(); }
function setWaitRule(key, v) { const c = appState.company; c.pricing = c.pricing || {}; c.pricing.waitDays = c.pricing.waitDays || {}; c.pricing.waitDays[key] = v; saveState(); renderAll(); }
function renderPricingManager() {
  const box = document.getElementById('pricingManagerView'); if (!box) return;
  const PR = pricingSettings();
  box.innerHTML = `<div class="eq-grid">
    <div class="card eq-card"><div class="eq-head"><span class="eq-icon">💶</span><div><div class="eq-name">Mínimos y tarifa</div><div class="eq-sub">Para no pillarse los dedos</div></div></div>
      <div class="eq-fields">${PRICING_FIELDS.map(([k, l, st, h]) => `<label class="eq-field"><span>${l} ${helpIcon(h)}</span><input type="number" min="0" step="${st}" value="${PR[k]}" onchange="setPricing('${k}', Math.max(0, parseFloat(this.value)||0))"></label>`).join('')}</div></div>
    <div class="card eq-card"><div class="eq-head"><span class="eq-icon">⏳</span><div><div class="eq-name">Esperas de secado y fraguado ${helpIcon('esperas')}</div><div class="eq-sub">Días laborables que hay que esperar después de cada trabajo</div></div></div>
      <div class="eq-fields">${PR.waitRules.map(r => `<label class="eq-field"><span>${esc(r.label)}</span><input type="number" min="0" step="0.5" value="${r.days}" onchange="setWaitRule('${r.key}', Math.max(0, parseFloat(this.value)||0))"></label>`).join('')}</div></div>
  </div>`;
}
