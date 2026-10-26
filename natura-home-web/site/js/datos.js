/* ============================================================
   DATOS.JS  ·  La "base de datos" de la página
   ------------------------------------------------------------
   Qué hace:
   1. Guarda los productos, tipos y ajustes que vienen por defecto.
   2. Los lee y los guarda en el navegador (localStorage).
   3. Ofrece funciones que usan los demás archivos: NH.products(),
      NH.types(), NH.settings(), NH.orders(), NH.cart(), NH.save()...

   Cada planta tiene:
     type    → su TIPO (uno solo): Medicinales, Aromáticas, Flores...
     places  → dónde puede estar: Exteriores y/o Interiores
     stock   → unidades disponibles (vacío = sin control de stock)
   Los tipos se administran desde el panel (pestaña "Tipos").
   ============================================================ */
(() => {
  const PLACES = ['Exteriores', 'Interiores'];
  const VERSION = '3'; // sube cuando cambia la forma de guardar los datos (migración)

  // P() crea un producto con todos sus campos.
  const P = (id, name, type, places, description, n, light, water, featured = false) => ({
    id, name, type, places, description, image: `assets/images/plant-${n}.svg`,
    price: null, stock: null, available: true, featured, light, water
  });

  // Valores iniciales.
  const DEFAULTS = {
    settings: {
      name: 'Natura & Home', whatsapp: '59167206132', hours: 'Todos los días, de 08:00 a 19:00',
      address: 'Bella Vista, El Alto, Bolivia', announce: 'Pedidos por WhatsApp. Atención todos los días de 08:00 a 19:00',
      facebook: '', tiktok: '', password: 'natura2026', currency: 'Bs',
      deliveryFee: '',  // costo de envío (vacío = "a coordinar")
      payments: '',     // otras formas de pago separadas por coma, ej: Efectivo (vacío = ninguna)
      yapeNumber: '',   // número de Yape (junto con el QR, activa el pago por Yape en el carrito)
      yapeName: '',     // nombre del titular de Yape
      yapePercent: '50', // porcentaje del pedido que se pide como adelanto
      businessNit: ''   // NIT del negocio (opcional, aparece en el comprobante)
    },
    types: [
      { name: 'Medicinales', desc: 'Tradición natural en casa' },
      { name: 'Aromáticas', desc: 'Aromas para tu cocina y tus espacios' },
      { name: 'Flores', desc: 'Color para jardines, macetas y balcones' }
    ],
    products: [
      P('ajenjo', 'Ajenjo', 'Medicinales', ['Exteriores'], 'Planta aromática tradicional que puede cultivarse en casa.', 1, 'Sol directo', 'Moderado', true),
      P('ruda', 'Ruda', 'Medicinales', ['Exteriores'], 'Planta aromática conocida por su presencia en jardines y espacios naturales.', 2, 'Sol directo', 'Poco', true),
      P('romero', 'Romero', 'Aromáticas', ['Exteriores', 'Interiores'], 'Planta aromática versátil, apreciada por su aroma y su lugar en el hogar.', 3, 'Sol pleno', 'Poco', true),
      P('cedron', 'Cedrón', 'Aromáticas', ['Exteriores', 'Interiores'], 'Planta de agradable fragancia para tener cerca de casa.', 4, 'Sol / luz brillante', 'Regular', true),
      P('toronjil', 'Toronjil', 'Aromáticas', ['Exteriores', 'Interiores'], 'Planta aromática tradicionalmente apreciada por su agradable aroma.', 5, 'Semisombra', 'Regular'),
      P('rosa', 'Rosa', 'Flores', ['Exteriores'], 'Planta de flores clásicas, muy apreciada en jardines, entradas y patios.', 6, 'Sol directo', 'Regular'),
      P('geranio-nacional', 'Geranio nacional', 'Flores', ['Exteriores', 'Interiores'], 'Geranio de hojas redondeadas y floración constante, ideal para macetas al aire libre.', 7, 'Sol / luz brillante', 'Moderado'),
      P('geranio-japones', 'Geranio japonés', 'Flores', ['Exteriores', 'Interiores'], 'Geranio de porte compacto y follaje perfumado, perfecto para balcones y terrazas.', 8, 'Sol / luz brillante', 'Moderado'),
      P('margarita', 'Margarita', 'Flores', ['Exteriores'], 'Planta de flores alegres y resistentes, habitual en jardines y macetas exteriores.', 9, 'Sol directo', 'Regular'),
      P('hierbabuena', 'Hierbabuena', 'Aromáticas', ['Interiores', 'Exteriores'], 'Planta aromática de hojas frescas, fácil de tener en maceta.', 3, 'Luz brillante o semisombra', 'Regular'),
      P('menta', 'Menta', 'Aromáticas', ['Interiores', 'Exteriores'], 'Planta aromática de aroma fresco, que crece bien en macetas.', 4, 'Luz brillante o semisombra', 'Regular'),
      P('manzanilla', 'Manzanilla', 'Aromáticas', ['Exteriores'], 'Planta de flores pequeñas y aroma suave, habitual en jardines y huertos.', 9, 'Sol directo', 'Moderado'),
      P('lavanda', 'Lavanda', 'Aromáticas', ['Exteriores'], 'Planta aromática de flores moradas y perfume duradero, ideal para el sol.', 5, 'Sol pleno', 'Poco'),
      P('albahaca', 'Albahaca', 'Aromáticas', ['Interiores'], 'Planta aromática de hojas verdes y aroma intenso, para tener cerca de la cocina.', 1, 'Luz brillante y abrigada', 'Regular'),
      P('oregano', 'Orégano', 'Aromáticas', ['Interiores', 'Exteriores'], 'Planta aromática resistente, muy usada en la cocina de casa.', 2, 'Sol directo', 'Poco'),
      P('muna', 'Muña', 'Aromáticas', ['Exteriores'], 'Planta aromática andina de aroma intenso, tradicional en los hogares de la región.', 8, 'Sol directo', 'Moderado')
    ],
    orders: [], cart: {}, customer: {}, yapeqr: ''
  };

  // read/write: leen y guardan en localStorage con el prefijo "nh_" (Natura & Home).
  const read = (k) => { try { const v = localStorage.getItem('nh_' + k); return v ? JSON.parse(v) : structuredClone(DEFAULTS[k]); } catch (e) { return structuredClone(DEFAULTS[k]); } };
  const write = (k, v) => { try { localStorage.setItem('nh_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  // Migración: actualiza datos guardados con versiones anteriores del sitio (una sola vez).
  function migrar() {
    try {
      const anterior = localStorage.getItem('nh_cat');
      if (anterior === VERSION) return;
      const crudo = localStorage.getItem('nh_products');
      if (crudo) {
        const lista = JSON.parse(crudo), ids = new Set(lista.map((p) => p.id));
        if (anterior !== '2') DEFAULTS.products.forEach((p) => { if (!ids.has(p.id)) lista.push(p); });
        lista.forEach((p) => {
          if (!p.type) { // formato antiguo: "categories" mezclaba tipo y lugar
            const cats = (p.categories || []).map((c) => (c === 'Para el hogar' ? 'Interiores' : c));
            p.places = cats.filter((c) => PLACES.includes(c));
            p.type = cats.find((c) => !PLACES.includes(c)) || 'Flores';
            delete p.categories;
          }
          if (p.stock === undefined) p.stock = null;
        });
        write('products', lista);
      }
      localStorage.setItem('nh_cat', VERSION);
    } catch (e) {}
  }

  // Todo lo que otros archivos pueden usar queda dentro del objeto NH.
  window.NH = {
    defaults: DEFAULTS,
    PLACES,
    settings: () => ({ ...DEFAULTS.settings, ...read('settings') }),
    products() { migrar(); return read('products'); },
    // Tipos en orden. Si una planta usa un tipo que no está en la lista, se agrega solo.
    types() {
      const lista = read('types'), nombres = new Set(lista.map((t) => t.name));
      this.products().forEach((p) => { if (p.type && !nombres.has(p.type)) { lista.push({ name: p.type, desc: '' }); nombres.add(p.type); } });
      return lista;
    },
    orders: () => read('orders'),
    cart: () => read('cart'),
    customer: () => read('customer'),
    save: write,
    imgs: (p) => (p.images && p.images.length ? p.images : [p.image]),
    // ¿Se puede comprar? (marcada disponible y con stock, si lleva control de stock)
    avail: (p) => p.available && (p.stock == null || p.stock > 0),
    // Texto "Exteriores / Interiores" según dónde puede estar la planta.
    place: (p) => (p.places || []).join(' / ') || '—',
    // Máximo de unidades que se pueden pedir.
    maxQty: (p) => (p.stock == null ? 99 : p.stock),
    // ---- Pago por Yape ----
    yapeQr: () => read('yapeqr'),                    // imagen del QR (la sube el administrador)
    yapeOn() { return !!(read('yapeqr') || this.settings().yapeNumber); },
    yapePct() { const n = Number(this.settings().yapePercent); return n > 0 && n <= 100 ? n : 50; },
    // Formas de pago que ve el cliente: Yape (si está activo) + las que se escribieron en Ajustes.
    payOptions() {
      const lista = [];
      if (this.yapeOn()) lista.push({ value: 'yape', label: `Yape (adelanto del ${this.yapePct()}%)` });
      this.settings().payments.split(',').map((x) => x.trim()).filter(Boolean).forEach((p) => lista.push({ value: p, label: p }));
      if (lista.length === 1 && lista[0].value === 'yape') lista.push({ value: 'coordinar', label: 'Coordinar el pago por WhatsApp' });
      return lista;
    },
    // Formas de entrega.
    modos() { return [{ id: 'recojo', label: `Recojo en ${this.settings().address.split(',')[0]}` }, { id: 'envio', label: 'Envío en El Alto' }]; },

    // Cuentas del pedido: subtotal, envío, total y, si se paga por Yape, adelanto y saldo.
    // items = [{ price, qty }]. El adelanto solo se calcula si el total ya es conocido.
    totales(items, { envio = false, fee = null, yape = false } = {}) {
      const r2 = (n) => Math.round(n * 100) / 100;
      const conPrecio = items.filter((i) => i.price != null);
      const sub = r2(conPrecio.reduce((a, i) => a + i.price * i.qty, 0));
      const sinPrecio = items.length - conPrecio.length;
      const total = sinPrecio === 0 && (!envio || fee != null) ? r2(sub + (envio ? fee : 0)) : null;
      const pct = this.yapePct();
      const adelanto = yape && total != null ? r2(total * pct / 100) : null;
      return { sub, sinPrecio, fee: envio ? fee : null, total, pct, adelanto, saldo: adelanto != null ? r2(total - adelanto) : null };
    },

    // Arma el pedido completo (lo usan el carrito y el panel al registrar a mano).
    newOrder({ prefix = 'P', name, phone = '', nit = '', delivery = false, zone = '', payValue = '', note = '', items, fee, totalManual = null, declaredPaid = false }) {
      const s = this.settings(), r2 = (n) => Math.round(n * 100) / 100;
      const modo = this.modos().find((m) => m.id === (delivery ? 'envio' : 'recojo'));
      const tarifa = fee !== undefined ? fee : (s.deliveryFee !== '' && !isNaN(+s.deliveryFee) ? +s.deliveryFee : null);
      const opcion = this.payOptions().find((o) => o.value === payValue);
      const yape = payValue === 'yape' && this.yapeOn();
      const t = this.totales(items, { envio: delivery, fee: tarifa, yape });
      if (totalManual != null) { // total acordado a mano
        t.total = totalManual;
        if (yape) { t.adelanto = r2(totalManual * t.pct / 100); t.saldo = r2(totalManual - t.adelanto); }
      }
      return {
        id: prefix + Date.now().toString(36).toUpperCase(), date: new Date().toISOString(),
        name, phone, nit, mode: modo.label, delivery, zone: delivery ? zone : '',
        payment: opcion ? opcion.label : '', payMethod: payValue, note, items,
        subtotal: t.sub, fee: t.fee, total: t.total,
        advance: t.adelanto, advancePct: yape ? t.pct : null, balance: t.saldo,
        advanceDeclared: yape ? declaredPaid : false, advancePaid: false, status: 'Nuevo'
      };
    },

    // Enlace de WhatsApp a un número (8 dígitos = celular de Bolivia) o, sin número, para elegir contacto.
    waTo(phone, text) {
      let n = String(phone || '').replace(/\D/g, '');
      if (n.length === 8) n = '591' + n;
      return `https://wa.me/${n}${text ? '?text=' + encodeURIComponent(text) : ''}`;
    },
    reset: (k) => { try { localStorage.removeItem('nh_' + k); } catch (e) {} },
    esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    money: (p) => (p == null || p === '' ? null : `${NH.settings().currency} ${Number(p).toFixed(2).replace(/\.00$/, '')}`),
    wa: (text) => `https://wa.me/${NH.settings().whatsapp}${text ? '?text=' + encodeURIComponent(text) : ''}`
  };
})();
