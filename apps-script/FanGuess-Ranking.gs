/**
 * FanGuess · Ranking del mes (por racha de aciertos seguidos) y estadísticas
 * --------------------------------------------------------------------------
 * Backend gratis con Google Sheets. No lleva llaves ni contraseñas.
 *
 * Cómo instalarlo (una sola vez):
 *   1. Crea una hoja de cálculo nueva en Google Drive llamada "FanGuess".
 *   2. Menú Extensiones → Apps Script. Borra lo que haya y pega este archivo.
 *   3. Guarda, elige la función "prepararHoja" y dale Ejecutar (acepta los permisos).
 *   4. Implementar → Nueva implementación → tipo "Aplicación web".
 *        Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona
 *   5. Copia la URL que termina en /exec y pégala en fanguess/index.html,
 *      en la línea  var RANKING_URL = '';
 *
 * Cómo funciona:
 *   - Cada canción que se juega llega aquí. El servidor lleva la racha de cada celular
 *     (no se fía de lo que diga la página), así nadie puede inventarse una racha.
 *   - Cuando a alguien se le acaba la racha, la página le pide su @ de Instagram.
 *     Si ese @ ya está en el ranking del mes, se actualiza (queda la mejor racha).
 *   - Ranking: mejor racha del mes; si empatan, gana quien tenga más aciertos.
 *
 *   - Premios por racha (todo es por una boleta individual): 10 seguidas = 5% · 20 = 7% · 30 = 10%
 *     · 40 = boleta gratis. El servidor revisa la racha antes de dar el código y lo anota en la hoja Premios.
 *
 * Hojas: Jugadores · Rondas · Ranking · Canciones (estadísticas) · Premios
 */

var ZONA = 'America/Bogota';
var PUNTOS = [300, 200, 100];
var MULT = { facil: 1, medio: 1.5, dificil: 2 };
var MIN_SEG_ENTRE_RONDAS = 2.5;    // nadie escucha, adivina y pasa de canción en menos de 2,5 s
var MAX_RONDAS_DIA = 400;          // tope por celular por día
var PREMIOS = { 10: '5% de descuento en una boleta individual', 20: '7% de descuento en una boleta individual', 30: '10% de descuento en una boleta individual', 40: 'Boleta individual gratis' };
var NIVEL_GRATIS = 40;

function prepararHoja() {
  var ss = SpreadsheetApp.getActive();
  hoja_(ss, 'Jugadores', ['celular (id)', 'instagram', 'creado', 'última vez']);
  hoja_(ss, 'Rondas', ['fecha', 'mes', 'celular (id)', 'instagram', 'trackId', 'canción', 'acertó', 'intento', 'dificultad', 'racha', 'válida']);
  hoja_(ss, 'Ranking', ['mes', 'instagram', 'mejor racha', 'aciertos', 'actualizado']);
  hoja_(ss, 'Canciones', ['trackId', 'canción', 'jugadas', 'aciertos', 'a la primera', '% acierto', 'última vez']);
  hoja_(ss, 'Premios', ['fecha', 'mes', 'código', 'premio', 'racha', 'instagram', 'celular (id)', 'estado']);
}

function hoja_(ss, nombre, encabezados) {
  var h = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  if (h.getLastRow() === 0) { h.appendRow(encabezados); h.setFrozenRows(1); h.getRange(1, 1, 1, encabezados.length).setFontWeight('bold'); }
  return h;
}

