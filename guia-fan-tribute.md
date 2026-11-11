# Fan Tribute · Guía para trabajar con Claude

Última actualización: 11 de noviembre de 2026. Este documento resume las decisiones de marca, las páginas, los eventos y los sistemas de venta de Fan Tribute, para que cualquier chat nuevo de Claude siga trabajando igual.

## 1. Cómo trabajar

- Responder siempre en **español**, en tono cercano.
- **Mostrar antes de publicar.** Nada se sube a Netlify, GitHub ni a ninguna página en vivo sin la aprobación del dueño. Primero se muestra (link de vista previa de Claude o capturas).
- **Nunca pedir ni recibir llaves por chat.** Tokens de Instagram, llaves de Wompi y tokens de GitHub se pegan directamente en Propiedades del script de Apps Script o en el panel que corresponda. Si una llave circula por chat, se revoca y se genera otra.
- Netlify: los despliegues automáticos desde GitHub están detenidos por falta de créditos. Se publica subiendo el ZIP del sitio en **Deploys** del proyecto **fantributecol**.
- El dueño trabaja a veces desde un computador que bloquea Netlify; para que revise cosas, usar links de vista previa de Claude.

## 2. Marca y diseño (decisiones tomadas)

### Fuente oficial: Bebas Neue
- **Una sola fuente en todo**: títulos, menús, botones, párrafos, formularios y la imagen de la boleta. No mezclar con otras.
- Google Fonts: `https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap`
- Bebas Neue solo tiene mayúsculas y un solo grosor. Por eso:
  - Peso siempre normal (`font-weight:400`), sin negrita falsa (`font-synthesis:none`).
  - Espaciado de letras leve (`letter-spacing: .03em` a `.045em`).
  - Tamaños más grandes que con una fuente normal: textos pequeños mínimo ~14 px; títulos grandes.

### Estilo visual
- Fondo oscuro: `#0B0618` (principal), `#140B2A` (secciones/pie). Texto crema `#FDF4E8`, texto secundario `#C3B8D9`.
- **Poco color.** Tarjetas y bloques en oscuro con borde sutil; el color fuerte queda solo en las fotos, los flyers de los eventos y detalles puntuales.
- **Nada que parezca hecho con IA**: no fondos dibujados con código, no letras "generadas", no emojis como íconos, no textos de relleno.
- Fondo del inicio: **foto/animación real de una playa al atardecer con palmeras** (no un atardecer dibujado). Pendiente conseguir una versión en mejor resolución (ideal 1920 px de ancho o video).
- Página de inicio hecha con **Tailwind CSS** (compilado a un archivo `tw.css`, no por CDN), inspirada en la estructura de ticketlive.co: cartelera de eventos tipo póster con filtros, eventos pasados, bloques por ciudad, Instagram, FanGuess, ¿Quiénes somos? y pie de página.
- Lo que el dueño pidió quitar y no debe volver: "Escenarios donde hemos estado", la sección de noticias, el bloque "Nunca te pierdas otro evento" (Wompi/avisos/WhatsApp) y las historias de Instagram.
- Texto de "¿Quiénes somos?": *Fan Tribute es una productora independiente de fiestas en Bogotá, Colombia. No estamos afiliados a ninguna marca de festival internacional: organizamos experiencias propias, inspiradas en esa misma energía, con nuestros propios DJs, escenarios y comunidad.*
- Siempre: "Evento tributo +18 · artistas no presentes".

## 3. Sitio y repositorio

- Sitio en vivo: `https://fantributecol.netlify.app` (el sitio viejo `end-of-summer-2016-medellin.netlify.app` redirige ahí).
- Repositorio: `SebatjaUwU/fan-tribute-hub` (rama `master`). El dueño planea pasar el sitio nuevo a otro repositorio de GitHub.
- Páginas principales (en `eventos-hub/eventos/`):
  - `medellin-2016.html` · End of Summer 2016 Medellín
  - `back-to-classic-2000.html` · Back to Classic 2000
  - `last-summer-2016.html` · Last Summer 2016 (Bogotá)
  - `confirmacion-medellin.html` · página a la que Wompi manda después de pagar
  - `boleta-medellin.html` · boleta con QR descargable (`?c=CODIGO&n=NOMBRE`)
  - `escanear-medellin.html` y `herramientas-qr/venta-medellin.html` · herramientas del staff
- `fanguess/index.html` · versión de prueba del juego FanGuess.
- Contacto: WhatsApp **316 108 8178** · Instagram y TikTok **@fantribute_col** · correo **fantributeco@gmail.com**.

## 4. Eventos

| Evento | Ciudad | Fecha | Lugar | Precios |
|---|---|---|---|---|
| Back to Classic 2000 (EDM ✕ Reggaetón) | Bogotá | Sáb 28 nov, 8 PM – 5 AM | Algarete, Zona T | Cover $35.000 con $15.000 de consumo. Venta por WhatsApp. Sin etapa "Creyentes". |
| End of Summer 2016 | Medellín | Sáb 12 dic | Xero Club, Cl. 25 #43G-29 | Ver tabla de Medellín |
| Last Summer 2016 (gran final del año) | Bogotá | Segunda mitad de diciembre (por confirmar) | Por anunciar | Tributies $30.000 con $15.000 de consumo + regalo especial. Formulario y WhatsApp. |

Eventos pasados: End of Summer (4 y 5 sep, Bogotá), Pre-EDC Bogotá (3 oct), Back to Halloween 2016 (31 oct, Capital Live Concerts).

