// ============================================================
// 💰 PRECIO: todo lo que importa de un presupuesto, en una pantalla
//   - Lo que se cobra, lo que cuesta, lo que gana la empresa y cada persona al mes
//   - Hasta dónde se puede bajar (no perder / objetivo mensual)
//   - Qué pasa si se termina antes
//   - Comparación con el precio de la competencia
// ============================================================
function priceModel(proj, econ) {
  const comp = appState.company;
  const PR = econ.pricing;
  const wdm = Math.max(1, Number(comp.workDaysPerMonth) || 21);
  const cs = econ.crewInfo;
  const n = Math.max(1, cs.nTotal);
  const wagesDaily = cs.members.reduce((t, m) => t + m.count * m.wage, 0);
  const daily = econ.crewDailyLaborCost + econ.totalDailyOperational;
  const full = econ.planning.crewFull;
  const D = econ.plazoDays;
  const costsAt = d => full ? econ.baseInternalCostAll - (D - d) * daily : econ.baseInternalCostAll;
  const wagesAt = d => full ? d * wagesDaily : (econ.baseLaborCost / Math.max(1, econ.crewDailyLaborCost)) * wagesDaily;
  const monthsAt = d => Math.max(0.05, d / wdm);
  const perMonth = (P, d) => (wagesAt(d) + (P - costsAt(d))) / n / monthsAt(d);
  // Líquido aproximado: sueldo neto + beneficio neto (después de Sociedades y de dividendos)
  const netMonth = (P, d) => (wagesAt(d) * (Number(PR.netWagePct) || 0) / 100 + Math.max(0, P - costsAt(d)) * (Number(PR.netProfitPct) || 0) / 100 + Math.min(0, P - costsAt(d))) / n / monthsAt(d);
  const floorTarget = (d, target) => target * monthsAt(d) * n - wagesAt(d) + costsAt(d);
  return { PR, wdm, n, wagesDaily, daily, full, D, costsAt, wagesAt, monthsAt, perMonth, netMonth, floorTarget,
    tMin: Number(PR.targetMonthlyMin) || 0, tMax: Number(PR.targetMonthlyMax) || 0 };
}
function monthSignal(v, m) {
  if (v < m.tMin) return { ico: '🔴', txt: 'por debajo de nuestro objetivo', cls: 'eq-bad' };
  if (m.tMax && v > m.tMax) return { ico: '🔵', txt: 'por encima de nuestro objetivo', cls: '' };
  return { ico: '🟢', txt: 'dentro de nuestro objetivo', cls: 'eq-ok' };
}
function setProjNum(f, v) { const p = getCurrentProject(); p[f] = v; saveState(); renderAll(); }

