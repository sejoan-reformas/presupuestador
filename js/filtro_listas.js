// ============================================================
// BUSCADOR REUTILIZABLE PARA LISTAS
// Uso en HTML:  listFilterHtml({ id, scope, rows, groups?, placeholder })
//   scope  = selector del contenedor de la lista
//   rows   = selector de cada elemento (dentro de scope)
//   groups = (opcional) selector de grupos a ocultar si quedan vacíos
// Busca sin tildes ni mayúsculas, con varias palabras, también en casillas.
// Un MutationObserver vuelve a aplicar el filtro cada vez que la lista se redibuja.
// Para desplegables (<select>) largos: selectFilterHtml({ id, scope, placeholder })
// ============================================================
function listFilterHtml(o) {
  return `<div class="list-filter-wrap">
    <span class="lf-icon" aria-hidden="true">🔍</span>
    <input type="text" id="${o.id}" class="list-filter" data-scope="${o.scope}" data-rows="${o.rows}" ${o.groups ? `data-groups="${o.groups}"` : ''}
      placeholder="${o.placeholder || 'Buscar en la lista…'}" autocomplete="off"
      oninput="applyListFilter(this)" onkeydown="if(event.key==='Escape'){this.value='';applyListFilter(this);}">
    <span class="lf-count" aria-live="polite"></span>
    <button type="button" class="btn btn-sm lf-clear" title="Borrar búsqueda" onclick="const i=this.parentElement.querySelector('input');i.value='';applyListFilter(i);i.focus();">✕</button>
  </div>`;
}

function filterRowText(el) {
  let t = el.textContent || '';
  el.querySelectorAll('input:not([type=checkbox]):not([type=radio]), textarea').forEach(i => { t += ' ' + i.value; });
  el.querySelectorAll('select').forEach(s => { const op = s.options[s.selectedIndex]; if (op) t += ' ' + op.text; });
  return normTxt(t);
}

function applyListFilter(input) {
  const scope = document.querySelector(input.dataset.scope);
  const wrap = input.parentElement;
  const countEl = wrap.querySelector('.lf-count');
  wrap.classList.toggle('lf-active', !!input.value.trim());
  if (!scope) return;
  const words = normTxt(input.value).split(/\s+/).filter(Boolean);
  const rows = [...scope.querySelectorAll(input.dataset.rows)];
  let shown = 0;
  rows.forEach(r => {
    const ok = !words.length || words.every(w => filterRowText(r).includes(w));
    r.classList.toggle('lf-hidden', !ok);
    if (ok) shown++;
  });
  if (input.dataset.groups) {
    scope.querySelectorAll(input.dataset.groups).forEach(g => {
      const any = [...g.querySelectorAll(input.dataset.rows)].some(r => !r.classList.contains('lf-hidden'));
      g.classList.toggle('lf-hidden', words.length > 0 && !any);
    });
  }
  countEl.textContent = words.length ? (shown ? `${shown} de ${rows.length}` : `Ninguno de ${rows.length}`) : '';
}

// ---- Desplegables largos: oculta las opciones que no coinciden (la elegida nunca se oculta) ----
function selectFilterHtml(o) {
  return `<div class="list-filter-wrap">
    <span class="lf-icon" aria-hidden="true">🔍</span>
    <input type="text" id="${o.id}" class="select-filter" data-scope="${o.scope}" placeholder="${o.placeholder || 'Buscar…'}" autocomplete="off"
      oninput="applySelectFilter(this, true)" onkeydown="if(event.key==='Escape'){this.value='';applySelectFilter(this);}">
    <span class="lf-count" aria-live="polite"></span>
  </div>`;
}

function applySelectFilter(input, pickFirst) {
  const scope = document.querySelector(input.dataset.scope);
  if (!scope) return;
  const words = normTxt(input.value).split(/\s+/).filter(Boolean);
  const selects = scope.matches('select') ? [scope] : [...scope.querySelectorAll('select')];
  let shown = 0, total = 0;
  selects.forEach(sel => {
    let firstVisible = null;
    [...sel.options].forEach(op => {
      const ok = !words.length || words.every(w => normTxt(op.text).includes(w));
      op.hidden = !ok && !op.selected;
      if (ok && !firstVisible) firstVisible = op;
      if (sel === selects[0]) { total++; if (ok) shown++; }
    });
    // En un desplegable único (ej. "material suelto") se elige el primer resultado
    if (pickFirst && selects.length === 1 && firstVisible && words.length) { sel.value = firstVisible.value; sel.dispatchEvent(new Event('change')); }
  });
  input.parentElement.querySelector('.lf-count').textContent = words.length ? `${shown} de ${total}` : '';
}

// Reaplica los filtros activos cuando una lista se vuelve a dibujar
(function () {
  let pending = false;
  const run = () => {
    pending = false;
    document.querySelectorAll('input.list-filter').forEach(i => { if (i.value.trim() || i.parentElement.classList.contains('lf-active')) applyListFilter(i); });
    document.querySelectorAll('input.select-filter').forEach(i => { if (i.value.trim()) applySelectFilter(i, false); });
  };
  new MutationObserver(muts => {
    if (pending) return;
    if (muts.every(m => m.target.closest && m.target.closest('.list-filter-wrap'))) return;
    pending = true;
    requestAnimationFrame(run);
  }).observe(document.body, { childList: true, subtree: true });
})();

// Monta los buscadores declarados en el HTML con data-list-filter / data-select-filter
(function initListFilters() {
  document.querySelectorAll('[data-list-filter]').forEach(el => {
    el.outerHTML = listFilterHtml({ id: el.dataset.id, scope: el.dataset.scope, rows: el.dataset.rows, groups: el.dataset.groups, placeholder: el.dataset.placeholder });
  });
  document.querySelectorAll('[data-select-filter]').forEach(el => {
    el.outerHTML = selectFilterHtml({ id: el.dataset.id, scope: el.dataset.scope, placeholder: el.dataset.placeholder });
  });
})();
