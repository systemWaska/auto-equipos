const s = requireAuth();
let editingId = null;
let allAutos = [];

if (s) {
  document.getElementById('user-avatar').textContent = s.name.substring(0,2).toUpperCase();
  if (GS.url) {
    syncAll().then(ok => { if (ok) { buildList(); render(); toast('s','Sincronizado',''); } });
  } else { buildList(); render(); }
}

function buildList() {
  allAutos = DB.automatizaciones;
  // stats
  document.getElementById('st-tot').textContent = allAutos.length;
  document.getElementById('st-fin').textContent = allAutos.filter(a=>a.Status==='Finalizado').length;
  document.getElementById('st-dev').textContent = allAutos.filter(a=>a.Status==='En desarrollo').length;
  document.getElementById('st-cur').textContent = allAutos.filter(a=>a.Status==='En curso').length;
  document.getElementById('st-man').textContent = allAutos.filter(a=>a.Status==='Mantenimiento activo').length;
}

function render() {
  buildList();
  const q  = (document.getElementById('q-au')?.value||'').toLowerCase();
  const fm = document.getElementById('f-modulo')?.value||'';
  const fs = document.getElementById('f-status')?.value||'';
  const fp = document.getElementById('f-prio')?.value||'';

  const items = allAutos.filter(a => {
    const nom = String(a.NombreAutomatizacion||a.nom||'').toLowerCase();
    const req = String(a.Requerimiento||a.req||'').toLowerCase();
    const sol = String(a.Solicitante||a.sol||'').toLowerCase();
    const mod = String(a.ModuloArea||a.modulo||'');
    const st  = String(a.Status||a.status||'');
    const pr  = String(a.Prioridad||a.prio||'');
    return (nom.includes(q)||req.includes(q)||sol.includes(q)||mod.toLowerCase().includes(q)) &&
           (!fm||mod===fm) && (!fs||st===fs) && (!fp||pr===fp);
  });

  document.getElementById('tb-au').innerHTML = items.length ? items.map((a,i) => {
    const n   = a.N||a.n||(i+1);
    const mod = a.ModuloArea||a.modulo||'—';
    const req = a.Requerimiento||a.req||'—';
    const nom = a.NombreAutomatizacion||a.nom||'—';
    const sol = a.Solicitante||a.sol||'—';
    const pr  = a.Prioridad||a.prio||'';
    const fs_ = a.FechaSolicitud||a.fsol||'';
    const fe  = a.FechaEntrega||a.fent||'';
    const td  = a.TiempoDesarrollo||a.tdev||'';
    const imp = a.ImpactoAhorro||a.imp||'';
    const ver = a.Version||a.ver||'';
    const ubi = a.UbicacionScript||a.ubi||'';
    const st  = a.Status||a.status||'';
    const nt  = a.Notas||a.notas||'';
    const uid = a.N||a.id||i;
    return `<tr onclick="showDetail(${uid})">
      <td style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--mu)">${n}</td>
      <td><span class="chip">${mod}</span></td>
      <td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${req}">${req}</td>
      <td style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--a);white-space:nowrap">${nom}</td>
      <td style="font-size:12px">${sol}</td>
      <td>${pr?bPrio(pr):'—'}</td>
      <td style="font-family:'IBM Plex Mono',monospace;font-size:10px">${fmtDate(fs_)}</td>
      <td style="font-family:'IBM Plex Mono',monospace;font-size:10px">${fmtDate(fe)}</td>
      <td style="text-align:center;font-size:12px">${td?td+'d':'—'}</td>
      <td style="text-align:center;font-size:12px;color:var(--a)">${imp?imp+'h/mes':'—'}</td>
      <td style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mu)">${ver||'—'}</td>
      <td style="font-size:11px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mu)" title="${ubi}">${ubi||'—'}</td>
      <td>${bStatus(st)}</td>
      <td style="font-size:11px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mu)" title="${nt}">${nt||'—'}</td>
      <td onclick="event.stopPropagation()" style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="editAuto(${uid})" title="Editar">✎</button>
      </td>
    </tr>`;
  }).join('')
  : `<tr><td colspan="15"><div class="empty"><div class="empty-ico">⚡</div><div class="empty-t">Sin automatizaciones</div><div class="empty-s">Registra la primera o sincroniza con Google Sheets</div></div></td></tr>`;
}