function renderPriceTab(proj, econ) {
  const box = document.getElementById('priceView'); if (!box) return;
  const m = priceModel(proj, econ);
  const P = econ.baseClientBase, mat = econ.matsData.baseTotal;
  const pm = m.perMonth(P, m.D), sig = monthSignal(pm, m);
  const weeks = d => fmtNum(d / 5, 1);
  const scen = [0, 5, 10].map(k => Math.max(1, m.D - k)).filter((d, i, a) => a.indexOf(d) === i);
  const ehOk = econ.salePerHour >= m.PR.minHourRate;
  const cMO = Number(proj.competitorMO) || 0, cMat = Number(proj.competitorMat) || 0;
  const cSig = cMO ? monthSignal(m.perMonth(cMO, m.D), m) : null;
  const diff = (a, b) => { const d = r2(a - b); return d === 0 ? '=' : (d > 0 ? '+' : '−') + fmt(Math.abs(d)); };
  box.innerHTML = `
    <p class="modal-intro">Todo lo importante de <strong>${esc(proj.code)} ${esc(proj.title)}</strong> en una pantalla: lo que cobramos, lo que nos cuesta, lo que nos llevamos <strong>cada uno al mes</strong> y <strong>hasta dónde podemos bajar</strong> sin pillaros los dedos.${m.full ? '' : ' <strong>Ojo:</strong> en esta obra el equipo no está todo el plazo (casilla en «Equipo y gastos»), así que las cifras por mes son orientativas.'}</p>
    <div class="eq-grid">
      <div class="card eq-card"><div class="eq-head"><span class="eq-icon">💶</span><div><div class="eq-name">Lo que cobramos ${helpIcon('precioCobrais')}</div><div class="eq-sub">Mano de obra, sin IVA</div></div></div>
        <div class="price-big">${fmt(P)}</div>
        <div class="eq-sub">Con IVA: <strong>${fmt(econ.baseClientWithIva)}</strong> · Materiales aparte (previsión): <strong>${fmt(mat)}</strong></div>
        <div class="eq-result">Total para el cliente (MO + materiales, sin IVA): <strong>${fmt(P + mat)}</strong></div></div>
      <div class="card eq-card"><div class="eq-head"><span class="eq-icon">⏳</span><div><div class="eq-name">Plazo</div><div class="eq-sub">Con esperas de secado e imprevistos</div></div></div>
        <div class="price-big">${m.D} días</div>
        <div class="eq-sub">≈ ${weeks(m.D)} semanas · ${fmtNum(m.monthsAt(m.D), 1)} meses de trabajo</div>
        <div class="eq-result">En el PDF: entre ${Math.max(1, Math.round(m.D / 5))} y ${Math.ceil(m.D * 1.15 / 5)} semanas</div></div>
      <div class="card eq-card ${sig.cls}"><div class="eq-head"><span class="eq-icon">👥</span><div><div class="eq-name">Cada uno, al mes ${helpIcon('cadaUnoMes')}</div><div class="eq-sub">Sueldo + parte del beneficio, a partes iguales entre ${m.n}</div></div></div>
        <div class="price-big">${sig.ico} ${fmt(pm)} <span class="eq-sub">bruto</span></div>
        <div class="eq-result"><strong>Líquido aprox.: ${fmt(m.netMonth(P, m.D))} al mes</strong> ${helpIcon('liquido')}</div>
        <div class="eq-sub"><strong>${sig.txt}</strong> (${fmt(m.tMin)} – ${fmt(m.tMax)} brutos al mes). En toda la obra: <strong>${fmt(pm * m.monthsAt(m.D))}</strong> brutos cada uno. Sin comidas.</div></div>
      <div class="card eq-card"><div class="eq-head"><span class="eq-icon">🏢</span><div><div class="eq-name">Lo que gana la empresa</div><div class="eq-sub">Después de sueldos, S.S., gastos y subcontratas</div></div></div>
        <div class="price-big ${econ.baseNetProfit >= 0 ? 'eq-good' : 'eq-warn'}">${fmt(econ.baseNetProfit)}</div>
        <div class="eq-sub">${fmtNum(econ.baseNetProfitPct, 1)} % de la venta · Nos cuesta: <strong>${fmt(econ.baseInternalCostAll)}</strong></div></div>
    </div>

    <div class="card eq-card" style="margin-top:1.2rem;">
      <div class="eq-head"><span class="eq-icon">📉</span><div><div class="eq-name">Hasta dónde podemos bajar ${helpIcon('hastaDonde')}</div><div class="eq-sub">Precio de mano de obra (sin IVA, sin materiales)</div></div></div>
      <div class="table-wrap"><table class="pdf-table">
        <thead><tr><th>Si terminamos en…</th><th style="text-align:right;">Mínimo para no perder</th><th style="text-align:right;">Mínimo para ${fmt(m.tMin)}/mes cada uno</th><th style="text-align:right;">Con el precio actual, cada uno/mes (bruto · líquido aprox.)</th></tr></thead>
        <tbody>${scen.map((d, i) => { const v = m.perMonth(P, d), s = monthSignal(v, m); return `<tr>
          <td><strong>${d} días</strong> (≈ ${weeks(d)} sem.)${i === 0 ? ' — <em>plazo calculado</em>' : ` — <em>${i === 1 ? 'una semana antes' : 'dos semanas antes'}</em>`}</td>
          <td style="text-align:right;">${fmt(m.costsAt(d))}</td>
          <td style="text-align:right; font-weight:800;">${fmt(m.floorTarget(d, m.tMin))}</td>
          <td style="text-align:right; font-weight:800;">${s.ico} ${fmt(v)} · ${fmt(m.netMonth(P, d))}</td></tr>`; }).join('')}</tbody>
      </table></div>
      <p class="eq-sub">Por debajo del "mínimo para no perder", la obra nos cuesta dinero. Entre los dos mínimos, ganamos, pero menos de lo que nos hemos marcado.${m.full ? ' Terminar antes con el mismo precio es dinero para nosotros: cada día menos son ' + fmt(m.daily) + ' que no se gastan.' : ''}</p>
    </div>

    <div class="card eq-card" style="margin-top:1.2rem;">
      <div class="eq-head"><span class="eq-icon">🆚</span><div><div class="eq-name">Comparar con otra empresa ${helpIcon('competencia')}</div><div class="eq-sub">Dos números: mano de obra y materiales. Lo que nos importa es la mano de obra.</div></div></div>
      <div class="visit-fields">
        <label>👷 Su mano de obra (sin IVA)<input type="number" min="0" step="100" value="${cMO || ''}" placeholder="Ej.: 27000" onchange="setProjNum('competitorMO', parseFloat(this.value)||0)"></label>
        <label>🧱 Sus materiales, aprox. (sin IVA)<input type="number" min="0" step="100" value="${cMat || ''}" placeholder="Ej.: 13000" onchange="setProjNum('competitorMat', parseFloat(this.value)||0)"></label>
      </div>
      ${cMO || cMat ? `<div class="table-wrap" style="margin-top:0.7rem;"><table class="pdf-table">
        <thead><tr><th></th><th style="text-align:right;">Ellos</th><th style="text-align:right;">Nosotros</th><th style="text-align:right;">Diferencia</th></tr></thead>
        <tbody>
          <tr><td><strong>👷 Mano de obra</strong></td><td style="text-align:right; font-weight:800;">${cMO ? fmt(cMO) : '—'}</td><td style="text-align:right; font-weight:800;">${fmt(P)}</td><td style="text-align:right;">${cMO ? diff(P, cMO) : '—'}</td></tr>
          <tr><td>🧱 Materiales (aprox.)</td><td style="text-align:right;">${cMat ? fmt(cMat) : '—'}</td><td style="text-align:right;">${fmt(mat)}</td><td style="text-align:right;">${cMat ? diff(mat, cMat) : '—'}</td></tr>
        </tbody></table></div>
      <p class="eq-sub">Los materiales los elige y paga el cliente: su precio depende de la calidad que escoja y no cambia lo que ganamos nosotros.</p>
      ${cMO ? `<div class="eq-result ${cSig.cls}">Si igualamos <strong>su mano de obra (${fmt(cMO)})</strong>:<br>
        ${scen.map(d => { const v = m.perMonth(cMO, d), s2 = monthSignal(v, m); return `${s2.ico} Terminando en <strong>${d} días</strong>: cada uno <strong>${fmt(v)}/mes</strong> bruto (≈ ${fmt(m.netMonth(cMO, d))} líquido) · empresa ${fmt(cMO - m.costsAt(d))}`; }).join('<br>')}<br>
        ${(() => { const last = scen[scen.length - 1];
          if (cMO < m.costsAt(m.D)) return '⚠️ <strong>A esa mano de obra perdemos dinero con el plazo calculado.</strong>';
          if (cMO >= m.floorTarget(m.D, m.tMin)) return '✅ <strong>Podemos igualarla</strong> y seguir dentro de nuestro objetivo.';
          if (cMO >= m.floorTarget(last, m.tMin)) return '⚠️ Solo llegamos a nuestro objetivo <strong>si lo terminamos antes</strong> (mirad las líneas de arriba).';
          return `⚠️ Ganamos, pero <strong>por debajo de nuestro objetivo</strong>. Para ${fmt(m.tMin)}/mes cada uno, nuestra mano de obra no debería bajar de <strong>${fmt(m.floorTarget(m.D, m.tMin))}</strong>.`; })()}</div>` : ''}` : ''}
    </div>`;
}
