/* ============================================================
   IT HUB — app.js
   ============================================================ */

// ============================================================
// DATA STORE (local, se sincroniza con Google Sheets)
// ============================================================
const DB = {
  equipos: [],
  reservas: [],
  automatizaciones: []
};

let selectedDay = null;
const GS_CONFIG = {
  url: localStorage.getItem('gs_url') || '',
  orgName: localStorage.getItem('gs_org') || 'Mi Empresa',
  user: localStorage.getItem('gs_user') || 'Admin TI',
  area: localStorage.getItem('gs_area') || 'Sistemas & Redes'
};

// ============================================================
// NAVIGATION
// ============================================================
const pageTitles = {
  dashboard: 'Dashboard',
  catalogo: 'Catálogo de Equipos',
  reservas: 'Reservas',
  automations: 'Automatizaciones',
  roi: 'ROI & Métricas',
  config: 'Configuración'
};

function navigate(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('page-title').textContent = pageTitles[page];
  if (el) el.classList.add('active');
  renderPage(page);
}

function renderPage(page) {
  const renders = {
    dashboard: renderDashboard,
    catalogo: renderCatalogo,
    reservas: renderReservas,
    automations: renderAutos,
    roi: renderROI
  };
  if (renders[page]) renders[page]();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const activos = DB.equipos.filter(e => e.estado !== 'Mantenimiento').length;
  const mantenimiento = DB.equipos.filter(e => e.estado === 'Mantenimiento').length;
  const pendientes = DB.reservas.filter(r => r.estado === 'Pendiente').length;
  const totalAhorro = DB.automatizaciones.reduce((s, a) => s + (parseFloat(a.ahorro) || 0), 0);

  document.getElementById('st-equipos').textContent = activos;
  document.getElementById('st-equipos-sub').textContent = `${mantenimiento} en mantenimiento`;
  document.getElementById('st-reservas-hoy').textContent = pendientes;
  document.getElementById('st-autos').textContent = DB.automatizaciones.length;
  document.getElementById('st-horas').textContent = Math.round(totalAhorro * 12) + 'h';
  document.getElementById('badge-auto').textContent = DB.automatizaciones.length;
  document.getElementById('badge-reservas').textContent = pendientes;

  // Timeline
  const items = [
    ...DB.reservas.map(r => ({ date: r.inicio, text: `Reserva: ${r.equipo}`, meta: `${r.solicitante} · ${r.area}`, dot: '' })),
    ...DB.automatizaciones.map(a => ({ date: a.fecha, text: `Auto: ${a.nombre}`, meta: `${a.area} · ${a.herramienta}`, dot: 'purple' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  document.getElementById('timeline-activity').innerHTML = items.length
    ? items.map(i => `
        <div class="tl-item">
          <div class="tl-dot ${i.dot}"></div>
          <div class="tl-date">${formatDate(i.date)}</div>
          <div class="tl-content">${i.text}</div>
          <div class="tl-meta">${i.meta}</div>
        </div>`).join('')
    : '<p style="color:var(--muted);font-size:13px">Sin actividad registrada.</p>';

  document.getElementById('table-dashboard-equipos').innerHTML = DB.equipos.slice(0, 6).map(e => `
    <tr>
      <td><strong>${e.nombre}</strong><br><span style="color:var(--muted);font-size:12px">${e.modelo || ''}</span></td>
      <td style="font-size:12.5px">${e.usuario || '—'}</td>
      <td>${badgeEquipo(e.estado)}</td>
    </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px">Sin equipos registrados</td></tr>';
}

// ============================================================
// CATÁLOGO
// ============================================================
const tipoIconos = {
  Laptop: '💻', Monitor: '🖥️', Teléfono: '📱', Tablet: '📟',
  Proyector: '📽️', Impresora: '🖨️', Switch: '🔀', Router: '📡', Servidor: '🗄️'
};

function renderCatalogo() {
  const q = (document.getElementById('search-catalogo')?.value || '').toLowerCase();
  const tipo = document.getElementById('filter-tipo')?.value || '';
  const estado = document.getElementById('filter-estado-cat')?.value || '';

  const items = DB.equipos.filter(e =>
    (e.nombre.toLowerCase().includes(q) || (e.modelo || '').toLowerCase().includes(q)) &&
    (!tipo || e.tipo === tipo) &&
    (!estado || e.estado === estado)
  );

  document.getElementById('equip-grid').innerHTML = items.length
    ? items.map(e => `
        <div class="equip-card ${e.estado === 'Mantenimiento' ? 'unavailable' : ''}" onclick="showEquipoDetail(${e.id})">
          <div class="equip-header">
            <div class="equip-icon">${tipoIconos[e.tipo] || '⚙️'}</div>
            ${badgeEquipo(e.estado)}
          </div>
          <div class="equip-name">${e.nombre}</div>
          <div class="equip-model">${e.modelo || ''} · ${e.serie || ''}</div>
          <div class="equip-meta">
            <div class="equip-meta-item"><label>Tipo</label><span>${e.tipo}</span></div>
            <div class="equip-meta-item"><label>Año</label><span>${e.anio || '—'}</span></div>
            <div class="equip-meta-item"><label>Ubicación</label><span>${e.ubicacion || '—'}</span></div>
            <div class="equip-meta-item"><label>En uso por</label><span>${e.usuario || '—'}</span></div>
          </div>
          ${e.estado === 'Disponible'
            ? `<button class="btn btn-primary" style="width:100%;margin-top:12px;font-size:12px"
                 onclick="event.stopPropagation();openReservaEquipo(${e.id})">Reservar</button>`
            : ''}
        </div>`).join('')
    : `<div class="empty-state" style="grid-column:1/-1">
         <div class="empty-icon">◫</div>
         <div class="empty-title">Sin equipos</div>
         <div class="empty-sub">No se encontraron equipos con esos filtros</div>
       </div>`;
}

function showEquipoDetail(id) {
  const e = DB.equipos.find(x => x.id === id);
  if (!e) return;
  document.getElementById('detail-title').textContent = e.nombre;
  document.getElementById('detail-body').innerHTML = `
    <div style="font-size:40px;margin-bottom:16px">${tipoIconos[e.tipo] || '⚙️'}</div>
    <div class="kv-row"><span class="kv-key">Tipo</span><span>${e.tipo}</span></div>
    <div class="kv-row"><span class="kv-key">Modelo</span><span>${e.modelo || '—'}</span></div>
    <div class="kv-row"><span class="kv-key">Serie</span>
      <span style="font-family:'IBM Plex Mono',monospace;color:var(--accent)">${e.serie || '—'}</span></div>
    <div class="kv-row"><span class="kv-key">Año</span><span>${e.anio || '—'}</span></div>
    <div class="kv-row"><span class="kv-key">Ubicación</span><span>${e.ubicacion || '—'}</span></div>
    <div class="kv-row"><span class="kv-key">Estado</span><span>${badgeEquipo(e.estado)}</span></div>
    <div class="kv-row"><span class="kv-key">En uso por</span><span>${e.usuario || '—'}</span></div>
    <div class="kv-row" style="border:none"><span class="kv-key">Especificaciones</span></div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;
                font-size:12.5px;color:var(--muted);margin-top:8px">${e.specs || 'Sin especificaciones'}</div>`;
  document.getElementById('detail-footer').innerHTML = e.estado === 'Disponible'
    ? `<button class="btn btn-ghost" onclick="closeModal('modal-detail')">Cerrar</button>
       <button class="btn btn-primary" onclick="closeModal('modal-detail');openReservaEquipo(${e.id})">Reservar equipo</button>`
    : `<button class="btn btn-ghost" onclick="closeModal('modal-detail')">Cerrar</button>`;
  openModal('modal-detail');
}

function openReservaEquipo(id) {
  populateEquipoSelect();
  document.getElementById('r-equipo').value = id;
  openModal('modal-reserva');
}

// ============================================================
// RESERVAS
// ============================================================
function renderCalStrip() {
  const strip = document.getElementById('cal-strip');
  if (!strip) return;
  const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sel = selectedDay || today.toISOString().split('T')[0];
  let html = '';
  for (let i = -1; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    html += `
      <div class="cal-day ${iso === sel ? 'selected' : ''}" onclick="selectDay('${iso}')">
        <div class="cal-day-num">${d.getDate()}</div>
        <div class="cal-day-label">${days[d.getDay()]}</div>
      </div>`;
  }
  strip.innerHTML = html;
}

function selectDay(iso) {
  selectedDay = iso;
  renderCalStrip();
  renderReservas();
}

function renderReservas() {
  renderCalStrip();
  const q = (document.getElementById('search-reservas')?.value || '').toLowerCase();
  const estado = document.getElementById('filter-estado-res')?.value || '';

  const items = DB.reservas.filter(r =>
    (r.equipo.toLowerCase().includes(q) || r.solicitante.toLowerCase().includes(q)) &&
    (!estado || r.estado === estado)
  );

  document.getElementById('table-reservas').innerHTML = items.length
    ? items.map(r => `
        <tr onclick="showReservaDetail(${r.id})">
          <td><strong>${r.equipo}</strong></td>
          <td>${r.solicitante}</td>
          <td><span class="chip">${r.area}</span></td>
          <td style="font-family:'IBM Plex Mono',monospace;font-size:12px">${formatDate(r.inicio)}</td>
          <td style="font-family:'IBM Plex Mono',monospace;font-size:12px">${formatDate(r.fin)}</td>
          <td>${badgeReserva(r.estado)}</td>
          <td onclick="event.stopPropagation()">
            ${r.estado === 'Pendiente'
              ? `<button class="btn btn-primary" style="padding:4px 10px;font-size:11px" onclick="aprobarReserva(${r.id})">✓ Aprobar</button>
                 <button class="btn btn-danger" style="padding:4px 10px;font-size:11px;margin-left:4px" onclick="rechazarReserva(${r.id})">✕ Rechazar</button>`
              : r.estado === 'Aprobada'
              ? `<button class="btn btn-ghost" style="padding:4px 10px;font-size:11px" onclick="devolver(${r.id})">↩ Devolver</button>`
              : '—'}
          </td>
        </tr>`).join('')
    : `<tr><td colspan="7"><div class="empty-state">
         <div class="empty-icon">◷</div>
         <div class="empty-title">Sin reservas</div>
         <div class="empty-sub">No hay reservas que coincidan</div>
       </div></td></tr>`;
}

function showReservaDetail(id) {
  const r = DB.reservas.find(x => x.id === id);
  if (!r) return;
  document.getElementById('detail-title').textContent = `Reserva #${r.id}`;
  document.getElementById('detail-body').innerHTML = `
    <div class="kv-row"><span class="kv-key">Equipo</span><strong>${r.equipo}</strong></div>
    <div class="kv-row"><span class="kv-key">Solicitante</span><span>${r.solicitante}</span></div>
    <div class="kv-row"><span class="kv-key">Área</span><span>${r.area}</span></div>
    <div class="kv-row"><span class="kv-key">Inicio</span><span>${formatDate(r.inicio)} ${r.hora || ''}</span></div>
    <div class="kv-row"><span class="kv-key">Devolución</span><span>${formatDate(r.fin)}</span></div>
    <div class="kv-row"><span class="kv-key">Prioridad</span><span>${r.prioridad}</span></div>
    <div class="kv-row"><span class="kv-key">Estado</span><span>${badgeReserva(r.estado)}</span></div>
    <div style="margin-top:12px"><div class="detail-title">Propósito</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;
                padding:12px;font-size:13px;margin-top:6px">${r.proposito || '—'}</div></div>`;
  document.getElementById('detail-footer').innerHTML =
    `<button class="btn btn-ghost" onclick="closeModal('modal-detail')">Cerrar</button>`;
  openModal('modal-detail');
}

function aprobarReserva(id) {
  const r = DB.reservas.find(x => x.id === id);
  r.estado = 'Aprobada';
  const e = DB.equipos.find(x => x.id === r.equipoId);
  if (e) { e.estado = 'En uso'; e.usuario = r.solicitante; }
  renderReservas();
  syncToGS('Reservas', r);
  toast('success', 'Reserva aprobada', `${r.equipo} → ${r.solicitante}`);
}

function rechazarReserva(id) {
  const r = DB.reservas.find(x => x.id === id);
  r.estado = 'Rechazada';
  renderReservas();
  toast('error', 'Reserva rechazada', r.equipo);
}

function devolver(id) {
  const r = DB.reservas.find(x => x.id === id);
  r.estado = 'Devuelta';
  const e = DB.equipos.find(x => x.id === r.equipoId);
  if (e) { e.estado = 'Disponible'; delete e.usuario; }
  renderReservas();
  syncToGS('Reservas', r);
  toast('info', 'Equipo devuelto', `${r.equipo} está nuevamente disponible`);
}

// ============================================================
// AUTOMATIZACIONES
// ============================================================
const complejidadLabel = ['', 'Muy simple', 'Simple', 'Media', 'Compleja', 'Muy compleja'];

function renderAutos() {
  const q = (document.getElementById('search-autos')?.value || '').toLowerCase();
  const area = document.getElementById('filter-area-auto')?.value || '';
  const herramienta = document.getElementById('filter-herramienta')?.value || '';

  const items = DB.automatizaciones.filter(a =>
    (a.nombre.toLowerCase().includes(q) || a.descripcion.toLowerCase().includes(q)) &&
    (!area || a.area === area) &&
    (!herramienta || a.herramienta === herramienta)
  );

  document.getElementById('auto-grid').innerHTML = items.length
    ? items.map(a => {
        const roi12 = a.devHoras > 0
          ? Math.round((parseFloat(a.ahorro) * 12 / parseFloat(a.devHoras)) * 10) / 10
          : '∞';
        const comp = parseInt(a.complejidad) || 0;
        return `
          <div class="auto-card" onclick="showAutoDetail(${a.id})">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${badgeAuto(a.estado)}
                <span class="chip">${a.herramienta}</span>
              </div>
              <span class="chip">${a.area}</span>
            </div>
            <div class="auto-title">${a.nombre}</div>
            <div class="auto-desc">${a.descripcion}</div>
            <div class="auto-metrics">
              <div class="metric-box">
                <div class="metric-label">Ahorro/mes</div>
                <div class="metric-value">${a.ahorro}h</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Dev. invertido</div>
                <div class="metric-value purple">${a.devHoras}h</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">ROI 12 meses</div>
                <div class="metric-value yellow">${roi12}x</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Beneficiados</div>
                <div class="metric-value red">${a.personas} pers.</div>
              </div>
            </div>
            <div class="auto-footer">
              <span style="font-size:11px;color:var(--muted)">${formatDate(a.fecha)}</span>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:11px;color:var(--muted)">Complejidad:</span>
                ${[1,2,3,4,5].map(i =>
                  `<div style="width:6px;height:6px;border-radius:50%;background:${i <= comp ? 'var(--accent2)' : 'var(--border)'}"></div>`
                ).join('')}
              </div>
            </div>
          </div>`;
      }).join('')
    : `<div class="empty-state" style="grid-column:1/-1">
         <div class="empty-icon">⚡</div>
         <div class="empty-title">Sin automatizaciones</div>
         <div class="empty-sub">Registra tu primera automatización</div>
       </div>`;
}

function showAutoDetail(id) {
  const a = DB.automatizaciones.find(x => x.id === id);
  if (!a) return;
  const roi12 = a.devHoras > 0
    ? Math.round((parseFloat(a.ahorro) * 12 / parseFloat(a.devHoras)) * 10) / 10
    : '∞';
  const afectos = (a.afecto || '').split(',').filter(Boolean);

  document.getElementById('detail-title').textContent = a.nombre;
  document.getElementById('detail-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px">
        <div style="font-size:22px;font-weight:800;color:var(--accent);font-family:'Syne',sans-serif">${a.ahorro}h</div>
        <div style="font-size:10px;color:var(--muted)">Ahorro/mes</div>
      </div>
      <div style="text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px">
        <div style="font-size:22px;font-weight:800;color:var(--accent2);font-family:'Syne',sans-serif">${roi12}x</div>
        <div style="font-size:10px;color:var(--muted)">ROI 12m</div>
      </div>
      <div style="text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px">
        <div style="font-size:22px;font-weight:800;color:var(--accent4);font-family:'Syne',sans-serif">${a.personas}</div>
        <div style="font-size:10px;color:var(--muted)">Personas</div>
      </div>
    </div>
    <div class="kv-row"><span class="kv-key">Área</span><span>${a.area}</span></div>
    <div class="kv-row"><span class="kv-key">Herramienta</span><span>${a.herramienta}</span></div>
    <div class="kv-row"><span class="kv-key">Fecha</span><span>${formatDate(a.fecha)}</span></div>
    <div class="kv-row"><span class="kv-key">Estado</span><span>${badgeAuto(a.estado)}</span></div>
    <div class="kv-row"><span class="kv-key">Dev. invertido</span><span>${a.devHoras}h</span></div>
    <div class="kv-row"><span class="kv-key">Complejidad</span><span>${complejidadLabel[a.complejidad] || '—'}</span></div>
    <div style="margin-top:14px">
      <div class="detail-title">Procesos afectados</div>
      <div class="impact-tags">${afectos.map(t => `<span class="chip">${t.trim()}</span>`).join('') || '—'}</div>
    </div>
    <div style="margin-top:14px">
      <div class="detail-title">¿Qué mejoró?</div>
      <div style="background:rgba(0,229,160,0.06);border:1px solid rgba(0,229,160,0.15);border-radius:8px;
                  padding:12px;font-size:13px;line-height:1.6;margin-top:6px">${a.mejoro || '—'}</div>
    </div>`;
  document.getElementById('detail-footer').innerHTML =
    `<button class="btn btn-ghost" onclick="closeModal('modal-detail')">Cerrar</button>`;
  openModal('modal-detail');
}

// ============================================================
// ROI
// ============================================================
function renderROI() {
  const totalAhorro = DB.automatizaciones.reduce((s, a) => s + (parseFloat(a.ahorro) || 0), 0);
  const totalDev = DB.automatizaciones.reduce((s, a) => s + (parseFloat(a.devHoras) || 0), 0);
  const totalPersonas = DB.automatizaciones.reduce((s, a) => s + (parseInt(a.personas) || 0), 0);
  const roi12 = totalDev > 0 ? Math.round((totalAhorro * 12 / totalDev) * 10) / 10 : 0;

  document.getElementById('roi-summary').innerHTML = `
    <div class="roi-item"><div class="roi-value">${totalAhorro}h</div><div class="roi-label">Ahorro mensual total</div></div>
    <div class="roi-item"><div class="roi-value">${roi12}x</div><div class="roi-label">ROI promedio (12 meses)</div></div>
    <div class="roi-item"><div class="roi-value">${totalPersonas}</div><div class="roi-label">Personas beneficiadas</div></div>`;

  const sorted = [...DB.automatizaciones].sort((a, b) => parseFloat(b.ahorro) - parseFloat(a.ahorro));
  const maxAhorro = parseFloat(sorted[0]?.ahorro) || 1;

  document.getElementById('roi-top-list').innerHTML = sorted.map(a => `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:13px;font-weight:600">${a.nombre}</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--accent)">${a.ahorro}h/mes</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="progress-bar" style="flex:1">
          <div class="progress-fill" style="width:${(parseFloat(a.ahorro) / maxAhorro) * 100}%"></div>
        </div>
        <span style="font-size:11px;color:var(--muted);min-width:60px">${a.area}</span>
      </div>
    </div>`).join('') || '<p style="color:var(--muted);font-size:13px">Sin datos</p>';

  const byArea = {};
  DB.automatizaciones.forEach(a => {
    byArea[a.area] = (byArea[a.area] || 0) + (parseFloat(a.ahorro) || 0);
  });
  const maxArea = Math.max(...Object.values(byArea), 1);

  document.getElementById('roi-by-area').innerHTML = Object.entries(byArea)
    .sort((a, b) => b[1] - a[1])
    .map(([area, h]) => `
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:13px">${area}</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--accent2)">${h}h/mes</span>
        </div>
        <div class="progress-bar">
          <div style="height:100%;background:linear-gradient(90deg,var(--accent2),var(--accent));
                      border-radius:4px;width:${(h / maxArea) * 100}%;transition:width .5s"></div>
        </div>
      </div>`).join('') || '<p style="color:var(--muted);font-size:13px">Sin datos</p>';
}

// ============================================================
// SAVE FUNCTIONS
// ============================================================
function saveReserva() {
  const equipoId = parseInt(document.getElementById('r-equipo').value);
  const equipo = DB.equipos.find(e => e.id === equipoId);
  if (!equipo) return toast('error', 'Error', 'Selecciona un equipo');
  const solicitante = document.getElementById('r-solicitante').value.trim();
  if (!solicitante) return toast('error', 'Error', 'Ingresa el nombre del solicitante');

  const nueva = {
    id: Date.now(),
    equipo: equipo.nombre,
    equipoId,
    solicitante,
    area: document.getElementById('r-area').value,
    inicio: document.getElementById('r-inicio').value,
    fin: document.getElementById('r-fin').value,
    hora: document.getElementById('r-hora').value,
    prioridad: document.getElementById('r-prioridad').value,
    estado: 'Pendiente',
    proposito: document.getElementById('r-proposito').value,
    fechaCreacion: new Date().toISOString()
  };

  DB.reservas.push(nueva);
  closeModal('modal-reserva');
  clearForm(['r-solicitante', 'r-proposito']);
  syncToGS('Reservas', nueva);
  toast('success', 'Reserva creada', `${equipo.nombre} para ${solicitante}`);
  renderDashboard();
}

function saveAuto() {
  const nombre = document.getElementById('a-nombre').value.trim();
  if (!nombre) return toast('error', 'Error', 'Ingresa el nombre de la automatización');

  const nueva = {
    id: Date.now(),
    nombre,
    descripcion: document.getElementById('a-descripcion').value,
    area: document.getElementById('a-area').value,
    herramienta: document.getElementById('a-herramienta').value,
    devHoras: parseFloat(document.getElementById('a-dev-horas').value) || 0,
    ahorro: parseFloat(document.getElementById('a-ahorro').value) || 0,
    fecha: document.getElementById('a-fecha').value,
    estado: document.getElementById('a-estado').value,
    afecto: document.getElementById('a-afecto').value,
    mejoro: document.getElementById('a-mejoro').value,
    complejidad: parseInt(document.getElementById('a-complejidad').value),
    personas: parseInt(document.getElementById('a-personas').value) || 1,
    creadoPor: GS_CONFIG.user,
    fechaCreacion: new Date().toISOString()
  };

  DB.automatizaciones.push(nueva);
  closeModal('modal-auto');
  clearForm(['a-nombre', 'a-descripcion', 'a-afecto', 'a-mejoro', 'a-dev-horas', 'a-ahorro', 'a-personas']);
  syncToGS('Automatizaciones', nueva);
  toast('success', '⚡ Automatización registrada', nueva.nombre);
  document.getElementById('badge-auto').textContent = DB.automatizaciones.length;
  renderAutos();
}

function saveEquipo() {
  const nombre = document.getElementById('e-nombre').value.trim();
  if (!nombre) return toast('error', 'Error', 'Ingresa el nombre del equipo');

  const nuevo = {
    id: Date.now(),
    nombre,
    tipo: document.getElementById('e-tipo').value,
    modelo: document.getElementById('e-modelo').value,
    serie: document.getElementById('e-serie').value,
    ubicacion: document.getElementById('e-ubicacion').value,
    anio: parseInt(document.getElementById('e-anio').value) || '',
    specs: document.getElementById('e-specs').value,
    estado: 'Disponible',
    fechaCreacion: new Date().toISOString()
  };

  DB.equipos.push(nuevo);
  closeModal('modal-equipo');
  clearForm(['e-nombre', 'e-modelo', 'e-serie', 'e-ubicacion', 'e-anio', 'e-specs']);
  syncToGS('Equipos', nuevo);
  toast('success', 'Equipo agregado', nuevo.nombre);
  renderCatalogo();
}

function saveConfig() {
  GS_CONFIG.url      = document.getElementById('gs-url').value.trim();
  GS_CONFIG.orgName  = document.getElementById('org-name').value.trim();
  GS_CONFIG.user     = document.getElementById('current-user').value.trim();
  GS_CONFIG.area     = document.getElementById('current-area').value.trim();

  localStorage.setItem('gs_url',  GS_CONFIG.url);
  localStorage.setItem('gs_org',  GS_CONFIG.orgName);
  localStorage.setItem('gs_user', GS_CONFIG.user);
  localStorage.setItem('gs_area', GS_CONFIG.area);

  document.getElementById('sidebar-user').textContent = GS_CONFIG.user;
  document.getElementById('sidebar-role').textContent = GS_CONFIG.area;
  toast('success', 'Configuración guardada', GS_CONFIG.url ? 'URL configurada' : 'Sin URL de Sheets');
}

async function testConnection() {
  if (!GS_CONFIG.url) return toast('error', 'Sin URL', 'Configura la URL de Apps Script primero');
  toast('info', 'Probando conexión...', GS_CONFIG.url);
  try {
    const r = await fetch(`${GS_CONFIG.url}?action=ping`);
    const data = await r.json();
    toast('success', 'Conexión exitosa', data.message || 'Backend respondió correctamente');
  } catch {
    toast('error', 'Error de conexión', 'Verifica la URL y los permisos del Web App');
  }
}

async function loadFromGS() {
  if (!GS_CONFIG.url) return toast('error', 'Sin URL', 'Configura la URL primero');
  toast('info', 'Cargando datos de Sheets...', '');
  try {
    const [equipos, reservas, autos] = await Promise.all([
      fetch(`${GS_CONFIG.url}?action=getEquipos`).then(r => r.json()),
      fetch(`${GS_CONFIG.url}?action=getReservas`).then(r => r.json()),
      fetch(`${GS_CONFIG.url}?action=getAutomations`).then(r => r.json())
    ]);
    DB.equipos = equipos || [];
    DB.reservas = reservas || [];
    DB.automatizaciones = autos || [];
    renderDashboard();
    toast('success', 'Datos cargados', `${DB.equipos.length} equipos, ${DB.reservas.length} reservas, ${DB.automatizaciones.length} automatizaciones`);
  } catch {
    toast('error', 'Error al cargar', 'Revisa la URL y conexión');
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `it-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  toast('info', 'Datos exportados', 'Archivo JSON descargado');
}

// ============================================================
// GOOGLE SHEETS SYNC
// ============================================================
async function syncToGS(sheet, data) {
  if (!GS_CONFIG.url) return;
  try {
    await fetch(GS_CONFIG.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'append', sheet, data })
    });
  } catch (e) {
    console.warn('Sync to GS failed silently:', e);
  }
}

// ============================================================
// HELPERS
// ============================================================
function populateEquipoSelect() {
  const sel = document.getElementById('r-equipo');
  sel.innerHTML = '<option value="">-- Seleccionar equipo --</option>' +
    DB.equipos
      .filter(e => e.estado === 'Disponible')
      .map(e => `<option value="${e.id}">${e.nombre} (${e.tipo})</option>`)
      .join('');
}

function clearForm(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  const parts = iso.split('T')[0].split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function badgeEquipo(estado) {
  const map = { Disponible: 'badge-green', 'En uso': 'badge-yellow', Mantenimiento: 'badge-red' };
  const icons = { Disponible: '●', 'En uso': '●', Mantenimiento: '⚠' };
  return `<span class="badge ${map[estado] || 'badge-gray'}">${icons[estado] || ''} ${estado}</span>`;
}

function badgeReserva(estado) {
  const map = { Aprobada: 'badge-green', Pendiente: 'badge-yellow', Rechazada: 'badge-red', Devuelta: 'badge-gray' };
  return `<span class="badge ${map[estado] || 'badge-gray'}">${estado}</span>`;
}

function badgeAuto(estado) {
  const map = { Activa: 'badge-green', 'En pruebas': 'badge-yellow', Pausada: 'badge-gray', Deprecada: 'badge-red' };
  return `<span class="badge ${map[estado] || 'badge-gray'}">${estado}</span>`;
}

// ============================================================
// MODAL
// ============================================================
function openModal(id) {
  if (id === 'modal-reserva') populateEquipoSelect();
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ============================================================
// TOAST
// ============================================================
function toast(type, title, sub = '') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div class="toast-icon">${icons[type] || ''}</div>
    <div class="toast-text">
      <div class="toast-title">${title}</div>
      ${sub ? `<div class="toast-sub">${sub}</div>` : ''}
    </div>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ============================================================
// INIT
// ============================================================
(function init() {
  // Cargar config guardada
  document.getElementById('gs-url').value       = GS_CONFIG.url;
  document.getElementById('org-name').value     = GS_CONFIG.orgName;
  document.getElementById('current-user').value = GS_CONFIG.user;
  document.getElementById('current-area').value = GS_CONFIG.area;
  document.getElementById('sidebar-user').textContent = GS_CONFIG.user;
  document.getElementById('sidebar-role').textContent = GS_CONFIG.area;

  renderDashboard();
  renderCalStrip();
})();
