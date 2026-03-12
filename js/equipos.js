const s = requireAuth();
let editingId = null;

if (s) {
  document.getElementById('user-avatar').textContent = s.name.substring(0,2).toUpperCase();
  if (GS.url) {
    syncAll().then(ok => { if (ok) { render(); toast('s','Datos sincronizados',''); } });
  } else render();
}

function render() {
  const q  = (document.getElementById('q-eq')?.value||'').toLowerCase();
  const fa = document.getElementById('f-area')?.value||'';
  const fe = document.getElementById('f-estado-eq')?.value||'';
  const fs = document.getElementById('f-so')?.value||'';
  const items = DB.equipos.filter(e => {
    const cod  = String(e.Codigo||'').toLowerCase();
    const usr  = String(e.Usuario||'').toLowerCase();
    const area = String(e.Area||'');
    const est  = String(e.Estado||'');
    const so   = String(e.SO||'');
    return (cod.includes(q)||usr.includes(q)||area.toLowerCase().includes(q)) &&
           (!fa||area===fa) && (!fe||est===fe) && (!fs||so===fs);
  });
  document.getElementById('tb-eq').innerHTML = items.length ? items.map(e => {
    const cod = e.Codigo||'—';
    const usr = e.Usuario||'LIBRE';
    const est = e.Estado||'—';
    return `<tr onclick="showDetail('${cod}')">
      <td><code style="color:var(--a);font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600">${cod}</code></td>
      <td><span class="chip">${e.Area||'—'}</span></td>
      <td style="font-size:12.5px;font-weight:${usr==='LIBRE'?'400':'600'};color:${usr==='LIBRE'?'var(--mu)':'var(--tx)'}">${usr}</td>
      <td style="font-size:11.5px">${e.SO||'—'}</td>
      <td style="text-align:center">${bSiNo(e.Cargador||'NO')}</td>
      <td style="text-align:center">${bSiNo(e.Mouse||'NO')}</td>
      <td style="text-align:center">${bSiNo(e.Teclado||'NO')}</td>
      <td style="text-align:center">${bSiNo(e.Audifonos||'NO')}</td>
      <td style="text-align:center">${bSiNo(e.Monitor||'NO')}</td>
      <td style="text-align:center">${bSiNo(e.Cooler||'NO')}</td>
      <td style="text-align:center">${bSiNo(e.MousePad||'NO')}</td>
      <td style="font-size:11px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.Procesador||'—'}</td>
      <td style="font-size:11px">${e.RAM||'—'}</td>
      <td style="font-size:11px">${e.Almacenamiento||'—'}</td>
      <td>${bEquipo(est)}</td>
      <td onclick="event.stopPropagation()">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="editEquipo('${cod}')" title="Editar">✎</button>
      </td>
    </tr>`;
  }).join('')
  : `<tr><td colspan="16"><div class="empty"><div class="empty-ico">💻</div><div class="empty-t">Sin equipos</div><div class="empty-s">Agrega equipos o sincroniza con Google Sheets</div></div></td></tr>`;
}

