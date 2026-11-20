// ============================================================
// ALMACÉN EN ARCHIVO — guarda los datos en la carpeta de la aplicación
//   <carpeta app>\datos\presupuestador_datos.json   (datos vivos)
//   <carpeta app>\datos\copias\presupuestador_AAAA-MM-DD.json (1 copia por día, se guardan 30)
// Usa la File System Access API (Chrome / Edge). El navegador exige que el
// usuario elija la carpeta una vez; el permiso se recuerda en IndexedDB.
// localStorage se mantiene como caché por si el archivo no está disponible.
// ============================================================
const FS_DB_NAME = 'presupuestadorPRO_fs';
const FS_DATA_DIR = 'datos';
const FS_COPIES_DIR = 'copias';
const FS_DATA_FILE = 'presupuestador_datos.json';
const FS_MAX_COPIES = 30;

const fileStore = {
  supported: typeof window.showDirectoryPicker === 'function',
  dirHandle: null,      // carpeta de la aplicación
  status: 'off',        // off | needs-permission | ok | saving | error | unsupported
  lastSaved: null,
  lastError: '',
  pendingTimer: null,
  dirty: false,
  writeChain: Promise.resolve()
};

// ---------- IndexedDB mínima para recordar la carpeta ----------
function fsIdb(mode, fn) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FS_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const tx = req.result.transaction('kv', mode);
      const r = fn(tx.objectStore('kv'));
      tx.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
      tx.onerror = () => reject(tx.error);
    };
  });
}
const fsIdbGet = key => fsIdb('readonly', s => s.get(key));
const fsIdbSet = (key, val) => fsIdb('readwrite', s => s.put(val, key));
const fsIdbDel = key => fsIdb('readwrite', s => s.delete(key));

// ---------- Estado visible en la barra superior ----------
function renderFileStatus() {
  const btn = document.getElementById('fileStorageBtn');
  if (!btn) return;
  const hora = fileStore.lastSaved ? fileStore.lastSaved.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
  const map = {
    unsupported: ['⚠️ Este navegador no guarda en archivo (usa Chrome o Edge)', 'file-st-warn', 'Este navegador no permite guardar en la carpeta. Los datos solo están en el navegador: usa copias de seguridad.'],
    off:         ['📁 Conectar carpeta de datos', 'file-st-warn', 'Pulsa para elegir la carpeta de la aplicación y guardar ahí los datos.'],
    'needs-permission': ['🔓 Reconectar carpeta de datos', 'file-st-warn', 'Pulsa para volver a dar permiso de guardado en la carpeta.'],
    saving:      ['⏳ Guardando…', 'file-st-ok', 'Guardando en la carpeta de la aplicación.'],
    ok:          [`✅ Guardado en carpeta ${hora}`, 'file-st-ok', `Datos guardados en ${FS_DATA_DIR}\\${FS_DATA_FILE}. Pulsa para cambiar de carpeta.`],
    error:       ['❌ Error al guardar — pulsa', 'file-st-err', 'No se pudo guardar en la carpeta: ' + fileStore.lastError]
  };
  const [txt, cls, title] = map[fileStore.status] || map.off;
  btn.textContent = txt;
  btn.className = 'btn btn-a11y file-st ' + cls;
  btn.title = title;
}

async function onFileStorageButton() {
  if (!fileStore.supported) {
    alert('Para guardar en la carpeta hay que abrir la aplicación con Google Chrome o Microsoft Edge.');
    return;
  }
  if (fileStore.status === 'needs-permission' && fileStore.dirHandle) { await fsTryReconnect(); return; }
  if (fileStore.status === 'ok' && !confirm('Ya está conectada la carpeta "' + fileStore.dirHandle.name + '".\n\n¿Queremos elegir OTRA carpeta?')) return;
  await fsChooseFolder();
}

