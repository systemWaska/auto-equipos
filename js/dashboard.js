const s=requireAuth();
if(s){
  document.getElementById('user-avatar').textContent=s.name.substring(0,2).toUpperCase();
  function render(){
    const autos=DB.automatizaciones; const equips=DB.equipos;
    const libres=equips.filter(e=>String(e.Estado||'').toLowerCase()==='libre').length;
    const mant=equips.filter(e=>String(e.Estado||'').toLowerCase()==='mantenimiento').length;
    const fin=autos.filter(a=>a.Status==='Finalizado').length;
    const enDev=autos.filter(a=>['en desarrollo','en curso','mantenimiento activo'].includes(String(a.Status||'').toLowerCase())).length;
    document.getElementById('st-eq').textContent=equips.length;
    document.getElementById('st-eq-sub').textContent=mant+' en mantenimiento';
    document.getElementById('st-lib').textContent=libres;
    document.getElementById('st-au').textContent=autos.length;
    document.getElementById('st-au-sub').textContent=fin+' finalizadas';
    document.getElementById('st-dev').textContent=enDev;
    document.getElementById('tb-autos').innerHTML=autos.slice(-6).reverse().map(a=>`
      <tr onclick="window.location='automations.html'">
        <td style="font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.NombreAutomatizacion||'—'}</td>
        <td><span class="chip">${a.ModuloArea||'—'}</span></td>
        <td>${bStatus(a.Status||'')}</td>
      </tr>`).join('')||'<tr><td colspan="3" style="text-align:center;color:var(--mu);padding:20px;font-size:12px">Sin datos — <a href="config.html" style="color:var(--a)">Sincronizar GS</a></td></tr>';
    document.getElementById('tb-mant').innerHTML=equips.filter(e=>String(e.Estado||'').toLowerCase()==='mantenimiento').map(e=>`
      <tr onclick="window.location='equipos.html'">
        <td><code style="font-size:11px;color:var(--a)">${e.Codigo||'—'}</code></td>
        <td><span class="chip">${e.Area||'—'}</span></td>
        <td style="font-size:12px">${e.Usuario||'—'}</td>
      </tr>`).join('')||'<tr><td colspan="3" style="text-align:center;color:var(--a);padding:16px;font-size:12px">Sin equipos en mantenimiento ✓</td></tr>';
    const byArea={};
    autos.forEach(a=>{const k=a.ModuloArea||'Sin área';byArea[k]=(byArea[k]||0)+1;});
    const maxA=Math.max(...Object.values(byArea),1);
    document.getElementById('chart-area').innerHTML=Object.entries(byArea).sort((a,b)=>b[1]-a[1]).map(([area,n])=>`
      <div class="bar-row"><div class="bar-top"><span>${area}</span><span>${n}</span></div>
      <div class="bar-bg"><div class="bar-fill" style="width:${n/maxA*100}%"></div></div></div>`).join('')||'<p style="color:var(--mu);font-size:12px">Sin datos</p>';
    const byS={};
    autos.forEach(a=>{const k=a.Status||'Sin status';byS[k]=(byS[k]||0)+1;});
    const maxS=Math.max(...Object.values(byS),1);
    document.getElementById('chart-status').innerHTML=Object.entries(byS).sort((a,b)=>b[1]-a[1]).map(([st,n])=>`
      <div class="bar-row"><div class="bar-top"><span>${bStatus(st)}</span><span>${n}</span></div>
      <div class="bar-bg"><div class="bar-fill p" style="width:${n/maxS*100}%"></div></div></div>`).join('')||'<p style="color:var(--mu);font-size:12px">Sin datos</p>';
  }
  render();
  if(GS.url){syncAll().then(ok=>{if(ok){render();toast('s','Datos sincronizados','');}});}
}
function toggleMobile(){document.getElementById('sidebar').classList.toggle('mobile-open');document.getElementById('sidebar-overlay').classList.toggle('show');}
function closeMobile(){document.getElementById('sidebar').classList.remove('mobile-open');document.getElementById('sidebar-overlay').classList.remove('show');}
