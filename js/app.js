/* Router + Views: Dashboard, Einheiten, Lernen, Grammatik, Statistik, Einstellungen. */
window.Vamos = window.Vamos || {};

(function () {
  var esc = function (s) { return Vamos.quiz.esc(s); };
  var main = null;

  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function fail(err) {
    console.error(err);
    main.innerHTML =
      '<div class="empty-state"><div class="big">😕</div>' +
      "<p>Daten konnten nicht geladen werden.</p>" +
      '<p class="muted small">' + esc(err.message || err) + "</p>" +
      '<button class="btn primary" onclick="location.reload()">Neu laden</button></div>';
  }

  /* ---------- Dashboard ---------- */

  function streak(log) {
    var n = 0;
    var d = new Date();
    // heute zählt, wenn gelernt; sonst ab gestern rückwärts
    if (!log[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
    while (log[d.toISOString().slice(0, 10)]) {
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function viewDashboard() {
    Vamos.data.allCards().then(function (cards) {
      var srsMap = Vamos.store.srs();
      var c = Vamos.srs.counts(cards, srsMap);
      var log = Vamos.store.log();
      var s = streak(log);
      var newToday = Math.min(c["new"], Vamos.store.settings().newPerDay);
      var todo = c.due + newToday;

      var html =
        '<div class="card" style="text-align:center">' +
        '<h2 style="font-size:1.3rem">¡Hola! 👋</h2>' +
        (todo > 0
          ? '<p class="muted">' + c.due + " fällige + " + newToday + " neue Karten warten.</p>" +
            '<a class="btn primary" href="#/learn" style="font-size:1.05rem;padding:.7rem 2rem">Jetzt lernen (' + todo + ")</a>"
          : '<p class="muted">Alles erledigt für heute – ¡muy bien! 🎉</p>') +
        "</div>" +
        '<div class="stat-grid">' +
        '<div class="card"><div class="num">' + s + " 🔥</div><div class=\"lbl\">Tage-Streak</div></div>" +
        '<div class="card"><div class="num">' + c.mastered + "</div><div class=\"lbl\">Gelernt</div></div>" +
        '<div class="card"><div class="num">' + c.learning + "</div><div class=\"lbl\">In Arbeit</div></div>" +
        "</div>";

      // Einheiten-Fortschritt (Top 5 nach Rang)
      Vamos.data.loadAllUnits().then(function (units) {
        html += '<div class="card"><h2>Nächste Einheiten</h2><div id="unitList"></div>' +
          '<a class="btn small" href="#/units" style="margin-top:.5rem">Alle Einheiten</a></div>';
        main.innerHTML = html;
        var target = document.getElementById("unitList");
        target.innerHTML = units.slice(0, 5).map(function (u) {
          return unitRow(u, srsMap);
        }).join("");
      });
    }).catch(fail);
  }

  function unitRow(u, srsMap) {
    var c = Vamos.srs.counts(u.words, srsMap);
    var pct = c.total ? Math.round(100 * c.mastered / c.total) : 0;
    var started = c.learning + c.mastered > 0;
    return '<a class="unit-row" href="#/unit/' + u.meta.id + '">' +
      '<span class="emoji">' + esc(u.meta.emoji) + "</span>" +
      '<span class="body"><span class="title">' + esc(u.meta.title) + "</span> " +
      '<span class="pill level">' + esc(u.meta.level) + "</span>" +
      '<span class="muted small" style="display:block">' + c.total + " Karten · " +
      c.mastered + " gelernt" + (c.due ? " · <strong>" + c.due + " fällig</strong>" : "") + "</span>" +
      '<span class="progress"><i class="' + (pct < 100 && started ? "partial" : "") +
      '" style="width:' + Math.max(pct, started ? 4 : 0) + '%"></i></span>' +
      "</span></a>";
  }

  /* ---------- Einheiten ---------- */

  var PHASES = {
    1: "Phase 1 – Fundament",
    2: "Phase 2 – Reisen",
    3: "Phase 3 – Konversation",
    4: "Phase 4 – Feinschliff"
  };

  function viewUnits() {
    Vamos.data.loadAllUnits().then(function (units) {
      var srsMap = Vamos.store.srs();
      var byPhase = {};
      units.forEach(function (u) {
        (byPhase[u.meta.phase] = byPhase[u.meta.phase] || []).push(u);
      });
      var html = "";
      Object.keys(byPhase).sort().forEach(function (ph) {
        html += '<div class="card"><h2>' + esc(PHASES[ph] || "Phase " + ph) + "</h2>" +
          byPhase[ph].map(function (u) { return unitRow(u, srsMap); }).join("") + "</div>";
      });
      main.innerHTML = html;
    }).catch(fail);
  }

  function viewUnit(id) {
    Vamos.data.loadManifest().then(function () {
      var meta = Vamos.data.unitMeta(id);
      if (!meta) throw new Error("Einheit nicht gefunden: " + id);
      return Vamos.data.loadUnit(meta);
    }).then(function (u) {
      var srsMap = Vamos.store.srs();
      var c = Vamos.srs.counts(u.words, srsMap);
      var html =
        '<div class="card">' +
        '<h2>' + esc(u.meta.emoji) + " " + esc(u.meta.title) +
        ' <span class="pill level">' + esc(u.meta.level) + "</span></h2>" +
        '<p class="muted small">' + esc(u.meta.desc || "") + "</p>" +
        '<p class="muted small">' + c.total + " Karten · " + c.mastered + " gelernt · " +
        c.learning + " in Arbeit · " + c["new"] + " neu</p>" +
        '<div class="btn-row no-print">' +
        '<a class="btn primary" href="#/quiz/' + id + '">Quiz (Auswahl)</a>' +
        '<a class="btn" href="#/type/' + id + '">Tippen (DE→ES)</a>' +
        '<button class="btn" id="csvBtn">CSV ⬇</button>' +
        '<button class="btn" id="printBtn">Drucken 🖨</button>' +
        "</div></div>" +
        '<div class="card"><h2 class="no-print">Vokabeln</h2><table class="vocab"><tbody>';

      u.words.forEach(function (w) {
        var st = Vamos.srs.status(srsMap[w.id]);
        html += "<tr><td>" +
          '<span class="dot ' + st + '"></span><span class="es">' + esc(w.es) + "</span> " +
          Vamos.quiz.speakBtn(w.es) +
          (w.ex ? '<div class="ex">' + esc(w.ex) + "</div>" : "") +
          "</td><td>" + (w.emoji ? esc(w.emoji) + " " : "") + esc(w.de) +
          (w.exDe ? '<div class="ex">' + esc(w.exDe) + "</div>" : "") +
          "</td></tr>";
      });
      html += "</tbody></table></div>";
      main.innerHTML = html;
      Vamos.quiz.bindSpeak(main);
      document.getElementById("csvBtn").addEventListener("click", function () {
        Vamos.data.download(u.meta.id + "-" + u.meta.title.replace(/[^a-zA-Zäöü]+/g, "-") + ".csv",
          Vamos.data.unitToCsv(u));
        toast("CSV heruntergeladen");
      });
      document.getElementById("printBtn").addEventListener("click", function () {
        window.print();
      });
    }).catch(fail);
  }

  /* ---------- Lern-Session / Quiz-Wrapper ---------- */

  function viewLearn() {
    Vamos.data.allCards().then(function (cards) {
      Vamos.quiz.renderLearnSession(main, cards);
    }).catch(fail);
  }

  function withUnit(id, fn) {
    Vamos.data.loadManifest().then(function () {
      var meta = Vamos.data.unitMeta(id);
      if (!meta) throw new Error("Einheit nicht gefunden: " + id);
      return Vamos.data.loadUnit(meta);
    }).then(function (u) { fn(u); }).catch(fail);
  }

  /* ---------- Grammatik ---------- */

  function viewGrammarList() {
    Vamos.data.loadManifest().then(function (m) {
      var results = Vamos.store.grammar();
      var html = '<div class="card"><h2>📖 Grammatik</h2>' +
        m.grammar.map(function (g) {
          var r = results[g.id];
          return '<a class="unit-row" href="#/grammar/' + g.id + '">' +
            '<span class="emoji">' + esc(g.emoji) + "</span>" +
            '<span class="body"><span class="title">' + esc(g.title) + "</span> " +
            '<span class="pill level">' + esc(g.level) + "</span>" +
            (r ? '<span class="muted small" style="display:block">Zuletzt: ' +
              r.score + "/" + r.total + " (" + r.date + ")</span>" :
              '<span class="muted small" style="display:block">Noch nicht geübt</span>') +
            "</span>" +
            (r && r.score / r.total >= 0.8 ? '<span class="pill done">✓</span>' : "") +
            "</a>";
        }).join("") + "</div>";
      main.innerHTML = html;
    }).catch(fail);
  }

  function viewGrammar(id) {
    Vamos.data.loadManifest().then(function () {
      var meta = Vamos.data.grammarMeta(id);
      if (!meta) throw new Error("Kapitel nicht gefunden: " + id);
      return Vamos.data.loadGrammar(meta).then(function (g) {
        main.innerHTML =
          '<div class="card"><h2>' + esc(meta.emoji) + " " + esc(g.title) +
          ' <span class="pill level">' + esc(meta.level) + "</span></h2>" +
          '<div class="btn-row">' +
          '<button class="btn primary" id="exBtn">Übungen starten (' +
          (g.exercises || []).length + ")</button></div></div>" +
          '<div id="theory"></div>';
        Vamos.grammar.renderTheory(document.getElementById("theory"), g);
        document.getElementById("exBtn").addEventListener("click", function () {
          Vamos.grammar.renderExercises(main, g);
          window.scrollTo(0, 0);
        });
      });
    }).catch(fail);
  }

  /* ---------- Statistik ---------- */

  function viewStats() {
    Vamos.data.allCards().then(function (cards) {
      var srsMap = Vamos.store.srs();
      var c = Vamos.srs.counts(cards, srsMap);
      var log = Vamos.store.log();
      var s = streak(log);
      var total = Object.keys(log).reduce(function (a, k) { return a + log[k]; }, 0);

      // letzte 14 Tage
      var days = [];
      for (var i = 13; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        days.push({ key: key, n: log[key] || 0, label: d.getDate() + "." });
      }
      var maxN = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.n; })));

      var html =
        '<div class="stat-grid">' +
        '<div class="card"><div class="num">' + s + " 🔥</div><div class=\"lbl\">Tage-Streak</div></div>" +
        '<div class="card"><div class="num">' + total + "</div><div class=\"lbl\">Wiederholungen</div></div>" +
        '<div class="card"><div class="num">' + c.due + "</div><div class=\"lbl\">Jetzt fällig</div></div>" +
        "</div>" +
        '<div class="card"><h2>Aktivität (14 Tage)</h2><div class="chart">' +
        days.map(function (d) {
          var h = Math.round(100 * d.n / maxN);
          return '<div class="bar ' + (d.n ? "" : "empty") + '" style="height:' +
            Math.max(3, h) + '%" title="' + d.key + ": " + d.n + '"></div>';
        }).join("") + "</div>" +
        '<div class="chart-labels">' + days.map(function (d) {
          return "<span>" + d.label + "</span>";
        }).join("") + "</div></div>" +
        '<div class="card"><h2>Karten gesamt</h2>' +
        '<p class="muted small">' + c.total + " Karten · " +
        '<span class="dot mastered"></span>' + c.mastered + " gelernt · " +
        '<span class="dot learning"></span>' + c.learning + " in Arbeit · " +
        '<span class="dot new"></span>' + c["new"] + " neu</p>" +
        '<div class="progress"><i style="width:' +
        (c.total ? Math.round(100 * c.mastered / c.total) : 0) + '%"></i></div></div>' +
        '<div class="card"><h2>Fortschritt pro Einheit</h2><div id="unitProgress"></div></div>';

      Vamos.data.loadAllUnits().then(function (units) {
        main.innerHTML = html;
        document.getElementById("unitProgress").innerHTML =
          units.map(function (u) { return unitRow(u, srsMap); }).join("");
      });
    }).catch(fail);
  }

  /* ---------- Einstellungen ---------- */

  function viewSettings() {
    var s = Vamos.store.settings();
    var voices = Vamos.audio.spanishVoices();
    var html =
      '<div class="card"><h2>⚙️ Einstellungen</h2>' +
      '<label class="setting">Neue Karten pro Lernsession</label>' +
      '<input type="number" id="setNew" min="0" max="100" value="' + s.newPerDay + '">' +
      '<label class="setting">Abfrage-Richtung</label>' +
      '<select id="setDir">' +
      '<option value="es-de"' + (s.direction === "es-de" ? " selected" : "") + ">Spanisch → Deutsch</option>" +
      '<option value="de-es"' + (s.direction === "de-es" ? " selected" : "") + ">Deutsch → Spanisch</option>" +
      '<option value="mixed"' + (s.direction === "mixed" ? " selected" : "") + ">Gemischt</option>" +
      "</select>" +
      '<label class="setting">Stimme (Audio)</label>' +
      '<select id="setVoice"><option value="">Automatisch (es-ES)</option>' +
      voices.map(function (v) {
        return '<option value="' + esc(v.voiceURI) + '"' +
          (s.voiceURI === v.voiceURI ? " selected" : "") + ">" +
          esc(v.name + " (" + v.lang + ")") + "</option>";
      }).join("") + "</select>" +
      '<label class="setting">Sprechtempo: <span id="rateVal">' + s.speechRate + "</span></label>" +
      '<input type="range" id="setRate" min="0.5" max="1.2" step="0.1" value="' + s.speechRate + '" style="width:100%">' +
      '<div class="btn-row" style="margin-top:1rem">' +
      '<button class="btn small" id="testVoice">🔊 Stimme testen</button></div>' +
      "</div>" +
      '<div class="card"><h2>💾 Backup</h2>' +
      '<p class="muted small">Dein Fortschritt liegt nur in diesem Browser. Exportiere regelmäßig ein Backup, ' +
      "z. B. vor einem Gerätewechsel.</p>" +
      '<div class="btn-row">' +
      '<button class="btn primary" id="exportBtn">Backup exportieren</button>' +
      '<button class="btn" id="importBtn">Backup importieren</button>' +
      '<input type="file" id="importFile" accept=".json" style="display:none">' +
      "</div></div>" +
      '<div class="card"><h2>🗑 Zurücksetzen</h2>' +
      '<p class="muted small">Löscht den kompletten Lernfortschritt auf diesem Gerät.</p>' +
      '<button class="btn" id="resetBtn" style="color:var(--accent)">Fortschritt löschen …</button></div>' +
      '<p class="muted small" style="text-align:center">¡Vamos! · <a href="https://github.com/Hey1Marvin/Spanisch-Vocabeln">GitHub</a></p>';

    main.innerHTML = html;

    function save() {
      Vamos.store.saveSettings({
        newPerDay: Math.max(0, parseInt(document.getElementById("setNew").value, 10) || 0),
        direction: document.getElementById("setDir").value,
        voiceURI: document.getElementById("setVoice").value,
        speechRate: parseFloat(document.getElementById("setRate").value)
      });
      toast("Gespeichert");
    }
    ["setNew", "setDir", "setVoice"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", save);
    });
    document.getElementById("setRate").addEventListener("input", function () {
      document.getElementById("rateVal").textContent = this.value;
    });
    document.getElementById("setRate").addEventListener("change", save);
    document.getElementById("testVoice").addEventListener("click", function () {
      Vamos.audio.speak("¡Hola! ¿Qué tal? Me alegro de verte.");
    });
    document.getElementById("exportBtn").addEventListener("click", function () {
      Vamos.data.download("vamos-backup-" + new Date().toISOString().slice(0, 10) + ".json",
        Vamos.store.exportAll(), "application/json");
      toast("Backup exportiert");
    });
    document.getElementById("importBtn").addEventListener("click", function () {
      document.getElementById("importFile").click();
    });
    document.getElementById("importFile").addEventListener("change", function () {
      var f = this.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          Vamos.store.importAll(reader.result);
          toast("Backup importiert ✅");
          setTimeout(function () { location.hash = "#/"; }, 800);
        } catch (e) {
          toast("Fehler: " + e.message);
        }
      };
      reader.readAsText(f);
    });
    document.getElementById("resetBtn").addEventListener("click", function () {
      if (confirm("Wirklich den kompletten Lernfortschritt löschen?")) {
        Vamos.store.resetAll();
        toast("Zurückgesetzt");
        setTimeout(function () { location.hash = "#/"; location.reload(); }, 600);
      }
    });
  }

  /* ---------- Router ---------- */

  var routes = [
    { re: /^#?\/?$/, fn: viewDashboard, tab: "home" },
    { re: /^#\/units$/, fn: viewUnits, tab: "units" },
    { re: /^#\/unit\/([\w-]+)$/, fn: viewUnit, tab: "units" },
    { re: /^#\/learn$/, fn: viewLearn, tab: "learn" },
    { re: /^#\/quiz\/([\w-]+)$/, fn: function (id) { withUnit(id, function (u) { Vamos.quiz.renderMcQuiz(main, u); }); }, tab: "units" },
    { re: /^#\/type\/([\w-]+)$/, fn: function (id) { withUnit(id, function (u) { Vamos.quiz.renderTypeQuiz(main, u); }); }, tab: "units" },
    { re: /^#\/grammar$/, fn: viewGrammarList, tab: "grammar" },
    { re: /^#\/grammar\/([\w-]+)$/, fn: viewGrammar, tab: "grammar" },
    { re: /^#\/stats$/, fn: viewStats, tab: "stats" },
    { re: /^#\/settings$/, fn: viewSettings, tab: "" }
  ];

  function route() {
    var hash = location.hash || "#/";
    if (window.speechSynthesis) speechSynthesis.cancel();
    for (var i = 0; i < routes.length; i++) {
      var m = hash.match(routes[i].re);
      if (m) {
        document.querySelectorAll(".tabbar a").forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("data-tab") === routes[i].tab);
        });
        window.scrollTo(0, 0);
        routes[i].fn(m[1]);
        return;
      }
    }
    location.hash = "#/";
  }

  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", function () {
    main = document.getElementById("app");
    route();
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  });
})();
