/* ============================================================
   ANIMACIONES.JS  ·  Todo el movimiento que hace JavaScript
   ------------------------------------------------------------
   (Las animaciones de CSS, como el sello giratorio, están en
   css/layout.css y css/componentes.css.)

   1. Aparecer al hacer scroll: los elementos con data-r entran
      suavemente cuando llegan a la pantalla.
   2. Fotos rotativas: las tarjetas con varias fotos cambian de
      foto solas cada 3,5 segundos.
   ============================================================ */
(() => {
  const { $$ } = NH;

  /* ---------- 1. Aparecer al hacer scroll ---------- */
  // IntersectionObserver avisa cuando un elemento entra en la pantalla.
  const observador = 'IntersectionObserver' in window
    ? new IntersectionObserver((entradas) => entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');          // la clase "in" activa la animación en CSS
        observador.unobserve(e.target);        // ya apareció: dejamos de vigilarlo
        setTimeout(() => e.target.removeAttribute('data-r'), 900);
      }), { threshold: 0.12, rootMargin: '0px 0px -40px' })
    : null;

  // Prepara los elementos de una zona (por defecto, toda la página).
  NH.reveal = (raiz = document) => {
    // Los hijos de [data-stagger] entran uno tras otro (efecto escalonado).
    $$('[data-stagger]', raiz).forEach((padre) => [...padre.children].forEach((hijo, i) => {
      hijo.dataset.r = '';
      hijo.style.setProperty('--i', Math.min(i, 8));
    }));
    $$('[data-r]', raiz).forEach((el) => (observador ? observador.observe(el) : el.classList.add('in')));
  };

  /* ---------- 2. Fotos rotativas ---------- */
  // Muestra la foto número "ir" (o la siguiente si no se indica) dentro de una caja.
  NH.step = (caja, ir) => {
    const fotos = $$('img', caja);
    const actual = fotos.findIndex((f) => f.classList.contains('on'));
    const nueva = ir ?? (actual + 1) % fotos.length;
    fotos.forEach((f, i) => f.classList.toggle('on', i === nueva));
    $$('.dots button', caja).forEach((p, i) => p.setAttribute('aria-current', i === nueva));
  };

  // Cada 3,5 s avanza todas las cajas con varias fotos (data-rot),
  // con un pequeño desfase para que no cambien todas a la vez.
  // Si la persona pidió "reducir movimiento" en su dispositivo, no rota.
  const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducirMovimiento) {
    setInterval(() => {
      if (document.hidden) return;
      $$('[data-rot]').forEach((caja, i) => setTimeout(() => NH.step(caja), (i % 4) * 250));
    }, 3500);
  }
})();
