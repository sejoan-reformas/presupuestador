// ============================================================
// MATERIALES: separados en 🛁 Elementos a elegir y 🧱 Material de obra,
// quién los compra (cliente o empresa) y lista imprimible para el cliente por dependencia.
//   material.kind          = 'elegir' | 'obra'   (si falta, se deduce de la lista de abajo)
//   proj.matBuy            = { elegir: 'cliente'|'empresa', obra: 'cliente'|'empresa' }
//   proj.matBuyOverride    = { ovKey: 'cliente'|'empresa' }   (excepciones por línea)
//   proj.matMarginPct      = % que se suma cuando compra la empresa (0 = a precio de coste)
// La mano de obra no cambia nunca por esto.
// ============================================================
const MAT_ELEGIR_IDS = new Set(['m_azulejo', 'm_porcel_int', 'm_rodapie', 'm_porcel_ext', 'm_termo', 'm_ducha', 'm_mampara', 'm_inodoro', 'm_bidet', 'm_mueble_bano',
  'm_grif_bano', 'm_grif_coc', 'm_mecanismo', 'm_foco_led', 'm_split_aa', 'm_vent_60x50', 'm_vent_100x115', 'm_vent_120x115', 'm_vent_120x135', 'm_vent_basica',
  'm_balc_140x229', 'm_puerta_acor', 'm_puerta_lac', 'm_puerta_eco', 'm_armario', 'm_cocina_mueb', 'm_encimera', 'm_electrod', 'm_laminado', 'm_rodapie_mdf',
  'm_sumidero', 'm_banera', 'm_extractor', 'm_videoportero', 'm_vierteaguas', 'm_mosquitera']);
const MAT_KINDS = { elegir: { icon: '🛁', name: 'Elementos a elegir', sub: 'Lo que el cliente elige a su gusto: sanitarios, azulejo, grifos, ventanas…' },
  obra: { icon: '🧱', name: 'Material de obra', sub: 'Lo técnico que no se ve: sacos, cola, pladur, tubos, cable…' } };
const BUYERS = { cliente: '👤 Lo compra el cliente', empresa: '🏗️ Lo compramos nosotros' };

// Gama de la previsión de materiales (solo afecta a los elementos a elegir)
const MAT_QUALITIES = { basica: { name: 'Básica', factor: 0.65, txt: 'gama básica' }, media: { name: 'Media', factor: 1, txt: 'gama media' }, alta: { name: 'Alta', factor: 1.7, txt: 'gama alta' } };
function matQuality(proj) { return MAT_QUALITIES[proj.matQuality] ? proj.matQuality : (calcG().defaultMatQuality || 'basica'); }
function matQualityFactor(proj) { return MAT_QUALITIES[matQuality(proj)].factor; }
function setMatQuality(q) { getCurrentProject().matQuality = q; saveState(); renderAll(); }
function matKind(m) { return m.kind || (MAT_ELEGIR_IDS.has(m.id) ? 'elegir' : 'obra'); }
function matBuyDefault(proj, kind) { return ((proj.matBuy || {})[kind]) || 'cliente'; }
function matBuyer(proj, row) { return ((proj.matBuyOverride || {})[row.ovKey]) || matBuyDefault(proj, matKind(row)); }
function matMargin(proj) { return Math.max(0, Number(proj.matMarginPct) || 0); }

// Filas de materiales agrupadas por tipo, con quién lo compra y el precio que paga el cliente
function materialGroups(proj, mData) {
  const mg = matMargin(proj);
  const g = { elegir: { rows: [], total: 0 }, obra: { rows: [], total: 0 } };
  const add = (r, isOpt) => {
    const kind = matKind(r), buyer = matBuyer(proj, r);
    const clientPrice = buyer === 'empresa' ? r2(r.price * (1 + mg / 100)) : r.price;
    const sub = r2(r.qty * clientPrice);
    g[kind].rows.push({ ...r, kind, buyer, isOpt, clientPrice, clientSubtotal: sub });
    if (!isOpt) g[kind].total += sub;
  };
  mData.baseRows.forEach(r => add(r, false));
  mData.optRows.forEach(r => add(r, true));
  g.elegir.total = r2(g.elegir.total); g.obra.total = r2(g.obra.total);
  return g;
}