### Medellín: etapas, cupos y pagos
| Tipo | Precio | Cupo | Incluye | Cómo se paga |
|---|---|---|---|---|
| Preventa 1 | $35.000 | 50 | $15.000 consumo | **Agotada** (marcada a mano). Era por la llave @EMR345 |
| Preventa 2 | $40.000 | 100 | $15.000 consumo | Wompi: x1 `uIBaAU` · x2 `EwJjdk` · x3 `uo5HvV` · x4 `uXST6w` · x5 `aRnpk2` (el link viejo `wME6sq` también cuenta como P2 x1) |
| General | $45.000 | sin límite | $15.000 consumo | WhatsApp (aparece cuando se agota Preventa 2) |
| VIP | $85.000 | 50 | Tarima VIP, $20.000 consumo + shot de bienvenida | Wompi: x1 `kj5Nkr` · x2 `py5Cbe` · x3 `YH90PE` · x4 `KxCEFE` |
| Backstage | $95.000 | 50 | Junto al DJ, $20.000 consumo + shot de bienvenida | Wompi: x1 `8EDAxF` · x2 `hfFUoF` · x3 `pv9Uxf` · x4 `BtXI7L` |

Los links son `https://checkout.wompi.co/l/<ID>`. Todos redirigen a `confirmacion-medellin.html`. Un link nuevo de Wompi **debe agregarse a `LINKS_FIJOS` del Code.gs de Medellín**; si no, el correo de Wompi queda con la etiqueta `MDE-No-es-Medellin` y no se envía el QR.

## 5. Automatización (Google Apps Script)

### Medellín (`eventos-hub/apps-script/medellin/Code.gs`, ligado a la hoja de ventas)
- URL de la implementación (acceso "Cualquier persona"): `https://script.google.com/macros/s/AKfycby-x7O6z_Q2MvI2hKWLmS5CH22oLgbxrgAtQTcI6v5XwHokZvO3l5D_LaRR5LV_VNA7/exec`
- `?action=cupos` alimenta el sold-out automático de la página.
- `revisarCorreosWompi()` corre cada 5 minutos: lee en Gmail los correos "Transacción APROBADA … ref. X" de Wompi, registra las boletas en la hoja **Repositorio QR**, envía el correo con las boletas (cada una como imagen) y avisa a fantributeco@gmail.com. Etiquetas: `MDE-QR-Procesado`, `MDE-QR-Revisar`, `MDE-No-es-Medellin`.
- Ventas manuales por WhatsApp: se llenan en la hoja y se envían desde el menú **🎟️ Boletería → Enviar QR de las ventas nuevas**.
- Códigos de boleta con iniciales del comprador: `MDE-JSP-P2-0001` (Juan Sebastián Parra, Preventa 2).
- Si un correo de Wompi quedó mal etiquetado: quitarle la etiqueta y ejecutar `revisarCorreosWompi`. No duplica boletas.

### Otros scripts
- `Promo-BTC2000.gs`: correo masivo de Back to Classic, máximo 75 por día (deja 20 de cupo para los QR), sigue solo cada día a las 10 a. m. y anota los envíos en la pestaña "Promo BTC enviados".
- `Encuesta-Halloween.gs`: encuesta de satisfacción de Back to Halloween.
- Límite de Gmail en cuentas normales: unos 100 correos al día, compartidos entre todos los scripts.

## 6. FanGuess (juego "adivina la canción")

- Reto diario de 5 canciones, 3 intentos (se oye 1 s, luego 4 s, luego 10 s), puntos 300/200/100, racha diaria, ranking mensual; el #1 del mes gana una entrada gratis a cualquier evento.
- Niveles: Warm Up (fácil), Build Up (medio), Drop (difícil), Main Stage (experto).
- La persona escribe la respuesta a mano y aparecen sugerencias con carátula, nombre, artista y año, buscando en **todo** el catálogo (para no delatar la respuesta).
- Audio y carátulas: **iTunes Search de Apple** (gratis, sin cuenta ni llave, fragmentos de 30 s). Deezer como respaldo. Spotify no sirve (ya no da fragmentos y su reproductor revela la canción). No se descarga ninguna canción.
- La prueba actual usa artistas de la playlist "R&B de hoy" de Apple Music; la lista final debe ser de clásicos EDM 2010–2016 (borrador ya propuesto por nivel).
- Pendiente: cuentas de usuario y ranking real (plan: Supabase), lista final de canciones.

## 7. Redes sociales en la página

- **Instagram**: API oficial de Meta, gratis. App creada en developers.facebook.com con el caso de uso "Administrar mensajes y contenido en Instagram" → **API setup with Unified login** (no la opción vieja con Facebook). El token correcto empieza por **IGAA**, dura 60 días y se renueva. Consultas a `graph.instagram.com` (`/me/media`; los reels tienen `media_product_type = REELS`). El token se guarda en el servidor o en Propiedades del script, nunca en la página.
- **TikTok**: lo más simple es insertar el perfil con el código oficial de TikTok (gratis, se actualiza solo). La Display API también es gratis pero pide revisión de la app.
- **X**: la API es de pago por uso (no hay plan gratis para leer posts, aunque la cuenta tenga verificado). Usar los códigos de inserción de publish.x.com.

## 8. Pendientes conocidos

- Conectar los botones del inicio nuevo con las páginas reales de los eventos y quitar los datos de ejemplo antes de publicarlo.
- Imagen de la playa en mejor resolución.
- Instagram en la página con el token IGAA (script que consulte cada hora y renueve el token).
- Lista final de canciones de FanGuess, cuentas y ranking.
- Last Summer 2016: confirmar fecha y lugar.
