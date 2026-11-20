/**
 * FanGuess · Ranking del mes y estadísticas
 * ------------------------------------------------------------
 * Backend gratis con Google Sheets. No lleva llaves ni contraseñas.
 *
 * Cómo instalarlo (una sola vez):
 *   1. Crea una hoja de cálculo nueva en Google Drive llamada "FanGuess".
 *   2. Menú Extensiones → Apps Script. Borra lo que haya y pega este archivo.
 *   3. Guarda y ejecuta la función "prepararHoja" (te pedirá permisos: acéptalos).
 *   4. Implementar → Nueva implementación → tipo "Aplicación web".
 *        Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona
 *   5. Copia la URL que termina en /exec y pégala en fanguess/index.html,
 *      en la línea  var RANKING_URL = '';
 *
 * Hojas que crea:
 *   Jugadores · Rondas · Ranking (se actualiza solo) · Canciones (estadísticas)
 */

var ZONA = 'America/Bogota';
var PUNTOS = [300, 200, 100];
var MULT = { facil: 1, medio: 1.5, dificil: 2 };
var MIN_SEG_ENTRE_RONDAS = 4;      // nadie adivina y pasa de canción en menos de 4 s
var MAX_RONDAS_DIA = 400;          // tope por jugador por día

function prepararHoja() {
  var ss = SpreadsheetApp.getActive();
  hoja_(ss, 'Jugadores', ['id', 'nombre', 'instagram', 'creado', 'ultima vez']);
  hoja_(ss, 'Rondas', ['fecha', 'mes', 'jugador', 'trackId', 'canción', 'acertó', 'intento', 'dificultad', 'puntos', 'válida']);
  hoja_(ss, 'Ranking', ['mes', 'jugador', 'nombre', 'instagram', 'puntos', 'rondas', 'aciertos', 'actualizado']);
  hoja_(ss, 'Canciones', ['trackId', 'canción', 'jugadas', 'aciertos', 'a la primera', '% acierto', 'última vez']);
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
  return json_({ ok: true, servicio: 'FanGuess' });
}

function ranking_(id) {
  var mes = mesActual_(), cache = CacheService.getScriptCache(), clave = 'rk_' + mes, filas;
  var guardado = cache.get(clave);
  if (guardado) filas = JSON.parse(guardado);
  else {
    var h = SpreadsheetApp.getActive().getSheetByName('Ranking'), datos = h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, 7).getValues() : [];
    filas = datos.filter(function (r) { return r[0] === mes && r[4] > 0; })
      .map(function (r) { return { j: r[1], n: r[2], ig: r[3], p: r[4], r: r[5], a: r[6] }; })
      .sort(function (a, b) { return b.p - a.p || b.a - a.a; });
    cache.put(clave, JSON.stringify(filas), 30);
  }
  var top = filas.slice(0, 20).map(function (f, i) { return { pos: i + 1, nombre: f.n, ig: ocultarIg_(f.ig), puntos: f.p, aciertos: f.a, yo: f.j === id }; });
  var mio = null;
  filas.forEach(function (f, i) { if (f.j === id) mio = { pos: i + 1, puntos: f.p, aciertos: f.a, rondas: f.r }; });
  return { ok: true, mes: mes, total: filas.length, top: top, yo: mio };
}

function ocultarIg_(ig) { ig = String(ig || ''); return ig.length <= 3 ? '@' + ig : '@' + ig.slice(0, 3) + '•••'; }

/* ---------- Escrituras: registro y rondas ---------- */
function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (er) { return json_({ ok: false, error: 'formato' }); }
  if (!idValido_(d.id)) return json_({ ok: false, error: 'id' });
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return json_({ ok: false, error: 'ocupado' });
  try {
    if (d.accion === 'registrar') return json_(registrar_(d));
    if (d.accion === 'ronda') return json_(ronda_(d));
    return json_({ ok: false, error: 'accion' });
  } finally { lock.releaseLock(); }
}

function registrar_(d) {
  var nombre = limpiar_(d.nombre, 24), ig = limpiarIg_(d.ig);
  if (nombre.length < 2 || ig.length < 2) return { ok: false, error: 'datos' };
  var h = SpreadsheetApp.getActive().getSheetByName('Jugadores'), fila = buscar_(h, d.id), ahora = new Date();
  if (fila) h.getRange(fila, 2, 1, 4).setValues([[nombre, ig, h.getRange(fila, 4).getValue(), ahora]]);
  else h.appendRow([d.id, nombre, ig, ahora, ahora]);
  // si ya tenía puntos este mes, actualiza el nombre en el ranking
  var rk = SpreadsheetApp.getActive().getSheetByName('Ranking'), f2 = buscarRanking_(rk, mesActual_(), d.id);
  if (f2) rk.getRange(f2, 3, 1, 2).setValues([[nombre, ig]]);
  CacheService.getScriptCache().remove('rk_' + mesActual_());
  return { ok: true };
}

function ronda_(d) {
  var ss = SpreadsheetApp.getActive(), mes = mesActual_(), props = PropertiesService.getScriptProperties();
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

  var trackId = String(parseInt(d.trackId, 10) || ''), cancion = limpiar_(d.cancion, 80);
  ss.getSheetByName('Rondas').appendRow([new Date(), "'" + mes, d.id, trackId, cancion, acierto, intento, dif, puntos, valida]);
  estadistica_(ss.getSheetByName('Canciones'), trackId, cancion, acierto, intento);

  // solo suman al ranking los jugadores registrados y las rondas válidas
  var jug = ss.getSheetByName('Jugadores'), fj = buscar_(jug, d.id);
  if (fj) jug.getRange(fj, 5).setValue(new Date());
  if (fj && valida) {
    var datosJ = jug.getRange(fj, 2, 1, 2).getValues()[0];
    var rk = ss.getSheetByName('Ranking'), fr = buscarRanking_(rk, mes, d.id);
    if (fr) {
      var v = rk.getRange(fr, 5, 1, 3).getValues()[0];
      rk.getRange(fr, 3, 1, 6).setValues([[datosJ[0], datosJ[1], v[0] + esperado, v[1] + 1, v[2] + (acierto ? 1 : 0), new Date()]]);
    } else rk.appendRow(["'" + mes, d.id, datosJ[0], datosJ[1], esperado, 1, acierto ? 1 : 0, new Date()]);
    CacheService.getScriptCache().remove('rk_' + mes);
  }
  return { ok: true, valida: valida, cuenta: !!fj };
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

function buscarRanking_(h, mes, id) {
  if (h.getLastRow() < 2) return 0;
  var datos = h.getRange(2, 1, h.getLastRow() - 1, 2).getValues();
  for (var i = datos.length - 1; i >= 0; i--) if (datos[i][0] === mes && datos[i][1] === id) return i + 2;
  return 0;
}
