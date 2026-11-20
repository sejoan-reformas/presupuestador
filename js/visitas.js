// ============================================================
// VISITAS A PIE DE OBRA (pestaña 📝 0) — pensada para tablet
//   appState.visits = [{ id, createdAt, date, client:{name,phone,address}, notes, quick:[],
//                        rooms:[{ id, type, name, dims:{l,w,h}, holes, works:[{id, libId, name, unit, src, qty, manual}],
//                                 notes, quick:[], photos:[{id, stage, date}] }], projectId }]
//   Fotos: en IndexedDB (presupuestadorPRO_fotos) y, si la carpeta está conectada, en datos\fotos\
// ============================================================
const ROOM_TYPES = {
  general:   { icon: '🌍', name: 'General / Exterior', dims: false },
  habitacion:{ icon: '🛏️', name: 'Habitación' },
  salon:     { icon: '🛋️', name: 'Salón' },
  cocina:    { icon: '🍳', name: 'Cocina' },
  bano:      { icon: '🚿', name: 'Baño' },
  pasillo:   { icon: '🚪', name: 'Pasillo' },
  terraza:   { icon: '☀️', name: 'Terraza' },
  lavadero:  { icon: '🧺', name: 'Lavadero' },
  otra:      { icon: '📦', name: 'Otra dependencia' }
};
// src: de dónde sale la cantidad → floor (suelo), ceil (techo), walls (paredes), perim (perímetro), n (unidades a mano)
const W = (name, src, n) => ({ name, src, n: n || 1 });
const ROOM_SUGGESTIONS = {
  general: [W('Protección de zonas comunes, ascensor y suelos', 'n'), W('Contenedores y gestión de escombros a vertedero', 'n'), W('Retirada de instalaciones eléctricas y de fontanería antiguas', 'n'),
    W('Instalación cuadro eléctrico nuevo y cableado general', 'n'), W('Instalación red fontanería Wirsbo/PEX y desagües PVC', 'n'), W('Prueba de estanqueidad y presión de la instalación', 'n'),
    W('Montaje y conexión de termo eléctrico', 'n'), W('Ayudas de albañilería a gremios (rozas y tapado)', 'n'), W('Colocación de puerta de entrada acorazada', 'n'),
    W('Instalación de videoportero / telefonillo', 'n'), W('Boletín eléctrico (CIE) y legalización en la Junta de Andalucía', 'n'),
    W('Tramitación de declaración responsable / licencia de obra', 'n'), W('Permiso de ocupación de vía pública para contenedor', 'n'), W('Limpieza general profunda de fin de obra', 'n')],
  habitacion: [W('Picado de azulejos y levantado de solado actual', 'floor'), W('Mano de obra solado porcelánico salón, pasillo y dorm.', 'floor'), W('Suelo laminado o vinílico SPC flotante', 'floor'),
    W('Colocación de rodapié porcelánico', 'perim'), W('Colocación de rodapié MDF lacado', 'perim'), W('Alisado de paredes con yeso/emplaste', 'walls'),
    W('Mano de obra pintura paredes interiores', 'walls'), W('Mano de obra pintura techos (antimoho baño/cocina)', 'ceil'), W('Colocación falso techo pladur estándar (zonas secas)', 'ceil'),
    W('Montaje de mecanismos (enchufes, TV, red)', 'n', 4), W('Punto de luz sencillo o conmutado', 'n'), W('Colocación de puerta de paso interior', 'n'),
    W('Montaje y vestido de armario empotrado', 'n'), W('Colocación ventana PVC 120×115 con persiana', 'n'), W('Mano de obra preinstalación A/A (por estancia)', 'n')],
  cocina: [W('Retirada de muebles y electrodomésticos de cocina', 'n'), W('Picado de azulejos y levantado de solado actual', 'wf'), W('Regularización/maestreado previo en baño y cocina', 'walls'), W('Mano de obra alicatado completo cocina', 'walls'),
    W('Mano de obra solado porcelánico baño y cocina', 'floor'), W('Colocación falso techo pladur hidrófugo (baño/cocina)', 'ceil'), W('Mano de obra pintura techos (antimoho baño/cocina)', 'ceil'),
    W('Montaje de mobiliario de cocina + fregadero', 'n', 3), W('Colocación encimera cuarzo/porcelánico (NO granito)', 'n', 3), W('Instalación lote electrodomésticos de cocina', 'n'),
    W('Conexión tomas lavadora, lavavajillas y fregadero', 'n'), W('Conexión de salida de humos de campana', 'n'), W('Montaje de mecanismos (enchufes, TV, red)', 'n', 6),
    W('Instalación de focos LED empotrados y lámparas', 'n', 4), W('Colocación ventana PVC 100×115 con persiana', 'n')],
  bano: [W('Retirada de sanitarios y mueble de un baño', 'n'), W('Desmontaje de bañera y alicatado perimetral', 'n'), W('Picado de azulejos y levantado de solado actual', 'wf'),
    W('Regularización/maestreado previo en baño y cocina', 'walls'), W('Mano de obra alicatado completo baño', 'walls'), W('Mano de obra solado porcelánico baño y cocina', 'floor'),
    W('Colocación falso techo pladur hidrófugo (baño/cocina)', 'ceil'), W('Mano de obra pintura techos (antimoho baño/cocina)', 'ceil'), W('Colocación plato de ducha y montaje de mampara', 'n'),
    W('Formación de ducha de obra con sumidero lineal', 'n'), W('Montaje de bañera con conexiones', 'n'), W('Montaje sanitarios, mueble lavabo y griferías baño', 'n'),
    W('Instalación de extractor de baño con salida', 'n'), W('Instalación de focos LED empotrados y lámparas', 'n', 2), W('Colocación ventana PVC baño', 'n')],
  pasillo: [W('Mano de obra solado porcelánico salón, pasillo y dorm.', 'floor'), W('Suelo laminado o vinílico SPC flotante', 'floor'), W('Colocación de rodapié porcelánico', 'perim'),
    W('Alisado de paredes con yeso/emplaste', 'walls'), W('Mano de obra pintura paredes interiores', 'walls'), W('Mano de obra pintura techos (antimoho baño/cocina)', 'ceil'),
    W('Colocación falso techo pladur estándar (zonas secas)', 'ceil'), W('Instalación de focos LED empotrados y lámparas', 'n', 3), W('Demolición de tabique de ladrillo', 'n')],
  terraza: [W('Impermeabilización y solado exterior terraza', 'floor'), W('Mano de obra pintura exterior terraza', 'walls'), W('Esmaltado de rejas, barandillas o carpintería metálica', 'n', 5),
    W('Colocación puerta balconera salida a terraza', 'n'), W('Colocación de vierteaguas o alféizar', 'n', 2), W('Instalación de mosquitera enrollable', 'n')],
  lavadero: [W('Mano de obra solado porcelánico baño y cocina', 'floor'), W('Mano de obra alicatado completo cocina', 'walls'), W('Conexión tomas lavadora, lavavajillas y fregadero', 'n'),
    W('Mano de obra pintura paredes interiores', 'walls'), W('Montaje de mecanismos (enchufes, TV, red)', 'n', 2)]
};
ROOM_SUGGESTIONS.salon = ROOM_SUGGESTIONS.habitacion;
ROOM_SUGGESTIONS.otra = ROOM_SUGGESTIONS.habitacion;
const SRC_LABEL = { floor: 'suelo', ceil: 'techo', walls: 'paredes', wf: 'paredes + suelo', perim: 'perímetro', n: 'a mano' };
// Trabajos que se excluyen entre sí: al marcar uno se desmarcan los otros
const ALTERNATIVES = [['Colocación plato de ducha y montaje de mampara', 'Formación de ducha de obra con sumidero lineal', 'Montaje de bañera con conexiones'],
  ['Mano de obra solado porcelánico salón, pasillo y dorm.', 'Suelo laminado o vinílico SPC flotante'], ['Colocación de rodapié porcelánico', 'Colocación de rodapié MDF lacado']];