// Reparto por dependencia (usa las líneas de medición de cada partida: "Baño 1", "Cocina"…)
function materialsByRoom(proj, kindFilter) {
  const cat = appState.materialsCatalog || [];
  const rooms = {};
  proj.items.forEach(item => {
    if (!item.active) return;
    if (item.mode === 'sub' && item.subIncludesMat) return;
    const lines = (item.measures && item.measures.length) ? item.measures.map(m => ({ label: m.label || 'General', q: Number(m.res) || 0 })) : [{ label: 'General', q: Number(item.qty) || 0 }];
    const isOpt = isChapterOptional(proj, item.chapterId);
    (item.matRecipe || []).forEach(rec => {
      const m = cat.find(x => x.id === rec.matId); if (!m) return;
      if (kindFilter && matKind(m) !== kindFilter) return;
      lines.forEach(l => {
        const q = l.q * (Number(rec.factor) || 0); if (q <= 0) return;
        const room = rooms[l.label] || (rooms[l.label] = {});
        const k = m.id + (isOpt ? '_opt' : '');
        room[k] = room[k] || { m, qty: 0, isOpt };
        room[k].qty += q;
      });
    });
  });
  (proj.extraMaterials || []).forEach(em => {
    const m = cat.find(x => x.id === em.matId); if (!m || (kindFilter && matKind(m) !== kindFilter)) return;
    const room = rooms['Material suelto'] || (rooms['Material suelto'] = {});
    room[m.id] = room[m.id] || { m, qty: 0, isOpt: false }; room[m.id].qty += Number(em.qty) || 0;
  });
  return Object.entries(rooms).map(([label, list]) => ({
    label,
    rows: Object.values(list).map(x => ({ ...x, qty: x.m.roundUp ? Math.ceil(x.qty - 1e-9) : Math.round(x.qty * 10) / 10 })).sort((a, b) => a.m.name.localeCompare(b.m.name))
  })).sort((a, b) => (a.label === 'General') - (b.label === 'General') || a.label.localeCompare(b.label, 'es', { numeric: true }));
}

// ---------- Acciones ----------
function setMatBuyDefault(kind, who) { const p = getCurrentProject(); p.matBuy = p.matBuy || {}; p.matBuy[kind] = who; saveState(); renderAll(); }
function setMatBuyOverride(ovKey, who, kind) {
  const p = getCurrentProject(); p.matBuyOverride = p.matBuyOverride || {};
  if (who === matBuyDefault(p, kind)) delete p.matBuyOverride[ovKey]; else p.matBuyOverride[ovKey] = who;
  saveState(); renderAll();
}
function setMatKind(matId, kind) { const m = (appState.materialsCatalog || []).find(x => x.id === matId); if (!m) return; m.kind = kind; saveState(); renderAll(); }
function setMatMargin(v) { getCurrentProject().matMarginPct = Math.max(0, parseFloat(v) || 0); saveState(); renderAll(); }

