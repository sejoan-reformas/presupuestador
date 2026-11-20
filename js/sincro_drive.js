// ============================================================
// SINCRONIZACIÓN CON GOOGLE DRIVE (gratis, cuenta de la empresa)
//   Drive: carpeta "Presupuestador PRO"
//     presupuestador_datos.json        (datos vivos, compartidos portátil ↔ tablet)
//     copias/copia_AAAA-MM-DD.json     (una por día, se guardan 30)
// Permiso "drive.file": el programa SOLO ve los archivos que él mismo ha creado.
// Mezcla por presupuesto: si un presupuesto se ha cambiado en un solo aparato,
// gana ese cambio; si se ha cambiado en los dos a la vez, se guardan LOS DOS
// (el de aquí queda como copia con el nombre del aparato). Nunca se pierde nada.
// ============================================================
const DRIVE_CLIENT_ID = '1014247289112-l4u9h9suojs0b78s5ci5ttpdni7abpmf.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_HINT = 'reformasintegralessejoan@gmail.com';
const DRIVE_FOLDER = 'Presupuestador PRO';
const DRIVE_FILE = 'presupuestador_datos.json';
const DRIVE_COPIES = 'copias';
const DRIVE_MAX_COPIES = 30;
const DRIVE_KEY = 'presupuestadorPRO_drive_v1';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UP = 'https://www.googleapis.com/upload/drive/v3/files';

const isLocalOrigin = ['127.0.0.1', 'localhost', ''].includes(location.hostname);

const driveSync = {
  cfg: {},             // { linked, token, tokenExp, folderId, fileId, copiesId, base:{rest,projects}, lastCopyDay, device }
  status: 'off',       // off | login | syncing | ok | offline | error
  lastOk: null,
  lastError: '',
  timer: null,
  running: false,
  again: false,
  tokenClient: null,
  gisLoading: null
};

function driveLoadCfg() { try { driveSync.cfg = JSON.parse(localStorage.getItem(DRIVE_KEY)) || {}; } catch (e) { driveSync.cfg = {}; } }
function driveSaveCfg() { try { localStorage.setItem(DRIVE_KEY, JSON.stringify(driveSync.cfg)); } catch (e) {} }
function driveDevice() {
  if (!driveSync.cfg.device) { driveSync.cfg.device = /Android|iPad|Tablet/i.test(navigator.userAgent) ? 'Tablet' : 'Portátil'; driveSaveCfg(); }
  return driveSync.cfg.device;
}

// ---------- Huella de un trozo de datos (para saber si ha cambiado) ----------
function driveHash(obj) {
  const s = JSON.stringify(obj) || '';
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}
// Todo lo que no son presupuestos (empresa, personas, catálogos…). No cuenta qué presupuesto está abierto ni la hora.
function driveRest(state) { const r = { ...state }; delete r.projects; delete r.currentProjectId; delete r.savedAt; return r; }
function driveFingerprint(state) {
  const projects = {};
  (state.projects || []).forEach(p => { projects[p.id] = driveHash(p); });
  return { rest: driveHash(driveRest(state)), projects };
}

// ---------- Mezcla ----------
// Devuelve { state, conflicts:[nombres] }
function driveMerge(local, remote, base) {
  base = base || { rest: null, projects: {} };
  const bp = base.projects || {};
  const conflicts = [];
  const lMap = new Map((local.projects || []).map(p => [p.id, p]));
  const rMap = new Map((remote.projects || []).map(p => [p.id, p]));

  // Resto de datos: gana el que haya cambiado; si cambian los dos, el guardado más reciente
  const lr = driveHash(driveRest(local)), rr = driveHash(driveRest(remote));
  let restFrom;
  if (lr === rr || lr === base.rest) restFrom = remote;
  else if (rr === base.rest) restFrom = local;
  else restFrom = (Number(local.savedAt) || 0) >= (Number(remote.savedAt) || 0) ? local : remote;

  const out = [];
  const seen = new Set();
  const order = [...(remote.projects || []).map(p => p.id), ...(local.projects || []).map(p => p.id)];
  for (const id of order) {
    if (seen.has(id)) continue; seen.add(id);
    const L = lMap.get(id), R = rMap.get(id);
    const lh = L ? driveHash(L) : null, rh = R ? driveHash(R) : null, bh = bp[id] || null;
    if (L && R) {
      if (lh === rh || lh === bh) out.push(R);
      else if (rh === bh) out.push(L);
      else {
        out.push(R);
        const copy = JSON.parse(JSON.stringify(L));
        copy.id = id + '_c' + Date.now().toString(36);
        copy.title = (copy.title || 'Presupuesto') + ` (versión del ${driveDevice()} ${new Date().toLocaleDateString('es-ES')})`;
        out.push(copy);
        conflicts.push(R.title || id);
      }
    } else if (L) {
      // Solo aquí: es nuevo, o se borró en el otro aparato. Si se borró allí y aquí no se ha tocado, se borra.
      if (!(bh && lh === bh)) out.push(L);
    } else if (R) {
      // Solo en Drive: es nuevo, o lo borramos aquí. Si lo borramos aquí y allí no se ha tocado, se borra.
      if (!(bh && rh === bh)) out.push(R);
    }
  }
  const state = { ...JSON.parse(JSON.stringify(restFrom)), projects: out };
  state.currentProjectId = out.some(p => p.id === local.currentProjectId) ? local.currentProjectId : (out[0] && out[0].id);
  state.savedAt = Math.max(Number(local.savedAt) || 0, Number(remote.savedAt) || 0);
  if (!out.length) return { state: local, conflicts: [] }; // nunca dejamos el programa vacío
  return { state, conflicts };
}