function showDetail(uid) {
  const a = allAutos.find(x=>(x.N||x.id||x.n)==uid||allAutos.indexOf(x)===uid-1);
  if (!a) return;
  document.getElementById('det-au-title').textContent = '⚡ ' + (a.NombreAutomatizacion||a.nom||'Detalle');
  document.getElementById('det-au-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <div class="kv"><span class="kk">N°</span><span style="font-family:'IBM Plex Mono',monospace">${a.N||'—'}</span></div>
        <div class="kv"><span class="kk">Módulo/Área</span><span class="chip">${a.ModuloArea||'—'}</span></div>
        <div class="kv"><span class="kk">Solicitante</span><strong>${a.Solicitante||'—'}</strong></div>
        <div class="kv"><span class="kk">Prioridad</span>${a.Prioridad?bPrio(a.Prioridad):'—'}</div>
        <div class="kv"><span class="kk">Status</span>${bStatus(a.Status||'')}</div>
        <div class="kv"><span class="kk">Versión</span><code style="font-size:11px;color:var(--a)">${a.Version||'—'}</code></div>
      </div>
      <div>
        <div class="kv"><span class="kk">F. Solicitud</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12px">${fmtDate(a.FechaSolicitud||'')}</span></div>
        <div class="kv"><span class="kk">F. Entrega</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12px">${fmtDate(a.FechaEntrega||'')}</span></div>
        <div class="kv"><span class="kk">Tiempo Dev.</span><span>${a.TiempoDesarrollo?a.TiempoDesarrollo+' días':'—'}</span></div>
        <div class="kv"><span class="kk">Impacto/Ahorro</span><span style="color:var(--a);font-weight:700">${a.ImpactoAhorro?a.ImpactoAhorro+'h/mes':'—'}</span></div>
        <div class="kv"><span class="kk">Ubicación Script</span><span style="font-size:11px;color:var(--mu)">${a.UbicacionScript||'—'}</span></div>
      </div>
    </div>
    <div style="margin-top:14px"><div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Requerimiento</div>
    <div style="background:var(--s2);border:1px solid var(--bd);border-radius:8px;padding:10px;font-size:12.5px;line-height:1.6">${a.Requerimiento||'—'}</div></div>
    ${a.Notas?`<div style="margin-top:10px"><div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Notas</div>
    <div style="background:rgba(255,209,102,.05);border:1px solid rgba(255,209,102,.15);border-radius:8px;padding:10px;font-size:12px;color:var(--mu)">${a.Notas}</div></div>`:''}`;
  document.getElementById('det-au-foot').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal('modal-det-au')">Cerrar</button>
    <button class="btn btn-primary" onclick="closeModal('modal-det-au');editAuto(${a.N||allAutos.indexOf(a)})">✎ Editar</button>`;
  openModal('modal-det-au');
}

function openAdd() {
  editingId = null;
  document.getElementById('modal-au-title').textContent = '⚡ Nueva Automatización';
  ['a-sol','a-req','a-nom','a-ver','a-tdev','a-imp','a-ubi','a-notas'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('a-fsol').value='';
  document.getElementById('a-fent').value='';
  document.getElementById('a-status').value='En desarrollo';
  document.getElementById('a-prio').value='Media';
  openModal('modal-auto');
}

function editAuto(uid) {
  const a = allAutos.find(x=>(x.N||x.id)==uid) || allAutos[uid-1];
  if (!a) return;
  editingId = a.N||uid;
  document.getElementById('modal-au-title').textContent = '✎ Editar Automatización';
  document.getElementById('a-modulo').value  = a.ModuloArea||'';
  document.getElementById('a-sol').value     = a.Solicitante||'';
  document.getElementById('a-req').value     = a.Requerimiento||'';
  document.getElementById('a-nom').value     = a.NombreAutomatizacion||'';
  document.getElementById('a-status').value  = a.Status||'En desarrollo';
  document.getElementById('a-prio').value    = a.Prioridad||'Media';
  document.getElementById('a-ver').value     = a.Version||'1.0';
  document.getElementById('a-fsol').value    = a.FechaSolicitud||'';
  document.getElementById('a-fent').value    = a.FechaEntrega||'';
  document.getElementById('a-tdev').value    = a.TiempoDesarrollo||'';
  document.getElementById('a-imp').value     = a.ImpactoAhorro||'';
  document.getElementById('a-ubi').value     = a.UbicacionScript||'';
  document.getElementById('a-notas').value   = a.Notas||'';
  openModal('modal-auto');
}

async function saveAuto() {
  const session = getSession();
  const nom = document.getElementById('a-nom').value.trim();
  if (!nom) return toast('e','Error','El nombre de la automatización es obligatorio');

  const n = editingId ? editingId : (allAutos.length + 1);
  const data = {
    N:                   n,
    ModuloArea:          document.getElementById('a-modulo').value,
    Requerimiento:       document.getElementById('a-req').value,
    NombreAutomatizacion:nom,
    Solicitante:         document.getElementById('a-sol').value,
    Prioridad:           document.getElementById('a-prio').value,
    FechaSolicitud:      document.getElementById('a-fsol').value,
    FechaEntrega:        document.getElementById('a-fent').value,
    TiempoDesarrollo:    document.getElementById('a-tdev').value,
    ImpactoAhorro:       document.getElementById('a-imp').value,
    Version:             document.getElementById('a-ver').value,
    UbicacionScript:     document.getElementById('a-ubi').value,
    Status:              document.getElementById('a-status').value,
    Notas:               document.getElementById('a-notas').value,
    FechaCreacion:       new Date().toISOString(),
    CreadoPor:           session?.name||'Admin'
  };

  if (editingId) {
    const idx = allAutos.findIndex(x=>(x.N||x.id)==editingId);
    if (idx>=0) allAutos[idx] = data;
    gsPost({ action:'update', sheet:'Automatizaciones', id:editingId, data });
    toast('s','Automatización actualizada', nom);
  } else {
    allAutos.push(data);
    DB.automatizaciones = allAutos;
    gsPost({ action:'append', sheet:'Automatizaciones', data });
    toast('s','Automatización registrada', nom);
  }

  DB.automatizaciones = allAutos;
  saveDB();
  closeModal('modal-auto');
  editingId = null;
  render();
}

async function loadFromGS() {
  if (!GS.url) return toast('w','Sin URL','Configura Google Sheets en Configuración');
  toast('i','Sincronizando...','');
  const ok = await syncAll();
  if (ok) { buildList(); render(); toast('s','Sincronizado',`${DB.automatizaciones.length} registros`); }
  else toast('e','Error de conexión','Revisa la URL del Web App');
}

function toggleMobile(){ document.getElementById('sidebar').classList.toggle('mobile-open'); document.getElementById('sidebar-overlay').classList.toggle('show'); }
function closeMobile(){ document.getElementById('sidebar').classList.remove('mobile-open'); document.getElementById('sidebar-overlay').classList.remove('show'); }