const DEFAULT_QUICK_NOTES = ['Quiere plato de ducha en vez de bañera', 'Mantener radiadores', 'El cliente aporta materiales', 'Vive en la vivienda durante la obra',
  'Sin prisa', 'Urgente', 'Sin ascensor', 'Aparcamiento difícil', 'Horario de la comunidad', 'Hay mascotas', 'Revisar posible amianto', 'Pedir planos'];
const PHOTO_STAGES = { antes: '📷 Antes', durante: '🔨 Durante', despues: '✅ Después' };

let visitOpenId = null, visitRoomId = null, visitLibQuery = '';

function ensureVisits() { if (!Array.isArray(appState.visits)) appState.visits = []; }
const getVisit = () => (appState.visits || []).find(v => v.id === visitOpenId);
const getRoom = v => v && v.rooms.find(r => r.id === visitRoomId);
const vid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function roomAreas(r) {
  const l = Number(r.dims && r.dims.l) || 0, w = Number(r.dims && r.dims.w) || 0, h = Number(r.dims && r.dims.h) || 0;
  const floor = r2(l * w), perim = r2(2 * (l + w));
  const walls = Math.max(0, r2(perim * h - (Number(r.holes) || 0)));
  return { floor, ceil: floor, perim, walls, wf: r2(walls + floor) };
}
function workQty(r, wk) {
  if (wk.manual || wk.src === 'n') return Number(wk.qty) || 0;
  return roomAreas(r)[wk.src] || 0;
}
function libByName(name) {
  const n = normTxt(name);
  return (appState.itemLibrary || []).find(l => normTxt(l.name) === n);
}

