// ============================================================
// DESHACER / REHACER (Ctrl+Z / Ctrl+Y) y FESTIVOS
// Deshacer guarda una "foto" de los datos antes de cada cambio (máx. 30).
// Por seguridad legal, nunca deshace una factura ya emitida (para eso: Abonar).
// ============================================================
const UNDO_MAX = 30;
const undoState = { undo: [], redo: [], last: null, restoring: false };

function undoSnapshot() { const c = { ...appState }; delete c.savedAt; return JSON.stringify(c); }

// Llamar al arrancar y cada vez que los datos se cargan de fuera (archivo, copia)
function undoInit() {
  undoState.undo = []; undoState.redo = [];
  undoState.last = undoSnapshot();
  renderUndoButtons();
}

// Se llama desde saveState(): guarda la foto ANTERIOR al cambio
function undoRecord() {
  if (undoState.restoring) return;
  const now = undoSnapshot();
  if (undoState.last !== null && now !== undoState.last) {
    undoState.undo.push(undoState.last);
    if (undoState.undo.length > UNDO_MAX) undoState.undo.shift();
    undoState.redo = [];
  }
  undoState.last = now;
  renderUndoButtons();
}

function invoiceCodes(state) {
  const s = new Set();
  (state.projects || []).forEach(p => (p.invoices || []).forEach(i => s.add(i.code)));
  return s;
}

function restoreSnapshot(json, label) {
  const target = JSON.parse(json);
  // Nunca hacer desaparecer una factura emitida
  const cur = invoiceCodes(appState), tgt = invoiceCodes(target);
  const lost = [...cur].filter(c => !tgt.has(c));
  if (lost.length) {
    alert(`No se puede ${label}: haría desaparecer la factura ${lost.join(', ')}.\n\nLas facturas emitidas no se borran. Si está mal, usa "Abonar (R-)" en la pestaña «Facturas».`);
    return false;
  }
  // Los contadores de facturas nunca retroceden
  const c = appState.company, t = target.company;
  t.invNormalNext = Math.max(Number(c.invNormalNext) || 1, Number(t.invNormalNext) || 1);
  t.invRectNext = Math.max(Number(c.invRectNext) || 1, Number(t.invRectNext) || 1);
  if (c.invNormalPrefix) t.invNormalPrefix = c.invNormalPrefix;
  if (c.invRectPrefix) t.invRectPrefix = c.invRectPrefix;
  if (!target.projects.some(p => p.id === target.currentProjectId)) target.currentProjectId = target.projects[0].id;

  undoState.restoring = true;
  appState = target;
  saveState();
  undoState.restoring = false;
  undoState.last = undoSnapshot();
  renderAll();
  return true;
}

function doUndo() {
  if (!undoState.undo.length) return showToast('Nada que deshacer');
  const prev = undoState.undo.pop();
  const cur = undoState.last;
  if (restoreSnapshot(prev, 'deshacer')) {
    undoState.redo.push(cur);
    showToast(`↶ Deshecho${undoState.undo.length ? ` (quedan ${undoState.undo.length})` : ''}`);
  } else {
    undoState.undo.push(prev);
  }
  renderUndoButtons();
}

function doRedo() {
  if (!undoState.redo.length) return showToast('Nada que rehacer');
  const next = undoState.redo.pop();
  const cur = undoState.last;
  if (restoreSnapshot(next, 'rehacer')) {
    undoState.undo.push(cur);
    showToast('↷ Rehecho');
  } else {
    undoState.redo.push(next);
  }
  renderUndoButtons();
}

function renderUndoButtons() {
  const u = document.getElementById('undoBtn'), r = document.getElementById('redoBtn');
  if (!u || !r) return;
  u.disabled = !undoState.undo.length;
  r.disabled = !undoState.redo.length;
  u.title = `Deshacer (Ctrl+Z) · ${undoState.undo.length} paso(s) guardado(s)`;
  r.title = `Rehacer (Ctrl+Y) · ${undoState.redo.length} paso(s)`;
}