// el mes se guarda como texto ('2026-11') para que Sheets no lo convierta en fecha
function mesActual_() { return Utilities.formatDate(new Date(), ZONA, 'yyyy-MM'); }
function hoy_() { return Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd'); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function limpiar_(s, max) { return String(s || '').replace(/[<>"'`=]/g, '').replace(/^[=+\-@]+/, '').trim().slice(0, max); }
function limpiarIg_(s) { return String(s || '').toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9._]/g, '').slice(0, 30); }
function idValido_(id) { return /^[a-z0-9]{12,40}$/.test(String(id || '')); }

/* ---------- Lecturas: el ranking ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.accion === 'ranking') return json_(ranking_(p.id));
  if (p.accion === 'premio') {
    if (!idValido_(p.id)) return json_({ ok: false, error: 'id' });
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(8000)) return json_({ ok: false, error: 'ocupado' });
    try { return json_(premio_(p)); } finally { lock.releaseLock(); }
  }
  return json_({ ok: true, servicio: 'FanGuess' });
}

function ranking_(id) {
  var mes = mesActual_(), cache = CacheService.getScriptCache(), clave = 'rk2_' + mes, filas;
  var guardado = cache.get(clave);
  if (guardado) filas = JSON.parse(guardado);
  else {
    var h = SpreadsheetApp.getActive().getSheetByName('Ranking'), datos = h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, 4).getValues() : [];
    filas = datos.filter(function (r) { return String(r[0]) === mes && r[2] > 0; })
      .map(function (r) { return { ig: String(r[1]), racha: r[2], aciertos: r[3] }; })
      .sort(function (a, b) { return b.racha - a.racha || b.aciertos - a.aciertos; });
    cache.put(clave, JSON.stringify(filas), 30);
  }
  var miIg = id && idValido_(id) ? igDe_(id) : '';
  var top = filas.slice(0, 20).map(function (f, i) { return { pos: i + 1, ig: f.ig, racha: f.racha, aciertos: f.aciertos, yo: !!miIg && f.ig === miIg }; });
  var yo = null;
  filas.forEach(function (f, i) { if (miIg && f.ig === miIg) yo = { pos: i + 1, ig: f.ig, racha: f.racha, aciertos: f.aciertos }; });
  return { ok: true, mes: mes, total: filas.length, top: top, yo: yo, miIg: miIg };
}

/* ---------- Escrituras: rondas y @ de Instagram ---------- */
function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (er) { return json_({ ok: false, error: 'formato' }); }
  if (!idValido_(d.id)) return json_({ ok: false, error: 'id' });
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return json_({ ok: false, error: 'ocupado' });
  try {
    if (d.accion === 'ronda') return json_(ronda_(d));
    if (d.accion === 'instagram') return json_(vincular_(d));
    return json_({ ok: false, error: 'accion' });
  } finally { lock.releaseLock(); }
}

/* ---------- Premios: el servidor revisa la racha y entrega un código ---------- */
function premio_(p) {
  var n = parseInt(p.n, 10), st = estado_(p.id), props = PropertiesService.getScriptProperties();
  if (!PREMIOS[n]) return { ok: false, error: 'nivel' };
  var paseYa = props.getProperty('pase_' + p.id + '_' + st.mes);
  var vale = st.actual >= n || (n === NIVEL_GRATIS && st.mejor >= NIVEL_GRATIS && !paseYa);
  if (!vale) return { ok: false, error: 'racha', racha: st.actual };
  var ig = limpiarIg_(p.ig) || igDe_(p.id);
  var codigo = 'FG' + n + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  var h = hoja_(SpreadsheetApp.getActive(), 'Premios', ['fecha', 'mes', 'código', 'premio', 'racha', 'instagram', 'celular (id)', 'estado']);
  h.appendRow([new Date(), "'" + st.mes, codigo, PREMIOS[n], Math.max(st.actual, n), ig ? '@' + ig : '', p.id, 'PENDIENTE']);
  if (n === NIVEL_GRATIS) props.setProperty('pase_' + p.id + '_' + st.mes, codigo);
  st.actual = 0; guardarEstado_(p.id, st);   // reclamar cierra la partida
  return { ok: true, codigo: codigo, premio: PREMIOS[n], nivel: n };
}

// estado de cada celular en el mes: racha actual, mejor racha y aciertos (lo lleva el servidor)
function estado_(id) {
  var mes = mesActual_(), raw = PropertiesService.getScriptProperties().getProperty('st_' + id), st = raw ? JSON.parse(raw) : null;
  if (!st || st.mes !== mes) st = { mes: mes, actual: 0, mejor: 0, aciertos: 0 };
  return st;
}
function guardarEstado_(id, st) { PropertiesService.getScriptProperties().setProperty('st_' + id, JSON.stringify(st)); }

function ronda_(d) {
  var ss = SpreadsheetApp.getActive(), props = PropertiesService.getScriptProperties();
  var acierto = d.acierto === true, intento = Math.max(1, Math.min(3, parseInt(d.intento, 10) || 3));
  var dif = MULT[d.dificultad] ? d.dificultad : 'facil';
  var esperado = acierto ? Math.round(PUNTOS[intento - 1] * MULT[dif]) : 0;
  var puntos = Math.max(0, parseInt(d.puntos, 10) || 0);

  // controles contra trampas: puntos que cuadren, tiempo mínimo entre rondas y tope diario
  var valida = puntos === esperado;
  var claveT = 't_' + d.id, ahora = Date.now(), ultima = Number(props.getProperty(claveT) || 0);
  if (ahora - ultima < MIN_SEG_ENTRE_RONDAS * 1000) valida = false;
  props.setProperty(claveT, String(ahora));
  var claveD = 'd_' + d.id + '_' + hoy_(), nDia = Number(props.getProperty(claveD) || 0) + 1;
  props.setProperty(claveD, String(nDia));
  if (nDia > MAX_RONDAS_DIA) valida = false;

  // la racha la cuenta el servidor: una ronda dudosa corta la racha
  var st = estado_(d.id);
  if (acierto && valida) { st.actual++; st.aciertos++; if (st.actual > st.mejor) st.mejor = st.actual; }
  else st.actual = 0;
  guardarEstado_(d.id, st);

  var ig = igDe_(d.id), trackId = String(parseInt(d.trackId, 10) || ''), cancion = limpiar_(d.cancion, 80);
  ss.getSheetByName('Rondas').appendRow([new Date(), "'" + st.mes, d.id, ig, "'" + trackId, cancion, acierto, intento, dif, st.actual, valida]);
  estadistica_(ss.getSheetByName('Canciones'), trackId, cancion, acierto, intento);

  // si el celular ya tiene un @, su ranking se actualiza solo
  if (ig) subirRanking_(ig, st, acierto && valida ? 1 : 0);
  return { ok: true, valida: valida, racha: st.actual, mejor: st.mejor, ig: ig };
}

function vincular_(d) {
  var ig = limpiarIg_(d.ig);
  if (ig.length < 2) return { ok: false, error: 'instagram' };
  var h = SpreadsheetApp.getActive().getSheetByName('Jugadores'), fila = buscar_(h, d.id), ahora = new Date();
  if (fila) h.getRange(fila, 2, 1, 3).setValues([[ig, h.getRange(fila, 3).getValue(), ahora]]);
  else h.appendRow([d.id, ig, ahora, ahora]);
  var st = estado_(d.id);
  subirRanking_(ig, st, 0);
  return { ok: true, ig: ig, mejor: st.mejor };
}

// si el @ ya está en el ranking del mes se reemplaza su fila: queda la mejor racha
function subirRanking_(ig, st, sumaAcierto) {
  var rk = SpreadsheetApp.getActive().getSheetByName('Ranking'), mes = mesActual_(), f = buscarRanking_(rk, mes, ig);
  if (f) {
    var v = rk.getRange(f, 3, 1, 2).getValues()[0];
    var racha = Math.max(Number(v[0]) || 0, st.mejor), aciertos = sumaAcierto ? (Number(v[1]) || 0) + 1 : Math.max(Number(v[1]) || 0, st.aciertos);
    rk.getRange(f, 3, 1, 3).setValues([[racha, aciertos, new Date()]]);
  } else if (st.mejor > 0 || st.aciertos > 0) {
    rk.appendRow(["'" + mes, ig, st.mejor, st.aciertos, new Date()]);
  }
  CacheService.getScriptCache().remove('rk2_' + mes);
}

function igDe_(id) {
  var h = SpreadsheetApp.getActive().getSheetByName('Jugadores'), f = buscar_(h, id);
  return f ? String(h.getRange(f, 2).getValue()) : '';
}

function estadistica_(h, trackId, cancion, acierto, intento) {
  if (!trackId) return;
  var f = buscar_(h, trackId);
  if (!f) { h.appendRow(["'" + trackId, cancion, 0, 0, 0, 0, new Date()]); f = h.getLastRow(); }
  var v = h.getRange(f, 3, 1, 3).getValues()[0], jug = v[0] + 1, ac = v[1] + (acierto ? 1 : 0), pri = v[2] + (acierto && intento === 1 ? 1 : 0);
  h.getRange(f, 2, 1, 6).setValues([[cancion || h.getRange(f, 2).getValue(), jug, ac, pri, Math.round(ac / jug * 100) / 100, new Date()]]);
}

function buscar_(h, valor) {
  if (h.getLastRow() < 2) return 0;
  var r = h.getRange(2, 1, h.getLastRow() - 1, 1).createTextFinder(String(valor)).matchEntireCell(true).findNext();
  return r ? r.getRow() : 0;
}

function buscarRanking_(h, mes, ig) {
  if (h.getLastRow() < 2) return 0;
  var datos = h.getRange(2, 1, h.getLastRow() - 1, 2).getValues();
  for (var i = datos.length - 1; i >= 0; i--) if (String(datos[i][0]) === mes && String(datos[i][1]) === ig) return i + 2;
  return 0;
}