// ---------- Google: permiso ----------
function driveLoadGis() {
  if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
  if (driveSync.gisLoading) return driveSync.gisLoading;
  driveSync.gisLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => res(); s.onerror = () => { driveSync.gisLoading = null; rej(new Error('sin conexión con Google')); };
    document.head.appendChild(s);
  });
  return driveSync.gisLoading;
}
function driveTokenOk() { return driveSync.cfg.token && Date.now() < (driveSync.cfg.tokenExp || 0) - 60000; }

// Abre la ventanita de Google (tiene que ser tras un clic). Devuelve true si hay permiso.
async function driveLogin(firstTime) {
  try { await driveLoadGis(); } catch (e) { driveSetStatus('offline'); return false; }
  return new Promise(resolve => {
    const tc = google.accounts.oauth2.initTokenClient({
      client_id: DRIVE_CLIENT_ID, scope: DRIVE_SCOPE, hint: DRIVE_HINT,
      callback: r => {
        if (r && r.access_token) {
          driveSync.cfg.token = r.access_token;
          driveSync.cfg.tokenExp = Date.now() + (Number(r.expires_in) || 3600) * 1000;
          driveSync.cfg.linked = true; driveSaveCfg();
          resolve(true);
        } else { driveSetStatus('login'); resolve(false); }
      },
      error_callback: () => { driveSetStatus(driveSync.cfg.linked ? 'login' : 'off'); resolve(false); }
    });
    tc.requestAccessToken({ prompt: firstTime ? 'consent' : '' });
  });
}

// ---------- Google Drive: llamadas ----------
async function driveFetch(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + driveSync.cfg.token } });
  if (r.status === 401) { driveSync.cfg.token = null; driveSaveCfg(); const e = new Error('permiso caducado'); e.login = true; throw e; }
  if (!r.ok) throw new Error('Drive ' + r.status + ' ' + (await r.text()).slice(0, 160));
  return r;
}
async function driveFind(q) {
  const r = await driveFetch(DRIVE_API + '?q=' + encodeURIComponent(q + ' and trashed=false') + '&fields=files(id,name,modifiedTime)&orderBy=name&pageSize=100');
  return (await r.json()).files || [];
}
async function driveCreateFolder(name, parent) {
  const r = await driveFetch(DRIVE_API + '?fields=id', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: parent ? [parent] : undefined })
  });
  return (await r.json()).id;
}
async function driveCreateFile(name, parent, text) {
  const b = 'presu' + Math.random().toString(36).slice(2);
  const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` + JSON.stringify({ name, parents: [parent], mimeType: 'application/json' }) +
    `\r\n--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` + text + `\r\n--${b}--`;
  const r = await driveFetch(DRIVE_UP + '?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body });
  return (await r.json()).id;
}
// Devuelve la hora de modificación que ha quedado en Drive tras NUESTRA escritura
async function driveUpdateFile(id, text) {
  const r = await driveFetch(DRIVE_UP + '/' + id + '?uploadType=media&fields=modifiedTime', { method: 'PATCH', headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: text });
  return (await r.json()).modifiedTime;
}
async function driveModified(id) {
  return (await (await driveFetch(DRIVE_API + '/' + id + '?fields=modifiedTime')).json()).modifiedTime;
}
async function driveEnsureFolders() {
  const c = driveSync.cfg;
  if (!c.folderId) {
    const f = await driveFind(`name='${DRIVE_FOLDER}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents`);
    c.folderId = f.length ? f[0].id : await driveCreateFolder(DRIVE_FOLDER);
  }
  if (!c.fileId) {
    const f = await driveFind(`name='${DRIVE_FILE}' and '${c.folderId}' in parents`);
    if (f.length) c.fileId = f[0].id;
  }
  driveSaveCfg();
}
async function driveDailyCopy(text) {
  const c = driveSync.cfg, day = todayLocalStr();
  if (c.lastCopyDay === day) return;
  if (!c.copiesId) {
    const f = await driveFind(`name='${DRIVE_COPIES}' and mimeType='application/vnd.google-apps.folder' and '${c.folderId}' in parents`);
    c.copiesId = f.length ? f[0].id : await driveCreateFolder(DRIVE_COPIES, c.folderId);
  }
  const name = `copia_${day}.json`;
  const same = await driveFind(`name='${name}' and '${c.copiesId}' in parents`);
  if (same.length) await driveUpdateFile(same[0].id, text); else await driveCreateFile(name, c.copiesId, text);
  c.lastCopyDay = day; driveSaveCfg();
  const all = (await driveFind(`'${c.copiesId}' in parents`)).filter(f => /^copia_\d{4}-\d{2}-\d{2}\.json$/.test(f.name)).sort((a, b) => a.name < b.name ? -1 : 1);
  while (all.length > DRIVE_MAX_COPIES) { try { await driveFetch(DRIVE_API + '/' + all.shift().id, { method: 'DELETE' }); } catch (e) { break; } }
}

