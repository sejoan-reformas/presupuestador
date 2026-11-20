// Redondeo a céntimos (evita descuadres de 1 céntimo entre base, IVA y total)
function r2(n) { const x = Number(n) || 0; return Math.round((x + (x >= 0 ? Number.EPSILON : -Number.EPSILON)) * 100) / 100; }
// Fecha local AAAA-MM-DD (toISOString da la fecha UTC: de 00:00 a 01:00/02:00 sale el día anterior)
function todayLocalStr(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
// Formato español con punto de miles SIEMPRE (toLocaleString no lo pone en cifras de 4 dígitos)
function fmtNum(n, dec = 2) {
  const x = Number(n) || 0;
  const fixed = Math.abs(x).toFixed(dec);
  let [ent, frac] = fixed.split('.');
  ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const neg = x < 0 && Number(fixed) !== 0;
  return (neg ? '-' : '') + ent + (dec > 0 ? ',' + frac : '');
}
function fmt(n) { return fmtNum(n, 2) + ' €'; }
function esc(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
}
function isChapterOptional(proj, chapterId) {
  const ch = proj.chapters.find(c => c.id === chapterId);
  return !!(ch && ch.isOptional);
}

// ---------- Precios mínimos, plazos reales (pestaña «Empresa») ----------
const DEFAULT_PRICING = {
  realityFactor: 1.65,       // multiplica las horas "de libro" de cada partida (se calibra con las horas reales)
  minItemHours: 2,           // ninguna partida propia por debajo de estas horas
  minSubCharge: 120,         // salida mínima de una subcontrata
  minJobLabor: 250,          // mínimo de mano de obra de cualquier trabajo
  minHourRate: 20,           // tarifa mínima media por persona y hora (aviso)
  coordPct: 5,               // medios auxiliares y coordinación (% de la mano de obra)
  idlePctDefault: 10,        // tiempo improductivo por defecto en obras nuevas
  targetMonthlyMin: 2500,    // objetivo: lo que debe llevarse cada persona al mes (mínimo)
  targetMonthlyMax: 3500,    // … y máximo razonable
  netWagePct: 81.5,          // del sueldo bruto queda limpio (− 6,5 % S.S. trabajador − ~12 % IRPF)
  netProfitPct: 65.6         // del beneficio repartido queda limpio (− 19 % Sociedades − 19 % dividendos)
};
// Esperas obligatorias (secado, fraguado…) después de cada tipo de trabajo, en días laborables.
// Cada fase espera lo que pida el trabajo más lento que tenga. Se pueden cambiar en la pestaña «Empresa».
const DEFAULT_WAIT_RULES = [
  { key: 'yeso', match: 'yeso|alisado|enlucido|emplaste|tendido', days: 3, label: 'Yeso / alisado (secar antes de pintar)' },
  { key: 'solera', match: 'solera|recrecido|nivelaci|autonivel', days: 3, label: 'Solera / recrecido / nivelación' },
  { key: 'enfoscado', match: 'enfoscad|maestread|regularizaci|raseo', days: 1, label: 'Enfoscado / maestreado' },
  { key: 'imperm', match: 'impermeabiliz|ducha de obra', days: 1, label: 'Impermeabilización' },
  { key: 'reparac', match: 'grieta|reparaci', days: 1, label: 'Reparación con mortero' },
  { key: 'alicatado', match: 'alicatad|solado|porcel|gres', days: 1, label: 'Alicatado / solado (rejuntar)' },
  { key: 'pintura', match: 'pintura|esmalt|lacado', days: 0.5, label: 'Pintura (entre manos)' },
  { key: 'pladur', match: 'pladur|trasdosad', days: 0.5, label: 'Pladur (pasta y cinta)' },
  { key: 'tabique', match: 'tabique|ladrillo', days: 1, label: 'Tabique de ladrillo' }
];
function pricingSettings() {
  const p = appState.company.pricing || {};
  const waits = DEFAULT_WAIT_RULES.map(r => ({ ...r, days: (p.waitDays && p.waitDays[r.key] !== undefined) ? Number(p.waitDays[r.key]) || 0 : r.days }));
  return { ...DEFAULT_PRICING, ...p, waitRules: waits };
}
function itemWaitDays(item, PR) {
  if (item.waitDays !== undefined && item.waitDays !== null && item.waitDays !== '') return Number(item.waitDays) || 0;
  const n = normTxt ? normTxt(item.name || '') : String(item.name || '').toLowerCase();
  let w = 0;
  (PR || pricingSettings()).waitRules.forEach(r => { if (new RegExp(r.match).test(n)) w = Math.max(w, r.days); });
  return w;
}
function planningOf(proj) {
  const pl = proj.planning || {};
  // Tiempo improductivo: dato general. El equipo está en la obra todo el plazo. Lo único de la obra: el ajuste del plazo.
  return { idlePct: pricingSettings().idlePctDefault, crewFull: true, plazoAdjust: Number(pl.plazoAdjust) || 0 };
}

function calculateProjectEconomics(proj) {
  const comp = appState.company;
  const workDaysMonth = Math.max(1, Number(comp.workDaysPerMonth) || 21);
  const hoursDay = Math.max(1, Number(comp.hoursPerDay) || 8);

  // Datos generales (⚙️ Datos de cálculo); de la obra solo se usan los km
  const G = (typeof calcG === 'function') ? calcG() : {};
  const c = { ...proj.crew, mealPerPersonDay: G.mealPerPersonDay ?? proj.crew.mealPerPersonDay, costPerKm: G.costPerKm ?? proj.crew.costPerKm, vehicles: 1, vanDailyFixed: 0,
    ownMarginPct: G.ownMarginPct ?? proj.crew.ownMarginPct, includeOverhead: true, distributeExpenses: true, parallelSavingsDays: 0 };
  // Equipo por puestos (pestaña «Equipo y gastos»). Los "supervisa" cuestan pero no suman horas de trabajo.
  const cs = crewSummary(proj);
  const totalPeople = cs.nTotal;
  const firstOf = cs.members.find(m => m.role.type === 'oficial');
  const firstAy = cs.members.find(m => m.role.type === 'ayudante');
  const offDailyTotal = firstOf ? firstOf.perPerson : 0;
  const wrkDailyTotal = firstAy ? firstAy.perPerson : 0;

  const crewDailyLaborCost = cs.laborDaily;
  const crewDailyManHours = cs.nWorking * hoursDay;
  const avgHourlyLaborCost = crewDailyManHours > 0 ? (crewDailyLaborCost / crewDailyManHours) : 0;

  const dailyOverhead = c.includeOverhead
    ? ((Number(comp.monthlyGestoria) || 0) + (Number(comp.monthlyInsurance) || 0) + (Number(comp.monthlyOtherOverhead) || 0)
       + (comp.fixedCosts || []).reduce((t, f) => t + (Number(f.amount) || 0), 0)) / workDaysMonth
    : 0;

  // Furgoneta: coste fijo al día si se ha puesto; si no, por kilómetros
  const dailyTravelCost = Number(c.vanDailyFixed) > 0 ? Number(c.vanDailyFixed) : (Number(c.vehicles) || 0) * (Number(c.kmRoundTrip) || 0) * (Number(c.costPerKm) || 0);
  const dailyMealCost = cs.nWorking * (Number(c.mealPerPersonDay) || 0);
  const totalDailyOperational = dailyTravelCost + dailyMealCost + dailyOverhead;

  const PR = pricingSettings(), PL = planningOf(proj);
  const idleF = 1 + Math.max(0, Number(PL.idlePct) || 0) / 100;
  const R = Math.max(0.1, Number(PR.realityFactor) || 1);
  let sumOwnBaseDays = 0, sumOwnOptDays = 0, baseSubDays = 0, optSubDays = 0;
  const itemResults = {};

  proj.items.forEach(item => {
    const qty = Math.max(0, Number(item.qty) || 0);
    const isOpt = isChapterOptional(proj, item.chapterId);
    if (!item.active) {
      itemResults[item.id] = { isOpt, taskDays: 0, totalManHours: 0, laborCost: 0, subCost: 0, opShare: 0, internalCost: 0, clientTotal: 0, clientUnit: 0, profit: 0 };
      return;
    }

    if (item.mode === 'own') {
      // Horas reales = horas de libro × factor de realidad, y nunca menos del mínimo por partida
      let totalManHours = qty * (Number(item.hoursPerUnit) || 0) * R;
      const minApplied = qty > 0 && totalManHours > 0 && totalManHours < PR.minItemHours;
      if (minApplied) totalManHours = PR.minItemHours;
      const taskDays = crewDailyManHours > 0 ? (totalManHours / crewDailyManHours) : 0;
      const laborCost = totalManHours * avgHourlyLaborCost * idleF;
      if (isOpt) sumOwnOptDays += taskDays; else sumOwnBaseDays += taskDays;
      itemResults[item.id] = { isOpt, taskDays, totalManHours, laborCost, subCost: 0, opShare: 0, internalCost: laborCost, clientTotal: 0, clientUnit: 0, profit: 0, minApplied };
    } else {
      const subCost = qty * (Number(item.subCost) || 0);
      const subDays = Number(item.subDays) || 0;
      if (isOpt) optSubDays += subDays; else baseSubDays += subDays;
      const marginPct = Number(item.subMarginPct) || 0;
      const rawClient = subCost * (1 + marginPct / 100);
      let clientUnit = qty > 0 ? r2(rawClient / qty) : 0;
      let clientTotal = qty > 0 ? r2(clientUnit * qty) : 0;
      // Salida mínima: ningún gremio viene por menos
      const minApplied = qty > 0 && clientTotal > 0 && clientTotal < PR.minSubCharge;
      if (minApplied) { clientUnit = r2(PR.minSubCharge / qty); clientTotal = r2(clientUnit * qty); }
      itemResults[item.id] = { isOpt, taskDays: subDays, totalManHours: 0, laborCost: 0, subCost, opShare: 0, internalCost: subCost, clientTotal, clientUnit, profit: clientTotal - subCost, minApplied };
    }
  });

  // Plazo real del presupuesto base: fases + esperas de secado + tiempo improductivo
  const rmPlazo = buildRoadmapData(proj, { itemResults }, false);
  const plazoDays = rmPlazo.totalSpanDays;
  const parallelSavings = PL.crewFull ? 0 : Math.min(sumOwnBaseDays, Math.max(0, Number(c.parallelSavingsDays) || 0));
  // Equipo en la obra todo el plazo: se pagan TODOS los días que dura, no solo las horas de libro
  const realOwnBaseDays = PL.crewFull ? plazoDays : Math.max(0, sumOwnBaseDays - parallelSavings) * idleF;
  const realOwnOptDays = sumOwnOptDays * idleF;
  const ownBaseMH = proj.items.reduce((t, i) => t + (i.active && i.mode === 'own' && !itemResults[i.id].isOpt ? itemResults[i.id].totalManHours : 0), 0);
  if (PL.crewFull && ownBaseMH > 0) {
    const pool = plazoDays * crewDailyLaborCost;
    proj.items.forEach(i => { const r = itemResults[i.id]; if (i.active && i.mode === 'own' && !r.isOpt) { r.laborCost = pool * r.totalManHours / ownBaseMH; r.internalCost = r.laborCost; } });
  }

  const baseTravelCost = realOwnBaseDays * dailyTravelCost;
  const baseMealCost = realOwnBaseDays * dailyMealCost;
  const baseOverheadCost = realOwnBaseDays * dailyOverhead;
  const baseOperationalExpenses = baseTravelCost + baseMealCost + baseOverheadCost;
  const optOperationalExpenses = realOwnOptDays * totalDailyOperational;

  let baseLaborCost = 0, baseSubCost = 0, baseClientBase = 0;
  let optLaborCost = 0, optSubCost = 0, optClientBase = 0;
  const ownMarginPct = Number(c.ownMarginPct) || 0;

  proj.items.forEach(item => {
    const r = itemResults[item.id];
    if (!item.active) return;

    if (item.mode === 'own') {
      let opShare = 0;
      if (c.distributeExpenses) {
        if (!r.isOpt && sumOwnBaseDays > 0) opShare = (r.taskDays / sumOwnBaseDays) * baseOperationalExpenses;
        else if (r.isOpt && sumOwnOptDays > 0) opShare = (r.taskDays / sumOwnOptDays) * optOperationalExpenses;
      }
      r.opShare = opShare;
      r.internalCost = r.laborCost + opShare;
      const rawClient = r.internalCost * (1 + ownMarginPct / 100);
      const qty = Number(item.qty) || 0;
      // Precio unitario redondeado y total = unitario × medición, para que cada línea cuadre en el PDF
      r.clientUnit = qty > 0 ? r2(rawClient / qty) : 0;
      r.clientTotal = qty > 0 ? r2(r.clientUnit * qty) : 0;
      r.profit = r.clientTotal - r.internalCost;

      if (r.isOpt) optLaborCost += r.laborCost; else baseLaborCost += r.laborCost;
    } else {
      if (r.isOpt) optSubCost += r.subCost; else baseSubCost += r.subCost;
    }

    if (r.isOpt) optClientBase += r.clientTotal; else baseClientBase += r.clientTotal;
  });

  // Medios auxiliares y coordinación (el trabajo de oficina que no se ve) + mínimo de cualquier trabajo
  const coordAmount = r2(baseClientBase * (Number(PR.coordPct) || 0) / 100);
  const optCoordAmount = r2(optClientBase * (Number(PR.coordPct) || 0) / 100);
  baseClientBase = r2(baseClientBase + coordAmount);
  optClientBase = r2(optClientBase + optCoordAmount);
  const minJobFill = baseClientBase > 0 && baseClientBase < PR.minJobLabor ? r2(PR.minJobLabor - baseClientBase) : 0;
  baseClientBase = r2(baseClientBase + minJobFill);
  const unchargedOpex = c.distributeExpenses ? 0 : r2(baseOperationalExpenses + optOperationalExpenses);
  const ivaRate = (Number(proj.ivaPct) || 10) / 100;
  const baseInternalCostAll = baseLaborCost + baseSubCost + baseOperationalExpenses;
  const baseNetProfit = baseClientBase - baseInternalCostAll;
  const baseNetProfitPct = baseClientBase > 0 ? (baseNetProfit / baseClientBase) * 100 : 0;      // beneficio sobre VENTA
  const baseMarkupPct = baseInternalCostAll > 0 ? (baseNetProfit / baseInternalCostAll) * 100 : 0; // recargo sobre COSTE
  const baseIvaAmount = r2(baseClientBase * ivaRate);
  const baseClientWithIva = r2(baseClientBase + baseIvaAmount);

  const optInternalCostAll = optLaborCost + optSubCost + optOperationalExpenses;
  const optNetProfit = optClientBase - optInternalCostAll;
  const optIvaAmount = r2(optClientBase * ivaRate);
  const optClientWithIva = r2(optClientBase + optIvaAmount);

  const grandClientBase = r2(baseClientBase + optClientBase);
  const grandIvaAmount = r2(baseIvaAmount + optIvaAmount);
  const grandClientWithIva = r2(grandClientBase + grandIvaAmount);
  const grandInternalCostAll = baseInternalCostAll + optInternalCostAll;
  const grandNetProfit = baseNetProfit + optNetProfit;

  const matsData = calculateProjectMaterials(proj);

  // Resumen de Facturación de esta obra (Facturas activas no rectificadas)
  const invs = proj.invoices || [];
  const activeAdvances = invs.filter(inv => inv.type === 'advance' && !inv.rectifiedBy);
  const alreadyBilledAdvanceBase = r2(activeAdvances.reduce((s, inv) => s + (Number(inv.baseAmount) || 0), 0));
  const totalNetBilledBase = r2(invs.reduce((s, inv) => s + (Number(inv.baseAmount) || 0), 0));

  return {
    offDailyTotal, wrkDailyTotal, crewDailyLaborCost, totalPeople, avgHourlyLaborCost, crewDailyManHours, crewInfo: cs,
    dailyOverhead, dailyTravelCost, dailyMealCost, totalDailyOperational,
    sumOwnBaseDays, realOwnBaseDays, baseSubDays, realOwnOptDays, optSubDays,
    baseLaborCost, baseSubCost, baseTravelCost, baseMealCost, baseOverheadCost, baseOperationalExpenses,
    baseInternalCostAll, baseClientBase, baseIvaAmount, baseClientWithIva, baseNetProfit, baseNetProfitPct, baseMarkupPct,
    optInternalCostAll, optClientBase, optIvaAmount, optClientWithIva, optNetProfit,
    grandClientBase, grandIvaAmount, grandClientWithIva, grandInternalCostAll, grandNetProfit,
    itemResults, matsData, unchargedOpex,
    plazoDays, rmPlazo, pricing: PR, planning: PL, realityFactor: R, coordAmount, optCoordAmount, minJobFill,
    // Lo que de verdad cobramos por cada hora de cada persona del equipo
    paidHoursBase: PL.crewFull ? plazoDays * cs.nTotal * hoursDay : ownBaseMH * idleF,
    salePerHour: (() => { const own = proj.items.reduce((t, i) => t + (i.active && i.mode === 'own' && !itemResults[i.id].isOpt ? itemResults[i.id].clientTotal : 0), 0) + coordAmount + minJobFill;
      const h = PL.crewFull ? plazoDays * cs.nTotal * hoursDay : ownBaseMH * idleF; return h > 0 ? own / h : 0; })(),
    activeAdvances, alreadyBilledAdvanceBase, totalNetBilledBase
  };
}

function calculateProjectMaterials(proj) {
  const cat = appState.materialsCatalog || [];
  const overrides = proj.materialOverrides || {};
  const aggBase = {};
  const aggOpt = {};

  proj.items.forEach(item => {
    if (!item.active) return;
    if (item.mode === 'sub' && item.subIncludesMat) return;
    const recipe = item.matRecipe || [];
    const isOpt = isChapterOptional(proj, item.chapterId);
    const target = isOpt ? aggOpt : aggBase;

    recipe.forEach(rec => {
      const qtyNeeded = (Number(item.qty) || 0) * (Number(rec.factor) || 0);
      if (qtyNeeded > 0) target[rec.matId] = (target[rec.matId] || 0) + qtyNeeded;
    });
  });

  (proj.extraMaterials || []).forEach(em => {
    const qty = Number(em.qty) || 0;
    if (qty > 0) aggBase[em.matId] = (aggBase[em.matId] || 0) + qty;
  });

  function mapToRows(aggMap, keyPrefix) {
    const rows = [];
    let total = 0;
    Object.keys(aggMap).forEach(matId => {
      const m = cat.find(x => x.id === matId);
      if (!m) return;
      const rawQty = aggMap[matId];
      const autoQty = m.roundUp ? Math.ceil(rawQty) : Number(rawQty.toFixed(1));
      const ovKey = keyPrefix + '_' + matId;
      const isOverridden = overrides[ovKey] !== undefined && overrides[ovKey] !== null;
      const finalQty = isOverridden ? Math.max(0, Number(overrides[ovKey]) || 0) : autoQty;
      // Gama de la previsión: solo cambia el precio de los elementos que elige el cliente
      const qf = (typeof matKind === 'function' && matKind(m) === 'elegir') ? matQualityFactor(proj) : 1;
      const price = r2((Number(m.price) || 0) * qf);
      const subtotal = finalQty * price;
      total += subtotal;
      rows.push({ ...m, price, basePrice: Number(m.price) || 0, ovKey, autoQty, qty: finalQty, isOverridden, subtotal });
    });
    rows.sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name));
    return { rows, total };
  }

  const baseMats = mapToRows(aggBase, 'base');
  const optMats = mapToRows(aggOpt, 'opt');
  return { baseRows: baseMats.rows, baseTotal: baseMats.total, optRows: optMats.rows, optTotal: optMats.total, grandTotal: baseMats.total + optMats.total };
}

