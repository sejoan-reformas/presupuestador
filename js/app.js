const A11Y_KEY = 'reformasPro_a11y_v1';

// true si este navegador no tenía datos guardados y se ha arrancado con el ejemplo
let localIsFreshDefault = false;
let appState = loadState();
let a11yState = loadA11y();
let currentMeasureItemId = null;
let tempMeasures = [];
let currentRecipeItemId = null;
let tempRecipe = [];
let currentRectifyInvoiceId = null;

function loadA11y() {
  try {
    const raw = localStorage.getItem(A11Y_KEY);
    if (!raw) return { theme: 'light', zoomPct: 110 };
    const p = JSON.parse(raw);
    return { theme: p.theme === 'dark' ? 'dark' : 'light', zoomPct: Math.min(180, Math.max(80, Number(p.zoomPct) || 100)) };
  } catch (e) { return { theme: 'light', zoomPct: 100 }; }
}
function saveA11y() { try { localStorage.setItem(A11Y_KEY, JSON.stringify(a11yState)); } catch (e) {} }
function applyA11y() {
  document.documentElement.setAttribute('data-theme', a11yState.theme);
  document.documentElement.style.fontSize = (16 * (a11yState.zoomPct / 100)) + 'px';
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.innerHTML = a11yState.theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
  const zoomDisp = document.getElementById('zoomDisplay');
  if (zoomDisp) zoomDisp.textContent = a11yState.zoomPct + '%';
}
function toggleTheme() { a11yState.theme = a11yState.theme === 'dark' ? 'light' : 'dark'; saveA11y(); applyA11y(); }
function changeZoom(delta) { a11yState.zoomPct = Math.min(180, Math.max(80, a11yState.zoomPct + delta)); saveA11y(); applyA11y(); }
function resetZoom() { a11yState.zoomPct = 100; saveA11y(); applyA11y(); }

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { localIsFreshDefault = true; return getDefaultState(); }
    const parsed = JSON.parse(raw);
    if (!parsed.projects || !parsed.projects.length) return getDefaultState();

    if (!parsed.version || parsed.version < 4) {
      parsed.version = 4;
      if (!parsed.company.invNormalPrefix) parsed.company.invNormalPrefix = 'F-2026-';
      if (!parsed.company.invNormalNext) parsed.company.invNormalNext = 1;
      if (!parsed.company.invRectPrefix) parsed.company.invRectPrefix = 'R-2026-';
      if (!parsed.company.invRectNext) parsed.company.invRectNext = 1;
      if (!parsed.company.iban) parsed.company.iban = 'ES00 0000 0000 00 0000000000';
      if (!parsed.materialsCatalog) parsed.materialsCatalog = JSON.parse(JSON.stringify(DEFAULT_MATERIALS_CATALOG));
      if (!parsed.toolsCatalog) parsed.toolsCatalog = JSON.parse(JSON.stringify(DEFAULT_TOOLS_CATALOG));

      const freshDemo = createDefaultFuengirolaProject();
      const oldIdx = parsed.projects.findIndex(p => p.id.startsWith('proj_fuengirola'));
      if (oldIdx >= 0) {
        freshDemo.images = parsed.projects[oldIdx].images || [];
        freshDemo.invoices = parsed.projects[oldIdx].invoices || [];
        parsed.projects[oldIdx] = freshDemo;
      } else {
        parsed.projects.unshift(freshDemo);
      }
      parsed.projects.forEach(p => {
        if (!p.materialOverrides) p.materialOverrides = {};
        if (!p.invoices) p.invoices = [];
      });
      parsed.currentProjectId = freshDemo.id;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) { return getDefaultState(); }
}

function saveState() {
  appState.savedAt = Date.now();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); }
  catch (e) {
    if (!(fileStore.dirHandle && fileStore.status !== 'needs-permission')) alert('Memoria del navegador llena (reduce imágenes o conecta la carpeta de datos).');
  }
  fsScheduleSave();
  if (typeof driveScheduleSync === 'function') driveScheduleSync();
  undoRecord();
}

function getCurrentProject() {
  let p = appState.projects.find(x => x.id === appState.currentProjectId);
  if (!p) { p = appState.projects[0]; appState.currentProjectId = p.id; }
  return p;
}

function renderAll() {
  ensureTemplatesAndLibrary();
  ensureHolidays();
  ensureCrewRoles();
  ensurePricing();
  ensureCalcData();
  const proj = getCurrentProject();
  const econ = calculateProjectEconomics(proj);
  renderTopbar();
  renderPrivateKpiBar(proj, econ);
  renderChecklistTab(proj, econ);
  renderMaterialsTab(proj, econ);
  renderCostsTab(proj, econ);
  renderToolsTab(proj);
  renderImagesTab(proj);
  renderRoadmapTab(proj, econ);
  renderInvoicesTab(proj, econ);
  renderRealHoursTab(proj, econ);
  renderStaffTab(proj, econ);
  renderVisitsTab();
  renderPriceTab(proj, econ);
  renderCalcDataTab();
  renderVisitNotesBox(proj);
  renderPdfTab(proj, econ);
  renderSettingsTab();
  renderLibraryManager();
}

