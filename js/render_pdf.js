const DEFAULT_VARIATIONS_TEXT = `Este presupuesto está hecho con lo que se ve antes de empezar. En una reforma hay cosas que no se conocen hasta abrir paredes y suelos, por ejemplo:
• Humedades ocultas, tuberías o cables en mal estado, bajantes deterioradas.
• Paredes, techos o forjados con más desperfectos de lo previsto, o desniveles importantes.
• Cambios o ampliaciones que el cliente decida durante la obra.
• Retrasos en la entrega de materiales o en la elección de acabados.
Si aparece algo así, LE AVISAMOS ANTES de hacer nada: le explicamos qué es, cuánto cuesta y cuánto tiempo añade, y solo se hace con su conformidad por escrito.
El plazo indicado incluye los tiempos de secado y fraguado normales; puede variar por estas causas, nunca sin explicárselo.`;
let pdfPreviewMode = 'budget'; // 'budget' | 'invoice'
let pdfSelectedInvoiceId = null;

function companyIdMissing() {
  const cif = String(appState.company.cif || '').trim();
  return !cif || /^\.+$/.test(cif) || /0{6,}/.test(cif);
}
function cifWarningHtml() {
  return companyIdMissing()
    ? `<div style="background:#fee2e2; color:#7f1d1d; border:2px solid #b91c1c; border-radius:8px; padding:8px 12px; margin-top:8px; font-weight:800;">⛔ FALTA TU CIF/NIF real (Ajustes → CIF / NIF). Una factura sin NIF no es válida: no la envíes hasta tenerlo.</div>`
    : '';
}
function renderPdfTab(proj, econ) {
  const toolbar = document.getElementById('pdfToolbar');
  if (pdfPreviewMode === 'invoice' && pdfSelectedInvoiceId) {
    const inv = (proj.invoices || []).find(i => i.id === pdfSelectedInvoiceId);
    if (inv) {
      toolbar.innerHTML = `
        <div><strong>Vista Previa de FACTURA: ${esc(inv.code)}</strong> <button class="btn btn-sm" onclick="setPdfBudgetMode()" style="margin-left:10px;">← Volver a ver el Presupuesto</button></div>
        <button class="btn btn-orange" onclick="window.print()">🖨️ Imprimir / Guardar Factura en PDF</button>${helpIcon('imprimir')}
        ${cifWarningHtml()}
      `;
      renderInvoicePdfDocument(proj, inv);
      return;
    }
    pdfPreviewMode = 'budget';
  }

  toolbar.innerHTML = `
    <div><strong>Vista Previa de PRESUPUESTO para el Cliente</strong> <span style="color:var(--text-muted); margin-left:6px;">(Al imprimir siempre sale en papel blanco A4).</span></div>
    <button class="btn btn-orange" onclick="printBudget()">🖨️ Imprimir / Guardar Presupuesto en PDF</button>${helpIcon('imprimir')}
  `;
  renderBudgetPdfDocument(proj, econ);
}