// ---------- Pestaña 2 ----------
function renderMaterialsSplit(proj, econ) {
  const g = materialGroups(proj, econ.matsData);
  const mg = matMargin(proj);
  const anyEmpresa = [...g.elegir.rows, ...g.obra.rows].some(r => r.buyer === 'empresa');
  const q = matQuality(proj);
  const head = `<div class="card eq-card" style="margin-bottom:1rem;">
    <div class="eq-head"><span class="eq-icon">🏷️</span><div><div class="eq-name">Gama de la previsión ${helpIcon('gamaMateriales')}</div><div class="eq-sub">Con qué calidad se calcula lo que el cliente elige. Él decide al final.</div></div></div>
    <div class="quality-pick">${Object.entries(MAT_QUALITIES).map(([k, v]) => `<button class="btn visit-big ${k === q ? 'btn-primary' : ''}" onclick="setMatQuality('${k}')">${k === q ? '✔ ' : ''}${v.name}</button>`).join('')}</div>
    <div class="eq-sub">No cambia la mano de obra ni el material de obra (sacos, cola, pladur…). Ganamos lo mismo con un lavabo de cerámica que con uno de oro.</div>
  </div>
  <div class="eq-grid" style="margin-bottom:1rem;">
    ${['elegir', 'obra'].map(k => `<div class="card eq-card">
      <div class="eq-head"><span class="eq-icon">${MAT_KINDS[k].icon}</span><div><div class="eq-name">${MAT_KINDS[k].name} ${helpIcon(k === 'elegir' ? 'matElegir' : 'matObra')}</div><div class="eq-sub">${MAT_KINDS[k].sub}</div></div></div>
      <label class="eq-field"><span>¿Quién lo compra? ${helpIcon('quienCompra')}</span>
        <select onchange="setMatBuyDefault('${k}', this.value)">${Object.entries(BUYERS).map(([b, l]) => `<option value="${b}" ${matBuyDefault(proj, k) === b ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="eq-result">Previsión: <strong>${fmt(g[k].total)}</strong> · ${g[k].rows.filter(r => !r.isOpt).length} materiales</div>
    </div>`).join('')}
    <div class="card eq-card">
      <div class="eq-head"><span class="eq-icon">🛒</span><div><div class="eq-name">Lista para el cliente ${helpIcon('listaCompra')}</div><div class="eq-sub">Por dependencia, para que elija y compre</div></div></div>
      <label class="eq-field"><span>💶 Margen si compramos nosotros (%) ${helpIcon('margenMaterial')}</span><input type="number" min="0" step="1" value="${mg}" onchange="setMatMargin(this.value)"></label>
      <button class="btn btn-primary visit-big" onclick="printShoppingList(true)">🖨️ Imprimir lista (con precios orientativos)</button>
      <button class="btn" onclick="printShoppingList(false)">🖨️ Imprimir lista sin precios</button>
      ${anyEmpresa ? `<div class="eq-result">🏗️ Lo que compramos nosotros va ${mg ? `con un ${fmtNum(mg, 0)}% de margen` : 'a precio de coste'}: el cliente nos lo paga aparte de la mano de obra.</div>` : ''}
    </div>
  </div>`;
  const table = k => {
    const rows = g[k].rows; if (!rows.length) return '';
    return `<h4 style="margin:1rem 0 0.4rem 0;">${MAT_KINDS[k].icon} ${MAT_KINDS[k].name}</h4>
      <div class="table-wrap"><table class="pdf-table">
      <thead><tr><th>Material</th><th style="text-align:right;">Cantidad (editable)</th><th>Ud.</th><th style="text-align:right;">Precio ref.</th><th style="text-align:right;">Estimado</th><th>Tipo ${helpIcon('tipoMaterial')}</th><th>Lo compra</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td><strong>${esc(r.name)}</strong> ${r.isOpt ? '<span class="badge badge-opt">Extra</span>' : ''} ${r.isOverridden ? '<span class="badge badge-opt">Ajustado a mano</span>' : ''}<div class="eq-sub">${esc(r.cat)}</div></td>
        <td style="text-align:right; white-space:nowrap;"><input type="number" step="${r.roundUp ? 1 : 0.5}" class="inline-input num-input" value="${r.qty}" onchange="setMaterialOverride('${r.ovKey}', parseFloat(this.value))">
          ${r.isOverridden ? `<button class="btn btn-sm" title="Volver al cálculo de la receta (${r.autoQty})" onclick="clearMaterialOverride('${r.ovKey}')">↺</button>` : ''}</td>
        <td>${esc(r.unit)}</td>
        <td style="text-align:right;">${fmt(r.clientPrice)}${r.clientPrice !== r.price ? `<div class="eq-sub">coste ${fmt(r.price)}</div>` : ''}</td>
        <td style="text-align:right; font-weight:700;">${fmt(r.clientSubtotal)}</td>
        <td><select class="inline-input" onchange="setMatKind('${r.id}', this.value)" title="Cambia el tipo de este material en todas las obras">${Object.entries(MAT_KINDS).map(([kk, t]) => `<option value="${kk}" ${kk === k ? 'selected' : ''}>${t.icon} ${kk === 'elegir' ? 'A elegir' : 'De obra'}</option>`).join('')}</select></td>
        <td><select class="inline-input" onchange="setMatBuyOverride('${r.ovKey}', this.value, '${k}')">${Object.entries(BUYERS).map(([b, l]) => `<option value="${b}" ${r.buyer === b ? 'selected' : ''}>${b === 'cliente' ? '👤 Cliente' : '🏗️ Nosotros'}</option>`).join('')}</select></td>
      </tr>`).join('')}</tbody></table></div>`;
  };
  return head + table('elegir') + table('obra');
}