// ---------- El ciclo de sincronización ----------
function driveScheduleSync(ms) {
  if (!driveSync.cfg.linked) return;
  driveSync.pending = true;
  clearTimeout(driveSync.timer);
  driveSync.timer = setTimeout(() => { driveSync.timer = null; driveSyncNow(); }, ms == null ? 6000 : ms);
}

async function driveSyncNow() {
  if (!driveSync.cfg.linked) return;
  if (driveSync.running) { driveSync.again = true; return; }
  if (!navigator.onLine) { driveSetStatus('offline'); return; }
  if (!driveTokenOk()) { driveSetStatus('login'); return; }
  driveSync.running = true; driveSetStatus('syncing');
  try {
    await driveEnsureFolders();
    const c = driveSync.cfg;
    const startSavedAt = appState.savedAt;
    driveSync.pending = false;
    const local = JSON.parse(JSON.stringify(appState));
    let remote = null, m1 = null;
    if (c.fileId) {
      try { m1 = await driveModified(c.fileId); remote = await (await driveFetch(DRIVE_API + '/' + c.fileId + '?alt=media')).json(); }
      catch (e) { if (/ 404/.test(e.message)) { c.fileId = null; c.base = null; } else throw e; }
      if (remote && !(remote.projects && remote.company)) remote = null;
    }

    let merged = local, conflicts = [];
    if (remote) {
      // Aparato nuevo que solo tiene el ejemplo: se queda con lo de Drive tal cual
      if (!c.base && localIsFreshDefault) merged = remote;
      else ({ state: merged, conflicts } = driveMerge(local, remote, c.base));
    }

    // Si mientras tanto hemos tocado algo, repetimos con los datos nuevos
    if (appState.savedAt !== startSavedAt) { driveSync.again = true; return; }

    const text = JSON.stringify(merged, null, 1);
    const mergedFp = driveFingerprint(merged);
    const remoteFp = remote ? driveFingerprint(remote) : null;
    const needUpload = !remote || JSON.stringify(mergedFp) !== JSON.stringify(remoteFp);
    // Si el otro aparato escribe justo a la vez, no damos por buena la mezcla: se repite y, si hace falta, se guardan las dos versiones
    let solo = true;
    if (needUpload) {
      if (c.fileId && remote) {
        if ((await driveModified(c.fileId)) !== m1) { driveSync.again = true; return; }
        const mine = await driveUpdateFile(c.fileId, text);
        await new Promise(r => setTimeout(r, 1200));
        solo = (await driveModified(c.fileId)) === mine;
      } else if (c.fileId) { await driveUpdateFile(c.fileId, text); }
      else { c.fileId = await driveCreateFile(DRIVE_FILE, c.folderId, text); }
    }
    // Lo que venga de Drive entra en este aparato (navegador + carpeta si está conectada)
    if (JSON.stringify(mergedFp) !== JSON.stringify(driveFingerprint(local))) {
      appState = merged;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); } catch (e) {}
      if (typeof fsScheduleSave === 'function') fsScheduleSave();
      renderAll();
      if (typeof undoInit === 'function') undoInit();
    }
    localIsFreshDefault = false;
    if (solo) c.base = mergedFp; else driveSync.again = true;
    driveSaveCfg();
    try { await driveDailyCopy(text); } catch (e) { /* la copia se reintenta en el próximo ciclo */ }
    driveSync.lastOk = new Date(); driveSetStatus('ok');
    const bar = document.getElementById('backupReminderBar'); if (bar) bar.remove();
    if (conflicts.length) alert('☁️ Estos presupuestos se cambiaron a la vez en el portátil y en la tablet:\n\n• ' + conflicts.join('\n• ') +
      '\n\nNo se ha perdido nada: tenemos las dos versiones en "Mis presupuestos". La del ' + driveDevice() + ' lleva su nombre entre paréntesis. Nos quedamos con la buena y borramos la otra.');
  } catch (e) {
    if (e.login) driveSetStatus('login');
    else if (!navigator.onLine || e instanceof TypeError) driveSetStatus('offline');
    else { driveSync.lastError = e.message || String(e); driveSetStatus('error'); }
  } finally {
    driveSync.running = false;
    if (driveSync.again) { driveSync.again = false; driveScheduleSync(1500); }
  }
}

