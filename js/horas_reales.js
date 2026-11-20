// ============================================================
// HORAS REALES vs PRESUPUESTADAS (solo partidas de ejecución propia)
//   item.realHours = horas-persona reales acumuladas en esa partida
// ============================================================
const RH_TOLERANCE = 10; // ±10% se considera "en lo previsto"

function setRealHours(itemId, val) {
  const item = getCurrentProject().items.find(i => i.id === itemId);
  if (!item) return;
  const v = parseFloat(String(val).replace(',', '.'));
  if (String(val).trim() === '' ) delete item.realHours;
  else item.realHours = Math.max(0, isNaN(v) ? 0 : r2(v));
  saveState(); renderAll();
}

function addTodayHours(itemId, inputEl) {
  const v = parseFloat(String(inputEl.value).replace(',', '.'));
  if (!v || v <= 0) return;
  const item = getCurrentProject().items.find(i => i.id === itemId);
  if (!item) return;
  item.realHours = r2((Number(item.realHours) || 0) + v);
  saveState(); renderAll();
  showToast(`⏱️ +${fmtNum(v, 1)} h en "${item.name}" (total ${fmtNum(item.realHours, 1)} h)`);
}

function deviationInfo(budgetH, realH) {
  if (!(realH > 0) || !(budgetH > 0)) return null;
  const pct = (realH - budgetH) / budgetH * 100;
  if (Math.abs(pct) <= RH_TOLERANCE) return { pct, icon: '≈', text: 'En lo previsto', cls: 'dev-ok' };
  if (pct > 0) return { pct, icon: '▲', text: `${fmtNum(pct, 0)}% más lento`, cls: 'dev-slow' };
  return { pct, icon: '▼', text: `${fmtNum(-pct, 0)}% más rápido`, cls: 'dev-fast' };
}

// Pasa el rendimiento real (h/ud) a la biblioteca de partidas
function teachLibrary(itemId) {
  const proj = getCurrentProject();
  const item = proj.items.find(i => i.id === itemId);
  if (!item || !(item.realHours > 0) || !(item.qty > 0)) return;
  const hpu = Math.round(item.realHours / item.qty * 1000) / 1000;
  const lib = appState.itemLibrary.find(l => normTxt(l.name) === normTxt(item.name));
  if (lib) {
    if (!confirm(`"${item.name}"\n\nBiblioteca: ${fmtNum(lib.hoursPerUnit, 3)} h/${lib.unit}\nReal en esta obra: ${fmtNum(hpu, 3)} h/${item.unit}\n\n¿Guardar el valor real en nuestra biblioteca?\n(Este presupuesto no cambia.)`)) return;
    lib.hoursPerUnit = hpu;
    lib.updatedAt = Date.now();
  } else {
    if (!confirm(`"${item.name}" no está en nuestra biblioteca.\n\n¿Añadirla con el rendimiento real de ${fmtNum(hpu, 3)} h/${item.unit}?`)) return;
    const ch = proj.chapters.find(c => c.id === item.chapterId);
    const e = libEntryFromItem(item, ch ? ch.name : '');
    e.hoursPerUnit = hpu;
    appState.itemLibrary.push(e);
  }
  saveState(); renderAll();
  showToast(`📚 Biblioteca actualizada: ${fmtNum(hpu, 3)} h/${item.unit}`);
}

