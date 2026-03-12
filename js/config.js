const s = requireAuth();
if (s) {
  document.getElementById('user-avatar').textContent = s.name.substring(0,2).toUpperCase();
  document.getElementById('gs-url').value   = GS.url;
  document.getElementById('cfg-org').value  = GS.org;
  document.getElementById('pref-lap').value = localStorage.getItem('pref_lap')||'W-L';
  document.getElementById('pref-pc').value  = localStorage.getItem('pref_pc')||'W-P';
  document.getElementById('pref-mon').value = localStorage.getItem('pref_mon')||'W-M';
  updateCounts();
}

function updateCounts() {
  document.getElementById('cnt-eq').textContent   = DB.equipos.length;
  document.getElementById('cnt-au').textContent   = DB.automatizaciones.length;
  document.getElementById('cnt-hist').textContent = DB.historial.length;
}

function saveGS() {
  const url = document.getElementById('gs-url').value.trim();
  localStorage.setItem('gs_url', url);
  toast('s','URL guardada', url ? 'Google Sheets conectado' : 'URL eliminada');
}

async function testConnection() {
  const url = document.getElementById('gs-url').value.trim();
  if (!url) return toast('e','Sin URL','Ingresa la URL del Web App primero');
  const st = document.getElementById('conn-status');
  st.style.display = 'block';
  st.textContent = '⏳ Probando conexión...';
  try {
    const r = await fetch(url + '?action=ping');
    const d = await r.json();
    if (d.ok) {
      st.textContent = '✅ Conexión exitosa — ' + (d.message||'');
      st.style.color = 'var(--a)';
      toast('s','Conexión exitosa', d.message||'Backend OK');
    } else {
      st.textContent = '⚠ Respuesta inesperada';
      st.style.color = 'var(--a4)';
    }
  } catch(e) {
    st.textContent = '✕ Error: ' + e.message;
    st.style.color = 'var(--a3)';
    toast('e','Error de conexión','Verifica la URL y permisos del Web App');
  }
}

async function syncNow() {
  const url = localStorage.getItem('gs_url');
  if (!url) return toast('e','Sin URL','Guarda la URL primero');
  toast('i','Sincronizando...','');
  const ok = await syncAll();
  if (ok) {
    updateCounts();
    toast('s','Sincronizado', `Equipos: ${DB.equipos.length} · Autos: ${DB.automatizaciones.length} · Historial: ${DB.historial.length}`);
  } else toast('e','Error','No se pudo conectar con Google Sheets');
}

function saveSys() {
  const org  = document.getElementById('cfg-org').value.trim();
  const pass = document.getElementById('cfg-pass').value;
  if (org) localStorage.setItem('gs_org', org);
  if (pass) { localStorage.setItem('pass_admin', pass); document.getElementById('cfg-pass').value=''; }
  toast('s','Configuración guardada','');
  if (GS.url) gsPost({ action:'setConfig', data:{ clave:'org_name', valor:org } });
}

function savePrefixes() {
  localStorage.setItem('pref_lap', document.getElementById('pref-lap').value||'W-L');
  localStorage.setItem('pref_pc',  document.getElementById('pref-pc').value||'W-P');
  localStorage.setItem('pref_mon', document.getElementById('pref-mon').value||'W-M');
  toast('s','Prefijos guardados','');
}

function exportAll() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(DB,null,2)],{type:'application/json'}));
  a.download = 'ithub-backup-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  toast('i','Backup exportado','');
}

function clearLocal() {
  if (!confirm('¿Borrar todos los datos locales? Se perderán si no tienes copia en Google Sheets.')) return;
  sessionStorage.removeItem('db_autos');
  sessionStorage.removeItem('db_equips');
  sessionStorage.removeItem('db_hist');
  DB.automatizaciones=[]; DB.equipos=[]; DB.historial=[];
  updateCounts();
  toast('w','Datos locales borrados','');
}

function toggleMobile(){ document.getElementById('sidebar').classList.toggle('mobile-open'); document.getElementById('sidebar-overlay').classList.toggle('show'); }
function closeMobile(){ document.getElementById('sidebar').classList.remove('mobile-open'); document.getElementById('sidebar-overlay').classList.remove('show'); }
