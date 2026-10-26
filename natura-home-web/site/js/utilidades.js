/* ============================================================
   UTILIDADES.JS  ·  Herramientas pequeñas que usan todos los demás
   ------------------------------------------------------------
   Aquí viven:
   - $ y $$ : atajos para buscar elementos en la página.
   - NH.state : la lista de productos y el carrito en memoria.
   - NH.toast : el mensaje flotante ("Ruda se agregó al pedido").
   - NH.icons : los dibujos (SVG) del carrito y del chat.
   ============================================================ */
(() => {
  // CSS usa la clase "js" para activar las animaciones de entrada.
  document.documentElement.classList.add('js');

  // $('.clase') devuelve UN elemento; $$('.clase') devuelve una LISTA.
  NH.$ = (selector, raiz = document) => raiz.querySelector(selector);
  NH.$$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

  // Estado compartido: se carga una vez y todos los archivos lo consultan.
  NH.state = { products: NH.products(), cart: NH.cart() };
  NH.byId = (id) => NH.state.products.find((p) => p.id === id);

  // Mensaje flotante: aparece 2,2 segundos y se oculta solo.
  let temporizador;
  NH.toast = (mensaje) => {
    const t = NH.$('#toast');
    t.textContent = mensaje;
    t.classList.add('on');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => t.classList.remove('on'), 2200);
  };

  // Iconos dibujados en SVG (no necesitan archivos de imagen).
  const svg = (trazo) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${trazo}"/></svg>`;
  NH.icons = {
    bag: svg('M6 8h12l-1 12H7L6 8zM9 8a3 3 0 016 0'),
    chat: svg('M21 12a8 8 0 01-11.8 7L4 20l1.2-4.6A8 8 0 1121 12z')
  };
})();
