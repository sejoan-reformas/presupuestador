// ============================================================
// PLANTILLAS DE PRESUPUESTO Y BIBLIOTECA DE PARTIDAS
//   appState.templates   = [{ id, name, createdAt, chapters, items, crew, ivaPct, paymentFreq }]
//   appState.itemLibrary = [{ id, name, desc, unit, phase, mode, hoursPerUnit, subCost,
//                             subMarginPct, subDays, subIncludesMat, matRecipe, chapterName, updatedAt }]
// ============================================================
const LIB_FIELDS = ['name', 'desc', 'unit', 'phase', 'mode', 'hoursPerUnit', 'subCost', 'subMarginPct', 'subDays', 'subIncludesMat', 'matRecipe'];

function deepCopy(o) { return JSON.parse(JSON.stringify(o)); }
function normTxt(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }

// Se llama al principio de cada renderAll: añade lo que falte a datos antiguos
function ensureTemplatesAndLibrary() {
  if (!Array.isArray(appState.templates)) appState.templates = [];
  if (!Array.isArray(appState.itemLibrary)) {
    appState.itemLibrary = [];
    const demo = createDefaultFuengirolaProject();
    demo.items.forEach(it => {
      const ch = demo.chapters.find(c => c.id === it.chapterId);
      appState.itemLibrary.push(libEntryFromItem(it, ch ? ch.name : ''));
    });
  }
  // Catálogo ampliado: añade materiales, herramientas y partidas nuevas una sola vez
  const res = applyCatalogRev(appState);
  if (res && (res.mats || res.tools || res.lib || res.fixes || res.prices || res.names)) {
    const parts = [];
    if (res.lib || res.mats || res.tools) parts.push(`🆕 ${res.lib} partidas, ${res.mats} materiales y ${res.tools} herramientas nuevas`);
    if (res.fixes) parts.push(`${res.fixes} recetas corregidas`);
    if (res.prices) parts.push(`💶 ${res.prices} precios actualizados (nov 2026)`);
    if (res.names) parts.push(`✏️ ${res.names} nombres de partidas actualizados`);
    setTimeout(() => showToast(parts.join(' · ')), 600);
  }
}

