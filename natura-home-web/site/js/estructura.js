/* ============================================================
   ESTRUCTURA.JS  ·  Las partes que se repiten en todas las páginas
   ------------------------------------------------------------
   En lugar de copiar el menú y el pie de página en cada HTML,
   este archivo los dibuja una sola vez y los inserta en cada página:
   - Barra de anuncio y encabezado con menú.
   - Panel lateral del carrito (drawer) y ventana de detalle (modal).
   - Pie de página y botón flotante de WhatsApp.
   Si cambias el menú aquí, cambia en TODAS las páginas.
   ============================================================ */
(() => {
  const { $, $$, esc } = NH;
  const S = NH.settings(); // ajustes: WhatsApp, horario, dirección...

  // Página actual (para marcar el enlace activo del menú).
  const pagina = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  const MENU = [
    ['index', 'Inicio'], ['catalogo', 'Catálogo'], ['cuidados', 'Cuidados'],
    ['como-comprar', 'Cómo comprar'], ['nosotros', 'Nosotros'], ['contacto', 'Contacto']
  ];

  // Logo + nombre (se usa en el encabezado y en el pie).
  const marca = `<a class="brand" href="index.html" aria-label="${esc(S.name)} inicio">
    <img src="assets/logo-mark.webp" alt="" width="46" height="46">
    <span><b>Natura &amp; Home</b><small>Bienestar | Deco | Esencia</small></span></a>`;

  // 1) Todo lo que va ARRIBA del contenido de la página.
  document.body.insertAdjacentHTML('afterbegin', `
    ${S.announce ? `<div class="announce">${esc(S.announce)}</div>` : ''}
    <header class="hdr"><div class="wrap">${marca}
      <nav class="nav" id="nav" aria-label="Principal">
        ${MENU.map(([h, t]) => `<a href="${h}.html"${h === pagina ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
      </nav>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="cart-btn" id="openCart" aria-label="Abrir carrito">${NH.icons.bag}<span>Mi pedido</span><i id="cartN">0</i></button>
        <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false">☰</button>
      </div>
    </div></header>`);

  // 2) Todo lo que va ABAJO: pie, carrito, ventana de detalle, aviso, WhatsApp.
  document.body.insertAdjacentHTML('beforeend', `
    <footer class="ftr"><div class="wrap">
      <div>${marca}<p style="margin-top:16px;max-width:36ch">Un pequeño espacio natural para tu hogar. Plantas seleccionadas, atención directa y una forma sencilla de conectar con la naturaleza.</p></div>
      <div><h3>Explora</h3>${MENU.map(([h, t]) => `<a href="${h}.html">${t}</a>`).join('')}</div>
      <div><h3>Encuéntranos</h3><p>${esc(S.address)}</p><p>${esc(S.hours)}</p>
        <a href="${NH.wa()}" target="_blank" rel="noopener">WhatsApp ${esc(S.whatsapp.replace(/^591/, ''))}</a>
        ${S.facebook ? `<a href="${esc(S.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ''}
        ${S.tiktok ? `<a href="${esc(S.tiktok)}" target="_blank" rel="noopener">TikTok</a>` : ''}</div>
      <div class="bot"><span>© ${new Date().getFullYear()} ${esc(S.name)}. Todos los derechos reservados.</span><a href="admin.html" style="margin:0">Administración</a></div>
    </div></footer>

    <div class="veil" id="veil"></div>

    <aside class="drawer" id="drawer" aria-label="Mi pedido" aria-hidden="true">
      <div class="dh"><div><span class="eyebrow" id="cCount" style="margin:0">Tu selección</span><h3>Mi pedido</h3></div><button class="x" id="closeCart" aria-label="Cerrar">×</button></div>
      <div class="db">
        <div id="cartList"></div>
        <div id="cartForm" hidden>
          <h4 class="sep">Tus datos</h4>
          <div class="field"><label for="cName">Nombre *</label><input id="cName" autocomplete="name" placeholder="Ej: María Quispe"></div>
          <div class="field"><label for="cPhone">Celular (opcional)</label><input id="cPhone" type="tel" autocomplete="tel" inputmode="tel" placeholder="Ej: 7xxxxxxx"></div>
          <div class="field"><label for="cNit">NIT o CI (opcional, para tu comprobante)</label><input id="cNit" inputmode="numeric" placeholder="Ej: 1234567"></div>
          <div class="field"><label for="cMode">Entrega</label><select id="cMode"></select></div>
          <div class="field" id="zoneBox" hidden><label for="cZone">Zona o dirección de entrega *</label><input id="cZone" autocomplete="street-address" placeholder="Ej: Distrito 7, calle…"></div>
          <div class="field" id="payBox" hidden><label for="cPay">Forma de pago</label><select id="cPay"></select></div>
          <div class="yape" id="yapeBox" hidden>
            <h4>Paga tu adelanto por Yape</h4>
            <p class="yape-amt" id="yapeAmt"></p>
            <div id="yapeQrBox">
              <img id="yapeQr" alt="Código QR para pagar por Yape" hidden>
              <p class="yape-data" id="yapeData"></p>
              <ol class="yape-steps"><li>Abre Yape y escanea el QR (o yapea al número).</li><li>Paga el monto del adelanto.</li><li>Envía el pedido y adjunta la captura del pago en el chat de WhatsApp.</li></ol>
              <label class="chk"><input type="checkbox" id="yapePaid"> Ya pagué el adelanto</label>
            </div>
          </div>
          <div class="field"><label for="cNote">Notas (opcional)</label><input id="cNote" placeholder="Horario, referencias, preguntas…"></div>
          <button class="linkbtn" id="clearCart" type="button">Vaciar pedido</button>
        </div>
      </div>
      <div class="df" id="cartFoot" hidden>
        <div class="sum" id="cSummary"></div>
        <button class="btn" id="checkout" style="width:100%">Enviar pedido por WhatsApp</button>
      </div></aside>

    <div class="modal" id="modal" role="dialog" aria-modal="true" aria-label="Detalle de planta"><div class="mbox" id="mbox"></div></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <a class="wa" href="${NH.wa('Hola Natura & Home, quisiera información sobre sus plantas.')}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">${NH.icons.chat}<b>¿Hablamos por WhatsApp?</b></a>`);

  // 3) Abrir y cerrar el panel del carrito y la ventana de detalle.
  const el = { drawer: $('#drawer'), veil: $('#veil'), modal: $('#modal') };
  NH.el = el;
  NH.openDrawer = () => {
    el.drawer.classList.add('on'); el.veil.classList.add('on');
    el.drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  };
  NH.openModal = () => {
    el.modal.classList.add('on'); el.veil.classList.add('on'); document.body.style.overflow = 'hidden';
  };
  NH.closeAll = () => {
    el.drawer.classList.remove('on'); el.modal.classList.remove('on'); el.veil.classList.remove('on');
    el.drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
  };
})();
