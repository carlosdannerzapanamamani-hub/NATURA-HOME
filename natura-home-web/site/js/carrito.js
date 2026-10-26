/* ============================================================
   CARRITO.JS  ·  El pedido del cliente
   ------------------------------------------------------------
   El carrito es un objeto simple:  { "ruda": 2, "romero": 1 }
   (id de la planta → cantidad). Se guarda en el navegador para que
   no se pierda al cambiar de página.

   Qué incluye:
   - Cantidades limitadas por el stock; las plantas agotadas se quitan solas.
   - Datos del cliente (nombre, celular, NIT/CI, zona) que se recuerdan.
   - Entrega o recojo, con costo de envío configurable en el panel.
   - Forma de pago. Con Yape se pide un ADELANTO (50 % por defecto)
     y se muestra el QR que sube el administrador.
   - Resumen: subtotal, envío, total, adelanto y saldo.
   - Pantalla de confirmación con enlace a WhatsApp y comprobante.

   Funciones:
   NH.addToCart(id, cantidad) · NH.clearCart() · NH.renderCart() · NH.checkout()
   ============================================================ */
(() => {
  const { $, esc, money } = NH;
  const S = NH.settings();
  let ultimo = null; // último pedido enviado (para la pantalla de confirmación)

  /* ---------- Opciones del formulario ---------- */
  const MODOS = NH.modos();
  const pagos = NH.payOptions(); // Yape (si está activo) + formas de pago de Ajustes
  $('#cMode').innerHTML = MODOS.map((m) => `<option value="${m.id}">${esc(m.label)}</option>`).join('');
  if (pagos.length) {
    $('#cPay').innerHTML = pagos.map((p) => `<option value="${esc(p.value)}">${esc(p.label)}</option>`).join('');
    $('#payBox').hidden = false;
  }

  // Datos de Yape: QR (subido en el panel), número y titular.
  const qr = NH.yapeQr();
  if (qr) { $('#yapeQr').src = qr; $('#yapeQr').hidden = false; }
  $('#yapeData').innerHTML = [S.yapeNumber && `Yape al <b>${esc(S.yapeNumber)}</b>`, S.yapeName && esc(S.yapeName)].filter(Boolean).join(' · ');

  // Recuerda los datos de la última compra.
  const previo = NH.customer();
  $('#cName').value = previo.name || ''; $('#cPhone').value = previo.phone || '';
  $('#cNit').value = previo.nit || ''; $('#cZone').value = previo.zone || '';

  /* ---------- Cantidades ---------- */
  const cantidadTotal = () => Object.values(NH.state.cart).reduce((a, b) => a + b, 0);
  const guardar = () => {
    NH.save('cart', NH.state.cart);
    const n = $('#cartN'); n.textContent = cantidadTotal();
    n.classList.add('bump'); setTimeout(() => n.classList.remove('bump'), 180);
  };

  // Agrega (d = 1) o quita (d = -1) unidades. Respeta el stock.
  NH.addToCart = (id, d = 1) => {
    const p = NH.byId(id), cart = NH.state.cart;
    if (!p) return;
    if (d > 0 && !NH.avail(p)) { NH.toast(`${p.name} está agotada`); return; }
    let q = (cart[id] || 0) + d;
    if (q > NH.maxQty(p)) { q = NH.maxQty(p); NH.toast(`Solo hay ${q} de ${p.name}`); }
    if (q <= 0) delete cart[id]; else cart[id] = q;
    if (d > 0) ultimo = null;
    guardar(); NH.renderCart(); NH.syncActs();
  };
  NH.clearCart = () => {
    if (!cantidadTotal() || !confirm('¿Vaciar todo el pedido?')) return;
    NH.state.cart = {}; guardar(); NH.renderCart(); NH.syncActs();
  };

  // Quita lo que ya no se puede comprar y ajusta cantidades al stock.
  function limpiar() {
    const cart = NH.state.cart; let cambio = false;
    Object.keys(cart).forEach((id) => {
      const p = NH.byId(id);
      if (!p || !NH.avail(p)) { delete cart[id]; cambio = true; }
      else if (cart[id] > NH.maxQty(p)) { cart[id] = NH.maxQty(p); cambio = true; }
    });
    if (cambio) { guardar(); NH.toast('Actualizamos tu pedido según la disponibilidad'); }
  }

  /* ---------- Cálculo del resumen ---------- */
  function calcular() {
    const items = Object.keys(NH.state.cart).map((id) => ({ id, name: NH.byId(id).name, qty: NH.state.cart[id], price: NH.byId(id).price }));
    const envio = $('#cMode').value === 'envio';
    const fee = S.deliveryFee !== '' && !isNaN(+S.deliveryFee) ? +S.deliveryFee : null;
    const pago = pagos.length ? $('#cPay').value : '';
    return { items, envio, pago, ...NH.totales(items, { envio, fee, yape: pago === 'yape' }) };
  }

  // Cuadro de Yape: monto del adelanto, QR y pasos.
  function dibujarYape(c) {
    $('#yapeBox').hidden = c.pago !== 'yape';
    if (c.pago !== 'yape') return;
    const conocido = c.adelanto != null;
    $('#yapeAmt').innerHTML = conocido
      ? `Paga ahora <b>${money(c.adelanto)}</b> <small>(${c.pct}% de ${money(c.total)}). El saldo de ${money(c.saldo)} se paga al recibir.</small>`
      : 'Cuando confirmemos los precios te diremos el monto del adelanto. Todavía no pagues.';
    $('#yapeQrBox').hidden = !conocido; // el QR solo se muestra cuando el monto ya es conocido
  }

  /* ---------- Dibujar el panel ---------- */
  NH.renderCart = () => {
    limpiar();
    const cart = NH.state.cart, ids = Object.keys(cart), hay = ids.length > 0;
    $('#cCount').textContent = hay ? `${cantidadTotal()} ${cantidadTotal() === 1 ? 'planta' : 'plantas'}` : 'Tu selección';
    $('#cartForm').hidden = !hay; $('#cartFoot').hidden = !hay;
    $('#zoneBox').hidden = $('#cMode').value !== 'envio';
    $('#cartN').textContent = cantidadTotal();

    if (!hay) { // vacío, o confirmación del último pedido
      const o = ultimo && ultimo.order;
      $('#cartList').innerHTML = ultimo
        ? `<div class="done"><img src="assets/logo-mark.webp" alt=""><h3>¡Pedido listo!</h3>
            <p>Código <b>${esc(o.id)}</b>. Envíalo por WhatsApp para que lo confirmemos.</p>
            ${o.advance != null ? `<p class="done-pay">Recuerda enviar por WhatsApp la captura de tu pago de <b>${money(o.advance)}</b> por Yape.</p>` : ''}
            <a class="btn" href="${esc(ultimo.url)}" target="_blank" rel="noopener">Abrir WhatsApp</a>
            <button class="btn ghost sm" data-comp>Guardar comprobante</button>
            <button class="linkbtn" data-close>Seguir viendo plantas</button></div>`
        : `<div class="empty"><img src="assets/logo-mark.webp" alt=""><h3>Tu pedido está vacío</h3>
            <p>Agrega una planta para comenzar.</p><a class="btn sm" href="catalogo.html" style="margin-top:16px">Ver catálogo</a></div>`;
      return;
    }

    $('#cartList').innerHTML = ids.map((id) => {
      const p = NH.byId(id), q = cart[id], tope = q >= NH.maxQty(p);
      return `<div class="ci"><img src="${esc(NH.imgs(p)[0])}" alt="">
        <div><h4>${esc(p.name)}</h4>
          <small>${p.price != null ? `${money(p.price)} c/u · <b>${money(p.price * q)}</b>` : 'Precio por confirmar'}</small>
          <div class="qty"><button data-q="${id}" data-d="-1" aria-label="Quitar uno">−</button><b>${q}</b><button data-q="${id}" data-d="1" aria-label="Agregar uno"${tope ? ' disabled' : ''}>+</button>${tope && p.stock != null ? '<small>máximo</small>' : ''}</div></div>
        <button class="x" data-rm="${id}" aria-label="Eliminar ${esc(p.name)}">×</button></div>`;
    }).join('');

    const c = calcular();
    $('#cSummary').innerHTML = `
      <div><span>Subtotal</span><b>${c.sinPrecio ? (c.sub ? `${money(c.sub)} + ${c.sinPrecio} por confirmar` : `${c.sinPrecio} por confirmar`) : money(c.sub)}</b></div>
      <div><span>Envío</span><b>${c.envio ? (c.fee != null ? money(c.fee) : 'A coordinar') : 'Sin costo (recojo)'}</b></div>
      <div class="tot"><span>Total</span><b>${c.total != null ? money(c.total) : 'Se confirma por WhatsApp'}</b></div>
      ${c.pago === 'yape' ? `<div class="adv"><span>Adelanto por Yape (${c.pct}%)</span><b>${c.adelanto != null ? money(c.adelanto) : 'Se confirma'}</b></div>
        ${c.saldo != null ? `<div><span>Saldo al recibir</span><b>${money(c.saldo)}</b></div>` : ''}` : ''}
      <p class="hint">Los precios y la disponibilidad se confirman por WhatsApp.</p>`;
    dibujarYape(c);
  };

  /* ---------- Enviar el pedido ---------- */
  NH.checkout = () => {
    limpiar();
    if (!Object.keys(NH.state.cart).length) return;
    const nombre = $('#cName').value.trim(), cel = $('#cPhone').value.trim(), nit = $('#cNit').value.trim();
    const zona = $('#cZone').value.trim(), nota = $('#cNote').value.trim();
    const c = calcular();

    // Validaciones con mensaje claro.
    if (!nombre) { $('#cName').focus(); NH.toast('Escribe tu nombre para continuar'); return; }
    if (cel && !/^[0-9+\s-]{7,}$/.test(cel)) { $('#cPhone').focus(); NH.toast('Revisa tu número de celular'); return; }
    if (c.envio && !zona) { $('#cZone').focus(); NH.toast('Indica la zona o dirección de entrega'); return; }

    const pedido = NH.newOrder({
      name: nombre, phone: cel, nit, delivery: c.envio, zone: zona, payValue: c.pago, note: nota,
      items: c.items, declaredPaid: c.pago === 'yape' && $('#yapePaid').checked
    });
    const guardados = NH.orders(); guardados.unshift(pedido); NH.save('orders', guardados); // copia para el panel
    NH.save('customer', { name: nombre, phone: cel, nit, zone: zona });                      // para la próxima vez

    const mensaje = `Hola Natura & Home, soy ${nombre}. Quiero hacer este pedido (${pedido.id}):\n\n` +
      pedido.items.map((i) => `• ${i.name} × ${i.qty}${i.price != null ? ` — ${money(i.price * i.qty)}` : ''}`).join('\n') +
      `\n\n${pedido.subtotal ? `Subtotal: ${money(pedido.subtotal)}${c.sinPrecio ? ` (+ ${c.sinPrecio} por confirmar)` : ''}\n` : ''}` +
      `Entrega: ${pedido.mode}${c.envio ? `\nZona: ${zona}${pedido.fee != null ? `\nEnvío: ${money(pedido.fee)}` : ''}` : ''}` +
      `${pedido.total != null ? `\nTotal estimado: ${money(pedido.total)}` : ''}` +
      `${pedido.payment ? `\nPago: ${pedido.payment}` : ''}` +
      `${pedido.advance != null ? `\nAdelanto por Yape: ${money(pedido.advance)} — ${pedido.advanceDeclared ? 'ya pagué, adjunto la captura' : 'lo pago y envío la captura'}\nSaldo al recibir: ${money(pedido.balance)}` : ''}` +
      `${cel ? `\nCelular: ${cel}` : ''}${nit ? `\nNIT/CI: ${nit}` : ''}${nota ? `\nNotas: ${nota}` : ''}` +
      `\n\n¿Me confirman disponibilidad, precios y entrega?`;

    ultimo = { id: pedido.id, url: NH.wa(mensaje), order: pedido };
    window.open(ultimo.url, '_blank', 'noopener');
    NH.state.cart = {}; $('#cNote').value = ''; $('#yapePaid').checked = false; guardar(); NH.renderCart(); NH.syncActs();
  };

  /* ---------- Eventos propios del panel ---------- */
  $('#cMode').addEventListener('change', NH.renderCart);
  $('#cPay').addEventListener('change', NH.renderCart);
  $('#clearCart').addEventListener('click', NH.clearCart);
  // Botón "Guardar comprobante" de la pantalla de confirmación.
  $('#cartList').addEventListener('click', (e) => { if (e.target.closest('[data-comp]') && ultimo) NH.comprobante.download(ultimo.order); });
})();
