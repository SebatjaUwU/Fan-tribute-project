# Fan Tribute

Sitio web y automatizaciones de **Fan Tribute**, productora independiente de fiestas tributo de música electrónica en Bogotá y Medellín, Colombia.

Sitio en vivo: https://fantributecol.netlify.app

## Estructura

```text
sitio/                  El sitio que se publica (Netlify). Todo lo que va en vivo está aquí.
  index.html            Inicio actual (el que está en vivo)
  index-nuevo.html      Inicio nuevo (playa, Bebas Neue, Tailwind) — pendiente de aprobación, noindex
  ASSETS/               Logo, ícono, tw.css del inicio nuevo y fotos
  comprar/              Boletería
  edc-preparty/         Pre-EDC Bogotá (y carpeta ASSETS compartida de flyers, videos y QR)
  eventos-hub/          Páginas de eventos, merch y herramientas de QR del staff
    eventos/            medellin-2016, back-to-classic-2000, last-summer-2016, boletas, confirmaciones...
    herramientas-qr/    Generadores de boletas para ventas manuales
  fanguess/             Versión de prueba del juego FanGuess
  sitemap.xml, robots.txt, llms.txt
maqueta-inicio-nuevo/   Maqueta original del inicio nuevo (referencia de diseño)
apps-script/            Google Apps Script (se copian a mano en script.google.com)
  Code-Medellin.gs        Ventas Wompi, QR y cupos de Medellín
  Promo-BTC2000.gs        Correo masivo de Back to Classic (máx. 75/día)
  Encuesta-Halloween.gs   Encuesta de satisfacción
  Instagram-Feed.gs       Publicaciones de Instagram para el inicio (renueva el token solo)
guia-fan-tribute.md     Guía de marca, eventos, precios y sistemas
```

## Publicar en Netlify

Los despliegues automáticos desde GitHub están detenidos. Para publicar:

1. Comprime el **contenido** de la carpeta `sitio/` (no la carpeta misma) en un ZIP.
2. En Netlify, proyecto **fantributecol** → **Deploys** → arrastra el ZIP.

## Llaves y secretos

Este repositorio es **público**. Ninguna llave va en el código:

- Wompi, PIN del staff, token de Instagram: en **Propiedades del script** de cada Apps Script.
- Tokens de GitHub: nunca en archivos ni en chats. Si uno circula, se revoca.

La configuración web de Firebase que aparece en las páginas de Halloween es pública por diseño; la seguridad la dan las reglas de Firestore.

## Marca

- Fuente única: **Bebas Neue** (peso 400, sin negrita falsa).
- Fondo `#0B0618` / `#140B2A`, texto `#FDF4E8` / `#C3B8D9`.
- Siempre: «Evento tributo +18 · artistas no presentes».

Más detalle en [guia-fan-tribute.md](./guia-fan-tribute.md).
