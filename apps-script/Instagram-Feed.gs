/**
 * Fan Tribute · Feed de Instagram para la página de inicio
 *
 * Qué hace:
 *  - Cada hora consulta las últimas publicaciones de @fantribute_col en graph.instagram.com
 *    y las guarda en caché (la página nunca ve el token).
 *  - Una vez al día revisa el token IGAA y lo renueva cuando le quedan menos de 15 días
 *    (dura 60 días; Meta solo deja renovarlo si tiene más de 24 horas).
 *  - Publica un JSON en la URL de la implementación web, que lee index.html.
 *
 * Instalación (una sola vez):
 *  1. script.google.com → Nuevo proyecto → pega este archivo.
 *  2. Configuración del proyecto → Propiedades del script → agrega:
 *       IG_TOKEN = el token que empieza por IGAA (no lo pegues en ningún chat)
 *  3. Ejecuta instalar() y acepta los permisos.
 *  4. Implementar → Nueva implementación → Aplicación web
 *       Ejecutar como: Yo · Quién tiene acceso: Cualquier persona
 *  5. Copia la URL que termina en /exec y pégala en IG_FEED_URL de sitio/index.html.
 */

const IG_CAMPOS = 'id,caption,media_type,media_url,thumbnail_url,permalink,media_product_type,timestamp';
const IG_CANTIDAD = 12;            // se guardan 12, la página muestra 6
const IG_RENOVAR_DIAS = 15;        // renovar cuando falten menos de 15 días

function instalar() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['actualizarInstagram', 'renovarTokenInstagram'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('actualizarInstagram').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('renovarTokenInstagram').timeBased().everyDays(1).atHour(4).create();

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('IG_TOKEN_FECHA')) props.setProperty('IG_TOKEN_FECHA', String(Date.now()));
  actualizarInstagram();
  Logger.log('Listo. Activadores creados: actualizarInstagram (cada hora) y renovarTokenInstagram (diario 4 a. m.).');
}

/** Consulta Instagram y guarda la caché. */
function actualizarInstagram() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('IG_TOKEN');
  if (!token) throw new Error('Falta IG_TOKEN en Propiedades del script.');

  const url = 'https://graph.instagram.com/me/media?fields=' + IG_CAMPOS +
              '&limit=' + IG_CANTIDAD + '&access_token=' + encodeURIComponent(token);
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const codigo = res.getResponseCode();
  if (codigo !== 200) {
    // No se borra la caché anterior: la página sigue mostrando lo último que funcionó.
    Logger.log('Instagram respondió ' + codigo + ': ' + res.getContentText().slice(0, 300));
    props.setProperty('IG_ULTIMO_ERROR', new Date().toISOString() + ' · ' + codigo);
    return;
  }

  const datos = JSON.parse(res.getContentText()).data || [];
  const posts = datos.map(function (m) {
    const esVideo = m.media_type === 'VIDEO';
    return {
      id: m.id,
      permalink: m.permalink,
      imagen: esVideo ? (m.thumbnail_url || '') : (m.media_url || ''),
      esReel: m.media_product_type === 'REELS',
      texto: (m.caption || '').replace(/\s+/g, ' ').slice(0, 140),
      fecha: m.timestamp
    };
  }).filter(function (p) { return p.imagen && p.permalink; });

  // Las propiedades aceptan ~9 KB por valor; 12 publicaciones con texto recortado caben de sobra.
  props.setProperty('IG_CACHE', JSON.stringify({ actualizado: new Date().toISOString(), posts: posts }));
  props.deleteProperty('IG_ULTIMO_ERROR');
  Logger.log('Instagram: ' + posts.length + ' publicaciones guardadas.');
}

/** Renueva el token IGAA de larga duración antes de que venza. */
function renovarTokenInstagram() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('IG_TOKEN');
  if (!token) return;

  const desde = Number(props.getProperty('IG_TOKEN_FECHA') || 0);
  const vence = Number(props.getProperty('IG_TOKEN_VENCE') || (desde + 60 * 86400000));
  const faltan = (vence - Date.now()) / 86400000;
  if (faltan > IG_RENOVAR_DIAS) {
    Logger.log('Token vigente, faltan ' + Math.round(faltan) + ' días.');
    return;
  }

  const res = UrlFetchApp.fetch('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' +
                                encodeURIComponent(token), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    const msg = 'No se pudo renovar el token de Instagram (' + res.getResponseCode() + '). Revisa la app en developers.facebook.com y genera uno nuevo.';
    Logger.log(msg + ' ' + res.getContentText().slice(0, 300));
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Fan Tribute · token de Instagram', msg);
    return;
  }
  const r = JSON.parse(res.getContentText());
  props.setProperties({
    IG_TOKEN: r.access_token,
    IG_TOKEN_FECHA: String(Date.now()),
    IG_TOKEN_VENCE: String(Date.now() + (r.expires_in || 60 * 86400) * 1000)
  });
  Logger.log('Token renovado. Vence en ' + Math.round((r.expires_in || 0) / 86400) + ' días.');
}

/** URL pública que lee la página: devuelve solo la caché, nunca el token. */
function doGet() {
  const cache = PropertiesService.getScriptProperties().getProperty('IG_CACHE');
  const cuerpo = cache ? Object.assign({ ok: true }, JSON.parse(cache)) : { ok: false, posts: [] };
  return ContentService.createTextOutput(JSON.stringify(cuerpo)).setMimeType(ContentService.MimeType.JSON);
}
