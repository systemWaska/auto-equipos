const s = requireAuth();
if (s) {
  document.getElementById('user-avatar').textContent = s.name.substring(0,2).toUpperCase();
  if (GS.url) {
    syncAll().then(ok => { if (ok) render(); });
  } else render();
}

function render() {
  const q     = (document.getElementById('q-hist')?.value||'').toLowerCase();
  const fc    = document.getElementById('f-campo')?.value||'';
  const desde = document.getElementById('f-desde')?.value||'';
  const hasta = document.getElementById('f-hasta')?.value||'';

  let items = DB.historial.filter(h => {
    const cod  = String(h.Codigo||h.codigo||'').toLowerCase();
    const usr  = String(h.UsuarioNuevo||h.usuarionuevo||'').toLowerCase();
    const campo= String(h.CampoModificado||h.campo||'');
    const fecha= String(h.Fecha||h.fecha||'').split('T')[0];
    return (cod.includes(q)||usr.includes(q)||campo.toLowerCase().includes(q)) &&
           (!fc||campo===fc) &&
           (!desde||fecha>=desde) &&
           (!hasta||fecha<=hasta);
  }).sort((a,b)=>new Date(b.Fecha||b.fecha||0)-new Date(a.Fecha||a.fecha||0));

  document.getElementById('hist-count').textContent = `${items.length} registro${items.length!==1?'s':''} encontrado${items.length!==1?'s':''}`;

  document.getElementById('tb-hist').innerHTML = items.length ? items.map(h => {
    const cod   = h.Codigo||h.codigo||'—';
    const area  = h.Area||h.area||'—';
    const uOld  = h.UsuarioAnterior||h.usuarioanterior||'—';
    const uNew  = h.UsuarioNuevo||h.usuarionuevo||'—';
    const campo = h.CampoModificado||h.campo||'—';
    const vOld  = h.ValorAnterior||h.valoranterior||'—';
    const vNew  = h.ValorNuevo||h.valornuevo||'—';
    const mod   = h.ModificadoPor||h.modificadopor||'—';
    const fecha = h.Fecha||h.fecha||'';
    const mot   = h.Motivo||h.motivo||'—';
    const changed = vOld !== vNew;
    return `<tr>
      <td><code style="color:var(--a);font-family:'IBM Plex Mono',monospace;font-size:11px">${cod}</code></td>
      <td><span class="chip">${area}</span></td>
      <td style="font-size:12px;color:var(--mu)">${uOld}</td>
      <td style="font-size:12px;font-weight:600">${uNew}</td>
      <td><span class="chip" style="background:rgba(124,111,247,.1);border-color:rgba(124,111,247,.2);color:var(--a2)">${campo}</span></td>
      <td style="font-size:12px;color:var(--a3)">${changed ? vOld : '—'}</td>
      <td style="font-size:12px;color:var(--a);font-weight:600">${changed ? vNew : '—'}</td>
      <td style="font-size:12px">${mod}</td>
      <td style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--mu);white-space:nowrap">${fmtDate(fecha)}</td>
      <td style="font-size:11px;color:var(--mu);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${mot}">${mot}</td>
    </tr>`;
  }).join('')
  : `<tr><td colspan="10"><div class="empty"><div class="empty-ico">📋</div><div class="empty-t">Sin registros</div><div class="empty-s">El historial se genera automáticamente al editar equipos</div></div></td></tr>`;
}

function exportCSV() {
  const headers = ['Codigo','Area','UsuarioAnterior','UsuarioNuevo','Campo','ValorAnterior','ValorNuevo','ModificadoPor','Fecha','Motivo'];
  const rows = DB.historial.map(h => headers.map(k => `"${h[k]||''}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
  a.download = 'historial-equipos-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  toast('i','CSV exportado','');
}

async function loadFromGS() {
  if (!GS.url) return toast('w','Sin URL','Configura Google Sheets en Configuración');
  const ok = await syncAll();
  if (ok) { render(); toast('s','Sincronizado',`${DB.historial.length} registros`); }
  else toast('e','Error','Revisa la conexión');
}

function toggleMobile(){ document.getElementById('sidebar').classList.toggle('mobile-open'); document.getElementById('sidebar-overlay').classList.toggle('show'); }
function closeMobile(){ document.getElementById('sidebar').classList.remove('mobile-open'); document.getElementById('sidebar-overlay').classList.remove('show'); }