// Ctrl+Z / Ctrl+Y. Dentro de una casilla de texto se deja el deshacer normal del navegador.
document.addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const t = e.target;
  const editing = t && (t.isContentEditable || (t.tagName === 'INPUT' && !['checkbox', 'radio', 'button'].includes(t.type)) || t.tagName === 'TEXTAREA');
  if (editing) return;
  if (document.querySelector('.modal-backdrop.open')) return;
  const k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
  else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); doRedo(); }
});

// ---------------- FESTIVOS ----------------
// Málaga capital. 2026: calendario UMA (BOJA 93/2025 y 197/2025). 2027: Junta + Ayuntamiento de Málaga.
const DEFAULT_HOLIDAYS_MALAGA = [
  ['2026-01-01', 'Año Nuevo'], ['2026-01-06', 'Reyes'], ['2026-02-28', 'Día de Andalucía'],
  ['2026-04-02', 'Jueves Santo'], ['2026-04-03', 'Viernes Santo'], ['2026-05-01', 'Fiesta del Trabajo'],
  ['2026-08-15', 'Asunción'], ['2026-08-19', 'Local Málaga (Feria)'], ['2026-09-08', 'Local Málaga (Victoria)'],
  ['2026-10-12', 'Fiesta Nacional'], ['2026-11-02', 'Todos los Santos (trasladado)'], ['2026-12-07', 'Constitución (trasladado)'],
  ['2026-12-08', 'Inmaculada'], ['2026-12-25', 'Navidad'],
  ['2027-01-01', 'Año Nuevo'], ['2027-01-06', 'Reyes'], ['2027-03-01', 'Día de Andalucía (trasladado)'],
  ['2027-03-25', 'Jueves Santo'], ['2027-03-26', 'Viernes Santo'], ['2027-05-01', 'Fiesta del Trabajo'],
  ['2027-08-16', 'Asunción (trasladado)'], ['2027-08-19', 'Local Málaga (Feria)'], ['2027-09-08', 'Local Málaga (Victoria)'],
  ['2027-10-12', 'Fiesta Nacional'], ['2027-11-01', 'Todos los Santos'], ['2027-12-06', 'Constitución'],
  ['2027-12-08', 'Inmaculada'], ['2027-12-25', 'Navidad']
];

function ensureHolidays() {
  if (!Array.isArray(appState.company.holidays)) {
    appState.company.holidays = DEFAULT_HOLIDAYS_MALAGA.map(([date, name]) => ({ date, name }));
  }
}
function holidaySet() { return new Set((appState.company.holidays || []).map(h => h.date)); }

function holidaysToText(list) {
  return (list || []).slice().sort((a, b) => a.date.localeCompare(b.date))
    .map(h => { const [y, m, d] = h.date.split('-'); return `${d}/${m}/${y}  ${h.name || ''}`.trim(); }).join('\n');
}
function updateHolidaysFromText(text) {
  const out = [], bad = [];
  text.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => {
    const m = l.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\s*(.*)$/);
    if (!m) { bad.push(l); return; }
    const d = m[1].padStart(2, '0'), mo = m[2].padStart(2, '0');
    const dt = new Date(`${m[3]}-${mo}-${d}T12:00:00`);
    if (isNaN(dt) || dt.getDate() !== Number(d)) { bad.push(l); return; }
    out.push({ date: `${m[3]}-${mo}-${d}`, name: m[4] || '' });
  });
  if (bad.length) alert('Estas líneas no se entienden y se han ignorado (formato: dd/mm/aaaa nombre):\n\n' + bad.join('\n'));
  appState.company.holidays = out;
  saveState(); renderAll();
}
function resetHolidays() {
  if (!confirm('¿Volver a la lista oficial de festivos de Málaga capital 2026-2027?')) return;
  appState.company.holidays = DEFAULT_HOLIDAYS_MALAGA.map(([date, name]) => ({ date, name }));
  saveState(); renderAll();
}