function renderRealHoursTab(proj, econ) {
  const box = document.getElementById('realHoursView');
  if (!box) return;
  const items = proj.items.filter(i => i.active && i.mode === 'own');
  if (!items.length) { box.innerHTML = '<p style="color:var(--text-muted);">No hay partidas de ejecución propia activas.</p>'; return; }

  const hourCost = econ.avgHourlyLaborCost || 0;
  const manHoursDay = econ.crewDailyManHours || 0;
  let bH = 0, rH = 0, bHwithReal = 0, withReal = 0;
  const rows = items.map(i => {
    const ch = proj.chapters.find(c => c.id === i.chapterId);
    const isOpt = !!(ch && ch.isOptional);
    const budgetH = r2((Number(i.qty) || 0) * (Number(i.hoursPerUnit) || 0));
    const realH = Number(i.realHours) || 0;
    const hasReal = i.realHours !== undefined && i.realHours !== null && realH > 0;
    bH += budgetH;
    if (hasReal) { rH += realH; bHwithReal += budgetH; withReal++; }
    const dev = hasReal ? deviationInfo(budgetH, realH) : null;
    const realHpu = hasReal && i.qty > 0 ? realH / i.qty : null;
    return `
      <tr>
        <td><strong>${esc(i.name)}</strong>${isOpt ? ' <span class="badge badge-opt">Extra</span>' : ''}<div style="font-size:0.8em; color:var(--text-muted);">${esc(ch ? ch.name : '')}</div></td>
        <td style="text-align:right; white-space:nowrap;">${fmtNum(i.qty, 2)} ${esc(i.unit)}</td>
        <td style="text-align:right;">${fmtNum(i.hoursPerUnit, 2)}</td>
        <td style="text-align:right; font-weight:700;">${fmtNum(budgetH, 1)} h</td>
        <td style="white-space:nowrap;">
          <input type="number" min="0" step="0.5" class="inline-input num-input" style="width:5.5rem;" value="${hasReal ? realH : ''}" placeholder="—" onchange="setRealHours('${i.id}', this.value)" title="Total de horas-persona reales">
        </td>
        <td style="white-space:nowrap;">
          <input type="number" min="0" step="0.5" class="inline-input" style="width:4.5rem;" placeholder="+ h" onkeydown="if(event.key==='Enter') addTodayHours('${i.id}', this)" title="Escribe las horas de hoy y pulsa Enter o +">
          <button class="btn btn-sm" onclick="addTodayHours('${i.id}', this.previousElementSibling)">+</button>
        </td>
        <td>${dev ? `<span class="dev-badge ${dev.cls}">${dev.icon} ${dev.text}</span><div style="font-size:0.8em;">${realH > budgetH ? '+' : ''}${fmtNum(realH - budgetH, 1)} h</div>` : '<span style="color:var(--text-muted);">Sin datos</span>'}</td>
        <td style="text-align:right;">${realHpu !== null ? `<strong>${fmtNum(realHpu, 3)}</strong>` : '—'}</td>
        <td>${realHpu !== null ? `<button class="btn btn-sm" onclick="teachLibrary('${i.id}')" title="Guardar el h/ud real en nuestra biblioteca">📚 Enseñar</button>` : ''}</td>
      </tr>`;
  }).join('');

  // Desviación económica (solo partidas con horas reales apuntadas)
  const extraH = rH - bHwithReal;
  const extraLabor = extraH * hourCost;
  const extraDays = manHoursDay > 0 ? extraH / manHoursDay : 0;
  const extraOpex = extraDays * (econ.totalDailyOperational || 0);
  const realProfit = econ.baseNetProfit - extraLabor - extraOpex;
  const dev = deviationInfo(bHwithReal, rH);
  const progress = items.length ? Math.round(withReal / items.length * 100) : 0;

  box.innerHTML = `
    <div class="rh-summary">
      <div class="pdf-box">
        <div class="rh-k">Horas presupuestadas (todas las partidas propias)</div>
        <div class="rh-v">${fmtNum(bH, 1)} h</div>
        <div class="rh-s">${withReal} de ${items.length} partidas con horas reales (${progress}%)</div>
      </div>
      <div class="pdf-box">
        <div class="rh-k">En las partidas con datos: previsto → real</div>
        <div class="rh-v">${fmtNum(bHwithReal, 1)} h → ${fmtNum(rH, 1)} h</div>
        <div class="rh-s">${dev ? `<span class="dev-badge ${dev.cls}">${dev.icon} ${dev.text}</span> (${extraH >= 0 ? '+' : ''}${fmtNum(extraH, 1)} h)` : 'Apunta horas reales para ver la desviación'}</div>
      </div>
      <div class="pdf-box">
        <div class="rh-k">Beneficio de la obra base: previsto → real estimado ${helpIcon('rhBeneficio')}</div>
        <div class="rh-v">${fmt(econ.baseNetProfit)} → ${withReal ? fmt(realProfit) : '—'}</div>
        <div class="rh-s">${withReal ? `${extraLabor + extraOpex >= 0 ? 'Nos cuesta' : 'Ahorramos'} ${fmt(Math.abs(extraLabor + extraOpex))} en sueldos, furgoneta y comidas` : `Cada hora de más cuesta ~${fmt(hourCost)} de sueldos`}</div>
      </div>
    </div>
    <div class="table-wrap">
      <table class="items-table">
        <thead><tr><th>Partida</th><th style="text-align:right;">Medición</th><th style="text-align:right;">h/ud prev.</th><th style="text-align:right;">Horas prev.</th><th>Horas reales (total) ${helpIcon('rhTotal')}</th><th>Sumar hoy ${helpIcon('rhHoy')}</th><th>Desviación ${helpIcon('rhDesviacion')}</th><th style="text-align:right;">h/ud real ${helpIcon('rhHudReal')}</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
