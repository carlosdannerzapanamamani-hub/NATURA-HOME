/* ============================================================
   COMPROBANTE.JS  ·  Comprobante de pedido (para imprimir o enviar por WhatsApp)
   ------------------------------------------------------------
   IMPORTANTE: es un COMPROBANTE DE PEDIDO, no una factura fiscal.
   Una factura válida en Bolivia se emite con el sistema de
   Impuestos Nacionales (SIN) y no se puede generar desde esta página.

   Un mismo pedido se puede mostrar de cuatro formas:
   1. NH.comprobante.html(pedido)     → documento para ver en pantalla / imprimir
   2. NH.comprobante.text(pedido)     → texto para el mensaje de WhatsApp
   3. NH.comprobante.image(pedido)    → imagen PNG (la dibuja con <canvas>)
   4. NH.comprobante.share(pedido)    → la comparte por WhatsApp
   Todas parten de datos(pedido), que ordena la información una sola vez.
   ============================================================ */
(() => {
  const { esc, money } = NH;

  // Logo pequeño incluido en el código para que el <canvas> pueda usarlo
  // (una imagen leída desde un archivo local impediría guardar el PNG).
  const LOGO = 'data:image/webp;base64,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';

  /* ---------- 1. Ordenar la información del pedido ---------- */
  function datos(o) {
    const s = NH.settings();
    const tieneSub = o.subtotal != null ? o.subtotal : NH.totales(o.items).sub;
    const sinPrecio = o.items.some((i) => i.price == null);
    const totales = [['Subtotal', sinPrecio ? 'por confirmar' : money(tieneSub)]];
    if (o.delivery) totales.push(['Envío', money(o.fee) || 'a coordinar']);
    totales.push(['Total', money(o.total) || 'por confirmar', 'fuerte']);
    if (o.advance != null) {
      totales.push([`Adelanto Yape (${o.advancePct}%)`, money(o.advance)]);
      totales.push(['Estado del adelanto', o.advancePaid ? 'recibido' : 'pendiente']);
      totales.push(['Saldo por pagar', money(o.balance), 'fuerte']);
    }
    return {
      numero: o.id,
      fecha: new Date(o.date).toLocaleDateString('es-BO'),
      negocio: { nombre: s.name, direccion: s.address, whatsapp: s.whatsapp.replace(/^591/, ''), nit: s.businessNit },
      cliente: [['Cliente', o.name], ['NIT / CI', o.nit], ['Celular', o.phone], ['Entrega', o.mode], ['Zona', o.zone]].filter((f) => f[1]),
      lineas: o.items.map((i) => [String(i.qty), i.name, money(i.price) || '—', i.price != null ? money(i.price * i.qty) : 'por confirmar']),
      totales,
      pago: o.payment || '',
      notas: o.note || ''
    };
  }

  /* ---------- 2. Documento HTML (pantalla e impresión) ---------- */
  const ESTILO = `<style>
    .cmp{font:14px/1.5 system-ui,Arial,sans-serif;color:#18221a;background:#fff;max-width:640px;margin:0 auto;padding:28px;border:1px solid #d9dfc6;border-radius:14px}
    .cmp-top{display:flex;gap:14px;align-items:center;border-bottom:3px solid #24421f;padding-bottom:14px}
    .cmp-top img{width:56px;height:56px;border-radius:50%}
    .cmp-top b{display:block;font:700 20px Georgia,serif;color:#24421f}.cmp-top small{color:#55624c}
    .cmp-top div:last-child{margin-left:auto;text-align:right}.cmp-top h2{font:700 13px system-ui,sans-serif;letter-spacing:.06em;margin:0}
    .cmp-cli{margin:16px 0;display:grid;gap:3px}.cmp-cli span{color:#55624c;display:inline-block;min-width:84px}
    .cmp table{width:100%;border-collapse:collapse;margin:8px 0}.cmp th{background:#e1e9cf;text-align:left;padding:8px;font-size:12px}
    .cmp td{padding:8px;border-bottom:1px solid #e3e6d6}.cmp .r{text-align:right}
    .cmp-tot{margin:12px 0 0 auto;max-width:300px}.cmp-tot div{display:flex;justify-content:space-between;gap:16px;padding:3px 0}
    .cmp-tot .fuerte{font-weight:700;border-top:1px solid #d9dfc6;margin-top:4px;padding-top:6px}
    .cmp-pie{margin-top:18px;padding-top:12px;border-top:1px dashed #b9c4a0;color:#55624c;font-size:12px}
    @media print{.cmp{border:0;padding:0}}
  </style>`;

  function html(o) {
    const d = datos(o), n = d.negocio;
    return `${ESTILO}<article class="cmp">
      <header class="cmp-top"><img src="${LOGO}" alt="">
        <div><b>${esc(n.nombre)}</b><small>${esc(n.direccion)} · WhatsApp ${esc(n.whatsapp)}${n.nit ? ` · NIT ${esc(n.nit)}` : ''}</small></div>
        <div><h2>COMPROBANTE DE PEDIDO</h2><small>N.º ${esc(d.numero)} · ${esc(d.fecha)}</small></div></header>
      <div class="cmp-cli">${d.cliente.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>
      <table><thead><tr><th>Cant.</th><th>Detalle</th><th class="r">P. unit.</th><th class="r">Importe</th></tr></thead>
        <tbody>${d.lineas.map((l) => `<tr><td>${esc(l[0])}</td><td>${esc(l[1])}</td><td class="r">${esc(l[2])}</td><td class="r">${esc(l[3])}</td></tr>`).join('')}</tbody></table>
      <div class="cmp-tot">${d.totales.map(([k, v, f]) => `<div class="${f || ''}"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}</div>
      ${d.pago ? `<p><b>Forma de pago:</b> ${esc(d.pago)}</p>` : ''}${d.notas ? `<p><b>Notas:</b> ${esc(d.notas)}</p>` : ''}
      <footer class="cmp-pie">¡Gracias por tu compra! Este documento es un comprobante de pedido y no reemplaza una factura fiscal.</footer></article>`;
  }

  /* ---------- 3. Texto para WhatsApp ---------- */
  function text(o) {
    const d = datos(o);
    return [`*${d.negocio.nombre}* — Comprobante de pedido`, `N.º ${d.numero} · ${d.fecha}`, '',
      ...d.cliente.map(([k, v]) => `${k}: ${v}`), '',
      ...d.lineas.map((l) => `• ${l[1]} × ${l[0]} — ${l[3]}`), '',
      ...d.totales.map(([k, v, f]) => (f ? `*${k}: ${v}*` : `${k}: ${v}`)),
      ...(d.pago ? ['', `Pago: ${d.pago}`] : []), '', '¡Gracias por tu compra!',
      '(Comprobante de pedido, no es factura fiscal)'].join('\n');
  }

  /* ---------- 4. Imagen PNG (dibujada con canvas) ---------- */
  const cargar = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  // Recorta un texto con "…" si no cabe en el ancho dado.
  const ajustar = (ctx, t, ancho) => { while (t.length > 1 && ctx.measureText(t).width > ancho) t = t.slice(0, -2) + '…'; return t; };

  async function image(o) {
    const d = datos(o), W = 800, M = 40, ESC = 2;
    const alto = 150 + d.cliente.length * 28 + 60 + d.lineas.length * 38 + d.totales.length * 34 + (d.pago ? 40 : 0) + (d.notas ? 40 : 0) + 110;
    const c = document.createElement('canvas'); c.width = W * ESC; c.height = alto * ESC;
    const g = c.getContext('2d'); g.scale(ESC, ESC);
    const texto = (t, x, y, { fuente = '15px system-ui, Arial, sans-serif', color = '#18221a', alinear = 'left', max } = {}) => {
      g.font = fuente; g.fillStyle = color; g.textAlign = alinear; g.fillText(max ? ajustar(g, t, max) : t, x, y);
    };
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, alto);

    // Franja verde con logo y datos del negocio
    g.fillStyle = '#24421f'; g.fillRect(0, 0, W, 108);
    const logo = await cargar(LOGO);
    if (logo) { g.save(); g.beginPath(); g.arc(M + 30, 52, 30, 0, Math.PI * 2); g.clip(); g.drawImage(logo, M, 22, 60, 60); g.restore(); }
    texto(d.negocio.nombre, M + 76, 50, { fuente: 'bold 26px Georgia, serif', color: '#fff' });
    texto(d.negocio.direccion, M + 76, 68, { fuente: '13px system-ui, Arial, sans-serif', color: '#cfdcba', max: 430 });
    texto(`WhatsApp ${d.negocio.whatsapp}${d.negocio.nit ? ` · NIT ${d.negocio.nit}` : ''}`, M + 76, 88, { fuente: '13px system-ui, Arial, sans-serif', color: '#cfdcba', max: 430 });
    texto('COMPROBANTE DE PEDIDO', W - M, 46, { fuente: 'bold 14px system-ui, Arial, sans-serif', color: '#c8a45a', alinear: 'right' });
    texto(`N.º ${d.numero} · ${d.fecha}`, W - M, 74, { fuente: '14px system-ui, Arial, sans-serif', color: '#fff', alinear: 'right' });

    // Datos del cliente
    let y = 144;
    d.cliente.forEach(([k, v]) => { texto(k, M, y, { color: '#55624c' }); texto(v, M + 110, y, { fuente: 'bold 15px system-ui, Arial, sans-serif', max: W - 2 * M - 110 }); y += 28; });

    // Tabla de plantas
    y += 14; g.fillStyle = '#e1e9cf'; g.fillRect(M, y - 22, W - 2 * M, 34);
    const fh = 'bold 12px system-ui, Arial, sans-serif';
    texto('CANT.', M + 10, y, { fuente: fh }); texto('DETALLE', M + 80, y, { fuente: fh });
    texto('P. UNIT.', W - M - 150, y, { fuente: fh, alinear: 'right' }); texto('IMPORTE', W - M - 10, y, { fuente: fh, alinear: 'right' });
    y += 36;
    d.lineas.forEach((l) => {
      texto(l[0], M + 10, y); texto(l[1], M + 80, y, { max: 380 });
      texto(l[2], W - M - 150, y, { alinear: 'right' }); texto(l[3], W - M - 10, y, { alinear: 'right' });
      g.strokeStyle = '#e3e6d6'; g.beginPath(); g.moveTo(M, y + 12); g.lineTo(W - M, y + 12); g.stroke(); y += 38;
    });

    // Totales
    y += 14;
    d.totales.forEach(([k, v, f]) => {
      const fuente = f ? 'bold 17px system-ui, Arial, sans-serif' : '15px system-ui, Arial, sans-serif';
      texto(k, W - M - 340, y, { fuente, color: f ? '#18221a' : '#55624c' }); texto(v, W - M - 10, y, { fuente, alinear: 'right' }); y += 34;
    });
    if (d.pago) { y += 6; texto(`Forma de pago: ${d.pago}`, M, y, { fuente: 'bold 14px system-ui, Arial, sans-serif', max: W - 2 * M }); y += 34; }
    if (d.notas) texto(`Notas: ${d.notas}`, M, y, { max: W - 2 * M });

    // Pie
    g.strokeStyle = '#b9c4a0'; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(M, alto - 78); g.lineTo(W - M, alto - 78); g.stroke(); g.setLineDash([]);
    texto('¡Gracias por tu compra!', M, alto - 48, { fuente: 'bold 15px system-ui, Arial, sans-serif', color: '#24421f' });
    texto('Este documento es un comprobante de pedido y no reemplaza una factura fiscal.', M, alto - 24, { fuente: '12px system-ui, Arial, sans-serif', color: '#55624c' });
    return new Promise((ok) => c.toBlob(ok, 'image/png'));
  }

  /* ---------- Acciones: descargar, compartir, imprimir ---------- */
  const nombreArchivo = (o) => `comprobante-${o.id}.png`;
  const descargarBlob = (blob, nombre) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };
  const descargar = async (o) => descargarBlob(await image(o), nombreArchivo(o));

  // En celulares con "compartir archivos" abre la lista de apps (se elige WhatsApp y se envía la imagen).
  // En computadora: descarga la imagen y abre el chat de WhatsApp con el texto para que se adjunte.
  // Devuelve 'compartido', 'descargado' o 'cancelado'.
  async function share(o) {
    const blob = await image(o), nombre = nombreArchivo(o);
    const archivo = new File([blob], nombre, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try { await navigator.share({ files: [archivo], text: text(o) }); return 'compartido'; }
      catch (e) { if (e.name === 'AbortError') return 'cancelado'; }
    }
    descargarBlob(blob, nombre);
    window.open(NH.waTo(o.phone, text(o)), '_blank', 'noopener');
    return 'descargado';
  }

  // Imprime (o guarda como PDF) usando un iframe invisible para no abrir ventanas nuevas.
  function print(o) {
    const marco = document.createElement('iframe');
    marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(marco);
    const doc = marco.contentDocument;
    doc.open(); doc.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Comprobante ${esc(o.id)}</title></head><body style="margin:0">${html(o)}</body></html>`); doc.close();
    setTimeout(() => { marco.contentWindow.focus(); marco.contentWindow.print(); setTimeout(() => marco.remove(), 2000); }, 300);
  }

  NH.comprobante = { html, text, image, share, print, download: descargar };
})();
