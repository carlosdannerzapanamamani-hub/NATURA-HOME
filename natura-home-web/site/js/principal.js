/* ============================================================
   PRINCIPAL.JS  ·  El "director de orquesta"
   ------------------------------------------------------------
   Es el último archivo que se carga. Hace dos cosas:
   1. Escucha TODOS los clics de la página y decide qué hacer
      según el botón tocado (usa los atributos data-... del HTML).
   2. Arranca: dibuja el carrito y activa las animaciones.

   Tabla de botones:
     data-add="id"   → agregar planta al pedido
     data-view="id"  → abrir el detalle de la planta
     data-q / data-rm→ sumar/restar o eliminar en el carrito
     data-dot="n"    → ir a la foto número n
     data-close      → cerrar ventanas
   ============================================================ */
(() => {
  const { $ } = NH;

  document.addEventListener('click', (e) => {
    const t = e.target;
    const en = (selector) => t.closest(selector); // ¿el clic fue dentro de este selector?

    if (en('#openCart')) { NH.renderCart(); NH.openDrawer(); }
    else if (en('#closeCart') || t === NH.el.veil || t === NH.el.modal) NH.closeAll();
    else if (en('[data-add]')) {
      const b = en('[data-add]');
      NH.addToCart(b.dataset.add);
      NH.toast(`${NH.byId(b.dataset.add).name} se agregó al pedido`);
      if (b.hasAttribute('data-close')) NH.closeAll();
    }
    else if (en('[data-view]')) NH.viewProduct(en('[data-view]').dataset.view);
    else if (en('[data-dot]')) NH.step(en('.gal'), +en('[data-dot]').dataset.dot);
    else if (en('[data-close]')) NH.closeAll();
    else if (en('[data-q]')) NH.addToCart(en('[data-q]').dataset.q, +en('[data-q]').dataset.d);
    else if (en('[data-rm]')) NH.addToCart(en('[data-rm]').dataset.rm, -999);
    else if (en('#checkout')) NH.checkout();
    else if (en('#burger')) { // menú en celular
      const abierto = $('#nav').classList.toggle('on');
      $('#burger').setAttribute('aria-expanded', abierto);
    }
  });

  // Tecla Escape cierra el carrito y las ventanas.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') NH.closeAll(); });

  // Arranque
  NH.renderCart();
  NH.reveal();
})();