// Pide el permiso de nuevo (el navegador exige que sea tras un clic o una tecla)
async function fsTryReconnect() {
  if (fileStore.requesting || fileStore.status !== 'needs-permission' || !fileStore.dirHandle) return;
  fileStore.requesting = true;
  try {
    const ok = (await fileStore.dirHandle.requestPermission({ mode: 'readwrite' })) === 'granted';
    if (ok) await fsOpenConnected();
  } catch (e) { /* carpeta movida o borrada: el botón permite elegirla otra vez */ }
  fileStore.requesting = false;
  if (fileStore.status === 'needs-permission') renderFileStatus();
}
// El primer clic o tecla en cualquier sitio de la app vuelve a pedir el permiso
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => {
  if (fileStore.status === 'needs-permission') fsTryReconnect();
}, true));

async function fsChooseFolder() {
  alert('Ahora se abrirá una ventana.\n\nElige la carpeta de la aplicación (la que contiene index.html, por ejemplo D:\\Presupuestador_PRO) y pulsa "Seleccionar carpeta".\n\nSi el navegador pregunta si permites ver y editar archivos, pulsa "Permitir" o "Editar archivos".');
  let dir;
  try { dir = await window.showDirectoryPicker({ id: 'presupuestadorPRO', mode: 'readwrite' }); }
  catch (e) { return; } // cancelado
  let esCarpetaApp = true;
  try { await dir.getFileHandle('index.html'); } catch (e) { esCarpetaApp = false; }
  if (!esCarpetaApp && !confirm(`La carpeta "${dir.name}" no contiene index.html: no parece la carpeta de la aplicación.\n\n¿Usarla de todas formas?`)) return;
  fileStore.dirHandle = dir;
  await fsIdbSet('dir', dir);
  await fsOpenConnected();
}

async function fsGetDataDir(create) {
  return fileStore.dirHandle.getDirectoryHandle(FS_DATA_DIR, { create });
}

// Lee el archivo; si no existe, lo crea con los datos actuales.
// Si el archivo y el navegador tienen versiones distintas, gana la más reciente.
async function fsOpenConnected() {
  try {
    const dataDir = await fsGetDataDir(true);
    let fileData = null;
    try {
      const fh = await dataDir.getFileHandle(FS_DATA_FILE);
      const text = await (await fh.getFile()).text();
      const parsed = JSON.parse(text);
      if (parsed && parsed.projects && parsed.company) fileData = parsed;
    } catch (e) { /* no existe todavía o está vacío */ }

    if (fileData) {
      const fileT = Number(fileData.savedAt) || 0;
      const localT = Number(appState.savedAt) || 0;
      // Si este navegador arrancó con el ejemplo (p. ej. primera vez desde localhost), manda SIEMPRE el archivo
      if (fileT >= localT || localIsFreshDefault) {
        appState = fileData;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); } catch (e) {}
        renderAll();
        undoInit();
      } else {
        await fsWriteNow(); // el navegador tiene cambios más nuevos que el archivo
      }
    } else {
      await fsWriteNow();
    }
    localIsFreshDefault = false;
    fileStore.status = 'ok';
    fsFlushExtraFiles();
    if (!fileStore.lastSaved) fileStore.lastSaved = new Date();
    const bar = document.getElementById('backupReminderBar'); if (bar) bar.remove();
  } catch (e) {
    fileStore.status = 'error'; fileStore.lastError = e.message || String(e);
  }
  renderFileStatus();
}

// Archivos extra en datos\copias (p. ej. la copia de antes de un cambio grande). No se sobrescriben.
const pendingExtraFiles = {};
function fsWriteExtraFile(name, content) {
  if (!content) return;
  pendingExtraFiles[name] = content;
  fsFlushExtraFiles();
}
async function fsFlushExtraFiles() {
  if (!fileStore.dirHandle || !['ok', 'saving'].includes(fileStore.status)) return;
  for (const name of Object.keys(pendingExtraFiles)) {
    try {
      const copies = await (await fsGetDataDir(true)).getDirectoryHandle(FS_COPIES_DIR, { create: true });
      let exists = false;
      try { await copies.getFileHandle(name); exists = true; } catch (e) {}
      if (!exists) {
        const w = await (await copies.getFileHandle(name, { create: true })).createWritable();
        await w.write(pendingExtraFiles[name]); await w.close();
      }
      delete pendingExtraFiles[name];
    } catch (e) { /* se reintenta en el próximo guardado */ }
  }
}