// ---------- Acciones ----------
function newVisit() {
  ensureVisits();
  const v = { id: vid('vis'), createdAt: Date.now(), date: todayLocalStr(), client: { name: '', phone: '', address: '' }, notes: '', quick: [],
    rooms: [{ id: vid('room'), type: 'general', name: 'General / Exterior', dims: {}, holes: 0, works: [], notes: '', quick: [], photos: [] }], projectId: null };
  appState.visits.unshift(v);
  visitOpenId = v.id; visitRoomId = null;
  saveState(); renderVisitsTab();
}
function openVisit(id) { visitOpenId = id; visitRoomId = null; renderVisitsTab(); window.scrollTo(0, 0); }
function closeVisit() { visitOpenId = null; visitRoomId = null; renderVisitsTab(); }
function deleteVisit(id) {
  const v = appState.visits.find(x => x.id === id); if (!v) return;
  if (!confirm(`¿Borrar la visita de "${v.client.name || 'sin nombre'}"?\n\nSe borran también sus notas y la lista de fotos.`)) return;
  appState.visits = appState.visits.filter(x => x.id !== id);
  if (visitOpenId === id) visitOpenId = null;
  saveState(); renderVisitsTab();
}
function updateVisitField(path, value) {
  const v = getVisit(); if (!v) return;
  if (path.startsWith('client.')) v.client[path.slice(7)] = value; else v[path] = value;
  saveState();
}
function addRoom(type) {
  const v = getVisit(); if (!v) return;
  const t = ROOM_TYPES[type];
  const n = v.rooms.filter(r => r.type === type).length + 1;
  const r = { id: vid('room'), type, name: `${t.name} ${n}`, dims: { l: '', w: '', h: 2.6 }, holes: 0, works: [], notes: '', quick: [], photos: [] };
  v.rooms.push(r); visitRoomId = r.id;
  saveState(); renderVisitsTab();
  setTimeout(() => document.getElementById('roomL')?.focus(), 50);
}
function openRoom(id) { visitRoomId = id; renderVisitsTab(); document.getElementById('visitRoomPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function stepRoom(dir) {
  const v = getVisit(); if (!v) return;
  const i = v.rooms.findIndex(r => r.id === visitRoomId);
  const j = i + dir;
  if (j >= 0 && j < v.rooms.length) openRoom(v.rooms[j].id);
}
function deleteRoom() {
  const v = getVisit(), r = getRoom(v); if (!r) return;
  if (r.type === 'general') return alert('"General / Exterior" no se puede borrar: déjalo vacío si no hace falta.');
  if (!confirm(`¿Borrar "${r.name}" con sus trabajos y notas?`)) return;
  v.rooms = v.rooms.filter(x => x.id !== r.id); visitRoomId = null;
  saveState(); renderVisitsTab();
}
function updateRoom(field, value) {
  const r = getRoom(getVisit()); if (!r) return;
  if (field.startsWith('dims.')) r.dims[field.slice(5)] = value; else r[field] = value;
  saveState(); renderVisitRoomLive();
}
function toggleSuggestion(idx) {
  const r = getRoom(getVisit()); if (!r) return;
  const sug = (ROOM_SUGGESTIONS[r.type] || [])[idx]; if (!sug) return;
  const ex = r.works.find(w => normTxt(w.name) === normTxt(sug.name));
  if (ex) r.works = r.works.filter(w => w !== ex);
  else {
    const grp = ALTERNATIVES.find(g => g.some(x => normTxt(x) === normTxt(sug.name)));
    if (grp) {
      const off = r.works.filter(w => grp.some(x => normTxt(x) === normTxt(w.name)));
      if (off.length) { r.works = r.works.filter(w => !off.includes(w)); showToast(`↔️ Quitado "${off.map(w => w.name).join('", "')}": es una u otra`); }
    }
    const lib = libByName(sug.name);
    r.works.push({ id: vid('wk'), libId: lib ? lib.id : null, name: lib ? lib.name : sug.name, unit: lib ? lib.unit : (sug.src === 'n' ? 'ud' : 'm²'), src: sug.src, qty: sug.n, manual: false });
  }
  saveState(); renderVisitsTab();
}
function addLibWorkToRoom(libId) {
  const r = getRoom(getVisit()); const lib = (appState.itemLibrary || []).find(l => l.id === libId); if (!r || !lib) return;
  const src = lib.unit === 'm²' ? (r.type === 'general' ? 'n' : 'floor') : (lib.unit === 'ml' && r.type !== 'general' ? 'perim' : 'n');
  r.works.push({ id: vid('wk'), libId: lib.id, name: lib.name, unit: lib.unit, src, qty: 1, manual: false });
  visitLibQuery = '';
  saveState(); renderVisitsTab();
}
function addFreeWork() {
  const r = getRoom(getVisit()); if (!r) return;
  const name = (document.getElementById('freeWorkName').value || '').trim();
  if (!name) return alert('Escribe qué trabajo es.');
  r.works.push({ id: vid('wk'), libId: null, name, unit: document.getElementById('freeWorkUnit').value, src: 'n', qty: parseFloat(document.getElementById('freeWorkQty').value) || 1, manual: true });
  saveState(); renderVisitsTab();
}
function updateWork(wid, field, value) {
  const r = getRoom(getVisit()); const w = r && r.works.find(x => x.id === wid); if (!w) return;
  if (field === 'qty') { w.qty = value; w.manual = true; }
  else if (field === 'src') { w.src = value; w.manual = value === 'n'; }
  else w[field] = value;
  saveState(); renderVisitsTab();
}
function removeWork(wid) {
  const r = getRoom(getVisit()); if (!r) return;
  r.works = r.works.filter(x => x.id !== wid);
  saveState(); renderVisitsTab();
}
function toggleQuickNote(target, text) {
  const v = getVisit(); if (!v) return;
  const obj = target === 'room' ? getRoom(v) : v; if (!obj) return;
  obj.quick = obj.quick || [];
  obj.quick = obj.quick.includes(text) ? obj.quick.filter(x => x !== text) : obj.quick.concat(text);
  saveState(); renderVisitsTab();
}
function addCustomQuickNote() {
  const t = prompt('Nueva nota rápida (se guardará para todas las visitas):');
  if (!t || !t.trim()) return;
  appState.company.quickNotes = (appState.company.quickNotes || DEFAULT_QUICK_NOTES.slice()).concat(t.trim());
  saveState(); renderVisitsTab();
}
const quickNotesList = () => appState.company.quickNotes || DEFAULT_QUICK_NOTES;

// ---------- Fotos ----------
const PHOTO_DB = 'presupuestadorPRO_fotos';
function photoDb() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open(PHOTO_DB, 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('fotos');
    rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
  });
}
async function photoPut(id, blob) { const db = await photoDb(); return new Promise((res, rej) => { const tx = db.transaction('fotos', 'readwrite'); tx.objectStore('fotos').put(blob, id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
async function photoGet(id) {
  const db = await photoDb();
  const b = await new Promise(res => { const rq = db.transaction('fotos').objectStore('fotos').get(id); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); });
  if (b) return b;
  // Si no está en este navegador, se busca en la carpeta datos\fotos
  try { if (fileStore.dirHandle) { const dir = await (await fsGetDataDir(false)).getDirectoryHandle('fotos'); return await (await dir.getFileHandle(id + '.jpg')).getFile(); } } catch (e) {}
  return null;
}
async function photoToFolder(id, blob) {
  try {
    if (!fileStore.dirHandle || !['ok', 'saving'].includes(fileStore.status)) return;
    const dir = await (await fsGetDataDir(true)).getDirectoryHandle('fotos', { create: true });
    const w = await (await dir.getFileHandle(id + '.jpg', { create: true })).createWritable(); await w.write(blob); await w.close();
  } catch (e) {}
}
let pendingPhotoStage = 'antes';
function takePhoto(stage) {
  pendingPhotoStage = stage;
  const inp = document.getElementById('visitPhotoInput');
  inp.value = ''; inp.click();
}
async function onPhotoChosen(input) {
  const v = getVisit(), r = getRoom(v);
  if (!r || !input.files || !input.files.length) return;
  for (const file of input.files) {
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
      const max = 1600, sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      // Sello con fecha y hora, obra y dependencia: vale como prueba aunque la foto se reenvíe
      const now = new Date();
      const stamp = `${(appState.company.name || '').trim()} · ${v.client.name || 'Visita'} · ${r.name} · ${PHOTO_STAGES[pendingPhotoStage].replace(/^\S+\s/, '').toUpperCase()} · ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      const fs = Math.max(16, Math.round(c.width / 55));
      g.font = `bold ${fs}px system-ui, sans-serif`;
      const pad = Math.round(fs * 0.5), bh = fs + pad * 2;
      g.fillStyle = 'rgba(0,0,0,0.62)'; g.fillRect(0, c.height - bh, c.width, bh);
      g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; g.fillText(stamp, pad, c.height - bh / 2, c.width - pad * 2);
      const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.8));
      const id = vid('foto');
      await photoPut(id, blob); photoToFolder(id, blob);
      r.photos.push({ id, stage: pendingPhotoStage, date: now.toISOString() });
    } catch (e) { alert('No se ha podido guardar una foto: ' + e.message); }
  }
  saveState(); renderVisitsTab();
  showToast('📷 Foto guardada con fecha y hora');
}
function deletePhoto(pid) {
  const r = getRoom(getVisit()); if (!r) return;
  if (!confirm('¿Quitar esta foto de la visita?')) return;
  r.photos = r.photos.filter(p => p.id !== pid);
  saveState(); renderVisitsTab();
}
function setPhotoStage(pid, stage) {
  const r = getRoom(getVisit()); const p = r && r.photos.find(x => x.id === pid); if (!p) return;
  p.stage = stage; saveState(); renderVisitsTab();
}
async function fillPhotoThumbs() {
  for (const el of document.querySelectorAll('img[data-photo]')) {
    if (el.src) continue;
    const b = await photoGet(el.dataset.photo);
    if (b) el.src = URL.createObjectURL(b); else el.alt = '⚠️ Foto no disponible en este aparato';
  }
}
async function viewPhoto(pid) {
  const b = await photoGet(pid); if (!b) return alert('Esta foto no está en este aparato.');
  const url = URL.createObjectURL(b);
  document.getElementById('staffModalBody').innerHTML = `<div class="card-header"><h3 class="card-title">📷 Foto</h3><button class="btn btn-sm" onclick="closeStaffModal()">✕</button></div><img src="${url}" style="width:100%; border-radius:12px;" alt="Foto de la visita">`;
  document.getElementById('staffModal').classList.add('open');
}

// ---------- Convertir en presupuesto ----------
function chapterKey(s) { return normTxt(String(s || '').replace(/^\d+\.\s*/, '').replace(/^extra opcional\s*[—-]\s*/i, '').replace(/^mano de obra\s*/i, '')).split(' ').slice(0, 2).join(' '); }
function convertVisitToBudget() {
  const v = getVisit(); if (!v) return;
  const works = v.rooms.flatMap(r => r.works.map(w => ({ r, w, qty: workQty(r, w) })));
  if (!works.length) return alert('Marca al menos un trabajo en alguna dependencia.');
  if (v.projectId && appState.projects.some(p => p.id === v.projectId) && !confirm('Esta visita ya se convirtió en un presupuesto. ¿Crear OTRO nuevo?')) return;
  const zero = works.filter(x => !x.qty);
  if (zero.length && !confirm(`Hay ${zero.length} trabajo(s) con cantidad 0 (faltan medidas):\n\n${zero.slice(0, 8).map(x => '• ' + x.r.name + ': ' + x.w.name).join('\n')}\n\n¿Seguir de todas formas? Luego los mides en el Checklist.`)) return;

  const curr = getCurrentProject();
  const base = createDefaultFuengirolaProject();
  base.chapters = base.chapters.filter(c => !c.isOptional).map(c => ({ ...c, name: c.name.replace(/^(\d+\.\s*)?Mano de Obra\s+/i, '$1') }));
  base.items = [];
  if (curr && curr.crew) base.crew = deepCopy(curr.crew);
  const getChapter = name => {
    const k = chapterKey(name);
    let ch = base.chapters.find(c => chapterKey(c.name) === k);
    if (!ch) { ch = { id: 'c_' + Date.now() + '_' + base.chapters.length, name: `${base.chapters.length + 1}. ${String(name || 'Otros trabajos').replace(/^\d+\.\s*/, '').replace(/^extra opcional\s*[—-]\s*/i, '').replace(/^mano de obra\s*/i, '')}`, isOptional: false }; base.chapters.push(ch); }
    return ch.id;
  };
  let otherCh = null;
  // Un mismo trabajo en varias dependencias = una partida con una línea de medición por dependencia
  const byKey = {};
  works.forEach(({ r, w, qty }) => {
    const lib = (w.libId && appState.itemLibrary.find(l => l.id === w.libId)) || libByName(w.name);
    const key = lib ? 'lib:' + lib.id : 'free:' + normTxt(w.name) + '|' + w.unit;
    if (!byKey[key]) {
      const item = { id: 'item_' + Date.now() + '_' + Object.keys(byKey).length, active: true, qty: 0, measures: [] };
      if (lib) { LIB_FIELDS.forEach(f => { item[f] = deepCopy(lib[f]); }); item.chapterId = getChapter(lib.chapterName); }
      else {
        Object.assign(item, { name: w.name, desc: '', unit: w.unit, phase: 3, mode: 'own', hoursPerUnit: 0, subCost: 0, subMarginPct: 15, subDays: 1, subIncludesMat: false, matRecipe: [] });
        if (!otherCh) otherCh = getChapter('Otros trabajos (revisar rendimiento)');
        item.chapterId = otherCh;
      }
      if (!item.phase) item.phase = 3; if (!item.mode) item.mode = 'own'; if (!Array.isArray(item.matRecipe)) item.matRecipe = [];
      byKey[key] = item;
    }
    const it = byKey[key];
    it.measures.push({ label: r.name, a: r2(qty), b: 1, res: r2(qty) });
    it.qty = r2(it.qty + qty);
  });
  Object.values(byKey).forEach(it => {
    const rooms = it.measures.map(m => m.label).join(', ');
    it.desc = (it.desc ? it.desc + ' ' : '') + `(${rooms})`;
    base.items.push(it);
  });
  // Fuera los capítulos vacíos y numeración seguida
  base.chapters = base.chapters.filter(c => base.items.some(i => i.chapterId === c.id))
    .map((c, n) => ({ ...c, name: `${n + 1}. ${c.name.replace(/^\d+\.\s*/, '')}` }));
  // Notas de la visita → condiciones internas / notas del cliente
  const notes = [
    v.notes, ...(v.quick || []).map(q => '• ' + q),
    ...v.rooms.filter(r => r.notes || (r.quick || []).length).map(r => `${r.name}: ${[...(r.quick || []), r.notes].filter(Boolean).join(' · ')}`)
  ].filter(Boolean).join('\n');
  base.id = 'proj_' + Date.now();
  base.title = v.client.name || 'Visita ' + new Date(v.createdAt).toLocaleDateString('es-ES');
  base.code = getNextProjectCode();
  base.date = todayLocalStr();
  base.client = { name: v.client.name || '', nif: '', phone: v.client.phone || '', email: '', projectAddress: v.client.address || '' };
  base.images = []; base.checkedTools = {}; base.materialOverrides = {}; base.invoices = []; base.extraMaterials = [];
  base.visitId = v.id; base.visitNotes = notes;
  appState.projects.push(base);
  appState.currentProjectId = base.id;
  v.projectId = base.id;
  saveState(); renderAll();
  switchTab('checklist');
  showToast(`✅ Presupuesto ${base.code} creado desde la visita (${base.items.length} partidas)`);
}

// ---------- Pintar ----------
function renderVisitsTab() {
  const box = document.getElementById('visitsView'); if (!box) return;
  ensureVisits();
  const v = getVisit();
  if (!v) {
    box.innerHTML = `
      <div class="visit-top"><h2 class="eq-name" style="font-size:1.3rem;">📝 Visitas a pie de obra <i class="info-icon" data-help="visitas">i</i></h2>
        <button class="btn btn-primary visit-big" onclick="newVisit()"><b class="plus">+</b> Nueva visita</button></div>
      <p class="modal-intro">Vamos a casa del cliente, pulsamos <strong><b class="plus">+</b> Nueva visita</strong>, añadimos las dependencias (🚿 Baño 1, 🛏️ Habitación 2…) y en cada una ponemos <strong>medidas, trabajos, notas y fotos</strong>. Al final, <strong>✅ Convertir en presupuesto</strong> y la app nos lo monta en el Checklist.</p>
      <div class="eq-grid">${appState.visits.length ? appState.visits.map(x => {
        const nw = x.rooms.reduce((t, r) => t + r.works.length, 0), np = x.rooms.reduce((t, r) => t + r.photos.length, 0);
        const proj = x.projectId && appState.projects.find(p => p.id === x.projectId);
        return `<div class="card eq-card">
          <div class="eq-head"><span class="eq-icon">🏠</span><div><div class="eq-name">${esc(x.client.name || 'Sin nombre')}</div><div class="eq-sub">${new Date(x.createdAt).toLocaleDateString('es-ES')} · ${esc(x.client.address || '')}</div></div></div>
          <div class="eq-sub">${x.rooms.length - 1} dependencias · ${nw} trabajos · ${np} fotos</div>
          ${proj ? `<div class="eq-result">✅ Convertida en <strong>${esc(proj.code)}</strong></div>` : '<div class="eq-result">⏳ Aún sin presupuesto</div>'}
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;"><button class="btn btn-primary visit-big" onclick="openVisit('${x.id}')">✏️ Abrir</button>
          <button class="btn btn-danger" onclick="deleteVisit('${x.id}')" title="Borrar visita">🗑</button></div></div>`;
      }).join('') : '<div class="card eq-card"><div class="eq-sub">Todavía no hay visitas.</div></div>'}</div>`;
    return;
  }
  const room = getRoom(v);
  const roomChips = v.rooms.map(r => {
    const t = ROOM_TYPES[r.type] || ROOM_TYPES.otra;
    return `<button class="visit-room-chip ${r.id === visitRoomId ? 'active' : ''}" onclick="openRoom('${r.id}')">${t.icon} ${esc(r.name)}<small>${r.works.length} trab.${r.photos.length ? ' · ' + r.photos.length + ' 📷' : ''}</small></button>`;
  }).join('');
  box.innerHTML = `
    <div class="visit-top"><button class="btn visit-big" onclick="closeVisit()">⬅ Todas las visitas</button>
      <button class="btn btn-primary visit-big" onclick="convertVisitToBudget()">✅ Convertir en presupuesto <i class="info-icon" data-help="convertirVisita">i</i></button></div>
    <div class="card eq-card">
      <div class="eq-head"><span class="eq-icon">🏠</span><div class="eq-name">Cliente y vivienda</div></div>
      <div class="visit-fields">
        <label>👤 Nombre<input type="text" value="${esc(v.client.name)}" onchange="updateVisitField('client.name', this.value)" placeholder="Nombre del cliente"></label>
        <label>📞 Teléfono<input type="tel" inputmode="tel" value="${esc(v.client.phone)}" onchange="updateVisitField('client.phone', this.value)"></label>
        <label class="wide">📍 Dirección<input type="text" value="${esc(v.client.address)}" onchange="updateVisitField('client.address', this.value)"></label>
      </div>
      <div class="eq-sub" style="margin-top:0.5rem;">📝 Lo que comenta el cliente (general)</div>
      <div class="visit-chips">${quickNotesList().map(q => `<button class="visit-chip ${(v.quick || []).includes(q) ? 'on' : ''}" onclick="toggleQuickNote('visit', ${esc(JSON.stringify(q))})">${(v.quick || []).includes(q) ? '✔ ' : ''}${esc(q)}</button>`).join('')}
        <button class="visit-chip add" onclick="addCustomQuickNote()"><b class="plus">+</b> Nota nueva</button></div>
      <textarea rows="2" placeholder="Otras notas (también podemos dictar con el micrófono del teclado)" onchange="updateVisitField('notes', this.value)">${esc(v.notes || '')}</textarea>
    </div>

    <div class="eq-section-title">🏘️ Dependencias <i class="info-icon" data-help="dependencias">i</i></div>
    <div class="visit-add-rooms">${Object.entries(ROOM_TYPES).filter(([k]) => k !== 'general').map(([k, t]) => `<button class="btn visit-big" onclick="addRoom('${k}')"><b class="plus">+</b> ${t.icon} ${t.name}</button>`).join('')}</div>
    <div class="visit-room-list">${roomChips}</div>
    <div id="visitRoomPanel">${room ? renderRoomPanel(v, room) : '<div class="card eq-card"><div class="eq-sub">👆 Pulsa una dependencia para rellenarla, o añade una nueva con los botones +.</div></div>'}</div>
    <input type="file" id="visitPhotoInput" accept="image/*" capture="environment" multiple style="display:none" onchange="onPhotoChosen(this)">`;
  fillPhotoThumbs();
}

function renderRoomPanel(v, r) {
  const t = ROOM_TYPES[r.type] || ROOM_TYPES.otra;
  const a = roomAreas(r);
  const idx = v.rooms.findIndex(x => x.id === r.id);
  const sugs = ROOM_SUGGESTIONS[r.type] || [];
  const q = normTxt(visitLibQuery);
  const libRes = q ? (appState.itemLibrary || []).filter(l => q.split(/\s+/).every(w => normTxt(l.name + ' ' + l.chapterName).includes(w))).slice(0, 8) : [];
  return `<div class="card eq-card visit-room">
    <div class="eq-head"><span class="eq-icon">${t.icon}</span>
      <input type="text" class="visit-room-name" value="${esc(r.name)}" onchange="updateRoom('name', this.value.trim()||'${t.name}'); renderVisitsTab();" aria-label="Nombre de la dependencia">
      ${r.type !== 'general' ? `<button class="btn btn-danger" onclick="deleteRoom()" title="Borrar dependencia">🗑</button>` : ''}</div>

    ${t.dims !== false ? `<div class="visit-step">1 · 📏 Medidas <i class="info-icon" data-help="medidasVisita">i</i></div>
    <div class="visit-fields">
      <label>Largo (m)<input id="roomL" type="number" inputmode="decimal" step="0.01" min="0" value="${r.dims.l ?? ''}" oninput="updateRoom('dims.l', this.value)"></label>
      <label>Ancho (m)<input type="number" inputmode="decimal" step="0.01" min="0" value="${r.dims.w ?? ''}" oninput="updateRoom('dims.w', this.value)"></label>
      <label>Alto (m)<input type="number" inputmode="decimal" step="0.01" min="0" value="${r.dims.h ?? ''}" oninput="updateRoom('dims.h', this.value)"></label>
      <label>Huecos a restar (m²) <i class="info-icon" data-help="huecos">i</i><input type="number" inputmode="decimal" step="0.1" min="0" value="${r.holes || ''}" oninput="updateRoom('holes', this.value)" placeholder="puertas, ventanas"></label>
    </div>
    <div class="visit-areas" id="visitAreas">${areasHtml(a)}</div>` : '<div class="eq-sub">Aquí van los trabajos de toda la vivienda o de fuera (fachada, contenedor, licencias, cuadro eléctrico…).</div>'}

    <div class="visit-step">2 · 🔨 Trabajos <i class="info-icon" data-help="trabajosVisita">i</i></div>
    <div class="eq-sub">Pulsa para marcar o desmarcar:</div>
    <div class="visit-chips">${sugs.map((s, i) => { const on = r.works.some(w => normTxt(w.name) === normTxt(s.name)); return `<button class="visit-chip work ${on ? 'on' : ''}" onclick="toggleSuggestion(${i})">${on ? '✔ ' : ''}${esc(s.name)}</button>`; }).join('')}</div>
    ${r.works.length ? `<div class="visit-works">${r.works.map(w => {
      const qty = workQty(r, w);
      return `<div class="visit-work">
        <div class="visit-work-name">${esc(w.name)}${w.libId ? '' : ' <span class="eq-own">sin biblioteca</span>'}</div>
        <div class="visit-work-qty">
          <input type="number" inputmode="decimal" step="0.01" min="0" value="${r2(qty)}" onchange="updateWork('${w.id}','qty',parseFloat(this.value)||0)" aria-label="Cantidad"> <span>${esc(w.unit)}</span>
          ${t.dims !== false ? `<select onchange="updateWork('${w.id}','src',this.value)" aria-label="De dónde sale la cantidad">${Object.entries(SRC_LABEL).map(([k, l]) => `<option value="${k}" ${(w.manual ? 'n' : w.src) === k ? 'selected' : ''}>${k === 'n' ? '✋ a mano' : '📐 ' + l}</option>`).join('')}</select>` : ''}
          <button class="btn btn-sm btn-danger" onclick="removeWork('${w.id}')" aria-label="Quitar trabajo">✕</button></div></div>`;
    }).join('')}</div>` : ''}
    <details class="visit-more"><summary><b class="plus">+</b> Otro trabajo (buscar en la biblioteca o escribirlo)</summary>
      <input type="search" placeholder="🔍 Buscar: tabique, enchufe, ventana…" value="${esc(visitLibQuery)}" oninput="visitLibQuery=this.value; renderVisitLibResults()" id="visitLibSearch">
      <div id="visitLibResults">${libRes.map(l => `<button class="visit-chip work" onclick="addLibWorkToRoom('${l.id}')"><b class="plus">+</b> ${esc(l.name)} <small>(${esc(l.unit)})</small></button>`).join('')}</div>
      <div class="visit-fields" style="margin-top:0.6rem;">
        <label class="wide">✍️ O escríbelo<input type="text" id="freeWorkName" placeholder="Ej.: quitar chimenea del salón"></label>
        <label>Cantidad<input type="number" inputmode="decimal" id="freeWorkQty" value="1" min="0" step="0.01"></label>
        <label>Unidad<select id="freeWorkUnit"><option>ud</option><option>m²</option><option>ml</option><option>PA</option></select></label>
      </div><button class="btn btn-primary" onclick="addFreeWork()"><b class="plus">+</b> Añadir</button>
    </details>

    <div class="visit-step">3 · 📝 Notas de ${esc(r.name)}</div>
    <div class="visit-chips">${quickNotesList().map(qn => `<button class="visit-chip ${(r.quick || []).includes(qn) ? 'on' : ''}" onclick="toggleQuickNote('room', ${esc(JSON.stringify(qn))})">${(r.quick || []).includes(qn) ? '✔ ' : ''}${esc(qn)}</button>`).join('')}</div>
    <textarea rows="2" placeholder="Lo que pide el cliente en esta dependencia" onchange="updateRoom('notes', this.value)">${esc(r.notes || '')}</textarea>

    <div class="visit-step">4 · 📷 Fotos <i class="info-icon" data-help="fotosVisita">i</i></div>
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">${Object.entries(PHOTO_STAGES).map(([k, l]) => `<button class="btn visit-big" onclick="takePhoto('${k}')">${l}</button>`).join('')}</div>
    ${r.photos.length ? `<div class="visit-photos">${r.photos.map(p => `<figure>
      <img data-photo="${p.id}" alt="Foto ${esc(PHOTO_STAGES[p.stage])}" onclick="viewPhoto('${p.id}')">
      <figcaption><select onchange="setPhotoStage('${p.id}', this.value)">${Object.entries(PHOTO_STAGES).map(([k, l]) => `<option value="${k}" ${k === p.stage ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="btn btn-sm btn-danger" onclick="deletePhoto('${p.id}')" aria-label="Quitar foto">✕</button></figcaption></figure>`).join('')}</div>` : ''}

    <div class="visit-nav">
      <button class="btn visit-big" onclick="stepRoom(-1)" ${idx <= 0 ? 'disabled' : ''}>⬅ Anterior</button>
      <button class="btn btn-primary visit-big" onclick="stepRoom(1)" ${idx >= v.rooms.length - 1 ? 'disabled' : ''}>Siguiente dependencia ➡</button>
    </div>
  </div>`;
}
function areasHtml(a) {
  return `<span>⬜ Suelo <strong>${fmtNum(a.floor, 2)} m²</strong></span><span>🔲 Techo <strong>${fmtNum(a.ceil, 2)} m²</strong></span>
    <span>🧱 Paredes <strong>${fmtNum(a.walls, 2)} m²</strong></span><span>📏 Perímetro <strong>${fmtNum(a.perim, 2)} ml</strong></span>`;
}
// Al teclear medidas solo se repintan las cifras (no se pierde el foco en la tablet)
function renderVisitRoomLive() {
  const r = getRoom(getVisit()); if (!r) return;
  const el = document.getElementById('visitAreas'); if (el) el.innerHTML = areasHtml(roomAreas(r));
  document.querySelectorAll('.visit-work').forEach((row, i) => {
    const w = r.works[i]; if (!w || w.manual || w.src === 'n') return;
    const inp = row.querySelector('input'); if (inp && document.activeElement !== inp) inp.value = r2(workQty(r, w));
  });
}
function renderVisitLibResults() {
  const box = document.getElementById('visitLibResults'); if (!box) return;
  const q = normTxt(visitLibQuery);
  const res = q ? (appState.itemLibrary || []).filter(l => q.split(/\s+/).every(w => normTxt(l.name + ' ' + l.chapterName).includes(w))).slice(0, 8) : [];
  box.innerHTML = res.map(l => `<button class="visit-chip work" onclick="addLibWorkToRoom('${l.id}')"><b class="plus">+</b> ${esc(l.name)} <small>(${esc(l.unit)})</small></button>`).join('') || (q ? '<div class="eq-sub">Nada con esas palabras. Escríbelo abajo.</div>' : '');
}

// ---------- 📝 Notas del presupuesto: libreta con fecha, en TODOS los presupuestos (no salen en el PDF) ----------
function ensureNotesLog(proj) {
  if (Array.isArray(proj.notesLog)) return;
  proj.notesLog = [];
  if (proj.visitNotes) {
    const v = (appState.visits || []).find(x => x.id === proj.visitId);
    proj.notesLog.push({ id: 'nt_' + Date.now().toString(36), date: v ? (v.date || todayLocalStr(new Date(v.createdAt))) : (proj.date || todayLocalStr()), title: 'Notas de la visita', text: proj.visitNotes });
  }
}
function addProjectNote() {
  const p = getCurrentProject(); ensureNotesLog(p);
  p.notesLog.unshift({ id: 'nt_' + Date.now().toString(36), date: todayLocalStr(), title: '', text: '' });
  saveState(); renderAll();
  setTimeout(() => document.querySelector('#visitNotesBox textarea')?.focus(), 60);
}
function updateProjectNote(id, f, v) { const n = (getCurrentProject().notesLog || []).find(x => x.id === id); if (!n) return; n[f] = v; saveState(); }
function deleteProjectNote(id) {
  const p = getCurrentProject(); const n = (p.notesLog || []).find(x => x.id === id); if (!n) return;
  if ((n.text || '').trim() && !confirm(`¿Borrar la nota del ${new Date(n.date + 'T12:00:00').toLocaleDateString('es-ES')}?`)) return;
  p.notesLog = p.notesLog.filter(x => x.id !== id); saveState(); renderAll();
}
function renderVisitNotesBox(proj) {
  const el = document.getElementById('visitNotesBox'); if (!el) return;
  ensureNotesLog(proj);
  const notes = proj.notesLog.slice().sort((a, b) => b.date.localeCompare(a.date));
  const v = (appState.visits || []).find(x => x.id === proj.visitId);
  el.innerHTML = `<div class="card eq-card" style="margin-bottom:1rem;">
    <div class="eq-head"><span class="eq-icon">📝</span><div><div class="eq-name">Notas del presupuesto ${helpIcon('notasPresupuesto')}</div><div class="eq-sub">${notes.length ? notes.length + ' nota' + (notes.length > 1 ? 's' : '') : 'Aún no hay notas'} · solo para nosotros, no salen en el PDF</div></div>
      <div style="margin-left:auto; display:flex; gap:0.4rem; flex-wrap:wrap;">
        ${v ? `<button class="btn btn-sm" onclick="switchTab('visits'); openVisit('${v.id}')">📝 Abrir la visita (medidas y fotos)</button>` : ''}
        <button class="btn btn-primary" onclick="addProjectNote()"><b class="plus">+</b> Nota de hoy</button></div></div>
    ${notes.length ? `<details class="notes-log" ${notes.length <= 3 ? 'open' : ''}><summary>Ver las notas</summary>
      ${notes.map(n => `<div class="note-item">
        <div class="note-head"><strong>📅 ${n.title ? esc(n.title) + ' del' : 'Notas a fecha'}</strong>
          <input type="date" class="inline-input" value="${n.date}" onchange="updateProjectNote('${n.id}','date',this.value||todayLocalStr()); renderAll();" aria-label="Fecha de la nota">
          <button class="btn btn-sm btn-danger" onclick="deleteProjectNote('${n.id}')" title="Borrar nota">🗑</button></div>
        <textarea rows="3" placeholder="Qué ha pasado, qué ha dicho el cliente, qué hay que tener en cuenta…" onchange="updateProjectNote('${n.id}','text',this.value)">${esc(n.text || '')}</textarea>
      </div>`).join('')}</details>` : ''}
  </div>`;
}
