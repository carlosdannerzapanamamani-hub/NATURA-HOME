/* ============================================================
   ADMIN.JS  ·  Panel de administración (admin.html)
   ------------------------------------------------------------
   Secciones del archivo:
   1. Acceso         → contraseña para entrar.
   2. Vistas         → Resumen, Productos, Tipos, Pedidos, Ajustes.
   3. Formulario     → crear / editar un producto (con fotos y stock).
   4. Pedidos        → detalle, adelanto de Yape, comprobante, estados, stock y exportación.
   5. Eventos        → qué pasa al hacer clic, cambiar o enviar.
   6. Inicialización → entra solo si la sesión sigue abierta.
   Los datos se leen y guardan con NH.products(), NH.types(),
   NH.orders(), NH.settings() y NH.save() (ver datos.js).
   ============================================================ */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { esc, money } = NH;

  const ESTADOS = ['Nuevo', 'Confirmado', 'Entregado', 'Cancelado'];
  const MAX_FOTOS = 5;
  let pestana = 'dash';   // pestaña abierta
  let fotos = [];         // fotos del producto que se está editando
  const fp = { q: '', tipo: '', disp: '' }; // filtros de la tabla de productos
  const sel = new Set();                    // productos marcados con la casilla
  const fo = { estado: 'Todos', q: '' };    // filtros de pedidos

  /* ---------- Utilidades del panel ---------- */
  const toast = (m) => {
    const t = $('#toast'); t.textContent = m; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400);
  };
  // Guardar con aviso si el navegador se quedó sin espacio.
  const guardar = (clave, valor) => {
    if (!NH.save(clave, valor)) toast('No se pudo guardar: el navegador no tiene espacio (usa imágenes más pequeñas)');
  };
  const abrirModal = (html) => { $('#mbox').innerHTML = `<button class="x" data-x aria-label="Cerrar">×</button>${html}`; $('#modal').classList.add('on'); };
  const cerrarModal = () => $('#modal').classList.remove('on');
  const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const nuevoId = (nombre) => `${slug(nombre) || 'planta'}-${Date.now().toString(36)}`;
  const fecha = (iso) => new Date(iso).toLocaleDateString('es-BO');
  const poco = (p) => p.stock != null && p.stock <= 3;

  /* ============ 1. ACCESO ============ */
  const entrar = () => { $('#login').hidden = true; $('#app').hidden = false; mostrar(); };
  $('#lf').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#pw').value === NH.settings().password) { sessionStorage.setItem('nh_admin', '1'); entrar(); }
    else { $('#le').textContent = 'Contraseña incorrecta'; $('#pw').select(); }
  });
  $('#out').addEventListener('click', () => { sessionStorage.removeItem('nh_admin'); location.reload(); });

  /* ============ 2. VISTAS ============ */
  const vistas = {
    /* --- Resumen --- */
    dash() {
      const plantas = NH.products(), pedidos = NH.orders();
      const vendido = pedidos.filter((x) => x.status === 'Entregado' && x.total).reduce((a, x) => a + x.total, 0);
      const revisar = plantas.filter((p) => !NH.avail(p) || poco(p));
      return `<h1>Resumen</h1>
        <div class="stats">
          <div class="stat"><b>${plantas.length}</b><span>Productos</span></div>
          <div class="stat"><b>${plantas.filter((x) => !NH.avail(x)).length}</b><span>Agotados</span></div>
          <div class="stat"><b>${pedidos.filter((x) => x.status === 'Nuevo').length}</b><span>Pedidos nuevos</span></div>
          <div class="stat"><b>${money(vendido) || NH.settings().currency + ' 0'}</b><span>Ventas entregadas</span></div>
        </div>
        <div class="card" style="margin-bottom:22px"><h3 style="margin-bottom:10px">Para revisar</h3>
          ${revisar.length ? `<ul class="rev">${revisar.map((p) => `<li><span><b>${esc(p.name)}</b> · ${NH.avail(p) ? `quedan ${p.stock}` : 'agotada'}</span><button class="mini" data-edit="${p.id}">Editar</button></li>`).join('')}</ul>`
            : '<p class="hint">Todo en orden: no hay plantas agotadas ni con poco stock.</p>'}</div>
        <h3 style="margin-bottom:12px">Últimos pedidos</h3>${tablaPedidos(pedidos.slice(0, 5), false)}`;
    },

    /* --- Productos: filtros + tabla (la tabla se dibuja aparte para no perder el foco al escribir) --- */
    prod() {
      return `<div class="cab"><h1 style="margin:0">Productos</h1><button class="btn sm" data-edit="">+ Nuevo producto</button></div>
        <div class="tb">
          <input class="search" id="pq" type="search" placeholder="Buscar producto" value="${esc(fp.q)}" aria-label="Buscar producto">
          <select class="sel" id="ptipo" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>${NH.types().map((t) => `<option${t.name === fp.tipo ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
          <select class="sel" id="pdisp" aria-label="Filtrar por estado"><option value="">Todos los estados</option>
            ${[['disp', 'Disponibles'], ['agot', 'Agotados'], ['poco', 'Poco stock']].map(([v, l]) => `<option value="${v}"${v === fp.disp ? ' selected' : ''}>${l}</option>`).join('')}</select>
        </div>
        <div class="bulk" id="bulk" hidden></div>
        <div class="tw" id="ptable"></div>
        <p class="hint">Puedes editar precio y stock directamente en la tabla. Stock vacío = sin control de unidades. Con stock 0 la planta se muestra como agotada.</p>`;
    },

    /* --- Tipos de planta --- */
    tipos() {
      const plantas = NH.products(), tipos = NH.types();
      return `<h1>Tipos de planta</h1>
        <p class="hint" style="margin:-10px 0 18px">Los tipos separan el catálogo en secciones. Cada planta tiene un solo tipo. El orden de esta lista es el orden en la tienda.</p>
        <div class="tw"><table><thead><tr><th>Orden</th><th>Nombre</th><th>Descripción (se ve en la tienda)</th><th>Plantas</th><th></th></tr></thead><tbody>
        ${tipos.map((t, i) => `<tr><td style="white-space:nowrap"><button class="mini" data-tmove="${i}" data-d="-1" aria-label="Subir"${i ? '' : ' disabled'}>↑</button> <button class="mini" data-tmove="${i}" data-d="1" aria-label="Bajar"${i < tipos.length - 1 ? '' : ' disabled'}>↓</button></td>
          <td><input class="inl wide" data-tname="${i}" value="${esc(t.name)}" aria-label="Nombre del tipo"></td>
          <td><input class="inl wide" data-tdesc="${i}" value="${esc(t.desc)}" aria-label="Descripción del tipo"></td>
          <td>${plantas.filter((p) => p.type === t.name).length}</td>
          <td><button class="mini d" data-tdel="${i}">Eliminar</button></td></tr>`).join('')}</tbody></table></div>
        <form class="card" id="tf" style="margin-top:18px"><h3 style="margin-bottom:12px">Agregar un tipo</h3>
          <div class="row"><div class="field"><label for="t_n">Nombre</label><input id="t_n" name="name" required placeholder="Ej: Suculentas"></div>
          <div class="field"><label for="t_d">Descripción</label><input id="t_d" name="desc" placeholder="Ej: Fáciles de cuidar"></div></div>
          <button class="btn sm">Agregar tipo</button></form>
        <p class="hint">Los lugares (Exteriores e Interiores) son fijos y se marcan en cada planta.</p>`;
    },

    /* --- Pedidos --- */
    ord() {
      const todos = NH.orders();
      return `<div class="cab"><h1 style="margin:0">Pedidos</h1><div class="acts"><button class="btn sm ghost" id="csv">Exportar CSV</button><button class="btn sm" data-neworder>+ Registrar pedido</button></div></div>
        <div class="tb"><div class="pills">${['Todos', ...ESTADOS].map((e) => `<button class="pill" data-fo="${e}" aria-pressed="${e === fo.estado}">${e} <small>${e === 'Todos' ? todos.length : todos.filter((x) => x.status === e).length}</small></button>`).join('')}</div>
          <input class="search" id="oq" type="search" placeholder="Buscar cliente o código" value="${esc(fo.q)}" aria-label="Buscar pedido"></div>
        <div id="otable"></div>
        <p class="hint">Aquí aparecen los pedidos hechos desde este navegador y los que registres a mano (por ejemplo, los que llegan por WhatsApp). Al pasar un pedido a "Confirmado" se descuenta el stock; si lo cancelas, se devuelve.</p>`;
    },

    /* --- Ajustes + copia de seguridad --- */
    cfg() {
      const s = NH.settings();
      const campo = (k, etiqueta, tipo = 'text', ayuda = '') => `<div class="field"><label for="s_${k}">${etiqueta}</label><input id="s_${k}" data-k="${k}" type="${tipo}" value="${esc(s[k])}">${ayuda ? `<span class="hint">${ayuda}</span>` : ''}</div>`;
      return `<h1>Ajustes</h1>
        <form class="card" id="cf">
          <div class="row">${campo('whatsapp', 'WhatsApp (con código de país, sin +)')}${campo('currency', 'Moneda')}</div>
          <div class="row">${campo('address', 'Dirección')}${campo('hours', 'Horario')}</div>
          ${campo('announce', 'Mensaje de la barra superior (vacío = ocultar)')}
          <div class="row">${campo('deliveryFee', 'Costo de envío', 'number', 'Vacío = "a coordinar" en el carrito')}${campo('payments', 'Formas de pago (separadas por coma)', 'text', 'Ej: Efectivo, QR. Vacío = no se pregunta')}</div>
          <h3 class="sub">Pago por Yape</h3>
          <p class="hint">Sube tu QR y/o escribe tu número para activar el pago por Yape en el carrito. Al elegirlo, el cliente paga solo un adelanto del porcentaje indicado.</p>
          <div class="row">${campo('yapeNumber', 'Número de Yape')}${campo('yapeName', 'Nombre del titular')}${campo('yapePercent', 'Adelanto (% del pedido)', 'number')}</div>
          <div class="field"><label for="qrFile">Imagen del QR de Yape</label><div id="qrBox"></div><input id="qrFile" type="file" accept="image/*"></div>
          <div class="row">${campo('facebook', 'Facebook (enlace)')}${campo('tiktok', 'TikTok (enlace)')}</div>
          <div class="row">${campo('businessNit', 'NIT del negocio (opcional, sale en el comprobante)')}${campo('password', 'Contraseña del panel')}</div>
          <button class="btn sm">Guardar ajustes</button>
        </form>
        <div class="card" style="margin-top:18px"><h3>Copia de seguridad</h3>
          <p class="hint" style="margin-bottom:14px">Tus datos viven en este navegador. Descarga una copia para no perderlos o para llevarlos a otro equipo.</p>
          <div class="acts"><button class="btn sm ghost" id="exp">Descargar copia</button>
            <label class="btn sm ghost" style="cursor:pointer">Restaurar copia<input type="file" id="imp" accept=".json" hidden></label>
            <button class="btn sm ghost" id="rst" style="color:#8a2f1f">Restablecer todo</button></div></div>`;
    }
  };

  // Pinta la pestaña actual y marca el botón del menú lateral.
  function mostrar() {
    $('#view').innerHTML = `<div class="panel">${vistas[pestana]()}</div>`;
    $$('.tab[data-t]').forEach((b) => b.setAttribute('aria-selected', b.dataset.t === pestana));
    if (pestana === 'prod') dibujarTabla();
    if (pestana === 'ord') dibujarPedidos();
    if (pestana === 'cfg') dibujarQr();
  }

  // Muestra el QR actual (con botón para quitarlo) o un aviso si todavía no hay.
  function dibujarQr() {
    const qr = NH.yapeQr();
    $('#qrBox').innerHTML = qr
      ? `<img class="qr" src="${esc(qr)}" alt="QR de Yape actual"><button type="button" class="mini d" id="qrDel">Quitar QR</button>`
      : '<p class="hint">Aún no hay QR. Sube una captura o foto de tu QR de Yape.</p>';
  }

  /* ---------- Tabla de productos (filtros, edición en línea, selección) ---------- */
  function filtrados() {
    const q = fp.q.trim().toLowerCase();
    return NH.products().filter((p) =>
      (!fp.tipo || p.type === fp.tipo) &&
      (!q || `${p.name} ${p.type}`.toLowerCase().includes(q)) &&
      (fp.disp === '' || (fp.disp === 'disp' && NH.avail(p)) || (fp.disp === 'agot' && !NH.avail(p)) || (fp.disp === 'poco' && poco(p))));
  }
  function dibujarTabla() {
    const lista = filtrados();
    for (const id of [...sel]) if (!NH.products().some((p) => p.id === id)) sel.delete(id);
    const todos = lista.length && lista.every((p) => sel.has(p.id));
    $('#ptable').innerHTML = lista.length ? `<table><thead><tr>
        <th><input type="checkbox" id="selAll" ${todos ? 'checked' : ''} aria-label="Seleccionar todas"></th><th></th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Disponible</th><th>Destacada</th><th></th></tr></thead><tbody>
      ${lista.map((x) => `<tr class="${sel.has(x.id) ? 'on' : ''}">
        <td><input type="checkbox" data-sel="${x.id}" ${sel.has(x.id) ? 'checked' : ''} aria-label="Seleccionar ${esc(x.name)}"></td>
        <td><img src="${esc(NH.imgs(x)[0])}" alt=""></td>
        <td><b>${esc(x.name)}</b><br><small>${esc(x.type)} · ${esc(NH.place(x))}</small>${poco(x) && x.stock > 0 ? ' <span class="badge no">Poco stock</span>' : ''}</td>
        <td><input class="inl" type="number" min="0" step="0.5" data-inl="price" data-id="${x.id}" value="${x.price ?? ''}" placeholder="—" aria-label="Precio de ${esc(x.name)}"></td>
        <td><input class="inl" type="number" min="0" step="1" data-inl="stock" data-id="${x.id}" value="${x.stock ?? ''}" placeholder="—" aria-label="Stock de ${esc(x.name)}"></td>
        <td><label class="sw"><input type="checkbox" data-tg="available" data-id="${x.id}" ${x.available ? 'checked' : ''} aria-label="Disponible"><i></i></label></td>
        <td><label class="sw"><input type="checkbox" data-tg="featured" data-id="${x.id}" ${x.featured ? 'checked' : ''} aria-label="Destacada"><i></i></label></td>
        <td style="white-space:nowrap"><button class="mini" data-edit="${x.id}">Editar</button> <button class="mini" data-dup="${x.id}">Duplicar</button> <button class="mini d" data-del="${x.id}">Eliminar</button></td></tr>`).join('')}
      </tbody></table>` : '<div class="card empty">No hay productos con esos filtros.</div>';
    // barra de acciones para las seleccionadas
    const bulk = $('#bulk');
    bulk.hidden = !sel.size;
    bulk.innerHTML = sel.size ? `<b>${sel.size} seleccionada${sel.size === 1 ? '' : 's'}</b>
      <button class="mini" data-bulk="disp">Marcar disponibles</button><button class="mini" data-bulk="agot">Marcar agotadas</button>
      <select class="sel" id="bulkType" aria-label="Mover a tipo"><option value="">Mover a tipo…</option>${NH.types().map((t) => `<option>${esc(t.name)}</option>`).join('')}</select>
      <button class="mini d" data-bulk="del">Eliminar</button><button class="mini" data-bulk="none">Quitar selección</button>` : '';
  }

  /* ---------- Tabla de pedidos ---------- */
  function totalTexto(x) { return money(x.total) || '—'; }
  function tablaPedidos(lista, completa) {
    if (!lista.length) return '<div class="card empty">Aún no hay pedidos.</div>';
    const filas = lista.map((x) => `<tr>
      <td>${fecha(x.date)}<br><small>${esc(x.id)}</small></td>
      <td><b>${esc(x.name)}</b><br><small>${esc(x.phone || x.mode || '')}</small></td>
      <td>${x.items.map((i) => `${esc(i.name)} × ${i.qty}`).join('<br>')}</td>
      <td>${totalTexto(x)}${x.advance != null ? `<br><span class="badge ${x.advancePaid ? '' : 'no'}">Adelanto ${x.advancePaid ? 'recibido' : 'pendiente'}</span>` : ''}</td>
      <td>${completa
        ? `<select class="sel" data-st="${x.id}" aria-label="Estado del pedido">${ESTADOS.map((s) => `<option${s === x.status ? ' selected' : ''}>${s}</option>`).join('')}</select>`
        : `<span class="badge ${x.status === 'Cancelado' ? 'no' : ''}">${x.status}</span>`}</td>
      ${completa ? `<td style="white-space:nowrap"><button class="mini" data-detail="${x.id}">Ver</button> <button class="mini d" data-delo="${x.id}">Borrar</button></td>` : ''}</tr>`).join('');
    return `<div class="tw"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Pedido</th><th>Total</th><th>Estado</th>${completa ? '<th></th>' : ''}</tr></thead><tbody>${filas}</tbody></table></div>`;
  }
  function dibujarPedidos() {
    const q = fo.q.trim().toLowerCase();
    const lista = NH.orders().filter((x) => (fo.estado === 'Todos' || x.status === fo.estado) && (!q || `${x.name} ${x.id} ${x.phone || ''}`.toLowerCase().includes(q)));
    $('#otable').innerHTML = tablaPedidos(lista, true);
  }

  /* ============ 3. FORMULARIO DE PRODUCTO ============ */
  function formularioProducto(id) {
    const vacio = { name: '', type: NH.types()[0]?.name || '', places: ['Exteriores'], description: '', price: '', stock: null, available: true, featured: false, light: '', water: '' };
    const p = NH.products().find((x) => x.id === id) || vacio;
    fotos = id ? [...NH.imgs(p)] : [];

    abrirModal(`<h2 style="font-size:1.6rem;margin-bottom:18px">${id ? 'Editar' : 'Nuevo'} producto</h2>
      <form id="pf" data-id="${id}">
        <div class="row">
          <div class="field"><label for="f_name">Nombre</label><input id="f_name" name="name" required value="${esc(p.name)}"></div>
          <div class="field"><label for="f_type">Tipo</label><select id="f_type" name="type">${NH.types().map((t) => `<option${t.name === p.type ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
        </div>
        <div class="row">
          <div class="field"><label for="f_price">Precio (vacío = por confirmar)</label><input id="f_price" name="price" type="number" min="0" step="0.5" value="${p.price ?? ''}"></div>
          <div class="field"><label for="f_stock">Stock (vacío = sin control)</label><input id="f_stock" name="stock" type="number" min="0" step="1" value="${p.stock ?? ''}"></div>
        </div>
        <div class="field"><label>Lugar donde puede estar</label><div class="acts">${NH.PLACES.map((l) => `<label class="chk"><input type="checkbox" name="places" value="${l}" ${(p.places || []).includes(l) ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>
        <div class="field"><label for="f_desc">Descripción</label><textarea id="f_desc" name="description" rows="3">${esc(p.description)}</textarea></div>
        <div class="row">
          <div class="field"><label for="f_l">Luz</label><input id="f_l" name="light" value="${esc(p.light)}"></div>
          <div class="field"><label for="f_w">Riego</label><input id="f_w" name="water" value="${esc(p.water)}"></div>
        </div>
        <div class="field"><label for="f_img">Fotos (hasta ${MAX_FOTOS}; se muestran rotando)</label>
          <input id="f_img" type="file" accept="image/*" multiple><div class="thumbs" id="thumbs"></div>
          <p class="hint">Se reducen automáticamente. La primera es la portada.</p></div>
        <div style="display:flex;gap:24px;margin:6px 0 20px;flex-wrap:wrap">
          <label style="display:flex;gap:8px;align-items:center"><span class="sw"><input type="checkbox" name="available" ${p.available ? 'checked' : ''}><i></i></span>Disponible</label>
          <label style="display:flex;gap:8px;align-items:center"><span class="sw"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}><i></i></span>Destacada en el inicio</label>
        </div>
        <button class="btn" style="width:100%">Guardar producto</button>
      </form>`);
    dibujarMiniaturas();
  }

  function dibujarMiniaturas() {
    $('#thumbs').innerHTML = fotos.map((src, i) => `<div class="th${i ? '' : ' cv'}">
      <img src="${esc(src)}" alt="Foto ${i + 1}">
      <button type="button" class="mini d" data-rmimg="${i}" aria-label="Quitar foto ${i + 1}">×</button>
      ${i ? `<button type="button" class="mini cov" data-cover="${i}">Portada</button>` : ''}
      <small>${i ? 'Foto ' + (i + 1) : 'Portada'}</small></div>`).join('');
  }

  // Reduce una foto a máximo 640 px (JPG) para ahorrar espacio en el navegador.
  const reducirFoto = (archivo) => new Promise((resolver) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, 640 / Math.max(img.width, img.height));
        const lienzo = document.createElement('canvas');
        lienzo.width = img.width * escala; lienzo.height = img.height * escala;
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
        resolver(lienzo.toDataURL('image/jpeg', 0.78));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });

  /* ============ 4. PEDIDOS: detalle, stock y exportación ============ */
  // Descuenta o devuelve stock según el estado (solo una vez por pedido).
  function ajustarStock(pedido, estado) {
    const plantas = NH.products();
    const mover = (signo) => pedido.items.forEach((i) => {
      const p = plantas.find((x) => x.id === i.id);
      if (p && p.stock != null) p.stock = Math.max(0, p.stock + signo * i.qty);
    });
    if ((estado === 'Confirmado' || estado === 'Entregado') && !pedido.stockApplied) { mover(-1); pedido.stockApplied = true; }
    else if ((estado === 'Cancelado' || estado === 'Nuevo') && pedido.stockApplied) { mover(1); pedido.stockApplied = false; }
    guardar('products', plantas);
  }

  function detallePedido(id) {
    const x = NH.orders().find((o) => o.id === id); if (!x) return;
    const fila = (k, v) => (v ? `<div><span>${k}</span><b>${esc(v)}</b></div>` : '');
    const tel = (x.phone || '').replace(/\D/g, '');
    abrirModal(`<h2 style="font-size:1.6rem;margin-bottom:4px">Pedido ${esc(x.id)}</h2><p class="hint" style="margin-bottom:16px">${fecha(x.date)} · <span class="badge ${x.status === 'Cancelado' ? 'no' : ''}">${x.status}</span></p>
      <div class="kv">${fila('Cliente', x.name)}${fila('Celular', x.phone)}${fila('NIT / CI', x.nit)}${fila('Entrega', x.mode)}${fila('Zona', x.zone)}${fila('Notas', x.note)}</div>
      <table style="margin:16px 0"><thead><tr><th>Planta</th><th>Cant.</th><th>Precio</th></tr></thead><tbody>${x.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${money(i.price != null ? i.price * i.qty : null) || 'por confirmar'}</td></tr>`).join('')}</tbody></table>
      <div class="kv">${fila('Subtotal', money(x.subtotal))}${fila('Envío', x.delivery ? (money(x.fee) || 'a coordinar') : '')}${fila('Total', money(x.total))}${fila('Forma de pago', x.payment)}
        ${x.advance != null ? fila(`Adelanto Yape (${x.advancePct}%)`, `${money(x.advance)}${x.advanceDeclared ? ' · el cliente dice que ya pagó' : ''}`) + fila('Saldo por pagar', money(x.balance)) : ''}</div>
      ${x.advance != null ? `<label class="advrow"><span class="sw"><input type="checkbox" data-advpaid="${x.id}" ${x.advancePaid ? 'checked' : ''}><i></i></span> Adelanto recibido (ya revisé la captura del pago)</label>` : ''}
      <div class="acts" style="margin-top:18px"><button class="btn sm" data-comp="${x.id}">Ver comprobante</button>
        ${tel ? `<a class="btn sm ghost" target="_blank" rel="noopener" href="${NH.waTo(x.phone, `Hola ${x.name}, te escribimos de Natura & Home por tu pedido ${x.id}.`)}">Escribir al cliente</a>` : ''}
        <button class="btn sm ghost" data-x>Cerrar</button></div>`);
  }

  // Vista del comprobante con las tres acciones: enviar por WhatsApp, descargar e imprimir.
  function verComprobante(id) {
    const x = NH.orders().find((o) => o.id === id); if (!x) return;
    abrirModal(`<h2 style="font-size:1.4rem;margin-bottom:12px">Comprobante de pedido</h2>
      <div class="cmp-wrap">${NH.comprobante.html(x)}</div>
      <p class="hint">Es un comprobante de pedido, no una factura fiscal. En el celular, "Enviar por WhatsApp" abre la lista de apps para mandar la imagen; en computadora descarga la imagen y abre el chat para que la adjuntes.</p>
      <div class="acts" style="margin-top:14px"><button class="btn sm" data-cshare="${id}">Enviar por WhatsApp</button><button class="btn sm ghost" data-cdl="${id}">Descargar imagen</button><button class="btn sm ghost" data-cprint="${id}">Imprimir / PDF</button><button class="btn sm ghost" data-detail="${id}">Volver</button></div>`);
  }

  // Reduce la imagen del QR (máx. 700 px). PNG para que se siga leyendo bien; JPG solo si pesa demasiado.
  const reducirQr = (archivo) => new Promise((resolver) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, 700 / Math.max(img.width, img.height)), lienzo = document.createElement('canvas');
        lienzo.width = img.width * escala; lienzo.height = img.height * escala;
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
        const png = lienzo.toDataURL('image/png');
        resolver(png.length > 600000 ? lienzo.toDataURL('image/jpeg', 0.9) : png);
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });

  const csv = () => {
    const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const filas = [['Código', 'Fecha', 'Cliente', 'Celular', 'NIT/CI', 'Entrega', 'Zona', 'Pago', 'Pedido', 'Total', 'Adelanto', 'Adelanto recibido', 'Saldo', 'Estado']];
    NH.orders().forEach((x) => filas.push([x.id, fecha(x.date), x.name, x.phone, x.nit, x.mode, x.zone, x.payment, x.items.map((i) => `${i.name} x${i.qty}`).join('; '), x.total ?? '', x.advance ?? '', x.advance != null ? (x.advancePaid ? 'sí' : 'no') : '', x.balance ?? '', x.status]));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + filas.map((f) => f.map(celda).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = `pedidos-natura-home-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  // Una fila "planta + cantidad" del formulario de pedido manual.
  const lineaPedido = () => `<div class="row oline"><div class="field"><select name="pid" aria-label="Planta">${NH.products().map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
    <div class="field"><input name="qty" type="number" min="1" value="1" aria-label="Cantidad"></div></div>`;

  /* ============ 5. EVENTOS ============ */
  // --- Clics ---
  document.addEventListener('click', (e) => {
    const t = e.target, en = (s) => t.closest(s);

    if (en('[data-t]')) { pestana = en('[data-t]').dataset.t; mostrar(); }
    else if (en('[data-x]') || t === $('#modal')) cerrarModal();

    // fotos del formulario
    else if (en('[data-rmimg]')) { fotos.splice(+en('[data-rmimg]').dataset.rmimg, 1); dibujarMiniaturas(); }
    else if (en('[data-cover]')) { fotos.unshift(...fotos.splice(+en('[data-cover]').dataset.cover, 1)); dibujarMiniaturas(); }

    // productos
    else if (en('[data-edit]')) formularioProducto(en('[data-edit]').dataset.edit);
    else if (en('[data-dup]')) {
      const lista = NH.products(), o = lista.find((x) => x.id === en('[data-dup]').dataset.dup);
      const copia = { ...structuredClone(o), id: nuevoId(o.name), name: `${o.name} (copia)`, featured: false };
      lista.unshift(copia); guardar('products', lista); mostrar(); formularioProducto(copia.id);
    }
    else if (en('[data-del]')) {
      const p = NH.products().find((x) => x.id === en('[data-del]').dataset.del);
      if (confirm(`¿Eliminar "${p.name}"?`)) { guardar('products', NH.products().filter((x) => x.id !== p.id)); sel.delete(p.id); mostrar(); toast('Producto eliminado'); }
    }
    else if (en('[data-bulk]')) { // acciones sobre las seleccionadas
      const accion = en('[data-bulk]').dataset.bulk; let lista = NH.products();
      if (accion === 'none') sel.clear();
      else if (accion === 'del') {
        if (!confirm(`¿Eliminar ${sel.size} producto(s)?`)) return;
        lista = lista.filter((p) => !sel.has(p.id)); guardar('products', lista); sel.clear(); toast('Productos eliminados');
      } else {
        lista.forEach((p) => { if (sel.has(p.id)) p.available = accion === 'disp'; });
        guardar('products', lista); toast('Actualizado');
      }
      mostrar();
    }

    // tipos
    else if (en('[data-tmove]')) {
      const i = +en('[data-tmove]').dataset.tmove, d = +en('[data-tmove]').dataset.d, l = NH.types();
      [l[i], l[i + d]] = [l[i + d], l[i]]; guardar('types', l); mostrar();
    }
    else if (en('[data-tdel]')) {
      const l = NH.types(), tipo = l[+en('[data-tdel]').dataset.tdel], n = NH.products().filter((p) => p.type === tipo.name).length;
      if (n) { toast(`Mueve primero las ${n} plantas de "${tipo.name}" a otro tipo (Productos → seleccionar → Mover a tipo)`); return; }
      if (confirm(`¿Eliminar el tipo "${tipo.name}"?`)) { guardar('types', l.filter((x) => x !== tipo)); mostrar(); }
    }

    // pedidos
    else if (en('[data-fo]')) { fo.estado = en('[data-fo]').dataset.fo; mostrar(); }
    else if (en('[data-detail]')) detallePedido(en('[data-detail]').dataset.detail);
    else if (en('[data-comp]')) verComprobante(en('[data-comp]').dataset.comp);
    else if (en('[data-cshare]')) {
      const x = NH.orders().find((o) => o.id === en('[data-cshare]').dataset.cshare);
      NH.comprobante.share(x).then((r) => toast(r === 'compartido' ? 'Comprobante compartido' : r === 'descargado' ? 'Se descargó la imagen: adjúntala en el chat de WhatsApp' : 'Envío cancelado'));
    }
    else if (en('[data-cdl]')) NH.comprobante.download(NH.orders().find((o) => o.id === en('[data-cdl]').dataset.cdl));
    else if (en('[data-cprint]')) NH.comprobante.print(NH.orders().find((o) => o.id === en('[data-cprint]').dataset.cprint));
    else if (t.id === 'qrDel') { if (confirm('¿Quitar el QR de Yape?')) { NH.reset('yapeqr'); dibujarQr(); toast('QR eliminado'); } }
    else if (en('[data-addline]')) $('#olines').insertAdjacentHTML('beforeend', lineaPedido());
    else if (en('[data-delo]')) {
      if (confirm('¿Borrar este pedido?')) { guardar('orders', NH.orders().filter((x) => x.id !== en('[data-delo]').dataset.delo)); mostrar(); }
    }
    else if (t.id === 'csv') csv();
    else if (en('[data-neworder]')) {
      const pagos = NH.payOptions(), fee = NH.settings().deliveryFee;
      abrirModal(`<h2 style="font-size:1.6rem;margin-bottom:18px">Registrar pedido</h2>
        <form id="of">
          <div class="row"><div class="field"><label for="o_n">Cliente</label><input id="o_n" name="name" required></div>
            <div class="field"><label for="o_c">Celular</label><input id="o_c" name="phone" type="tel"></div>
            <div class="field"><label for="o_i">NIT / CI</label><input id="o_i" name="nit"></div></div>
          <div class="row"><div class="field"><label for="o_m">Entrega</label><select id="o_m" name="mode">${NH.modos().map((m) => `<option value="${m.id}">${esc(m.label)}</option>`).join('')}</select></div>
            <div class="field"><label for="o_z">Zona (si es envío)</label><input id="o_z" name="zone"></div></div>
          <div class="row">${pagos.length ? `<div class="field"><label for="o_p">Forma de pago</label><select id="o_p" name="pay">${pagos.map((p) => `<option value="${esc(p.value)}">${esc(p.label)}</option>`).join('')}</select></div>` : ''}
            <div class="field"><label for="o_f">Costo de envío</label><input id="o_f" name="fee" type="number" min="0" step="0.5" placeholder="${fee !== '' ? fee : 'a coordinar'}"></div></div>
          <div class="field"><label>Plantas</label><div id="olines">${lineaPedido()}</div><button type="button" class="mini" data-addline>+ Otra planta</button></div>
          <div class="row"><div class="field"><label for="o_t">Total acordado (opcional)</label><input id="o_t" name="total" type="number" min="0" step="0.5"></div></div>
          <label class="chk" style="margin-bottom:16px"><input type="checkbox" name="paid"> El adelanto por Yape ya fue recibido</label>
          <button class="btn" style="width:100%">Guardar pedido</button></form>`);
    }

    // ajustes: copia de seguridad
    else if (t.id === 'exp') {
      const archivo = new Blob([JSON.stringify({ settings: NH.settings(), types: NH.types(), products: NH.products(), orders: NH.orders(), yapeqr: NH.yapeQr() }, null, 1)], { type: 'application/json' });
      const enlace = document.createElement('a');
      enlace.href = URL.createObjectURL(archivo);
      enlace.download = `natura-home-copia-${new Date().toISOString().slice(0, 10)}.json`;
      enlace.click();
    }
    else if (t.id === 'rst') {
      if (confirm('Se borrarán productos, tipos, pedidos y ajustes de este navegador. ¿Continuar?')) {
        ['settings', 'types', 'products', 'orders', 'cart', 'customer', 'yapeqr'].forEach(NH.reset); mostrar(); toast('Datos restablecidos');
      }
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

  // --- Escribir en buscadores (sin perder el foco) ---
  document.addEventListener('input', (e) => {
    if (e.target.id === 'pq') { fp.q = e.target.value; dibujarTabla(); }
    else if (e.target.id === 'oq') { fo.q = e.target.value; dibujarPedidos(); }
  });

  // --- Cambios (interruptores, edición en línea, selects, fotos, restaurar copia) ---
  document.addEventListener('change', async (e) => {
    const t = e.target;

    if (t.id === 'ptype' || t.id === 'ptipo') { fp.tipo = t.value; dibujarTabla(); }
    else if (t.id === 'pdisp') { fp.disp = t.value; dibujarTabla(); }
    else if (t.id === 'selAll') { filtrados().forEach((p) => (t.checked ? sel.add(p.id) : sel.delete(p.id))); dibujarTabla(); }
    else if (t.dataset.sel) { t.checked ? sel.add(t.dataset.sel) : sel.delete(t.dataset.sel); dibujarTabla(); }
    else if (t.id === 'bulkType') {
      if (!t.value) return;
      const lista = NH.products(); lista.forEach((p) => { if (sel.has(p.id)) p.type = t.value; });
      guardar('products', lista); toast(`Movidas a "${t.value}"`); sel.clear(); mostrar();
    }
    else if (t.dataset.tg) { // interruptor "Disponible" / "Destacada"
      const lista = NH.products(), p = lista.find((x) => x.id === t.dataset.id);
      p[t.dataset.tg] = t.checked; guardar('products', lista); toast('Guardado');
    }
    else if (t.dataset.inl) { // precio o stock editado en la tabla
      const lista = NH.products(), p = lista.find((x) => x.id === t.dataset.id);
      const v = t.value.trim();
      p[t.dataset.inl] = v === '' ? null : (t.dataset.inl === 'stock' ? Math.max(0, Math.floor(+v)) : Math.max(0, +v));
      guardar('products', lista); toast('Guardado'); dibujarTabla();
    }
    else if (t.dataset.tname !== undefined) { // renombrar tipo (actualiza también las plantas)
      const l = NH.types(), i = +t.dataset.tname, viejo = l[i].name, nuevo = t.value.trim();
      if (!nuevo || l.some((x, j) => j !== i && x.name.toLowerCase() === nuevo.toLowerCase())) { toast('Ese nombre está vacío o ya existe'); mostrar(); return; }
      const lista = NH.products(); lista.forEach((p) => { if (p.type === viejo) p.type = nuevo; });
      l[i].name = nuevo; guardar('types', l); guardar('products', lista); toast('Tipo actualizado'); mostrar();
    }
    else if (t.dataset.tdesc !== undefined) { const l = NH.types(); l[+t.dataset.tdesc].desc = t.value.trim(); guardar('types', l); toast('Guardado'); }
    else if (t.dataset.st) { // cambio de estado de un pedido
      const lista = NH.orders(), o = lista.find((x) => x.id === t.dataset.st);
      ajustarStock(o, t.value); o.status = t.value; guardar('orders', lista); toast('Estado actualizado'); mostrar();
    }
    else if (t.id === 'qrFile' && t.files[0]) { // QR de Yape nuevo o reemplazo
      guardar('yapeqr', await reducirQr(t.files[0])); t.value = ''; dibujarQr(); toast('QR de Yape actualizado');
    }
    else if (t.dataset.advpaid) { // marcar adelanto recibido
      const lista = NH.orders(), o = lista.find((x) => x.id === t.dataset.advpaid);
      o.advancePaid = t.checked; guardar('orders', lista); toast(t.checked ? 'Adelanto marcado como recibido' : 'Adelanto marcado como pendiente'); mostrar();
    }
    else if (t.id === 'f_img' && t.files.length) { // fotos nuevas del producto
      const lugar = MAX_FOTOS - fotos.length;
      if (lugar <= 0) toast(`Máximo ${MAX_FOTOS} fotos`);
      for (const archivo of [...t.files].slice(0, Math.max(lugar, 0))) fotos.push(await reducirFoto(archivo));
      if (t.files.length > lugar && lugar > 0) toast(`Solo caben ${MAX_FOTOS} fotos`);
      t.value = ''; dibujarMiniaturas();
    }
    else if (t.id === 'imp' && t.files[0]) { // restaurar copia de seguridad
      try {
        const datos = JSON.parse(await t.files[0].text());
        ['settings', 'types', 'products', 'orders'].forEach((k) => datos[k] && guardar(k, datos[k]));
        if (datos.yapeqr) guardar('yapeqr', datos.yapeqr);
        localStorage.removeItem('nh_cat'); // para que se revise el formato de la copia
        mostrar(); toast('Copia restaurada');
      } catch (err) { toast('Archivo no válido'); }
    }
  });

  // --- Envío de formularios ---
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.id === 'lf') return; // el login ya tiene su propio manejo
    e.preventDefault();
    const datos = new FormData(f);

    if (f.id === 'pf') { // guardar producto
      const lista = NH.products(), id = f.dataset.id, nombre = datos.get('name').trim();
      const precio = datos.get('price'), stock = datos.get('stock');
      const p = {
        id: id || nuevoId(nombre), name: nombre, type: datos.get('type'),
        places: datos.getAll('places'), description: datos.get('description').trim(),
        images: fotos.length ? [...fotos] : ['assets/images/plant-1.svg'],
        price: precio === '' ? null : Number(precio),
        stock: stock === '' ? null : Math.max(0, Math.floor(+stock)),
        available: datos.has('available'), featured: datos.has('featured'),
        light: datos.get('light').trim(), water: datos.get('water').trim()
      };
      p.image = p.images[0];
      const i = lista.findIndex((x) => x.id === id);
      if (i >= 0) lista[i] = p; else lista.unshift(p);
      guardar('products', lista); cerrarModal(); mostrar(); toast(p.stock === 0 ? 'Guardado. Con stock 0 se mostrará como agotada' : 'Producto guardado');
    }
    else if (f.id === 'tf') { // agregar tipo
      const nombre = datos.get('name').trim(), l = NH.types();
      if (l.some((x) => x.name.toLowerCase() === nombre.toLowerCase())) { toast('Ese tipo ya existe'); return; }
      l.push({ name: nombre, desc: datos.get('desc').trim() }); guardar('types', l); mostrar(); toast('Tipo agregado');
    }
    else if (f.id === 'of') { // registrar pedido a mano (con varias plantas)
      const plantas = NH.products(), cantidades = datos.getAll('qty');
      const items = datos.getAll('pid').map((id, i) => { const p = plantas.find((x) => x.id === id); return { id: p.id, name: p.name, qty: Math.max(1, +cantidades[i] || 1), price: p.price }; });
      const envio = datos.get('mode') === 'envio', tarifa = datos.get('fee'), total = datos.get('total');
      const pedido = NH.newOrder({
        prefix: 'M', name: datos.get('name').trim(), phone: datos.get('phone').trim(), nit: datos.get('nit').trim(),
        delivery: envio, zone: datos.get('zone').trim(), payValue: datos.get('pay') || '', items,
        fee: envio ? (tarifa === '' ? undefined : +tarifa) : null, totalManual: total === '' ? null : +total
      });
      if (pedido.advance != null && datos.has('paid')) pedido.advancePaid = true;
      const pedidos = NH.orders(); pedidos.unshift(pedido);
      guardar('orders', pedidos); cerrarModal(); mostrar(); toast('Pedido registrado');
    }
    else if (f.id === 'cf') { // guardar ajustes
      const s = {};
      $$('[data-k]', f).forEach((i) => { s[i.dataset.k] = i.value.trim(); });
      s.whatsapp = s.whatsapp.replace(/\D/g, '') || NH.defaults.settings.whatsapp;
      s.password = s.password || NH.defaults.settings.password;
      guardar('settings', s); toast('Ajustes guardados');
    }
  });

  /* ============ 6. INICIALIZACIÓN ============ */
  // Se hace al final para que todo lo anterior ya esté definido.
  // Si la sesión sigue abierta (se recargó la página), entra directo al panel.
  if (sessionStorage.getItem('nh_admin')) entrar();
})();