// Bloques: 📝 Presupuesto (para el cliente) · 🔨 Obra en marcha (interno) · ⚙️ Empresa
const lastTabOfGroup = { presu: 'checklist', obra: 'roadmap', empresa: 'settings' };
function switchGroup(g) { switchTab(lastTabOfGroup[g] || document.querySelector(`.tab-btn[data-group="${g}"]`).dataset.tab); }
function showGroupOf(tabId) {
  const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`); if (!btn) return;
  const g = btn.dataset.group; lastTabOfGroup[g] = tabId;
  document.querySelectorAll('.group-btn').forEach(b => b.classList.toggle('active', b.dataset.group === g));
  document.querySelectorAll('.tab-btn').forEach(b => { b.hidden = b.dataset.group !== g; });
  document.body.dataset.group = g;
}
function switchTab(tabId, btn) {
  showGroupOf(tabId);
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const targetBtn = btn || document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (targetBtn) targetBtn.classList.add('active');
  document.getElementById('panel-' + tabId).classList.add('active');
  document.body.classList.toggle('tab-visits', tabId === 'visits');
  if (tabId === 'pdf') renderPdfTab(getCurrentProject(), calculateProjectEconomics(getCurrentProject()));
}

function selectProject(id) { pdfPreviewMode = 'budget'; appState.currentProjectId = id; saveState(); renderAll(); }
function getNextProjectCode() {
  const pref = 'PRES-' + new Date().getFullYear() + '-';
  let max = 0;
  appState.projects.forEach(p => {
    if (p.code && p.code.startsWith(pref)) { const n = parseInt(p.code.slice(pref.length), 10); if (n > max) max = n; }
  });
  return pref + String(max + 1).padStart(3, '0');
}
function createNewProject() {
  const name = prompt('Nombre del nuevo presupuesto / cliente:', 'Reforma - Nuevo Cliente');
  if (!name) return;
  const base = createDefaultFuengirolaProject();
  base.id = 'proj_' + Date.now();
  base.title = name;
  base.code = getNextProjectCode();
  base.date = todayLocalStr();
  base.client = { name, nif: '', phone: '', email: '', projectAddress: '' };
  base.images = []; base.checkedTools = {}; base.materialOverrides = {}; base.invoices = [];
  appState.projects.push(base);
  appState.currentProjectId = base.id;
  pdfPreviewMode = 'budget';
  saveState(); renderAll();
}
function duplicateCurrentProject() {
  const curr = getCurrentProject();
  const copy = JSON.parse(JSON.stringify(curr));
  copy.id = 'proj_' + Date.now();
  copy.title = curr.title + ' (Copia)';
  copy.code = curr.code + '-B';
  copy.invoices = [];
  copy.items.forEach(i => { delete i.realHours; });
  copy.status = 'borrador'; copy.statusDates = {};
  appState.projects.push(copy);
  appState.currentProjectId = copy.id;
  pdfPreviewMode = 'budget';
  saveState(); renderAll();
}
function deleteCurrentProject() {
  if (appState.projects.length <= 1) return alert('Debe quedar al menos un presupuesto.');
  const curr = getCurrentProject();
  if (!confirm(`¿Eliminar "${curr.title}"?`)) return;
  appState.projects = appState.projects.filter(p => p.id !== curr.id);
  appState.currentProjectId = appState.projects[0].id;
  saveState(); renderAll();
}

function updateProjField(f, v) { getCurrentProject()[f] = v; saveState(); renderAll(); }
function updateClientField(f, v) { getCurrentProject().client[f] = v; saveState(); renderAll(); }
function updateCrewField(f, v) { getCurrentProject().crew[f] = v; saveState(); renderAll(); }
function updateCompanyField(f, v) { appState.company[f] = v; saveState(); renderAll(); }

function toggleChapterOptional(chId) {
  const ch = getCurrentProject().chapters.find(c => c.id === chId);
  if (ch) { ch.isOptional = !ch.isOptional; saveState(); renderAll(); }
}
function toggleItemActive(id, val) {
  const item = getCurrentProject().items.find(i => i.id === id);
  if (item) { item.active = val; saveState(); renderAll(); }
}
function updateItem(id, f, v) {
  const item = getCurrentProject().items.find(i => i.id === id);
  if (item) { item[f] = v; saveState(); renderAll(); }
}
function deleteItem(id) {
  if (!confirm('¿Eliminar partida?')) return;
  const p = getCurrentProject();
  p.items = p.items.filter(i => i.id !== id);
  saveState(); renderAll();
}
function deleteChapter(chId) {
  const p = getCurrentProject();
  if (!confirm('¿Eliminar este capítulo y sus partidas?')) return;
  p.chapters = p.chapters.filter(c => c.id !== chId);
  p.items = p.items.filter(i => i.chapterId !== chId);
  saveState(); renderAll();
}

// RECETAS DE MATERIALES POR PARTIDA Y AJUSTES MANUALES
function openRecipeModal(itemId) {
  const item = getCurrentProject().items.find(i => i.id === itemId);
  if (!item) return;
  currentRecipeItemId = itemId;
  tempRecipe = JSON.parse(JSON.stringify(item.matRecipe || []));
  document.getElementById('recipeModalTitle').textContent = 'Materiales para: ' + item.name;
  document.getElementById('recipeModalSubtitle').innerHTML = `¿Qué materiales gasta este trabajo y <strong>cuánto por cada 1 ${esc(item.unit)}</strong>? Ej.: alicatado → cola 0,22 sacos por m², junta 0,15 bolsas por m².<br>El <strong>total</strong> se calcula solo con la medición de esta obra (<strong>${fmtNum(item.qty, 2)} ${esc(item.unit)}</strong>) y va a la lista de materiales de la pestaña «Materiales», que el cliente ve como previsión.`;
  const sf = document.getElementById('sfRecipe'); if (sf) sf.value = '';
  renderRecipeLines(item.qty, item.unit);
  document.getElementById('recipeModal').classList.add('open');
}

function renderRecipeLines(itemQty, itemUnit) {
  const cat = appState.materialsCatalog || [];
  if (!tempRecipe.length) {
    document.getElementById('recipeLinesList').innerHTML = '<p style="color:var(--text-muted);">Este trabajo no gasta materiales todavía (o los pone la subcontrata). Pulsa <strong>"+ Añadir otro material"</strong> para poner el primero.</p>';
    return;
  }
  document.getElementById('recipeLinesList').innerHTML = `<div class="rl-head"><span>Material del catálogo (unidad de compra)</span><span>Cantidad por 1 ${esc(itemUnit)}</span><span>Total para esta obra</span><span></span></div>` + tempRecipe.map((rec, idx) => {
    const m = cat.find(x => x.id === rec.matId);
    const totalEst = (Number(itemQty) || 0) * (Number(rec.factor) || 0);
    const rounded = m && m.roundUp && totalEst > 0 && Math.ceil(totalEst) !== Number(totalEst.toFixed(2));
    return `
      <div class="recipe-line" style="display:grid; grid-template-columns:2fr 1fr 1.2fr auto; gap:8px; align-items:center; margin-bottom:8px;">
        <select onchange="tempRecipe[${idx}].matId=this.value; renderRecipeLines(${itemQty},'${esc(itemUnit)}')">
          ${cat.map(cm => `<option value="${cm.id}" ${cm.id===rec.matId?'selected':''}>${esc(cm.name)} (${esc(cm.unit)})</option>`).join('')}
        </select>
        <div>
          <input type="number" step="0.01" value="${rec.factor}" aria-label="Cantidad por 1 ${esc(itemUnit)}" oninput="tempRecipe[${idx}].factor=parseFloat(this.value)||0; this.closest('.recipe-line').querySelector('.rl-total').textContent=fmtNum((${Number(itemQty)||0})*(parseFloat(this.value)||0),2)">
        </div>
        <div style="font-size:0.8rem; color:var(--accent);">
          <strong><span class="rl-total">${fmtNum(totalEst, 2)}</span> ${m ? esc(m.unit) : ''}</strong>${rounded ? `<div style="font-size:0.72rem; color:var(--text-muted);">se compran ${Math.ceil(totalEst)} (enteros)</div>` : ''}
        </div>
        <button class="btn btn-sm btn-danger" onclick="tempRecipe.splice(${idx},1); renderRecipeLines(${itemQty},'${esc(itemUnit)}')">✕</button>
      </div>
    `;
  }).join('');
}

function addRecipeLine() {
  const item = getCurrentProject().items.find(i => i.id === currentRecipeItemId);
  const firstMat = appState.materialsCatalog[0]?.id || 'm_arena';
  tempRecipe.push({ matId: firstMat, factor: 1 });
  renderRecipeLines(item.qty, item.unit);
}
function closeRecipeModal() { document.getElementById('recipeModal').classList.remove('open'); }
function saveRecipeModal() {
  const item = getCurrentProject().items.find(i => i.id === currentRecipeItemId);
  if (item) {
    item.matRecipe = tempRecipe;
    saveState(); renderAll();
  }
  closeRecipeModal();
}

function setMaterialOverride(ovKey, val) {
  const proj = getCurrentProject();
  if (!proj.materialOverrides) proj.materialOverrides = {};
  proj.materialOverrides[ovKey] = isNaN(val) ? 0 : val;
  saveState(); renderAll();
}
function clearMaterialOverride(ovKey) {
  const proj = getCurrentProject();
  if (proj.materialOverrides) delete proj.materialOverrides[ovKey];
  saveState(); renderAll();
}

function updateCatalogMat(id, field, val) {
  const m = appState.materialsCatalog.find(x => x.id === id);
  if (m) { m[field] = val; saveState(); renderAll(); }
}
function deleteCatalogMat(id) {
  if (!confirm('¿Borrar material del catálogo?')) return;
  appState.materialsCatalog = appState.materialsCatalog.filter(x => x.id !== id);
  saveState(); renderAll();
}
function openAddCatalogMatModal() { document.getElementById('catMatName').value = ''; document.getElementById('addCatalogMatModal').classList.add('open'); }
function closeAddCatalogMatModal() { document.getElementById('addCatalogMatModal').classList.remove('open'); }
function saveNewCatalogMat() {
  const name = document.getElementById('catMatName').value.trim();
  if (!name) return;
  appState.materialsCatalog.push({ id: 'm_custom_' + Date.now(), cat: document.getElementById('catMatCat').value, name, unit: document.getElementById('catMatUnit').value, price: parseFloat(document.getElementById('catMatPrice').value) || 0, roundUp: true });
  saveState(); closeAddCatalogMatModal(); renderAll();
}
function openAddExtraMatModal() {
  document.getElementById('extraMatSelect').innerHTML = appState.materialsCatalog.map(m => `<option value="${m.id}">${esc(m.name)} (${fmt(m.price)}/${m.unit})</option>`).join('');
  const sf = document.getElementById('sfExtraMat'); if (sf) { sf.value = ''; applySelectFilter(sf); setTimeout(() => sf.focus(), 50); }
  updateExtraMatUnit();
  document.getElementById('addExtraMatModal').classList.add('open');
}
function updateExtraMatUnit() {
  const m = appState.materialsCatalog.find(x => x.id === document.getElementById('extraMatSelect').value);
  const el = document.getElementById('extraMatUnit'); if (el) el.textContent = m ? m.unit : '';
}
function closeAddExtraMatModal() { document.getElementById('addExtraMatModal').classList.remove('open'); }
function saveExtraMat() {
  const proj = getCurrentProject();
  if (!proj.extraMaterials) proj.extraMaterials = [];
  proj.extraMaterials.push({ id: 'em_' + Date.now(), matId: document.getElementById('extraMatSelect').value, qty: parseFloat(document.getElementById('extraMatQty').value) || 1 });
  saveState(); closeAddExtraMatModal(); renderAll();
}
function deleteExtraMat(id) {
  const proj = getCurrentProject();
  proj.extraMaterials = (proj.extraMaterials || []).filter(x => x.id !== id);
  saveState(); renderAll();
}

// ============================================================
// FACTURACIÓN Y ABONOS (SERIES F- Y R-)
// ============================================================
// Si el prefijo lleva un año distinto al actual (p.ej. F-2026- en 2027), se actualiza y el contador vuelve a 1
function rollSeriesYear(prefixKey, nextKey, letter) {
  const c = appState.company;
  const y = String(new Date().getFullYear());
  let pref = c[prefixKey] || `${letter}-${y}-`;
  const m = pref.match(/20\d\d/);
  if (m && m[0] !== y) { pref = pref.replace(m[0], y); c[nextKey] = 1; }
  c[prefixKey] = pref;
  return pref;
}
function getNextNormalCode() {
  const c = appState.company;
  const pref = rollSeriesYear('invNormalPrefix', 'invNormalNext', 'F');
  const num = Number(c.invNormalNext) || 1;
  c.invNormalNext = num + 1;
  return `${pref}${String(num).padStart(3, '0')}`;
}
function getNextRectCode() {
  const c = appState.company;
  const pref = rollSeriesYear('invRectPrefix', 'invRectNext', 'R');
  const num = Number(c.invRectNext) || 1;
  c.invRectNext = num + 1;
  return `${pref}${String(num).padStart(3, '0')}`;
}

function emitFinalInvoice(includeExtras) {
  const proj = getCurrentProject();
  const econ = calculateProjectEconomics(proj);
  const ivaRate = (Number(proj.ivaPct) || 10) / 100;

  const activeItems = proj.items.filter(i => {
    if (!i.active) return false;
    if (!includeExtras && isChapterOptional(proj, i.chapterId)) return false;
    return true;
  });
  if (!activeItems.length) return alert('No hay partidas activas para facturar.');

  const existingFinal = (proj.invoices || []).find(inv => inv.type === 'final' && !inv.rectifiedBy);
  if (existingFinal) {
    return alert(`Esta obra ya tiene la factura final ${existingFinal.code}.\n\nSi hay que cambiarla, primero abónala (rectificativa) y luego emite la nueva.`);
  }

  const grossWorkBase = includeExtras ? econ.grandClientBase : econ.baseClientBase;
  const advancesToDeduct = econ.activeAdvances || [];
  const deductedTotalBase = econ.alreadyBilledAdvanceBase || 0;
  if (deductedTotalBase > grossWorkBase) {
    return alert(`Los anticipos facturados (${fmt(deductedTotalBase)}) superan el total de trabajos (${fmt(grossWorkBase)}).\n\nNo se emite factura final a 0 €: abona (rectifica) el anticipo que sobre y vuelve a intentarlo.`);
  }
  if (!confirm(`¿Emitir FACTURA FINAL?\n\nTrabajos: ${fmt(grossWorkBase)}\nAnticipos descontados: ${fmt(deductedTotalBase)}\nBase imponible: ${fmt(grossWorkBase - deductedTotalBase)} + IVA\n\nSe consumirá un número de la serie F.`)) return;
  const netBase = r2(grossWorkBase - deductedTotalBase);

  const lines = activeItems.map(i => {
    const r = econ.itemResults[i.id];
    return { name: i.name, desc: i.desc, qty: i.qty, unit: i.unit, unitPrice: r.clientUnit, total: r.clientTotal };
  });

  if (deductedTotalBase > 0) {
    lines.push({
      name: 'Deducción de facturas de anticipo / certificaciones previas',
      desc: advancesToDeduct.map(a => `${a.code} (${fmt(a.baseAmount)})`).join(', '),
      qty: 1, unit: 'PA', unitPrice: -deductedTotalBase, total: -deductedTotalBase
    });
  }

  const ivaAmount = r2(netBase * ivaRate);
  const totalAmount = r2(netBase + ivaAmount);
  const code = getNextNormalCode();

  if (!proj.invoices) proj.invoices = [];
  proj.invoices.push({
    id: 'inv_' + Date.now(),
    code,
    type: 'final',
    date: todayLocalStr(),
    concept: `Liquidación Final Mano de Obra — ${proj.client.projectAddress || proj.title}`,
    ivaPct: proj.ivaPct || 10,
    grossWorkBase,
    deductedAdvances: advancesToDeduct.map(a => ({ code: a.code, date: a.date, baseAmount: a.baseAmount })),
    baseAmount: netBase,
    ivaAmount,
    totalAmount,
    lines,
    rectifiedBy: null
  });

  markAcceptedIfNeeded(proj);
  saveState();
  renderAll();
  viewInvoicePdf(proj.invoices[proj.invoices.length - 1].id);
}

function openAdvanceInvModal() {
  const proj = getCurrentProject();
  const econ = calculateProjectEconomics(proj);
  document.getElementById('advInvConcept').value = `Entrega inicial ${fmtNum(advancePctOf(proj),0)}% a cuenta de reforma integral`;
  document.getElementById('advInvAmount').value = (econ.baseClientBase * advancePctOf(proj) / 100).toFixed(2);
  document.getElementById('advInvDate').value = todayLocalStr();
  document.getElementById('advanceInvModal').classList.add('open');
  updateAdvancePreview();
}
function closeAdvanceInvModal() { document.getElementById('advanceInvModal').classList.remove('open'); }
function fill25PercentAdvance() {
  const econ = calculateProjectEconomics(getCurrentProject());
  document.getElementById('advInvAmount').value = (econ.baseClientBase * advancePctOf(getCurrentProject()) / 100).toFixed(2);
  updateAdvancePreview();
}
// Cuenta en vivo: base + IVA = total
function updateAdvancePreview() {
  const el = document.getElementById('advInvPreview'); if (!el) return;
  const base = r2(parseFloat(document.getElementById('advInvAmount').value) || 0);
  const pct = Number(getCurrentProject().ivaPct) || 10;
  const iva = r2(base * pct / 100);
  el.innerHTML = base > 0 ? `Base <strong>${fmt(base)}</strong> + IVA ${pct}% <strong>${fmt(iva)}</strong> = <strong>${fmt(r2(base + iva))}</strong> que paga el cliente` : 'Escribe el importe sin IVA (o pulsa "Poner 25%").';
}
function confirmAdvanceInvoice() {
  const proj = getCurrentProject();
  const concept = document.getElementById('advInvConcept').value.trim() || 'Anticipo a cuenta de obra';
  const baseAmount = r2(parseFloat(document.getElementById('advInvAmount').value) || 0);
  if (baseAmount <= 0) return alert('Introduce un importe válido mayor que 0.');
  const date = document.getElementById('advInvDate').value || todayLocalStr();
  const ivaPct = proj.ivaPct || 10;
  const ivaAmount = r2(baseAmount * (ivaPct / 100));
  const totalAmount = r2(baseAmount + ivaAmount);
  const code = getNextNormalCode();

  if (!proj.invoices) proj.invoices = [];
  proj.invoices.push({
    id: 'inv_' + Date.now(),
    code,
    type: 'advance',
    date,
    concept,
    ivaPct,
    baseAmount,
    ivaAmount,
    totalAmount,
    lines: [{ name: concept, desc: `Pago parcial a cuenta de presupuesto ${proj.code}`, qty: 1, unit: 'PA', unitPrice: baseAmount, total: baseAmount }],
    rectifiedBy: null
  });

  markAcceptedIfNeeded(proj);
  saveState();
  closeAdvanceInvModal();
  renderAll();
  viewInvoicePdf(proj.invoices[proj.invoices.length - 1].id);
}

function openRectifyModal(invoiceId) {
  const inv = (getCurrentProject().invoices || []).find(i => i.id === invoiceId);
  if (!inv) return;
  currentRectifyInvoiceId = invoiceId;
  document.getElementById('rectifyModalTitle').textContent = `Abonar / Rectificar Factura ${inv.code}`;
  document.getElementById('rectifyReason').value = 'Reajuste de mediciones y trabajos reales ejecutados';
  document.getElementById('rectifyDate').value = todayLocalStr();
  document.getElementById('rectifyModal').classList.add('open');
}
function closeRectifyModal() { document.getElementById('rectifyModal').classList.remove('open'); }
function confirmRectifyInvoice() {
  const proj = getCurrentProject();
  const orig = (proj.invoices || []).find(i => i.id === currentRectifyInvoiceId);
  if (!orig || orig.rectifiedBy) return;

  const reason = document.getElementById('rectifyReason').value.trim() || 'Rectificación de factura';
  const date = document.getElementById('rectifyDate').value || todayLocalStr();
  const rectCode = getNextRectCode();

  orig.rectifiedBy = rectCode;
  const negLines = (orig.lines || []).map(l => ({ ...l, unitPrice: -l.unitPrice, total: -l.total }));

  const rectInv = {
    id: 'inv_' + Date.now(),
    code: rectCode,
    type: 'rectificative',
    date,
    concept: `Abono / Rectificación de factura ${orig.code}`,
    rectifiesCode: orig.code,
    rectifiesDate: orig.date,
    rectifyReason: reason,
    ivaPct: orig.ivaPct,
    baseAmount: -orig.baseAmount,
    ivaAmount: -orig.ivaAmount,
    totalAmount: -orig.totalAmount,
    lines: negLines
  };

  proj.invoices.push(rectInv);
  saveState();
  closeRectifyModal();
  renderAll();
  viewInvoicePdf(rectInv.id);
}

function viewInvoicePdf(invoiceId) {
  pdfPreviewMode = 'invoice';
  pdfSelectedInvoiceId = invoiceId;
  switchTab('pdf');
}
function setPdfBudgetMode() {
  pdfPreviewMode = 'budget';
  pdfSelectedInvoiceId = null;
  renderPdfTab(getCurrentProject(), calculateProjectEconomics(getCurrentProject()));
}

// HERRAMIENTAS
function toggleToolChecked(toolId, checked) {
  const proj = getCurrentProject();
  if (!proj.checkedTools) proj.checkedTools = {};
  proj.checkedTools[toolId] = checked;
  saveState(); renderToolsTab(proj);
}
function openAddToolModal() {
  document.getElementById('newToolPhase').innerHTML = `<option value="0">General / EPIs</option>` + ROADMAP_PHASES.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  document.getElementById('newToolName').value = '';
  document.getElementById('addToolModal').classList.add('open');
}
function closeAddToolModal() { document.getElementById('addToolModal').classList.remove('open'); }
function saveNewTool() {
  const name = document.getElementById('newToolName').value.trim();
  if (!name) return;
  appState.toolsCatalog.push({ id: 't_custom_' + Date.now(), phase: parseInt(document.getElementById('newToolPhase').value) || 0, scope: document.getElementById('newToolScope').value, name });
  saveState(); closeAddToolModal(); renderAll();
}

// IMÁGENES
function compressImage(file, maxWidth, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const isPng = file.type === 'image/png' || file.type === 'image/svg+xml';
      callback(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.84));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function handleLogoUpload(file) { if (file) compressImage(file, 500, d => { appState.company.logoBase64 = d; saveState(); renderAll(); }); }
function removeLogo() { appState.company.logoBase64 = ''; saveState(); renderAll(); }
function handlePlanImagesUpload(files) {
  if (!files || !files.length) return;
  const proj = getCurrentProject();
  Array.from(files).forEach(file => {
    compressImage(file, 1400, d => {
      proj.images.push({ id: 'img_' + Date.now() + Math.random().toString(36).slice(2,5), title: file.name.replace(/\.[^.]+$/, ''), caption: '', dataBase64: d, includeInPdf: true });
      saveState(); renderAll();
    });
  });
}
function updateImageField(id, f, v) { const img = getCurrentProject().images.find(x => x.id === id); if (img) { img[f] = v; saveState(); } }
function deleteImage(id) { const p = getCurrentProject(); p.images = p.images.filter(x => x.id !== id); saveState(); renderAll(); }

// MEDIDAS
function openMeasureModal(itemId) {
  const item = getCurrentProject().items.find(i => i.id === itemId);
  if (!item) return;
  currentMeasureItemId = itemId;
  currentMeasureUnit = item.unit;
  tempMeasures = item.measures && item.measures.length ? JSON.parse(JSON.stringify(item.measures)) : [{ label: 'Estancia 1', a: item.qty || 0, b: 1, res: item.qty || 0 }];
  document.getElementById('measureModalTitle').textContent = 'Medir: ' + item.name;
  const c = measureCfg();
  document.getElementById('measureIntro').innerHTML = c.intro;
  renderMeasureLines();
  document.getElementById('measureModal').classList.add('open');
}
// Qué significa cada casilla según la unidad de la partida
let currentMeasureUnit = 'm²';
function measureCfg() {
  const u = currentMeasureUnit;
  if (u === 'm²') return { c1: 'Estancia o pared', a: 'Largo (m)', b: 'Alto o ancho (m)', newB: 2.5, unit: 'm²',
    intro: 'Suma la medición por partes: <strong>una línea por pared, suelo o techo</strong>.<br>Pared: <strong>largo × alto</strong>. Suelo o techo: <strong>largo × ancho</strong>.<br>Para <strong>restar un hueco</strong> (puerta, ventana), añade una línea con el largo en negativo: <code>-0,80 × 2,10</code>.' };
  if (u === 'ml') return { c1: 'Tramo', a: 'Metros', b: 'Veces', newB: 1, unit: 'ml',
    intro: 'Suma los metros por tramos: <strong>una línea por pared, mueble o tubería</strong>.<br>En <strong>Veces</strong> pon cuántos tramos iguales hay (2 tabiques iguales → 2).' };
  return { c1: 'Estancia o concepto', a: 'Cantidad', b: 'Veces', newB: 1, unit: u,
    intro: 'Cuenta por estancias o grupos: <strong>una línea por cada uno</strong>. Ej.: Cocina 6 enchufes, Salón 8.<br><strong>Veces</strong> multiplica: 3 dormitorios iguales con 4 enchufes → 4 × 3.' };
}
function renderMeasureLines() {
  let total = 0;
  const c = measureCfg();
  document.getElementById('measureLinesList').innerHTML = `<div class="ml-head"><span>${c.c1}</span><span>${c.a}</span><span>${c.b}</span><span style="text-align:right;">${esc(c.unit)}</span><span></span></div>` + tempMeasures.map((m, idx) => {
    const res = (Number(m.a) || 0) * (Number(m.b) || 0);
    m.res = res; total += res;
    return `<div style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr auto; gap:6px; align-items:center; margin-bottom:6px;">
      <input type="text" value="${esc(m.label)}" aria-label="${c.c1}" placeholder="${c.c1}" onchange="tempMeasures[${idx}].label=this.value">
      <input type="number" step="0.01" value="${m.a}" aria-label="${c.a}" placeholder="${c.a}" oninput="tempMeasures[${idx}].a=parseFloat(this.value)||0; updateMeasureTotals()">
      <input type="number" step="0.01" value="${m.b}" aria-label="${c.b}" placeholder="${c.b}" oninput="tempMeasures[${idx}].b=parseFloat(this.value)||0; updateMeasureTotals()">
      <div class="ml-res" style="text-align:right; font-weight:700;">${fmtNum(res, 2)}</div>
      <button class="btn btn-sm btn-danger" onclick="tempMeasures.splice(${idx},1); renderMeasureLines()">✕</button>
    </div>`;
  }).join('');
  document.getElementById('measureTotalDisplay').textContent = fmtNum(total, 2) + ' ' + c.unit;
}
// Actualiza resultados y total sin redibujar (así no se pierde el cursor al escribir)
function updateMeasureTotals() {
  let total = 0;
  const resEls = document.querySelectorAll('#measureLinesList .ml-res');
  tempMeasures.forEach((m, i) => {
    m.res = (Number(m.a) || 0) * (Number(m.b) || 0); total += m.res;
    if (resEls[i]) resEls[i].textContent = fmtNum(m.res, 2);
  });
  document.getElementById('measureTotalDisplay').textContent = fmtNum(total, 2) + ' ' + measureCfg().unit;
}
function addMeasureLine() { const c = measureCfg(); tempMeasures.push({ label: (c.unit === 'm²' ? 'Pared ' : c.unit === 'ml' ? 'Tramo ' : 'Grupo ') + (tempMeasures.length + 1), a: 0, b: c.newB, res: 0 }); renderMeasureLines(); }
function closeMeasureModal() { document.getElementById('measureModal').classList.remove('open'); }
function applyMeasureModal() {
  const item = getCurrentProject().items.find(i => i.id === currentMeasureItemId);
  if (item) {
    item.measures = tempMeasures;
    item.qty = Number(tempMeasures.reduce((s, m) => s + (Number(m.a)||0)*(Number(m.b)||0), 0).toFixed(2));
    saveState(); renderAll();
  }
  closeMeasureModal();
}

// PARTIDAS / CAPÍTULOS
function openAddItemModal(preChapterId) {
  const proj = getCurrentProject();
  document.getElementById('newItemChapter').innerHTML = proj.chapters.map(c => `<option value="${c.id}" ${c.id===preChapterId?'selected':''}>${esc(c.name)}</option>`).join('');
  document.getElementById('newItemPhase').innerHTML = ROADMAP_PHASES.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  document.getElementById('newItemName').value = ''; document.getElementById('newItemDesc').value = '';
  document.getElementById('libSearch').value = ''; document.getElementById('libQty').value = 1;
  renderLibrarySearch();
  document.getElementById('addItemModal').classList.add('open');
  setTimeout(() => document.getElementById('libSearch').focus(), 50);
}
function closeAddItemModal() { document.getElementById('addItemModal').classList.remove('open'); }
function saveNewItem() {
  const name = document.getElementById('newItemName').value.trim();
  if (!name) return alert('Escribe el nombre.');
  getCurrentProject().items.push({
    id: 'item_' + Date.now(), chapterId: document.getElementById('newItemChapter').value,
    phase: parseInt(document.getElementById('newItemPhase').value) || 3, active: true,
    name, desc: document.getElementById('newItemDesc').value.trim(),
    unit: document.getElementById('newItemUnit').value, qty: parseFloat(document.getElementById('newItemQty').value) || 1,
    mode: 'own', hoursPerUnit: parseFloat(document.getElementById('newItemHours').value) || 1,
    subCost: 0, subMarginPct: 15, subDays: 1, subIncludesMat: false, measures: [], matRecipe: []
  });
  saveState(); closeAddItemModal(); renderAll();
}
function openNewChapterModal() { document.getElementById('newChapterName').value = ''; document.getElementById('addChapterModal').classList.add('open'); }
function closeAddChapterModal() { document.getElementById('addChapterModal').classList.remove('open'); }
function saveNewChapter() {
  const name = document.getElementById('newChapterName').value.trim();
  if (!name) return;
  getCurrentProject().chapters.push({ id: 'ch_' + Date.now(), name, isOptional: false });
  saveState(); closeAddChapterModal(); renderAll();
}

// COPIAS
const BACKUP_KEY = 'reformasPro_lastBackup';
function exportBackup() {
  try { localStorage.setItem(BACKUP_KEY, String(Date.now())); } catch (e) {}
  const b = document.getElementById('backupReminderBar'); if (b) b.remove();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' }));
  a.download = `Copia_Presupuestador_${todayLocalStr()}.json`;
  a.click();
}
function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.projects || !parsed.company) throw new Error();
      appState = parsed; saveState(); renderAll(); alert('Copia restaurada.');
    } catch (err) { alert('Archivo inválido.'); }
  };
  reader.readAsText(file);
}
function resetToDemo() {
  if (!confirm('¿Restablecer ejemplo de Fuengirola y catálogo inicial?')) return;
  appState = getDefaultState(); saveState(); renderAll();
}

// Globos de ayuda: ver js/ayuda.js

function checkBackupReminder() {
  if (fileStore.status === 'ok') return;
  if (driveSync.cfg.linked) return;
  if (document.getElementById('backupReminderBar')) return;
  let last = 0;
  try { last = Number(localStorage.getItem(BACKUP_KEY)) || 0; } catch (e) {}
  const days = last ? Math.floor((Date.now() - last) / 86400000) : null;
  if (days !== null && days < 7) return;
  const bar = document.createElement('div');
  bar.id = 'backupReminderBar';
  bar.className = 'no-print';
  bar.style.cssText = 'background:#fde68a; color:#1f2937; border-bottom:3px solid #b45309; padding:10px 16px; font-size:1rem; font-weight:700; display:flex; gap:12px; align-items:center; flex-wrap:wrap;';
  const reconectar = fileStore.dirHandle && fileStore.status === 'needs-permission';
  bar.innerHTML = reconectar
    ? `🔓 Carpeta de datos desconectada. Nuestros datos están a salvo en el archivo; pulsa en cualquier sitio y acepta el permiso para seguir guardando en la carpeta (si nos da a elegir, marca "Permitir en cada visita").
       <button class="btn btn-sm" style="background:#1f2937; color:#fff;" onclick="onFileStorageButton()">🔓 Reconectar ahora</button>`
    : `⚠️ ${days === null ? 'Aún no hemos hecho ninguna copia de seguridad.' : 'Nuestra última copia de seguridad es de hace ' + days + ' días.'}
    Los datos solo están en este navegador: si se borran sus datos, se pierden.
    ${fileStore.supported && isLocalOrigin ? `<button class="btn btn-sm" style="background:#1f2937; color:#fff;" onclick="onFileStorageButton()">📁 Conectar carpeta (guardado automático)</button>` : ''}
    <button class="btn btn-sm" style="background:#1f2937; color:#fff;" onclick="onDriveButton()">☁️ Conectar con Drive</button>
    <button class="btn btn-sm" style="background:#1f2937; color:#fff;" onclick="exportBackup()">💾 Descargar copia ahora</button>`;
  bar.innerHTML += `
    <button class="btn btn-sm" style="background:#fff; color:#1f2937;" onclick="this.parentElement.remove()">Más tarde</button>`;
  document.body.insertBefore(bar, document.body.firstChild);
}

applyA11y();
renderAll();
undoInit();
showGroupOf((document.querySelector(".tab-btn.active") || {}).dataset?.tab || "checklist");
driveLoadCfg();
initFileStorage().finally(initDriveSync);
// Recalibración de precios y plazos (nov 2026): copia de seguridad antes del cambio
function ensurePricing() {
  const pr = appState.company.pricing;
  // Primera calibración (1,3 con esperas largas) → esperas cortas y 1,65: mismo plazo realista (~2,5 meses en Fuengirola)
  if (pr && Number(pr.realityFactor) === 1.3 && !pr.waitDays && !pr.calib2) { pr.realityFactor = 1.65; pr.calib2 = true; }
  if (pr) return;
  const backup = JSON.stringify(appState);
  try { localStorage.setItem('presupuestador_antes_de_recalibrar', backup); } catch (e) {}
  if (typeof fsWriteExtraFile === 'function') fsWriteExtraFile(`antes_de_recalibrar_${todayLocalStr()}.json`, backup);
  appState.company.pricing = { realityFactor: 1.65, calib2: true };
}

// ---------- Acerca de… ----------
const APP_VERSION = '2026.11.20';
function showAbout() {
  const comp = appState.company;
  document.getElementById('staffModalBody').innerHTML = `
    <div class="card-header"><h3 class="card-title">ℹ️ Acerca de Presupuestador PRO</h3><button class="btn btn-sm" onclick="closeStaffModal()">✕</button></div>
    <div class="about-box">
      ${comp.logoBase64 ? `<img src="${comp.logoBase64}" alt="Logo" class="about-logo">` : ''}
      <div class="about-name">Presupuestador PRO</div>
      <div class="eq-sub">Presupuestos, obras, personal y facturación para reformas</div>
      <div class="about-line">Hecho para <strong>${esc(comp.name || 'nuestra empresa')}</strong></div>
      <div class="about-line">Autor: <strong>José Antonio Navas Rodríguez</strong></div>
      <div class="about-line">Versión ${APP_VERSION}</div>
      <div class="about-copy">© 2026 José Antonio Navas Rodríguez. Todos los derechos reservados.</div>
    </div>`;
  document.getElementById('staffModal').classList.add('open');
}
