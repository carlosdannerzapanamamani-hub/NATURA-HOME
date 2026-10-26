/* ============================================================
   PAGINAS.JS  ·  Lo que es propio de cada página
   ------------------------------------------------------------
   Cada bloque solo funciona si la página tiene su contenedor:
   1. Inicio       → #featured, #typeRows, #placeLinks
   2. Catálogo     → #catalog (plantas separadas por TIPO + filtros)
   3. Cuidados     → #careList (luz y riego, también por tipo)
   4. Contacto     → #contactForm (mensaje a WhatsApp)
   5. Textos que se rellenan solos (data-s, data-wa)
   ============================================================ */
(() => {
  const { $, $$, esc } = NH;
  const plantas = NH.state.products;
  const S = NH.settings();
  const plural = (n) => `${n} ${n === 1 ? 'planta' : 'plantas'}`;

  // Cabecera de una sección de tipo: nombre, descripción y cantidad.
  const cabeceraTipo = (g) => `<div class="thead"><div><h2>${esc(g.name)}</h2>${g.desc ? `<p>${esc(g.desc)}</p>` : ''}</div><span class="tcount">${plural(g.plantas.length)}</span></div>`;

  /* ---------- 1. Inicio ---------- */
  const destacadas = $('#featured');
  if (destacadas) destacadas.innerHTML = plantas.filter((p) => p.featured && NH.avail(p)).slice(0, 4).map(NH.card).join('');

  // Filas por tipo (salen de la lista de tipos del panel).
  const filas = $('#typeRows');
  if (filas) {
    filas.innerHTML = NH.groupByType(plantas).map((g) =>
      `<a class="rl" href="catalogo.html?tipo=${encodeURIComponent(g.name)}"><span class="rn">${esc(g.name)}</span><p>${esc(g.desc)}</p><span class="rc">${plural(g.plantas.length)}</span></a>`).join('');
  }
  const lugares = $('#placeLinks');
  if (lugares) {
    lugares.innerHTML = NH.PLACES.map((l) =>
      `<a class="pill" href="catalogo.html?lugar=${encodeURIComponent(l)}">${esc(l)} · ${plantas.filter((p) => p.places.includes(l)).length}</a>`).join('');
  }

  /* ---------- 2. Catálogo ---------- */
  const catalogo = $('#catalog');
  if (catalogo) {
    const tipos = NH.types().filter((t) => plantas.some((p) => p.type === t.name)).map((t) => t.name);
    const params = new URLSearchParams(location.search);
    // ?tipo=Aromáticas&lugar=Interiores (también acepta el antiguo ?cat=)
    let tipo = params.get('tipo') || params.get('cat');
    if (!tipos.includes(tipo)) tipo = 'Todas';
    const lugaresSel = new Set(NH.PLACES.filter((l) => params.get('lugar') === l || params.get('cat') === l));

    // Botones de tipo (con cantidad) y de lugar.
    $('#pills').innerHTML = ['Todas', ...tipos].map((t) => {
      const n = t === 'Todas' ? plantas.length : plantas.filter((p) => p.type === t).length;
      return `<button class="pill" data-tipo="${esc(t)}" aria-pressed="${t === tipo}">${esc(t)} <small>${n}</small></button>`;
    }).join('');
    $('#places').innerHTML = NH.PLACES.map((l) => `<button class="pill" data-lugar="${l}" aria-pressed="${lugaresSel.has(l)}">${l}</button>`).join('');

    // dibujar(): filtra → ordena → separa por tipo → pinta.
    const dibujar = () => {
      const texto = $('#q').value.trim().toLowerCase(), orden = $('#sort').value, solo = $('#onlyAvail').checked;
      const lista = plantas.filter((p) =>
        (tipo === 'Todas' || p.type === tipo) &&
        (!lugaresSel.size || p.places.some((l) => lugaresSel.has(l))) &&
        (!solo || NH.avail(p)) &&
        (!texto || `${p.name} ${p.description} ${p.type}`.toLowerCase().includes(texto)));

      if (orden === 'az') lista.sort((a, b) => a.name.localeCompare(b.name));
      if (orden === 'precio') lista.sort((a, b) => (a.price ?? 1e9) - (b.price ?? 1e9));
      if (orden === 'disp') lista.sort((a, b) => NH.avail(b) - NH.avail(a));

      const grupos = NH.groupByType(lista);
      $('#count').textContent = `${plural(lista.length)}${grupos.length > 1 ? ` en ${grupos.length} tipos` : ''}`;
      const filtrado = tipo !== 'Todas' || lugaresSel.size || solo || texto;
      $('#clearF').hidden = !filtrado;

      catalogo.innerHTML = grupos.length
        ? grupos.map((g) => `<section class="tsec" id="tipo-${esc(g.name)}">${cabeceraTipo(g)}<div class="grid g4 pgrid">${g.plantas.map(NH.card).join('')}</div></section>`).join('')
        : '<div class="empty"><img src="assets/logo-mark.webp" alt=""><h3>No encontramos plantas</h3><p>Prueba con otra palabra o quita algún filtro.</p><button class="btn sm" data-clear style="margin-top:16px">Limpiar filtros</button></div>';
      NH.reveal(catalogo);
      try { // deja la dirección compartible (?tipo=…&lugar=…)
        const u = new URLSearchParams();
        if (tipo !== 'Todas') u.set('tipo', tipo);
        if (lugaresSel.size === 1) u.set('lugar', [...lugaresSel][0]);
        history.replaceState(null, '', u.toString() ? `?${u}` : location.pathname);
      } catch (e) { /* algunos navegadores no permiten esto al abrir el archivo directamente */ }
    };

    const limpiar = () => {
      tipo = 'Todas'; lugaresSel.clear(); $('#q').value = ''; $('#onlyAvail').checked = false; $('#sort').value = '';
      $$('[data-tipo]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tipo === 'Todas'));
      $$('[data-lugar]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      dibujar();
    };

    $('#pills').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tipo]'); if (!b) return;
      tipo = b.dataset.tipo; $$('[data-tipo]').forEach((x) => x.setAttribute('aria-pressed', x === b)); dibujar();
    });
    $('#places').addEventListener('click', (e) => {
      const b = e.target.closest('[data-lugar]'); if (!b) return;
      lugaresSel.has(b.dataset.lugar) ? lugaresSel.delete(b.dataset.lugar) : lugaresSel.add(b.dataset.lugar);
      b.setAttribute('aria-pressed', lugaresSel.has(b.dataset.lugar)); dibujar();
    });
    $('#q').addEventListener('input', dibujar);
    $('#sort').addEventListener('change', dibujar);
    $('#onlyAvail').addEventListener('change', dibujar);
    $('#clearF').addEventListener('click', limpiar);
    catalogo.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) limpiar(); });
    dibujar();
  }

  /* ---------- 3. Cuidados (separado por tipo) ---------- */
  const cuidados = $('#careList');
  if (cuidados) {
    cuidados.innerHTML = NH.groupByType(plantas).map((g) => `<section class="tsec">${cabeceraTipo(g)}<div class="grid g3">${g.plantas.map((p) => `
      <article class="card" data-r>
        <div style="display:flex;gap:16px;align-items:center">
          <img src="${esc(NH.imgs(p)[0])}" alt="" style="width:72px;height:72px;border-radius:14px;object-fit:cover">
          <div><h3>${esc(p.name)}</h3><small class="where">${esc(NH.place(p))}</small></div></div>
        <div class="care"><div><b>Luz</b>${esc(p.light || '—')}</div><div><b>Riego</b>${esc(p.water || '—')}</div><div><b>Lugar</b>${esc(NH.place(p))}</div></div></article>`).join('')}</div></section>`).join('');
    NH.reveal(cuidados);
  }

  /* ---------- 4. Contacto: el formulario abre WhatsApp ---------- */
  const formulario = $('#contactForm');
  if (formulario) {
    formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      const datos = new FormData(formulario);
      window.open(NH.wa(`Hola Natura & Home, soy ${datos.get('n')}. ${datos.get('m')}`), '_blank', 'noopener');
      NH.toast('Abriendo WhatsApp…');
      formulario.reset();
    });
  }

  /* ---------- 5. Textos que se rellenan solos ---------- */
  // <span data-s="hours"> muestra el horario guardado en Ajustes.
  $$('[data-s]').forEach((el) => { el.textContent = S[el.dataset.s]; });
  // <a data-wa="mensaje"> se convierte en un enlace a WhatsApp con ese mensaje.
  $$('[data-wa]').forEach((a) => { a.href = NH.wa(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
})();
