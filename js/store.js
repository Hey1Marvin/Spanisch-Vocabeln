/* Persistenz: localStorage mit Namespace, defensiv gelesen. */
window.Vamos = window.Vamos || {};

Vamos.store = (function () {
  var NS = "vamos.";

  function get(key, fallback) {
    try {
      var raw = localStorage.getItem(NS + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
    } catch (e) {
      console.warn("localStorage voll oder blockiert", e);
    }
  }

  var defaults = {
    newPerDay: 15,
    direction: "es-de", // es-de | de-es | mixed
    voiceURI: "",
    speechRate: 0.9
  };

  function settings() {
    var s = get("settings", {});
    var out = {};
    for (var k in defaults) out[k] = (k in s) ? s[k] : defaults[k];
    return out;
  }

  function saveSettings(patch) {
    var s = settings();
    for (var k in patch) s[k] = patch[k];
    set("settings", s);
  }

  // SRS-Zustände: { cardId: {r, e, i, due, l} }
  function srs() { return get("srs", {}); }
  function saveSrs(map) { set("srs", map); }

  // Lern-Log: { "2026-08-04": 23 }
  function log() { return get("log", {}); }
  function bumpLog(n) {
    var l = log();
    var day = new Date().toISOString().slice(0, 10);
    l[day] = (l[day] || 0) + (n || 1);
    set("log", l);
  }

  // Grammatik-Ergebnisse: { g01: {score, total, date} }
  function grammar() { return get("grammar", {}); }
  function saveGrammarResult(id, score, total) {
    var g = grammar();
    g[id] = { score: score, total: total, date: new Date().toISOString().slice(0, 10) };
    set("grammar", g);
  }

  function exportAll() {
    return JSON.stringify({
      app: "vamos",
      version: 1,
      exported: new Date().toISOString(),
      srs: srs(),
      log: log(),
      grammar: grammar(),
      settings: settings()
    }, null, 2);
  }

  function importAll(json) {
    var data = JSON.parse(json);
    if (!data || data.app !== "vamos") throw new Error("Keine gültige Vamos-Backup-Datei");
    if (data.srs) set("srs", data.srs);
    if (data.log) set("log", data.log);
    if (data.grammar) set("grammar", data.grammar);
    if (data.settings) set("settings", data.settings);
  }

  function resetAll() {
    ["srs", "log", "grammar", "settings"].forEach(function (k) {
      localStorage.removeItem(NS + k);
    });
  }

  return {
    settings: settings, saveSettings: saveSettings,
    srs: srs, saveSrs: saveSrs,
    log: log, bumpLog: bumpLog,
    grammar: grammar, saveGrammarResult: saveGrammarResult,
    exportAll: exportAll, importAll: importAll, resetAll: resetAll
  };
})();
