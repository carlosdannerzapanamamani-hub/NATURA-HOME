/* ============================================================
   PRODUCTOS.JS  ·  Cómo se dibuja una planta
   ------------------------------------------------------------
   1. NH.card(p)          → la tarjeta de una planta (inicio y catálogo).
   2. NH.actHTML(p)       → el botón "Agregar" o, si ya está en el
                            pedido, el contador  − 2 +  de la tarjeta.
   3. NH.syncActs()       → actualiza esos botones cuando cambia el carrito.
   4. NH.groupByType()    → separa una lista de plantas por TIPO.
   5. NH.viewProduct(id)  → ventana con el detalle de la planta.
   ============================================================ */
(() => {
  const { $, $$, esc, money } = NH;

  // Etiqueta de stock: "Quedan 3" solo cuando hay pocas unidades.
  const avisoStock = (p) => (p.stock != null && p.stock > 0 && p.stock <= 3 ? `Quedan ${p.stock}` : '');

  /* ---------- 2. Botón de la tarjeta (Agregar / contador) ---------- */
  NH.actHTML = (p) => {
    if (!NH.avail(p)) return '<button class="btn sm" disabled>Agotado</button>';
    const q = NH.state.cart[p.id] || 0;
    return q
      ? `<div class="stp" role="group" aria-label="Cantidad de ${esc(p.name)}"><button data-q="${p.id}" data-d="-1" aria-label="Quitar uno">−</button><b>${q}</b><button data-q="${p.id}" data-d="1" aria-label="Agregar uno">+</button></div>`
      : `<button class="btn sm" data-add="${p.id}">Agregar</button>`;
  };
  // Vuelve a dibujar solo esos botones (sin recargar toda la lista).
  NH.syncActs = () => $$('[data-act]').forEach((el) => {
    const p = NH.byId(el.dataset.act);
    if (p) el.innerHTML = NH.actHTML(p);
  });

  /* ---------- 1. Tarjeta de producto ---------- */
  NH.card = (p) => {
    const fotos = NH.imgs(p), poco = avisoStock(p);
    return `<article class="pcard" data-r>
      <button class="pimg" data-view="${p.id}"${fotos.length > 1 ? ' data-rot' : ''} aria-label="Ver ${esc(p.name)}">
        ${fotos.map((src, i) => `<img class="${i ? '' : 'on'}" src="${esc(src)}" alt="${i ? '' : esc(p.name)}" loading="lazy">`).join('')}
        <span class="tag">${esc(p.type)}</span>
        ${poco ? `<span class="low">${poco}</span>` : ''}
        ${NH.avail(p) ? '' : '<span class="soldout">Agotado</span>'}
      </button>
      <div class="pbody">
        <h3>${esc(p.name)}</h3>
        <small class="where">${esc(NH.place(p))}</small>
        <p>${esc(p.description)}</p>
        <div class="prow">
          <span class="price">${money(p.price) || '<small>Precio por confirmar</small>'}</span>
          <span data-act="${p.id}">${NH.actHTML(p)}</span>
        </div>
      </div></article>`;
  };

  /* ---------- 4. Separar por tipos ---------- */
  // Devuelve [{ name, desc, plantas }] en el orden de los tipos del panel; omite los vacíos.
  NH.groupByType = (lista) => NH.types()
    .map((t) => ({ ...t, plantas: lista.filter((p) => p.type === t.name) }))
    .filter((g) => g.plantas.length);

  /* ---------- 5. Ventana de detalle ---------- */
  NH.viewProduct = (id) => {
    const p = NH.byId(id);
    if (!p) return;
    const fotos = NH.imgs(p), poco = avisoStock(p);
    const galeria = `<div class="gal"${fotos.length > 1 ? ' data-rot' : ''}>
      ${fotos.map((src, i) => `<img class="${i ? '' : 'on'}" src="${esc(src)}" alt="${esc(p.name)}">`).join('')}
      ${fotos.length > 1 ? `<div class="dots">${fotos.map((_, i) => `<button data-dot="${i}" aria-label="Foto ${i + 1}" aria-current="${!i}"></button>`).join('')}</div>` : ''}
    </div>`;

    $('#mbox').innerHTML = `<button class="x" data-close aria-label="Cerrar">×</button>${galeria}
      <div class="mi">
        <span class="eyebrow">${esc(p.type)}${poco ? ` · ${poco}` : ''}</span>
        <h2 style="font-size:2rem">${esc(p.name)}</h2>
        <p style="color:var(--muted);margin:12px 0">${esc(p.description)}</p>
        <div class="care">
          <div><b>Luz</b>${esc(p.light || '—')}</div>
          <div><b>Riego</b>${esc(p.water || '—')}</div>
          <div><b>Lugar</b>${esc(NH.place(p))}</div>
        </div>
        <div class="prow" style="margin-top:22px">
          <span class="price" style="font-size:1.2rem">${money(p.price) || '<small>Precio por confirmar</small>'}</span>
          <button class="btn" data-add="${p.id}" data-close${NH.avail(p) ? '' : ' disabled'}>${NH.avail(p) ? 'Agregar al pedido' : 'Agotado'}</button>
        </div>
      </div>`;
    NH.openModal();
  };
})();