function libEntryFromItem(item, chapterName) {
  const e = { id: 'lib_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), chapterName: chapterName || '', updatedAt: Date.now() };
  LIB_FIELDS.forEach(f => { e[f] = deepCopy(item[f] === undefined ? null : item[f]); });
  if (!Array.isArray(e.matRecipe)) e.matRecipe = [];
  return e;
}

// Aviso corto que desaparece solo (no bloquea como alert)
function showToast(msg) {
  let t = document.getElementById('appToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'appToast';
    t.className = 'app-toast no-print';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ---------------- BIBLIOTECA ----------------
function saveItemToLibrary(itemId) {
  const proj = getCurrentProject();
  const item = proj.items.find(i => i.id === itemId);
  if (!item) return;
  const ch = proj.chapters.find(c => c.id === item.chapterId);
  const existing = appState.itemLibrary.find(l => normTxt(l.name) === normTxt(item.name));
  if (existing) {
    if (!confirm(`Ya tenemos en la biblioteca "${existing.name}".\n\n¿Actualizarla con las horas, precios y receta de esta partida?`)) return;
    const fresh = libEntryFromItem(item, ch ? ch.name : existing.chapterName);
    fresh.id = existing.id;
    Object.assign(existing, fresh);
    saveState();
    showToast('📚 Partida actualizada en nuestra biblioteca');
  } else {
    appState.itemLibrary.push(libEntryFromItem(item, ch ? ch.name : ''));
    saveState();
    showToast('📚 Partida guardada en nuestra biblioteca');
  }
  renderLibraryManager();
}

function addItemFromLibrary(libId) {
  const lib = appState.itemLibrary.find(l => l.id === libId);
  if (!lib) return;
  const proj = getCurrentProject();
  const chapterId = document.getElementById('newItemChapter').value || (proj.chapters[0] && proj.chapters[0].id);
  if (!chapterId) return alert('Primero crea un capítulo.');
  const qty = parseFloat(document.getElementById('libQty').value) || 1;
  const item = { id: 'item_' + Date.now(), chapterId, active: true, qty, measures: [] };
  LIB_FIELDS.forEach(f => { item[f] = deepCopy(lib[f]); });
  if (!item.phase) item.phase = 3;
  if (!item.mode) item.mode = 'own';
  if (!Array.isArray(item.matRecipe)) item.matRecipe = [];
  proj.items.push(item);
  saveState();
  closeAddItemModal();
  renderAll();
  showToast(`✅ Añadida: ${item.name} (${fmtNum(qty, 2)} ${item.unit})`);
}

function renderLibrarySearch() {
  const box = document.getElementById('libSearchResults');
  if (!box) return;
  const q = normTxt(document.getElementById('libSearch').value);
  const lib = appState.itemLibrary || [];
  const words = q.split(/\s+/).filter(Boolean);
  const found = lib.filter(l => {
    const hay = normTxt(l.name + ' ' + l.desc + ' ' + l.chapterName);
    return words.every(w => hay.includes(w));
  }).sort((a, b) => {
    const an = words.every(w => normTxt(a.name).includes(w)) ? 0 : 1;
    const bn = words.every(w => normTxt(b.name).includes(w)) ? 0 : 1;
    return an - bn || a.name.localeCompare(b.name, 'es');
  }).slice(0, 40);
  if (!lib.length) { box.innerHTML = '<p class="lib-empty">Nuestra biblioteca está vacía. Guarda partidas con el botón 📚 de cada fila.</p>'; return; }
  if (!found.length) { box.innerHTML = '<p class="lib-empty">No hay ninguna partida con ese texto.</p>'; return; }
  box.innerHTML = found.map(l => `
    <div class="lib-row">
      <div class="lib-row-txt">
        <strong>${esc(l.name)}</strong>
        <div class="lib-row-meta">${esc(l.unit || '')} · ${l.mode === 'sub' ? `Subcontrata ${fmt(l.subCost)}/ud +${fmtNum(l.subMarginPct, 0)}%` : `Propio ${fmtNum(l.hoursPerUnit, 2)} h/ud`}${(l.matRecipe || []).length ? ` · 🧱 ${l.matRecipe.length} mat.` : ''}${l.chapterName ? ` · <em>${esc(l.chapterName)}</em>` : ''}</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="addItemFromLibrary('${l.id}')"><b class="plus">+</b> Añadir</button>
    </div>`).join('');
}

function deleteLibraryItem(libId) {
  const l = appState.itemLibrary.find(x => x.id === libId);
  if (!l || !confirm(`¿Quitar "${l.name}" de nuestra biblioteca?\n\n(No afecta a los presupuestos que ya la usan.)`)) return;
  appState.itemLibrary = appState.itemLibrary.filter(x => x.id !== libId);
  saveState();
  renderLibraryManager();
}

function renderLibraryManager() {
  const box = document.getElementById('libraryManagerView');
  if (!box) return;
  const q = normTxt((document.getElementById('libManagerSearch') || {}).value);
  const lib = (appState.itemLibrary || []).filter(l => !q || normTxt(l.name + ' ' + l.desc).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  document.getElementById('libCount').textContent = (appState.itemLibrary || []).length;
  box.innerHTML = lib.length ? `
    <table class="items-table">
      <thead><tr><th>Partida</th><th>Ud.</th><th>Tipo</th><th>Materiales</th><th></th></tr></thead>
      <tbody>${lib.map(l => `
        <tr>
          <td><strong>${esc(l.name)}</strong><div style="font-size:0.8em; color:var(--text-muted);">${esc(l.desc || '')}</div></td>
          <td>${esc(l.unit || '')}</td>
          <td>${l.mode === 'sub' ? `Subc. ${fmt(l.subCost)}/ud` : `Propio ${fmtNum(l.hoursPerUnit, 2)} h/ud`}</td>
          <td>${(l.matRecipe || []).length}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteLibraryItem('${l.id}')" title="Quitar de la biblioteca">🗑</button></td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<p class="lib-empty">No hay partidas que coincidan.</p>';
}

// ---------------- PLANTILLAS Y PRESUPUESTO NUEVO ----------------
function saveCurrentAsTemplate() {
  const proj = getCurrentProject();
  const name = prompt('Nombre de la plantilla (ej: Baño completo, Cocina, Pintura piso):', proj.title);
  if (!name || !name.trim()) return;
  const existing = appState.templates.find(t => normTxt(t.name) === normTxt(name));
  if (existing && !confirm(`Ya existe la plantilla "${existing.name}". ¿Sustituirla?`)) return;
  const tpl = {
    id: existing ? existing.id : 'tpl_' + Date.now(),
    name: name.trim(),
    createdAt: Date.now(),
    chapters: deepCopy(proj.chapters),
    items: deepCopy(proj.items).map(i => { const c = { ...i, active: true }; delete c.realHours; return c; }),
    crew: deepCopy(proj.crew),
    ivaPct: proj.ivaPct,
    paymentFreq: proj.paymentFreq
  };
  if (existing) Object.assign(existing, tpl); else appState.templates.push(tpl);
  saveState();
  showToast(`💾 Plantilla "${tpl.name}" guardada (${tpl.items.length} partidas)`);
}

function openNewProjectModal() {
  ensureTemplatesAndLibrary();
  document.getElementById('newProjName').value = '';
  const opts = [
    { v: 'blank', label: '📄 En blanco', sub: 'Solo los capítulos, sin partidas. Las añadimos nosotros (o desde nuestra biblioteca).' },
    { v: 'demo', label: '🏠 Copia del ejemplo (piso Fuengirola)', sub: 'Todas las partidas del ejemplo; luego quitas las que no hagan falta.' },
    ...appState.templates.map(t => ({ v: t.id, label: '⭐ ' + t.name, sub: `Nuestra plantilla · ${t.items.length} partidas`, tpl: true }))
  ];
  document.getElementById('newProjOptions').innerHTML = opts.map((o, i) => `
    <label class="np-option">
      <input type="radio" name="newProjBase" value="${o.v}" ${i === 0 ? 'checked' : ''}>
      <span class="np-option-txt"><strong>${esc(o.label)}</strong><small>${esc(o.sub)}</small></span>
      ${o.tpl ? `<button type="button" class="btn btn-sm btn-danger" title="Borrar plantilla" onclick="event.preventDefault(); deleteTemplate('${o.v}')">🗑</button>` : ''}
    </label>`).join('');
  document.getElementById('newProjectModal').classList.add('open');
  setTimeout(() => document.getElementById('newProjName').focus(), 50);
}
function closeNewProjectModal() { document.getElementById('newProjectModal').classList.remove('open'); }

function deleteTemplate(tplId) {
  const t = appState.templates.find(x => x.id === tplId);
  if (!t || !confirm(`¿Borrar la plantilla "${t.name}"?`)) return;
  appState.templates = appState.templates.filter(x => x.id !== tplId);
  saveState();
  openNewProjectModal();
}

function confirmNewProject() {
  const name = document.getElementById('newProjName').value.trim();
  if (!name) { alert('Escribe el nombre del cliente o de la obra.'); return; }
  const choice = (document.querySelector('input[name="newProjBase"]:checked') || {}).value || 'blank';
  const curr = getCurrentProject();
  const base = createDefaultFuengirolaProject();

  if (choice === 'blank') {
    base.chapters = base.chapters.filter(c => !c.isOptional).map(c => ({ ...c, name: c.name.replace(/^(\d+\.\s*)?Mano de Obra\s+/i, '$1') }));
    base.items = [];
  } else if (choice !== 'demo') {
    const tpl = appState.templates.find(t => t.id === choice);
    if (tpl) {
      base.chapters = deepCopy(tpl.chapters);
      base.items = deepCopy(tpl.items).map((i, n) => { const c = { ...i, id: 'item_' + Date.now() + '_' + n }; delete c.realHours; return c; });
      if (tpl.crew) base.crew = deepCopy(tpl.crew);
      if (tpl.ivaPct) base.ivaPct = tpl.ivaPct;
      if (tpl.paymentFreq) base.paymentFreq = tpl.paymentFreq;
    }
  }
  // Nuestro equipo y gastos actuales, salvo que la plantilla traiga los suyos
  if ((choice === 'blank' || choice === 'demo') && curr && curr.crew) base.crew = deepCopy(curr.crew);

  base.id = 'proj_' + Date.now();
  base.title = name;
  base.code = getNextProjectCode();
  base.date = todayLocalStr();
  base.client = { name, nif: '', phone: '', email: '', projectAddress: '' };
  base.images = []; base.checkedTools = {}; base.materialOverrides = {}; base.invoices = []; base.extraMaterials = [];
  appState.projects.push(base);
  appState.currentProjectId = base.id;
  pdfPreviewMode = 'budget';
  closeNewProjectModal();
  saveState(); renderAll();
  switchTab('checklist');
  showToast(`✅ Presupuesto ${base.code} creado`);
}
