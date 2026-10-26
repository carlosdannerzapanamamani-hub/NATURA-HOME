# Guía del código — Natura & Home

Sirve para **explicar el proyecto** en una exposición. Cada archivo hace una sola cosa y empieza con un comentario que dice qué hace.

## 1. Tecnologías
| Tecnología | Para qué sirve | Dónde |
|---|---|---|
| HTML | Estructura y textos de cada página | `*.html` |
| CSS | Diseño, colores, formas y animaciones | `css/` |
| JavaScript | Catálogo, carrito, filtros y panel de administración | `js/` |
| localStorage | Guarda datos en el navegador (sin servidor) | `js/datos.js` |

No usa frameworks ni instalación. Se abre `index.html` y funciona.

## 2. Estructura final de carpetas
```
index.html  catalogo.html  cuidados.html  como-comprar.html
nosotros.html  contacto.html          ← las 6 páginas de la tienda
admin.html                            ← panel de administración
css/
  base.css          variables de color, tipografía, reseteo, botones
  layout.css        cuadrículas, encabezado/menú, portada, franjas, pasos, pie, utilidades
  componentes.css   tarjetas de producto, filtros, formularios, carrito, ventana de detalle
  animaciones.css   @keyframes y entrada suave al hacer scroll
  responsive.css    adaptación a tablet y celular, "reducir movimiento"
  admin.css         solo el panel de administración
js/
  datos.js          datos iniciales, tipos, stock y guardado en el navegador
  utilidades.js     $ , aviso flotante, iconos, estado compartido
  estructura.js     dibuja anuncio, menú, pie, carrito lateral y ventanas
  animaciones.js    aparecer al hacer scroll y fotos que rotan
  productos.js      tarjeta de planta, contador, separar por tipo, detalle
  comprobante.js    comprobante de pedido: pantalla, texto, imagen PNG, WhatsApp, imprimir
  carrito.js        pedido: cantidades, datos del cliente, envío, Yape (adelanto), total, WhatsApp
  paginas.js        lo propio de cada página (inicio, catálogo, cuidados, contacto)
  principal.js      escucha los clics y arranca todo
  admin.js          panel de administración
assets/             logo, fondo, favicon e ilustraciones de plantas
```
Se mantuvo la carpeta `assets/` (en vez de `img/`) porque las rutas de las fotos de los productos quedan guardadas en el navegador y cambiarla las rompería.

## 3. Orden de carga (importa)
- **CSS:** `base → layout → componentes → animaciones → responsive` (el último puede corregir a los anteriores). El panel agrega `admin.css`.
- **JS (al final del `<body>`):** `datos → utilidades → estructura → animaciones → productos → comprobante → carrito → paginas → principal`. Cada archivo usa al anterior.
- Todos comparten un objeto llamado **`NH`** (Natura & Home). No se usan módulos (`import`) porque no funcionan al abrir el archivo directamente.

## 4. Cómo está armado cada HTML
Todas las páginas siguen el mismo orden: `<!DOCTYPE html>` → `<html lang="es">` → `<head>` (codificación, adaptación a celular, descripción, título, ícono, CSS) → `<body>` → `<main>` con `<header>` (título de la página) y `<section>` → scripts.
El **anuncio, el menú (`<header>` + `<nav>`) y el pie (`<footer>`)** no están copiados en cada HTML: los dibuja `js/estructura.js`, así se cambian en un solo lugar.

## 5. Datos: tipo, lugar y stock
Cada planta tiene:
- **type** (un solo tipo): Medicinales, Aromáticas, Flores… Separa el catálogo en secciones.
- **places**: Exteriores y/o Interiores (se usa como filtro).
- **stock**: unidades. Vacío = sin control. Con 0 se muestra "Agotado".
Los tipos se administran en el panel (pestaña **Tipos**): agregar, renombrar, ordenar y eliminar.

## 6. Recorrido de un pedido
1. En el **catálogo** (`paginas.js` filtra, `productos.js` dibuja) la persona toca **Agregar** o usa el contador − 1 +.
2. `principal.js` detecta `data-add` y `carrito.js` suma, respetando el stock.
3. En **Mi pedido** escribe nombre, celular y NIT/CI (opcionales), elige recojo o envío (con zona) y la forma de pago. Ve subtotal, envío, total y, si elige Yape, el adelanto y el saldo.
4. `checkout()` valida, guarda una copia del pedido (para el panel) y abre `wa.me/<número>?text=…`.
5. Se muestra una pantalla de confirmación con el código, un botón por si WhatsApp no se abrió y **Guardar comprobante**.

## 6b. Pago por Yape (adelanto) y comprobante
- **Activar:** Panel → Ajustes → *Pago por Yape*: se sube la imagen del **QR** (se puede cambiar o quitar cuando se quiera) y/o se escribe el número y el titular. También se define el porcentaje del adelanto (50 % por defecto).
- **En el carrito:** al elegir *Yape (adelanto del 50%)* se calcula `NH.totales()`: adelanto = 50 % del total (incluye el envío si tiene costo) y saldo = lo que falta. Se muestran el monto, el QR y los pasos. Si todavía no hay precios para todas las plantas, el monto no se puede calcular: se avisa "todavía no pagues" y el QR se oculta hasta confirmar el precio por WhatsApp.
- **El pago no se verifica solo.** El cliente paga en su app de Yape, marca "Ya pagué" (opcional) y manda la captura por WhatsApp. En el panel, el administrador revisa la captura y marca **Adelanto recibido** en el detalle del pedido.
- **Comprobante** (`comprobante.js`): Panel → Pedidos → *Ver* → *Ver comprobante*. Se puede **enviar por WhatsApp**, **descargar como imagen** o **imprimir / guardar como PDF**. En el celular, *Enviar por WhatsApp* abre la lista de apps para mandar la imagen directamente. En computadora descarga la imagen y abre el chat del cliente con el texto, para adjuntarla.
- **Importante:** es un *comprobante de pedido*, **no una factura fiscal**. Una factura válida en Bolivia se emite con el sistema de Impuestos Nacionales (SIN).

