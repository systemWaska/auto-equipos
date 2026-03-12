/* ============================================================
   IT HUB — shared.js
   Estado global y utilidades compartidas
   ============================================================ */

// ============================================================
// ESTADO GLOBAL (se persiste en sessionStorage)
// ============================================================
const SESSION_KEY = 'ithub_session';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}
function setSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// Verificar autenticación — si no hay sesión, redirigir a login
function requireAuth() {
  const s = getSession();
  if (!s) { window.location.href = 'index.html'; return null; }
  return s;
}

// ============================================================
// DB LOCAL (cache en memoria de la pestaña)
// ============================================================
const DB = {
  automatizaciones: JSON.parse(sessionStorage.getItem('db_autos') || '[]'),
  equipos:          JSON.parse(sessionStorage.getItem('db_equips') || '[]'),
  historial:        JSON.parse(sessionStorage.getItem('db_hist')  || '[]'),
};

function saveDB() {
  sessionStorage.setItem('db_autos',  JSON.stringify(DB.automatizaciones));
  sessionStorage.setItem('db_equips', JSON.stringify(DB.equipos));
  sessionStorage.setItem('db_hist',   JSON.stringify(DB.historial));
}

// ============================================================
// GS CONFIG
// ============================================================
const GS = {
  get url()  { return localStorage.getItem('gs_url')  || ''; },
  get org()  { return localStorage.getItem('gs_org')  || 'IT Hub'; },
  get pass() { return localStorage.getItem('pass_admin') || 'admin123'; },
};

async function gsGet(action, params = {}) {
  if (!GS.url) return null;
  const qs = new URLSearchParams({ action, ...params }).toString();
  try {
    const r = await fetch(`${GS.url}?${qs}`);
    return await r.json();
  } catch(e) { console.warn('gsGet failed:', e); return null; }
}

async function gsPost(body) {
  if (!GS.url) return null;
  try {
    await fetch(GS.url, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return true;
  } catch(e) { console.warn('gsPost failed:', e); return false; }
}

async function syncAll() {
  const data = await gsGet('getAll');
  if (!data) return false;
  if (data.automatizaciones) { DB.automatizaciones = data.automatizaciones; }
  if (data.equipos)          { DB.equipos          = data.equipos; }
  if (data.historial)        { DB.historial         = data.historial; }
  saveDB();
  return true;
}

// ============================================================
// HELPERS UI
// ============================================================
function fmtDate(iso) {
  if (!iso) return '—';
  const p = String(iso).split('T')[0].split('-');
  return p.length < 3 ? iso : `${p[2]}/${p[1]}/${p[0]}`;
}

function fmtDatetime(d) {
  const dd = new Date(d);
  return dd.toLocaleDateString('es') + ' ' + dd.toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' });
}

function toast(type, title, sub = '') {
  const icons = { s:'✓', e:'✕', i:'ℹ', w:'⚠' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<div class="t-ico">${icons[type]||''}</div>
    <div class="t-tx"><div class="t-title">${title}</div>${sub ? `<div class="t-sub">${sub}</div>` : ''}</div>`;
  let container = document.getElementById('toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toasts';
    document.body.appendChild(container);
  }
  container.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(16px)'; setTimeout(()=>el.remove(),300); }, 4000);
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function clearF(ids) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

// Badge helpers
function bStatus(s) {
  const m = {
    'Finalizado':           'bg',
    'En desarrollo':        'by',
    'En curso':             'bi',
    'Mantenimiento activo': 'bp',
    'Cancelado':            'br',
    'Pendiente':            'bx'
  };
  return `<span class="badge ${m[s]||'bx'}">${s}</span>`;
}
function bEquipo(s) {
  const m = { Asignado:'bg', Libre:'bi', Mantenimiento:'by', Baja:'br' };
  return `<span class="badge ${m[s]||'bx'}">${s||'—'}</span>`;
}
function bPrio(s) {
  const m = { Alta:'br', Media:'by', Baja:'bg' };
  return `<span class="badge ${m[s]||'bx'}">${s||'—'}</span>`;
}
function bSiNo(v) {
  return v==='SI'
    ? `<span class="badge bg" style="min-width:36px;justify-content:center">SI</span>`
    : `<span class="badge br" style="min-width:36px;justify-content:center">NO</span>`;
}

// Render sidebar active state
function setNavActive(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// Render org name in sidebar
function renderSidebarUser() {
  const s = getSession();
  if (!s) return;
  const el = document.getElementById('sidebar-user');
  const ro = document.getElementById('sidebar-role');
  if (el) el.textContent = s.name;
  if (ro) ro.textContent = GS.org;
}

// Logout
function doLogout() {
  clearSession();
  window.location.href = 'index.html';
}

// Event: cerrar modales con Escape o click fuera
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
  });
  renderSidebarUser();
});