function showDetail(codigo) {
  const e = DB.equipos.find(x=>x.Codigo===codigo); if(!e) return;
  const hist = DB.historial.filter(h=>h.Codigo===codigo).sort((a,b)=>new Date(b.Fecha||0)-new Date(a.Fecha||0)).slice(0,10);
  document.getElementById('det-eq-title').textContent = '💻 ' + codigo;
  document.getElementById('det-eq-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Información</div>
        <div class="kv"><span class="kk">Código</span><code style="color:var(--a);font-size:12px">${e.Codigo}</code></div>
        <div class="kv"><span class="kk">Área</span><span class="chip">${e.Area||'—'}</span></div>
        <div class="kv"><span class="kk">Usuario</span><strong>${e.Usuario||'LIBRE'}</strong></div>
        <div class="kv"><span class="kk">SO</span><span>${e.SO||'—'}</span></div>
        <div class="kv"><span class="kk">Estado</span>${bEquipo(e.Estado||'')}</div>
        <div class="kv"><span class="kk">F. Asignación</span><span style="font-family:'IBM Plex Mono',monospace;font-size:11px">${fmtDate(e.FechaAsignacion||'')}</span></div>
        ${e.Notas?`<div class="kv"><span class="kk">Notas</span><span style="font-size:12px">${e.Notas}</span></div>`:''}
      </div>
      <div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Especificaciones</div>
        <div class="kv"><span class="kk">Procesador</span><span style="font-size:12px">${e.Procesador||'—'}</span></div>
        <div class="kv"><span class="kk">RAM</span><span>${e.RAM||'—'}</span></div>
        <div class="kv"><span class="kk">Almacenamiento</span><span>${e.Almacenamiento||'—'}</span></div>
      </div>
    </div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Accesorios</div>
    <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px">
      ${['Cargador','Mouse','Teclado','Audifonos','Monitor','Cooler','MousePad'].map(acc=>`
        <div style="display:flex;align-items:center;gap:5px;background:var(--s2);border:1px solid var(--bd);border-radius:7px;padding:5px 10px">
          <span style="font-size:11px;color:var(--mu)">${acc}</span>${bSiNo(e[acc]||'NO')}
        </div>`).join('')}
    </div>
    ${hist.length?`
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Historial de cambios</div>
      <div style="max-height:180px;overflow-y:auto">
        <table><thead><tr><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Por</th><th>Fecha</th></tr></thead>
        <tbody>${hist.map(h=>`<tr>
          <td style="font-size:11px">${h.CampoModificado||'—'}</td>
          <td style="font-size:11px;color:var(--a3)">${h.ValorAnterior||'—'}</td>
          <td style="font-size:11px;color:var(--a);font-weight:600">${h.ValorNuevo||'—'}</td>
          <td style="font-size:11px">${h.ModificadoPor||'—'}</td>
          <td style="font-family:'IBM Plex Mono',monospace;font-size:10px">${fmtDate(h.Fecha||'')}</td>
        </tr>`).join('')}</tbody></table>
      </div>`:''}`;
  document.getElementById('det-eq-foot').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal('modal-det-eq')">Cerrar</button>
    <button class="btn btn-primary" onclick="closeModal('modal-det-eq');editEquipo('${codigo}')">✎ Editar</button>`;
  openModal('modal-det-eq');
}

function openAdd() {
  editingId = null;
  document.getElementById('modal-eq-title').textContent = '💻 Agregar Equipo';
  document.getElementById('motivo-wrap').style.display = 'none';
  ['e-codigo','e-usuario','e-proc','e-ram','e-alma','e-notas','e-motivo'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('e-fecha').value='';
  openModal('modal-equipo');
}

function editEquipo(codigo) {
  const e = DB.equipos.find(x=>x.Codigo===codigo); if(!e) return;
  editingId = codigo;
  document.getElementById('modal-eq-title').textContent = '✎ Editar — ' + codigo;
  document.getElementById('motivo-wrap').style.display = 'block';
  document.getElementById('e-codigo').value   = e.Codigo||'';
  document.getElementById('e-area').value     = e.Area||'';
  document.getElementById('e-usuario').value  = e.Usuario||'';
  document.getElementById('e-cargador').value = e.Cargador||'SI';
  document.getElementById('e-mouse').value    = e.Mouse||'SI';
  document.getElementById('e-teclado').value  = e.Teclado||'SI';
  document.getElementById('e-audifonos').value= e.Audifonos||'NO';
  document.getElementById('e-monitor').value  = e.Monitor||'NO';
  document.getElementById('e-cooler').value   = e.Cooler||'SI';
  document.getElementById('e-mousepad').value = e.MousePad||'SI';
  document.getElementById('e-so').value       = e.SO||'Windows';
  document.getElementById('e-estado').value   = e.Estado||'Asignado';
  document.getElementById('e-proc').value     = e.Procesador||'';
  document.getElementById('e-ram').value      = e.RAM||'';
  document.getElementById('e-alma').value     = e.Almacenamiento||'';
  document.getElementById('e-fecha').value    = e.FechaAsignacion||'';
  document.getElementById('e-notas').value    = e.Notas||'';
  document.getElementById('e-motivo').value   = '';
  openModal('modal-equipo');
}

async function genCodigo() {
  const tipo = 'L';
  if (GS.url) {
    const r = await gsGet('getNextCodigo', { tipo });
    if (r?.codigo) { document.getElementById('e-codigo').value = r.codigo; return; }
  }
  const pref = localStorage.getItem('pref_lap')||'W-L';
  const nums = DB.equipos.map(e=>parseInt(String(e.Codigo||'').replace(pref,''))||0).filter(Boolean);
  const next = nums.length ? Math.max(...nums)+1 : 1;
  document.getElementById('e-codigo').value = pref + String(next).padStart(3,'0');
}

async function saveEquipo() {
  const session = getSession();
  const codigo = document.getElementById('e-codigo').value.trim();
  if (!codigo) return toast('e','Error','El código es obligatorio');
  const usuario = document.getElementById('e-usuario').value.trim();
  if (!usuario) return toast('e','Error','Ingresa el usuario o escribe LIBRE');

  const data = {
    Codigo:         codigo,
    Area:           document.getElementById('e-area').value,
    Usuario:        usuario,
    Cargador:       document.getElementById('e-cargador').value,
    Mouse:          document.getElementById('e-mouse').value,
    Teclado:        document.getElementById('e-teclado').value,
    Audifonos:      document.getElementById('e-audifonos').value,
    Monitor:        document.getElementById('e-monitor').value,
    SO:             document.getElementById('e-so').value,
    Cooler:         document.getElementById('e-cooler').value,
    MousePad:       document.getElementById('e-mousepad').value,
    Procesador:     document.getElementById('e-proc').value,
    RAM:            document.getElementById('e-ram').value,
    Almacenamiento: document.getElementById('e-alma').value,
    Estado:         document.getElementById('e-estado').value,
    FechaAsignacion:document.getElementById('e-fecha').value,
    Notas:          document.getElementById('e-notas').value,
    FechaCreacion:  new Date().toISOString()
  };

  if (editingId) {
    const old = DB.equipos.find(e=>e.Codigo===editingId)||{};
    const motivo = document.getElementById('e-motivo').value.trim();
    const campos = ['Area','Usuario','Estado','Cargador','Mouse','Teclado','Audifonos','Monitor','Cooler','MousePad','SO'];
    campos.forEach(campo => {
      const vOld = String(old[campo]||'');
      const vNew = String(data[campo]||'');
      if (vOld !== vNew) {
        const h = {
          ID: Date.now()+'_'+campo, Codigo: codigo, Area: data.Area,
          UsuarioAnterior: old.Usuario||'', UsuarioNuevo: data.Usuario,
          CampoModificado: campo, ValorAnterior: vOld, ValorNuevo: vNew,
          ModificadoPor: session?.name||'Admin',
          Fecha: new Date().toISOString(), Motivo: motivo
        };
        DB.historial.push(h);
        gsPost({ action:'historial', sheet:'Historial', data:h });
      }
    });
    const idx = DB.equipos.findIndex(e=>e.Codigo===editingId);
    if (idx>=0) DB.equipos[idx] = data;
    gsPost({ action:'update', sheet:'Equipos', id:editingId, data });
    toast('s','Equipo actualizado', codigo);
  } else {
    if (DB.equipos.find(e=>e.Codigo===codigo)) return toast('e','Código duplicado','Ya existe un equipo con ese código');
    DB.equipos.push(data);
    gsPost({ action:'append', sheet:'Equipos', data });
    toast('s','Equipo agregado', codigo);
  }

  saveDB(); closeModal('modal-equipo');
  editingId = null; render();
}

async function loadFromGS() {
  if (!GS.url) return toast('w','Sin URL','Ve a Configuración y agrega la URL del Web App');
  toast('i','Sincronizando...','');
  const ok = await syncAll();
  if (ok) { render(); toast('s','Sincronizado',`${DB.equipos.length} equipos cargados`); }
  else toast('e','Error','No se pudo conectar');
}

function toggleMobile(){ document.getElementById('sidebar').classList.toggle('mobile-open'); document.getElementById('sidebar-overlay').classList.toggle('show'); }
function closeMobile(){ document.getElementById('sidebar').classList.remove('mobile-open'); document.getElementById('sidebar-overlay').classList.remove('show'); }