// ---------- Lista imprimible para el cliente ----------
function printShoppingList(withPrices) {
  const proj = getCurrentProject();
  const econ = calculateProjectEconomics(proj);
  const comp = appState.company;
  const g = materialGroups(proj, econ.matsData);
  const buyerOf = id => { const r = [...g.elegir.rows, ...g.obra.rows].find(x => x.id === id); return r ? r.buyer : 'cliente'; };
  const priceOf = id => { const r = [...g.elegir.rows, ...g.obra.rows].find(x => x.id === id); return r ? r.clientPrice : 0; };
  const rooms = materialsByRoom(proj, 'elegir');
  const obraRows = g.obra.rows.filter(r => !r.isOpt && r.buyer === 'cliente');
  const w = window.open('', '_blank');
  if (!w) return alert('El navegador ha bloqueado la ventana. Permite las ventanas emergentes para imprimir la lista.');
  const roomHtml = rooms.map(rm => `<h2>${esc(rm.label)}</h2>
    <table><thead><tr><th class="ck">✔</th><th>Elemento</th><th class="n">Cantidad</th>${withPrices ? '<th class="n">Precio orientativo</th>' : ''}<th>Modelo / tienda elegidos</th></tr></thead>
    <tbody>${rm.rows.map(x => `<tr><td class="ck">☐</td><td><strong>${esc(x.m.name)}</strong>${x.isOpt ? ' <em>(extra opcional)</em>' : ''}${buyerOf(x.m.id) === 'empresa' ? '<br><small>Lo compramos nosotros</small>' : ''}</td>
      <td class="n">${fmtNum(x.qty, x.m.roundUp ? 0 : 1)} ${esc(x.m.unit)}</td>${withPrices ? `<td class="n">${fmt(priceOf(x.m.id) * x.qty)}</td>` : ''}<td class="blank"></td></tr>`).join('')}</tbody></table>`).join('');
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Lista para elegir y comprar - ${esc(proj.client.name || proj.title)}</title>
  <style>body{font-family:system-ui,Segoe UI,sans-serif;color:#0f172a;max-width:52rem;margin:1.5rem auto;font-size:14px;line-height:1.45}
  header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f172a;padding-bottom:.6rem;margin-bottom:.8rem}
  header img{max-height:60px}h1{font-size:1.35rem;margin:.2rem 0}h2{font-size:1.1rem;margin:1.2rem 0 .4rem;padding:.3rem .6rem;background:#e2e8f0;border-radius:6px}
  table{width:100%;border-collapse:collapse;margin-bottom:.5rem}th,td{border:1px solid #94a3b8;padding:.4rem .5rem;text-align:left;vertical-align:top}th{background:#f1f5f9}
  .n{text-align:right;white-space:nowrap}.ck{width:2rem;text-align:center;font-size:1.1rem}.blank{width:30%}.note{background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:.6rem .8rem}
  @media print{button{display:none}h2{break-after:avoid}tr{break-inside:avoid}}</style></head><body>
  <header><div>${comp.logoBase64 ? `<img src="${comp.logoBase64}" alt="">` : ''}<div><strong>${esc(comp.name || '')}</strong><br>${esc(comp.phone || '')} ${esc(comp.email || '')}</div></div>
    <div style="text-align:right"><h1>🛒 Lista para elegir y comprar</h1>${esc(proj.client.name || '')}<br>${esc(proj.client.projectAddress || '')}<br>${esc(proj.code || '')} · ${new Date().toLocaleDateString('es-ES')}</div></header>
  <p class="note">Estos son los <strong>elementos que usted elige a su gusto</strong> para la obra, ordenados por dependencia. Las cantidades ya llevan un pequeño margen para cortes y roturas.${withPrices ? ' Los precios son <strong>orientativos de gama media</strong>: el precio final depende del modelo que elija.' : ''} Apunte en la última columna el modelo y la tienda, y avísenos antes de comprar si tiene dudas de medidas.</p>
  ${roomHtml || '<p>No hay elementos a elegir en esta obra.</p>'}
  ${obraRows.length ? `<h2>🧱 Material de obra (lo técnico que no se ve)</h2><table><thead><tr><th class="ck">✔</th><th>Material</th><th class="n">Cantidad</th>${withPrices ? '<th class="n">Precio orientativo</th>' : ''}</tr></thead>
    <tbody>${obraRows.map(r => `<tr><td class="ck">☐</td><td>${esc(r.name)}</td><td class="n">${fmtNum(r.qty, r.roundUp ? 0 : 1)} ${esc(r.unit)}</td>${withPrices ? `<td class="n">${fmt(r.clientSubtotal)}</td>` : ''}</tr>`).join('')}</tbody></table>` : ''}
  <p><button onclick="window.print()">🖨️ Imprimir</button></p></body></html>`);
  w.document.close();
}