function fsScheduleSave() {
  if (!fileStore.dirHandle || !['ok', 'saving', 'error'].includes(fileStore.status)) return;
  fileStore.dirty = true;
  clearTimeout(fileStore.pendingTimer);
  fileStore.pendingTimer = setTimeout(() => { fsWriteNow(); }, 600);
}

function fsWriteNow() {
  clearTimeout(fileStore.pendingTimer);
  // Las escrituras van en cola para que nunca se pisen
  fileStore.writeChain = fileStore.writeChain.then(async () => {
    if (!fileStore.dirHandle) return;
    fileStore.status = 'saving'; renderFileStatus();
    try {
      const json = JSON.stringify(appState, null, 1);
      const dataDir = await fsGetDataDir(true);
      const fh = await dataDir.getFileHandle(FS_DATA_FILE, { create: true });
      const w = await fh.createWritable();
      await w.write(json);
      await w.close();
      await fsDailyCopy(dataDir, json);
      fileStore.dirty = false;
      fileStore.lastSaved = new Date();
      fileStore.status = 'ok';
    } catch (e) {
      fileStore.status = 'error'; fileStore.lastError = e.message || String(e);
    }
    renderFileStatus();
  });
  return fileStore.writeChain;
}

// Una copia por día en datos\copias; se conservan las 30 más recientes
async function fsDailyCopy(dataDir, json) {
  const copies = await dataDir.getDirectoryHandle(FS_COPIES_DIR, { create: true });
  const name = `presupuestador_${todayLocalStr()}.json`;
  const fh = await copies.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(json);
  await w.close();
  const names = [];
  for await (const [n, h] of copies.entries()) {
    if (h.kind === 'file' && /^presupuestador_\d{4}-\d{2}-\d{2}\.json$/.test(n)) names.push(n);
  }
  names.sort();
  while (names.length > FS_MAX_COPIES) {
    try { await copies.removeEntry(names.shift()); } catch (e) { break; }
  }
}

async function initFileStorage() {
  // En la web (tablet o cualquier sitio) no hay carpeta: se guarda en el navegador y en Drive
  if (!isLocalOrigin) {
    const b = document.getElementById('fileStorageBtn');
    if (b) { b.style.display = 'none'; if (b.nextElementSibling && b.nextElementSibling.classList.contains('info-icon')) b.nextElementSibling.style.display = 'none'; }
    fileStore.supported = false; fileStore.status = 'unsupported'; checkBackupReminder(); return;
  }
  if (!fileStore.supported) { fileStore.status = 'unsupported'; renderFileStatus(); checkBackupReminder(); return; }
  let dir = null;
  try { dir = await fsIdbGet('dir'); } catch (e) {}
  if (!dir) {
    fileStore.status = 'off'; renderFileStatus(); checkBackupReminder();
    if (localIsFreshDefault) setTimeout(() => {
      if (confirm('Primera vez en este navegador.\n\nPara cargar NUESTROS presupuestos, conecta ahora la carpeta de la aplicación (D:\\Presupuestador_PRO).\n\n¿Conectar ahora?')) fsChooseFolder();
    }, 400);
    return;
  }
  fileStore.dirHandle = dir;
  let perm = 'prompt';
  try { perm = await dir.queryPermission({ mode: 'readwrite' }); } catch (e) {}
  if (perm === 'granted') {
    await fsOpenConnected();
  } else {
    fileStore.status = 'needs-permission';
    renderFileStatus();
    checkBackupReminder();
  }
}

// Aviso si se cierra la ventana con un guardado pendiente
window.addEventListener('beforeunload', e => {
  if (fileStore.dirty) { fsWriteNow(); e.preventDefault(); e.returnValue = ''; }
});
