/* Laden von Manifest und Einheiten, stabile Karten-IDs, CSV-Export. */
window.Vamos = window.Vamos || {};

Vamos.data = (function () {
  var manifest = null;
  var unitCache = {};

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " bei " + url);
      return r.json();
    });
  }

  function loadManifest() {
    if (manifest) return Promise.resolve(manifest);
    return fetchJson("data/manifest.json").then(function (m) {
      manifest = m;
      return m;
    });
  }

  function slug(es) {
    return es.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  /* Einheit laden und jedem Eintrag eine stabile ID + Referenz auf die Einheit geben. */
  function loadUnit(meta) {
    if (unitCache[meta.id]) return Promise.resolve(unitCache[meta.id]);
    return fetchJson(meta.file).then(function (u) {
      var seen = {};
      u.words.forEach(function (w) {
        var base = meta.id + ":" + slug(w.es);
        var id = base, n = 2;
        while (seen[id]) { id = base + "-" + n; n += 1; }
        seen[id] = true;
        w.id = id;
        w.unitId = meta.id;
      });
      u.meta = meta;
      unitCache[meta.id] = u;
      return u;
    });
  }

  function loadAllUnits() {
    return loadManifest().then(function (m) {
      return Promise.all(m.units.map(loadUnit));
    });
  }

  /* Alle Karten in Manifest-Reihenfolge (= Wichtigkeit) für den Lernmodus. */
  function allCards() {
    return loadAllUnits().then(function (units) {
      var cards = [];
      units.forEach(function (u) {
        u.words.forEach(function (w) { cards.push(w); });
      });
      return cards;
    });
  }

  function unitMeta(id) {
    if (!manifest) return null;
    for (var i = 0; i < manifest.units.length; i++)
      if (manifest.units[i].id === id) return manifest.units[i];
    return null;
  }

  function grammarMeta(id) {
    if (!manifest) return null;
    for (var i = 0; i < manifest.grammar.length; i++)
      if (manifest.grammar[i].id === id) return manifest.grammar[i];
    return null;
  }

  function loadGrammar(meta) {
    return fetchJson(meta.file);
  }

  function csvEscape(s) {
    s = String(s == null ? "" : s);
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  /* CSV: Anki-kompatibel (Semikolon, Spanisch;Deutsch;Beispiel). */
  function unitToCsv(unit) {
    var rows = ["Spanisch;Deutsch;Beispiel;Beispiel (DE)"];
    unit.words.forEach(function (w) {
      rows.push([w.es, w.de, w.ex || "", w.exDe || ""].map(csvEscape).join(";"));
    });
    return rows.join("\n");
  }

  function download(filename, text, mime) {
    var blob = new Blob(["﻿" + text], { type: (mime || "text/csv") + ";charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 100);
  }

  return {
    loadManifest: loadManifest, loadUnit: loadUnit, loadAllUnits: loadAllUnits,
    allCards: allCards, unitMeta: unitMeta, grammarMeta: grammarMeta,
    loadGrammar: loadGrammar, unitToCsv: unitToCsv, download: download
  };
})();