## 7. Panel de administración (`admin.html`)
Contraseña inicial: `natura2026` (se cambia en Ajustes).
- **Resumen:** números clave y plantas por revisar (agotadas o con poco stock).
- **Productos:** buscar, filtrar por tipo/estado, editar precio y stock en la tabla, seleccionar varias (disponible, agotado, mover de tipo, eliminar), duplicar, fotos (hasta 5).
- **Tipos:** crear, renombrar (actualiza las plantas), reordenar y eliminar.
- **Pedidos:** filtro por estado, detalle, adelanto de Yape (pendiente / recibido), comprobante, botón para escribir al cliente, registrar pedidos a mano con varias plantas y exportar CSV. Al pasar a *Confirmado* se descuenta el stock; si se cancela, se devuelve.
- **Ajustes:** WhatsApp, horario, dirección, costo de envío, otras formas de pago, **Yape (QR, número, titular, porcentaje)**, NIT del negocio, redes, contraseña y copia de seguridad.

## 8. Resumen de cambios de la reorganización
- HTML: estructura uniforme y semántica (`header`, `main`, `section`, `article`, `aside`, `nav`, `figure`, `ol`/`ul`/`dl`), sangría y comentarios de sección. Los estilos escritos dentro del HTML pasaron a clases CSS. Se verificó que el texto, los `id` y los atributos `data-*` son los mismos que antes.
- CSS: de un archivo a seis, con índice de contenido al inicio de cada uno. Las animaciones (`@keyframes` y entrada al hacer scroll) están juntas en `animaciones.css`.
- JS: separado por responsabilidad (ver sección 2), con comentarios en español y el mismo orden en todos los archivos (configuración → variables → funciones → eventos → inicio).
- Se retiraron 3 imágenes que ningún archivo usaba (`leaf.svg`, `about-plants.svg`, `hero-plants.svg`). Siguen en el ZIP original.

## 9. Errores corregidos
1. **Panel sin botones al recargar:** si se recargaba `admin.html` con la sesión abierta, la pantalla quedaba sin funcionar (el arranque se ejecutaba antes de definir las vistas). Ahora el arranque está al final de `admin.js`.
2. **Reglas CSS repetidas** que podían chocar: `.df`, `.mbox.ad` y `[hidden]` (ahora una sola definición).
3. **Listas con sangría accidental** (`.why`, `.vals`): tenían el margen por defecto del navegador; ahora están alineadas. Es el único cambio visual de la reorganización.
4. **Jerarquía de títulos:** el pie usaba `h4` sin `h3` previo y el acceso del panel usaba `h2` sin `h1`.

## 10. Pendientes y limitaciones
- Los datos quedan **en el navegador** donde se usa el panel; no se comparten entre dispositivos. Para eso hace falta una base de datos en un servidor.
- La contraseña del panel es una barrera básica, no seguridad real.
- El menú y el pie los dibuja JavaScript: sin JavaScript no se ven.
- Las fuentes vienen de Google Fonts (necesitan internet; si no cargan, se usan fuentes del sistema).
- Las plantas usan ilustraciones de ejemplo hasta que se suban fotos reales.
- Los pedidos que hace un cliente se guardan en **su** navegador, no en el del administrador. Lo que le llega al administrador es el mensaje de WhatsApp; para generar el comprobante, se registra el pedido a mano en el panel (*Pedidos → Registrar pedido*).
- No se puede comprobar un pago de Yape automáticamente (haría falta un servicio de pagos).
- El QR se guarda en el navegador del administrador; si se abre la tienda desde otro dispositivo, no se verá hasta que haya un servidor que comparta los datos.

## 11. Cómo ejecutar y probar
1. Descomprime y abre `index.html` con doble clic (o súbelo a un hosting).
2. Prueba: catálogo → filtra por tipo/lugar → agrega plantas → abre **Mi pedido** → completa y envía.
3. Abre `admin.html` (contraseña `natura2026`): edita un precio o stock, crea un tipo y revisa el catálogo.
4. Para empezar de cero: Admin → Ajustes → **Restablecer todo**.

## 12. Dónde cambiar cosas comunes
| Quiero cambiar… | Archivo |
|---|---|
| Colores de toda la página | `css/base.css` → `:root` |
| Plantas y tipos iniciales | `js/datos.js` (o el panel) |
| WhatsApp, horario, envío, pagos | Panel → Ajustes |
| Menú o pie de página | `js/estructura.js` |
| Textos de una página | el `.html` de esa página |
| Velocidad de rotación de fotos | `js/animaciones.js` (3500 = 3,5 s) |

## 13. Preguntas que pueden hacerte
- **¿Es una factura?** No. Es un comprobante de pedido. La factura fiscal se emite con el SIN.
- **¿Cómo se calcula el 50 %?** `NH.totales()` en `datos.js`: adelanto = total × porcentaje / 100, redondeado a centavos.
- **¿Por qué no hay base de datos?** Para que funcione sin servidor; usa `localStorage`. El siguiente paso sería un servicio como Supabase.
- **¿Cómo se adapta al celular?** `responsive.css` con `@media (max-width: …)`.
- **¿Cómo se separan las plantas por tipo?** `NH.groupByType()` en `productos.js` agrupa por el campo `type`, en el orden de la pestaña Tipos.
- **¿Cómo rotan las fotos?** `animaciones.js` cambia la clase `on` cada 3,5 s y el CSS hace el fundido.