function buildRoadmapData(proj, econ, includeOptional = true) {
  const activePhases = [];
  let cursorDay = 0;

  ROADMAP_PHASES.forEach(ph => {
    const phItems = proj.items.filter(i => {
      if (!i.active || Number(i.phase) !== ph.id) return false;
      if (!includeOptional && isChapterOptional(proj, i.chapterId)) return false;
      return true;
    });
    if (!phItems.length) return;

    let ownDays = 0, subDays = 0;
    phItems.forEach(i => {
      const r = econ.itemResults[i.id];
      if (i.mode === 'own') ownDays += r.taskDays; else subDays += r.taskDays;
    });

    const idleF = 1 + Math.max(0, Number(planningOf(proj).idlePct) || 0) / 100;
    const phaseDuration = Math.max(0.5, Number(((ownDays + subDays * 0.65) * idleF).toFixed(1)));
    const PRw = pricingSettings();
    const waitDays = phItems.reduce((m, i) => i.mode === 'own' ? Math.max(m, itemWaitDays(i, PRw)) : m, 0);
    const startDay = cursorDay;
    const effectiveAdvance = phaseDuration > 2 ? phaseDuration * 0.9 : phaseDuration;
    cursorDay += effectiveAdvance + waitDays;

    const hasBase = phItems.some(i => !isChapterOptional(proj, i.chapterId));
    const hasOptional = phItems.some(i => isChapterOptional(proj, i.chapterId));

    activePhases.push({
      ...ph, items: phItems, durationDays: phaseDuration, waitDays,
      startDay: Number(startDay.toFixed(1)), endDay: Number((startDay + phaseDuration).toFixed(1)),
      hasSub: phItems.some(i => i.mode === 'sub'), onlyOptional: !hasBase && hasOptional, hasOptional
    });
  });

  // El plazo termina cuando acaba la última fase (su espera final no cuenta)
  let totalSpanDays = activePhases.length ? Math.ceil(Math.max(...activePhases.map(p => p.endDay))) : 0;
  // Ajuste del plazo decidido en la obra (± días)
  if (totalSpanDays) totalSpanDays = Math.max(1, totalSpanDays + (Number((proj.planning || {}).plazoAdjust) || 0));
  return { activePhases, totalSpanDays };
}

// Suma días laborables saltando sábados, domingos y festivos (lista en Empresa → Festivos)
function businessDaysInfo(startDateStr, businessDays) {
  if (!startDateStr) return { text: '', skipped: 0 };
  const hol = (typeof holidaySet === 'function') ? holidaySet() : new Set();
  const d = new Date(startDateStr + 'T12:00:00');
  let added = 0, skipped = 0;
  while (added < Math.ceil(businessDays)) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    if (hol.has(todayLocalStr(d))) { skipped++; continue; }
    added++;
  }
  return { text: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }), skipped };
}
function addBusinessDays(startDateStr, businessDays) { return businessDaysInfo(startDateStr, businessDays).text; }