// ---------- Botón de la barra superior ----------
function driveSetStatus(s) { driveSync.status = s; renderDriveStatus(); }
function renderDriveStatus() {
  const btn = document.getElementById('driveSyncBtn');
  if (!btn) return;
  const hora = driveSync.lastOk ? driveSync.lastOk.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
  const map = {
    off:     ['☁️ Conectar con Drive', 'file-st-warn', 'Pulsa para guardar en el Drive de la empresa y tener los mismos datos en el portátil y en la tablet.'],
    login:   ['🔑 Pulsa para sincronizar', 'file-st-warn', 'Google pide confirmar cada cierto tiempo. Pulsa y elige la cuenta de la empresa. Mientras tanto todo se guarda en este aparato.'],
    syncing: ['⏳ Sincronizando…', 'file-st-ok', 'Mandando y recogiendo los cambios del Drive.'],
    ok:      [`☁️ Sincronizado ${hora}`, 'file-st-ok', 'Los datos están en el Drive de la empresa (carpeta "Presupuestador PRO"). Pulsa para sincronizar ahora.'],
    offline: ['🔌 Sin internet (guardado aquí)', 'file-st-warn', 'No hay conexión. Todo se guarda en este aparato y se manda solo al Drive cuando vuelva internet.'],
    error:   ['❌ Error con Drive — pulsa', 'file-st-err', 'No se pudo sincronizar: ' + driveSync.lastError + '. Los datos siguen a salvo en este aparato.']
  };
  const [txt, cls, title] = map[driveSync.status] || map.off;
  btn.textContent = txt;
  btn.className = 'btn btn-a11y file-st ' + cls;
  btn.title = title;
}

async function onDriveButton() {
  const c = driveSync.cfg;
  if (!c.linked) {
    if (!confirm('Vamos a conectar con el Drive de la empresa (' + DRIVE_HINT + ').\n\nSe abrirá una ventana de Google: elige esa cuenta y pulsa "Continuar" / "Permitir".\n\nEl programa solo podrá ver la carpeta "Presupuestador PRO" que él mismo crea; nada más de vuestro Drive.')) return;
    if (await driveLogin(true)) driveSyncNow();
    return;
  }
  if (!driveTokenOk()) { if (await driveLogin(false)) driveSyncNow(); return; }
  driveSyncNow();
}

// El primer clic en cualquier sitio renueva el permiso de Google cuando ha caducado
let driveRenewing = false;
document.addEventListener('pointerdown', async e => {
  if (driveRenewing || driveSync.status !== 'login' || !driveSync.cfg.linked || !navigator.onLine) return;
  if (e.target && e.target.id === 'driveSyncBtn') return;
  driveRenewing = true;
  if (await driveLogin(false)) driveSyncNow();
  driveRenewing = false;
}, true);

window.addEventListener('online', () => setTimeout(driveSyncNow, 1000));
window.addEventListener('offline', () => { if (driveSync.cfg.linked) driveSetStatus('offline'); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { if (!driveSync.running) setTimeout(driveSyncNow, 800); }
  else if (driveSync.pending) driveSyncNow(); // al cambiar de app en la tablet, mandamos lo pendiente
});
setInterval(() => { if (document.visibilityState === 'visible' && !driveSync.running) driveSyncNow(); }, 120000);
window.addEventListener('beforeunload', e => {
  if (driveSync.cfg.linked && navigator.onLine && (driveSync.pending || driveSync.running)) { e.preventDefault(); e.returnValue = ''; }
});

function initDriveSync() {
  driveLoadCfg();
  driveDevice();
  if (!driveSync.cfg.linked) { driveSetStatus('off'); return; }
  driveSetStatus(navigator.onLine ? (driveTokenOk() ? 'syncing' : 'login') : 'offline');
  driveLoadGis().catch(() => {});
  setTimeout(driveSyncNow, 1500);
}