function renderInvoicePdfDocument(proj, inv) {
  const comp = appState.company;
  const isRect = inv.type === 'rectificative';

  let html = `<div class="pdf-sheet">`;
  html += `
    <div class="pdf-cover-header">
      <div class="pdf-logo-box">
        ${comp.logoBase64 ? `<img src="${comp.logoBase64}" alt="Logo">` : `<div style="font-size:1.5rem; font-weight:900;">${esc(comp.name)}</div>`}
        <div style="font-size:0.78rem; color:var(--text-muted); margin-top:8px;">
          <strong>${esc(comp.name)}</strong><br>CIF/NIF: ${esc(comp.cif)}<br>${esc(comp.address)}<br>Tel: ${esc(comp.phone)} | ${esc(comp.email)}
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.82rem; text-transform:uppercase; color:${isRect ? 'var(--red)' : 'var(--accent)'}; font-weight:800;">
          ${isRect ? 'FACTURA RECTIFICATIVA / ABONO' : 'FACTURA'}
        </div>
        <div style="font-size:1.6rem; font-weight:900; margin:4px 0;">${esc(inv.code)}</div>
        <div style="font-size:0.84rem; color:var(--text-muted);">Fecha emisión: <strong>${inv.date ? new Date(inv.date+'T12:00:00').toLocaleDateString('es-ES') : ''}</strong></div>
        <div style="font-size:0.8rem; color:var(--text-muted);">Ref. Presupuesto: ${esc(proj.code)}</div>
      </div>
    </div>
  `;

  if (isRect) {
    html += `
      <div class="pdf-rect-banner">
        <strong>DOCUMENTO RECTIFICATIVO (ABONO):</strong><br>
        Esta factura rectifica y anula la factura original nº <strong>${esc(inv.rectifiesCode)}</strong> de fecha <strong>${inv.rectifiesDate ? new Date(inv.rectifiesDate+'T12:00:00').toLocaleDateString('es-ES') : ''}</strong>.<br>
        Motivo: ${esc(inv.rectifyReason)}
      </div>
    `;
  }

  html += `
    <div class="pdf-two-col">
      <div class="pdf-box">
        <div style="font-size:0.74rem; text-transform:uppercase; color:var(--accent); font-weight:800; margin-bottom:6px;">Facturar a (Cliente)</div>
        <div style="font-size:0.95rem; font-weight:700;">${esc(proj.client.name || 'Cliente')}</div>
        ${proj.client.nif ? `<div style="font-size:0.82rem;">DNI/NIF: ${esc(proj.client.nif)}</div>` : ''}
        ${proj.client.phone ? `<div style="font-size:0.82rem;">Teléfono: ${esc(proj.client.phone)}</div>` : ''}
        ${proj.client.projectAddress ? `<div style="font-size:0.82rem; margin-top:4px;">Obra: ${esc(proj.client.projectAddress)}</div>` : ''}
      </div>
      <div class="pdf-box">
        <div style="font-size:0.74rem; text-transform:uppercase; color:var(--accent); font-weight:800; margin-bottom:6px;">Datos de Pago</div>
        <div style="font-size:0.82rem;">Forma de pago: Transferencia / Ingreso</div>
        ${comp.iban ? `<div style="font-size:0.84rem; margin-top:4px;">IBAN: <strong>${esc(comp.iban)}</strong></div>` : ''}
        <div style="font-size:0.76rem; color:var(--text-muted); margin-top:6px;">Concepto: ${esc(inv.concept)}</div>
      </div>
    </div>
  `;

  html += `
    <table class="pdf-table">
      <thead><tr><th style="width:55%;">Concepto / Descripción de Trabajos</th><th style="text-align:right;">Medición</th><th>Ud.</th><th style="text-align:right;">Precio Ud.</th><th style="text-align:right;">Importe</th></tr></thead>
      <tbody>
        ${(inv.lines || []).map(l => `
          <tr>
            <td><strong>${esc(l.name)}</strong>${l.desc ? `<div style="font-size:0.75rem; color:var(--text-muted);">${esc(l.desc)}</div>` : ''}</td>
            <td style="text-align:right;">${fmtNum(l.qty, 2)}</td>
            <td>${esc(l.unit)}</td>
            <td style="text-align:right;">${fmt(l.unitPrice)}</td>
            <td style="text-align:right; font-weight:700;">${fmt(l.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  if (inv.deductedAdvances && inv.deductedAdvances.length) {
    html += `
      <div class="pdf-box" style="margin-bottom:1rem;">
        <div style="font-weight:800; font-size:0.84rem; margin-bottom:6px;">Liquidación de Entregas / Facturas Previas Descontadas</div>
        <div style="font-size:0.8rem;">
          • Importe total trabajos ejecutados (100%): <strong>${fmt(inv.grossWorkBase)}</strong><br>
          ${inv.deductedAdvances.map(a => `• Menos factura previa <strong>${esc(a.code)}</strong> (${a.date ? new Date(a.date+'T12:00:00').toLocaleDateString('es-ES') : ''}): <strong>-${fmt(a.baseAmount)}</strong><br>`).join('')}
        </div>
      </div>
    `;
  }

  html += `
    <div class="pdf-totals-box">
      <div class="pdf-totals-row"><span>Base Imponible:</span><strong>${fmt(inv.baseAmount)}</strong></div>
      <div class="pdf-totals-row"><span>IVA (${inv.ivaPct}%):</span><strong>${fmt(inv.ivaAmount)}</strong></div>
      <div class="pdf-totals-row pdf-totals-final"><span>TOTAL FACTURA:</span><span>${fmt(inv.totalAmount)}</span></div>
    </div>
  `;

  html += `</div>`;
  document.getElementById('pdfPreviewContainer').innerHTML = html;
}

function renderBudgetPdfDocument(proj, econ) {
  const comp = appState.company;
  const pdfImages = proj.images.filter(img => img.includeInPdf);
  const rmBase = buildRoadmapData(proj, econ, false);
  const mData = econ.matsData;

  const baseChapters = proj.chapters.filter(c => !c.isOptional);
  const optChapters = proj.chapters.filter(c => !!c.isOptional);
  const hasOptionals = optChapters.some(ch => proj.items.some(i => i.active && i.chapterId === ch.id));

  const periods = payFreqOf() === 'quincenal' ? Math.max(1, Math.ceil(rmBase.totalSpanDays / 10)) : Math.max(1, Math.ceil(rmBase.totalSpanDays / 5));
  const freqWord = payFreqOf() === 'quincenal' ? 'quincenal (cada 15 días)' : 'semanal';
  const advPct = advancePctOf(proj);
  const initial25 = r2(econ.baseClientWithIva * advPct / 100);
  const rest75 = r2(econ.baseClientWithIva - initial25);
  const perPeriod = rest75 / periods;

  let html = `<div class="pdf-sheet">`;

  html += `
    <div class="pdf-cover-header">
      <div class="pdf-logo-box">
        ${comp.logoBase64 ? `<img src="${comp.logoBase64}" alt="Logo">` : `<div style="font-size:1.5rem; font-weight:900;">${esc(comp.name)}</div>`}
        <div style="font-size:0.78rem; color:var(--text-muted); margin-top:8px;">
          <strong>${esc(comp.name)}</strong><br>${companyIdMissing() ? '' : `CIF/NIF: ${esc(comp.cif)}<br>`}${esc(comp.address)}<br>Tel: ${esc(comp.phone)} | ${esc(comp.email)}
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.78rem; text-transform:uppercase; color:var(--accent); font-weight:800;">Presupuesto de Mano de Obra</div>
        <div style="font-size:1.5rem; font-weight:900; margin:4px 0;">${esc(proj.code)}</div>
        <div style="font-size:0.82rem; color:var(--text-muted);">Fecha: <strong>${proj.date ? new Date(proj.date+'T12:00:00').toLocaleDateString('es-ES') : ''}</strong></div>
        <div style="font-size:0.82rem; color:var(--text-muted);">Validez: <strong>30 días</strong></div>
      </div>
    </div>

    <div class="pdf-title-banner">
      <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Obra / Vivienda</div>
      <div style="font-size:1.2rem; font-weight:800; margin-top:2px;">${esc(proj.client.projectAddress || proj.title)}</div>
    </div>

    <div class="pdf-two-col">
      <div class="pdf-box">
        <div style="font-size:0.74rem; text-transform:uppercase; color:var(--accent); font-weight:800; margin-bottom:6px;">Datos del Cliente</div>
        <div style="font-size:0.95rem; font-weight:700;">${esc(proj.client.name || 'A quien corresponda')}</div>
        ${proj.client.nif ? `<div style="font-size:0.82rem;">DNI/NIF: ${esc(proj.client.nif)}</div>` : ''}
        ${proj.client.phone ? `<div style="font-size:0.82rem;">Teléfono: ${esc(proj.client.phone)}</div>` : ''}
        ${proj.client.projectAddress ? `<div style="font-size:0.82rem; margin-top:4px;">Dirección: ${esc(proj.client.projectAddress)}</div>` : ''}
      </div>
      <div class="pdf-box">
        <div style="font-size:0.74rem; text-transform:uppercase; color:var(--accent); font-weight:800; margin-bottom:6px;">Resumen Mano de Obra (Base)</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Base Mano de Obra:</span> <strong>${fmt(econ.baseClientBase)}</strong></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>IVA (${proj.ivaPct}%):</span> <strong>${fmt(econ.baseIvaAmount)}</strong></div>
        <div style="display:flex; justify-content:space-between; font-size:1.05rem; border-top:1px solid var(--border); padding-top:6px; margin-top:6px;">
          <strong>TOTAL MANO DE OBRA BASE:</strong> <strong style="color:var(--accent);">${fmt(econ.baseClientWithIva)}</strong>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px; border-top:1px dashed var(--border); padding-top:5px;">
          • <strong>Materiales:</strong> Elegidos y abonados aparte por el cliente (previsión orientativa en ${MAT_QUALITIES[matQuality(proj)].txt}: ~${fmt(mData.baseTotal)}).<br>
          ${hasOptionals ? `• <strong>Extras Opcionales de MO:</strong> ${fmt(econ.optClientBase)} (+IVA), detallados aparte.` : ''}
        </div>
      </div>
    </div>

    <h3 style="margin-top:1rem; font-size:0.95rem; border-bottom:1px solid var(--border-light); padding-bottom:6px;">Resumen Capítulos de Mano de Obra — Presupuesto Base</h3>
    <table class="pdf-table">
      <thead><tr><th>Capítulo</th><th style="text-align:right;">Mano de Obra (Sin IVA)</th></tr></thead>
      <tbody>
        ${baseChapters.map(ch => {
          const items = proj.items.filter(i => i.active && i.chapterId === ch.id);
          if (!items.length) return '';
          const sum = items.reduce((acc, i) => acc + econ.itemResults[i.id].clientTotal, 0);
          return `<tr><td>${esc(ch.name)}</td><td style="text-align:right; font-weight:700;">${fmt(sum)}</td></tr>`;
        }).join('')}
        ${econ.coordAmount ? `<tr><td>Medios auxiliares, gestión y coordinación de obra</td><td style="text-align:right; font-weight:700;">${fmt(econ.coordAmount)}</td></tr>` : ''}
        ${econ.minJobFill ? `<tr><td>Mínimo de servicio</td><td style="text-align:right; font-weight:700;">${fmt(econ.minJobFill)}</td></tr>` : ''}
        <tr style="background:var(--surface-2); font-weight:800;"><td>TOTAL MANO DE OBRA BASE (Antes de IVA)</td><td style="text-align:right; color:var(--accent);">${fmt(econ.baseClientBase)}</td></tr>
      </tbody>
    </table>

    ${hasOptionals ? `
      <h3 style="margin-top:1rem; font-size:0.95rem; border-bottom:1px solid #f59e0b; padding-bottom:6px;">Capítulos Extras Opcionales (Ajenos al Total Base)</h3>
      <table class="pdf-table">
        <thead><tr><th>Capítulo Opcional de Mano de Obra / Instalación</th><th style="text-align:right;">Importe (Sin IVA)</th></tr></thead>
        <tbody>
          ${optChapters.map(ch => {
            const items = proj.items.filter(i => i.active && i.chapterId === ch.id);
            if (!items.length) return '';
            const sum = items.reduce((acc, i) => acc + econ.itemResults[i.id].clientTotal, 0);
            return `<tr><td>${esc(ch.name)}</td><td style="text-align:right; font-weight:700;">${fmt(sum)}</td></tr>`;
          }).join('')}
          ${econ.optCoordAmount ? `<tr><td>Medios auxiliares, gestión y coordinación (de los extras)</td><td style="text-align:right; font-weight:700;">${fmt(econ.optCoordAmount)}</td></tr>` : ''}
        </tbody>
      </table>
    ` : ''}
  `;

  if (pdfImages.length) {
    html += `<div class="page-break"></div><h2 style="margin-top:0; border-bottom:2px solid var(--accent); padding-bottom:8px;">Documentación Gráfica y Planos</h2>`;
    pdfImages.forEach(img => {
      html += `<div class="pdf-image-block">${img.title ? `<div style="font-weight:800; margin-bottom:8px;">${esc(img.title)}</div>` : ''}<img src="${img.dataBase64}">${img.caption ? `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center;">${esc(img.caption)}</div>` : ''}</div>`;
    });
  }

  html += `<div class="page-break"></div><h2 style="margin-top:0; border-bottom:2px solid var(--accent); padding-bottom:8px;">Parte A — Desglose de Mano de Obra (Presupuesto Base)</h2>`;
  baseChapters.forEach(ch => {
    const items = proj.items.filter(i => i.active && i.chapterId === ch.id);
    if (!items.length) return;
    const chTotal = items.reduce((acc, i) => acc + econ.itemResults[i.id].clientTotal, 0);
    html += renderPdfChapterTable(ch, items, chTotal, econ, false);
  });

  html += `
    <div class="pdf-totals-box">
      <div class="pdf-totals-row"><span>Base Imponible Mano de Obra:</span><strong>${fmt(econ.baseClientBase)}</strong></div>
      <div class="pdf-totals-row"><span>IVA (${proj.ivaPct}%):</span><strong>${fmt(econ.baseIvaAmount)}</strong></div>
      <div class="pdf-totals-row pdf-totals-final"><span>TOTAL MANO DE OBRA BASE:</span><span>${fmt(econ.baseClientWithIva)}</span></div>
    </div>
  `;

  if (hasOptionals) {
    html += `<div class="pdf-optional-banner"><strong>CAPÍTULOS EXTRAS OPCIONALES DE MANO DE OBRA (Ajenos al Total Base)</strong></div>`;
    optChapters.forEach(ch => {
      const items = proj.items.filter(i => i.active && i.chapterId === ch.id);
      if (!items.length) return;
      const chTotal = items.reduce((acc, i) => acc + econ.itemResults[i.id].clientTotal, 0);
      html += renderPdfChapterTable(ch, items, chTotal, econ, true);
    });
    html += `
      <div class="pdf-totals-box" style="border-color:#f59e0b;">
        <div class="pdf-totals-row"><span>Suma Extras Mano de Obra (Sin IVA):</span><strong>${fmt(econ.optClientBase)}</strong></div>
        <div class="pdf-totals-row"><span>Total Base + Todos los Extras (Con IVA):</span><strong>${fmt(econ.grandClientWithIva)}</strong></div>
      </div>
    `;
  }

  html += `<div class="page-break"></div>`;
  const mg = materialGroups(proj, econ.matsData);
  html += `<h2 style="margin-top:0; border-bottom:2px solid var(--accent); padding-bottom:8px;">Parte B — Previsión de Materiales (aparte de la Mano de Obra)</h2>`;
  html += `
    <div class="pdf-optional-banner" style="margin-top:0.5rem;">
      <strong>IMPORTANTE SOBRE LOS MATERIALES:</strong> Esta lista es una estimación orientativa de cantidades y precios de mercado. <strong>Los materiales se abonan de forma totalmente independiente a la mano de obra.</strong>
      Cuando los compra la empresa, se solicitará una <strong>provisión de fondos</strong> antes de encargar o retirar cada suministro.<br>
      <strong>Previsión calculada con materiales de ${MAT_QUALITIES[matQuality(proj)].txt}.</strong> El precio final depende de los modelos que usted elija: puede ser menor o mayor.
    </div>
  `;
  const pdfMatTable = (rows, title, total, cls) => {
    if (!rows.length) return '';
    const who = [...new Set(rows.map(r => r.buyer))];
    const whoTxt = who.length > 1 ? 'Parte la compra el cliente y parte la empresa (ver columna)' : (who[0] === 'empresa' ? 'Los compra la empresa (provisión de fondos)' : 'Los elige y compra el cliente');
    return `<div class="pdf-chapter-title ${cls || ''}"><span>${title}</span><span>Estimación: ${fmt(total)}</span></div>
      <div style="font-size:0.8rem; margin:0 0 4px;">${whoTxt}</div>
      <table class="pdf-table"><thead><tr><th>Material</th><th style="text-align:right;">Cant.</th><th>Ud.</th><th style="text-align:right;">P. Ref.</th><th style="text-align:right;">Estimado</th>${who.length > 1 ? '<th>Lo compra</th>' : ''}</tr></thead><tbody>
      ${rows.map(r => `<tr><td>${esc(r.name)}</td><td style="text-align:right;">${fmtNum(r.qty, r.roundUp ? 0 : 1)}</td><td>${esc(r.unit)}</td><td style="text-align:right;">${fmt(r.clientPrice)}</td><td style="text-align:right; font-weight:700;">${fmt(r.clientSubtotal)}</td>${who.length > 1 ? `<td>${r.buyer === 'empresa' ? 'Empresa' : 'Cliente'}</td>` : ''}</tr>`).join('')}
      </tbody></table>`;
  };
  const sumOf = rows => r2(rows.reduce((t, r) => t + r.clientSubtotal, 0));
  ['elegir', 'obra'].forEach((k, i) => {
    const base = mg[k].rows.filter(r => !r.isOpt), opt = mg[k].rows.filter(r => r.isOpt);
    html += pdfMatTable(base, `B${i + 1}. ${MAT_KINDS[k].name} — Reforma Base`, sumOf(base));
    html += pdfMatTable(opt, `B${i + 1}. ${MAT_KINDS[k].name} — Capítulos Extras Opcionales`, sumOf(opt), 'optional-title');
  });

  html += `<div class="page-break"></div>`;
  html += `<h2 style="margin-top:0; border-bottom:2px solid var(--accent); padding-bottom:8px;">Planificación de Obra (Roadmap) y Forma de Pago</h2>`;
  html += renderRoadmapHtml(proj, econ, true);

  html += `
    <div style="margin-top:1.8rem; page-break-inside:avoid;">
      <div class="pdf-two-col">
        <div class="pdf-box">
          <div style="font-weight:800; font-size:0.86rem; margin-bottom:6px;">Forma de Pago (Independiente Mano de Obra y Materiales)</div>
          <div style="font-size:0.8rem;">
            <strong>1. MANO DE OBRA (Presupuesto Base ${fmt(econ.baseClientWithIva)} IVA incl.):</strong><br>
            • <strong>${fmtNum(advPct,0)}% a la aceptación del presupuesto:</strong> ${fmt(initial25)}<br>
            • <strong>${fmtNum(100-advPct,0)}% restante (${fmt(rest75)}):</strong> mediante certificaciones de avance de obra de forma <strong>${freqWord}</strong> (~${periods} abonos de aprox. ${fmt(perPeriod)}).<br><br>
            <strong>2. MATERIALES (Aparte de la Mano de Obra):</strong><br>
            • Adelanto previo al 100% mediante provisión de fondos antes de cursar cada pedido o retirada en proveedores, o pago directo del cliente en almacén.
          </div>
        </div>
        <div class="pdf-box">
          <div style="font-weight:800; font-size:0.86rem; margin-bottom:6px;">Condiciones Generales</div>
          <div style="font-size:0.8rem; white-space:pre-line;">${esc(comp.conditions)}</div>
        </div>
      </div>
      <div class="pdf-box" style="margin-top:0.8rem; border-left:4px solid #f59e0b;">
        <div style="font-weight:800; font-size:0.86rem; margin-bottom:6px;">⚠️ Imprevistos y posibles variaciones (le hablamos claro)</div>
        <div style="font-size:0.8rem; white-space:pre-line;">${esc(comp.variationsText || DEFAULT_VARIATIONS_TEXT)}</div>
      </div>

    </div>
  `;
  html += renderAcceptanceBox(proj, econ);

  html += `</div>`;
  document.getElementById('pdfPreviewContainer').innerHTML = html;
}

// Recuadro de aceptación: el cliente marca extras, firma, pone DNI y fecha
function renderAcceptanceBox(proj, econ) {
  const comp = appState.company;
  const ivaPct = Number(proj.ivaPct) || 10;
  const optChapters = proj.chapters.filter(c => c.isOptional).map(c => {
    const base = r2(proj.items.filter(i => i.active && i.chapterId === c.id).reduce((s, i) => s + econ.itemResults[i.id].clientTotal, 0));
    return { name: c.name, base };
  }).filter(c => c.base > 0);
  return `
    <div class="pdf-accept">
      <div class="pdf-accept-title">ACEPTACIÓN DEL PRESUPUESTO Nº ${esc(proj.code)}</div>
      <div class="pdf-accept-text">
        El cliente abajo firmante acepta el presupuesto de mano de obra nº <strong>${esc(proj.code)}</strong> de fecha ${fmtDateEs(proj.date)},
        para la obra situada en <strong>${esc(proj.client.projectAddress || '________________________________')}</strong>,
        por un importe <strong>BASE de ${fmt(econ.baseClientBase)} + IVA (${ivaPct}%) = ${fmt(econ.baseClientWithIva)}</strong>,
        con la forma de pago y las condiciones generales indicadas en este documento.
      </div>
      ${optChapters.length ? `
        <div class="pdf-accept-sub">Extras opcionales que el cliente SÍ desea contratar (marcar con una X):</div>
        <table class="pdf-accept-opts">
          ${optChapters.map(c => `<tr><td class="pdf-accept-chk">☐</td><td>${esc(c.name)}</td><td style="text-align:right; white-space:nowrap;">${fmt(c.base)} + IVA</td></tr>`).join('')}
        </table>
        <div class="pdf-accept-note">Los extras no marcados quedan excluidos.</div>` : ''}
      <div class="pdf-accept-grid">
        <div class="pdf-accept-col">
          <div class="pdf-accept-col-title">EL CLIENTE</div>
          <div class="pdf-accept-line">Nombre: ${esc(proj.client.name || '')}</div>
          <div class="pdf-accept-line">DNI/NIF: ${esc(proj.client.nif || '')}</div>
          <div class="pdf-accept-line">Fecha: ____ / ____ / ________</div>
          <div class="pdf-accept-sign">Firma:</div>
        </div>
        <div class="pdf-accept-col">
          <div class="pdf-accept-col-title">LA EMPRESA</div>
          <div class="pdf-accept-line">${esc(comp.name || '')}</div>
          <div class="pdf-accept-line">${companyIdMissing() ? '&nbsp;' : 'CIF/NIF: ' + esc(comp.cif)}</div>
          <div class="pdf-accept-line">Fecha: ____ / ____ / ________</div>
          <div class="pdf-accept-sign">Firma y sello:</div>
        </div>
      </div>
    </div>`;
}

function renderPdfChapterTable(ch, items, chTotal, econ, isOpt) {
  return `
    <div class="pdf-chapter-title ${isOpt ? 'optional-title' : ''}"><span>${esc(ch.name)}</span><span>${fmt(chTotal)}</span></div>
    <table class="pdf-table">
      <thead><tr><th style="width:52%;">Concepto de Mano de Obra</th><th style="text-align:right;">Medición</th><th>Ud.</th><th style="text-align:right;">Precio Ud.</th><th style="text-align:right;">Total</th></tr></thead>
      <tbody>
        ${items.map(i => {
          const r = econ.itemResults[i.id];
          return `<tr><td><strong>${esc(i.name)}</strong>${i.desc ? `<div style="font-size:0.76rem; color:var(--text-muted); margin-top:2px;">${esc(i.desc)}</div>` : ''}</td><td style="text-align:right;">${fmtNum(i.qty, 2)}</td><td>${esc(i.unit)}</td><td style="text-align:right;">${fmt(r.clientUnit)}</td><td style="text-align:right; font-weight:700;">${fmt(r.clientTotal)}</td></tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}