/* Router + Views: Dashboard, Einheiten, Lernen, Grammatik, Statistik, Suche, Einstellungen. */
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

  function loading() {
    main.innerHTML = Vamos.ui.skeleton(3);
  }

  function todayCount() {
    return Vamos.store.log()[new Date().toISOString().slice(0, 10)] || 0;
  }

  function streak(log) {
    var n = 0;
    var d = new Date();
    if (!log[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
    while (log[d.toISOString().slice(0, 10)]) {
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  /* Einheiten, in denen schon gelernt wurde (für Mix/Hör-Quiz). */
  function startedCards(units, srsMap) {
    var started = units.filter(function (u) {
      return u.words.some(function (w) {
        var st = srsMap[w.id];
        return st && st.r > 0;
      });
    });
    if (!started.length) started = units.slice(0, 2);
    var cards = [];
    started.forEach(function (u) { cards = cards.concat(u.words); });
    return cards;
  }

  /* ---------- Dashboard ---------- */

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return "¡Buenos días!";
    if (h < 20) return "¡Buenas tardes!";
    return "¡Buenas noches!";
  }

  function viewDashboard() {
    loading();
    Vamos.data.allCards().then(function (cards) {
      var srsMap = Vamos.store.srs();
      var s = Vamos.store.settings();
      var c = Vamos.srs.counts(cards, srsMap);
      var log = Vamos.store.log();
      var st = streak(log);
      var today = todayCount();
      var goal = s.dailyGoal || 30;
      var newToday = Math.min(c["new"], s.newPerDay);
      var todo = c.due + newToday;

      var html =
        '<div class="card hero">' +
        '<div style="flex:1;min-width:0">' +
        '<p class="greet">' + greeting() + "</p>" +
        '<p class="sub">' +
        (todo > 0
          ? c.due + " fällige + " + newToday + " neue Karten warten auf dich."
          : "Alles erledigt – ¡fantástico!") +
        "</p>" +
        (todo > 0
          ? '<a class="btn cta" href="#/learn">Jetzt lernen (' + todo + ")</a>"
          : '<a class="btn cta" href="#/mix">Mix-Quiz starten</a>') +
        "</div>" +
        '<div class="ring-wrap">' +
        Vamos.ui.ring(today / goal, today + "/" + goal) +
        '<span class="ring-label">Tagesziel</span>' +
        "</div></div>" +

        '<div class="quick-grid">' +
        '<a class="quick" href="#/mix"><span class="ico">🔀</span><span class="lbl">Mix-Quiz</span></a>' +
        '<a class="quick" href="#/listen"><span class="ico">🎧</span><span class="lbl">Hör-Quiz</span></a>' +
        '<a class="quick" href="#/conj"><span class="ico">🏃</span><span class="lbl">Konjugation</span></a>' +
        '<a class="quick" href="#/search"><span class="ico">🔍</span><span class="lbl">Suche</span></a>' +
        "</div>" +

        '<div class="stat-grid">' +
        '<div class="card"><div class="num">' + st + " 🔥</div><div class=\"lbl\">Streak</div></div>" +
        '<div class="card"><div class="num">' + c.mastered + "</div><div class=\"lbl\">Gelernt</div></div>" +
        '<div class="card"><div class="num">' + c.learning + "</div><div class=\"lbl\">In Arbeit</div></div>" +
        "</div>";

      Vamos.data.loadAllUnits().then(function (units) {
        html += '<div class="card"><h2>Nächste Einheiten</h2><div id="unitList"></div>' +
          '<a class="btn small" href="#/units" style="margin-top:.5rem">Alle Einheiten</a></div>';
        main.innerHTML = html;
        document.getElementById("unitList").innerHTML =
          units.slice(0, 5).map(function (u) { return unitRow(u, srsMap); }).join("");
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
    loading();
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
      html += '<div class="card"><h2>📥 Downloads</h2>' +
        '<p class="muted small">Anki-Dateien: In Anki über „Datei → Importieren“ laden. ' +
        "Erneuter Import aktualisiert die Karten, statt sie zu doppeln.</p>" +
        '<div class="btn-row">' +
        '<button class="btn" id="dlAnkiAll">Alle Vokabeln (Anki)</button>' +
        '<button class="btn" id="dlAnkiPhrases">Nur Sätze & Formulierungen (Anki)</button>' +
        '<button class="btn" id="dlCsvAll">Alles als CSV</button>' +
        "</div></div>";
      main.innerHTML = html;

      document.getElementById("dlAnkiAll").addEventListener("click", function () {
        Vamos.data.download("vamos-alle-einheiten.txt", Vamos.data.allToAnki(units), "text/plain");
        toast("Anki-Datei heruntergeladen");
      });
      document.getElementById("dlAnkiPhrases").addEventListener("click", function () {
        Vamos.data.download("vamos-saetze.txt", Vamos.data.phrasesToAnki(units), "text/plain");
        toast("Sätze-Paket heruntergeladen");
      });
      document.getElementById("dlCsvAll").addEventListener("click", function () {
        Vamos.data.download("vamos-alle.csv", Vamos.data.allToCsv(units));
        toast("CSV heruntergeladen");
      });
    }).catch(fail);
  }

  function viewUnit(id) {
    loading();
    Vamos.data.loadManifest().then(function () {
      var meta = Vamos.data.unitMeta(id);
      if (!meta) throw new Error("Einheit nicht gefunden: " + id);
      return Vamos.data.loadUnit(meta);
    }).then(function (u) {
      var srsMap = Vamos.store.srs();
      var c = Vamos.srs.counts(u.words, srsMap);
      var html =
        '<div class="card">' +
        "<h2>" + esc(u.meta.emoji) + " " + esc(u.meta.title) +
        ' <span class="pill level">' + esc(u.meta.level) + "</span></h2>" +
        '<p class="muted small">' + esc(u.meta.desc || "") + "</p>" +
        '<p class="muted small">' + c.total + " Karten · " + c.mastered + " gelernt · " +
        c.learning + " in Arbeit · " + c["new"] + " neu</p>" +
        '<div class="btn-row no-print">' +
        '<a class="btn primary" href="#/quiz/' + id + '">Quiz</a>' +
        '<a class="btn" href="#/type/' + id + '">Tippen</a>' +
        '<a class="btn" href="#/listen/' + id + '">Hören 🎧</a>' +
        '<a class="btn" href="#/cloze/' + id + '">Satz-Lücke ✍️</a>' +
        '<a class="btn" href="#/order/' + id + '">Satzbau 🧩</a>' +
        "</div>" +
        '<div class="btn-row no-print">' +
        '<button class="btn small" id="ankiBtn">Anki ⬇</button>' +
        '<button class="btn small" id="csvBtn">CSV ⬇</button>' +
        '<button class="btn small" id="printBtn">Drucken 🖨</button>' +
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

      var slugTitle = u.meta.id + "-" + u.meta.title.replace(/[^a-zA-Zäöüß]+/g, "-");
      document.getElementById("ankiBtn").addEventListener("click", function () {
        Vamos.data.download("vamos-" + slugTitle + ".txt", Vamos.data.unitToAnki(u), "text/plain");
        toast("Anki-Datei heruntergeladen");
      });
      document.getElementById("csvBtn").addEventListener("click", function () {
        Vamos.data.download("vamos-" + slugTitle + ".csv", Vamos.data.unitToCsv(u));
        toast("CSV heruntergeladen");
      });
      document.getElementById("printBtn").addEventListener("click", function () {
        window.print();
      });
    }).catch(fail);
  }

  /* ---------- Lern-Session / Quiz-Wrapper ---------- */

  function viewLearn() {
    loading();
    Vamos.data.allCards().then(function (cards) {
      Vamos.quiz.renderLearnSession(main, cards);
    }).catch(fail);
  }

  function withUnit(id, fn) {
    loading();
    Vamos.data.loadManifest().then(function () {
      var meta = Vamos.data.unitMeta(id);
      if (!meta) throw new Error("Einheit nicht gefunden: " + id);
      return Vamos.data.loadUnit(meta);
    }).then(function (u) { fn(u); }).catch(fail);
  }

  function viewMix() {
    loading();
    Vamos.data.loadAllUnits().then(function (units) {
      Vamos.quiz.renderMixQuiz(main, units);
    }).catch(fail);
  }

  function viewConj() {
    loading();
    fetch("data/conjugation.json").then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (conj) {
      Vamos.quiz.renderConjQuiz(main, conj);
    }).catch(fail);
  }

  function viewListenGlobal() {
    loading();
    Vamos.data.loadAllUnits().then(function (units) {
      var cards = startedCards(units, Vamos.store.srs());
      Vamos.quiz.renderListenQuiz(main, cards, "#/", "Hör-Quiz");
    }).catch(fail);
  }

  /* ---------- Suche ---------- */

  function viewSearch() {
    loading();
    Vamos.data.loadAllUnits().then(function (units) {
      var all = [];
      units.forEach(function (u) {
        u.words.forEach(function (w) { all.push(w); });
      });
      main.innerHTML =
        '<div class="card"><h2>🔍 Suche</h2>' +
        '<input class="answer-input" id="searchInput" autocomplete="off" ' +
        'placeholder="Spanisch oder Deutsch …">' +
        '<div id="results" style="margin-top:.6rem"></div></div>';
      var input = document.getElementById("searchInput");
      var results = document.getElementById("results");
      input.focus();

      function norm(s) {
        return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }

      input.addEventListener("input", function () {
        var q = norm(input.value.trim());
        if (q.length < 2) {
          results.innerHTML = '<p class="muted small">Mindestens 2 Zeichen …</p>';
          return;
        }
        var hits = all.filter(function (w) {
          return norm(w.es).indexOf(q) >= 0 || norm(w.de).indexOf(q) >= 0;
        }).slice(0, 30);
        if (!hits.length) {
          results.innerHTML = '<p class="muted small">Nichts gefunden.</p>';
          return;
        }
        results.innerHTML = hits.map(function (w) {
          var meta = Vamos.data.unitMeta(w.unitId) || {};
          return '<div class="search-hit">' +
            (w.emoji ? esc(w.emoji) + " " : "") +
            '<span class="es">' + esc(w.es) + "</span> " + Vamos.quiz.speakBtn(w.es) +
            '<span class="muted">' + esc(w.de) + "</span>" +
            '<a class="unit" href="#/unit/' + esc(w.unitId) + '">' + esc(meta.emoji || "") + " " +
            esc(meta.title || w.unitId) + "</a></div>";
        }).join("");
        Vamos.quiz.bindSpeak(results);
      });
      input.dispatchEvent(new Event("input"));
    }).catch(fail);
  }

  /* ---------- Grammatik ---------- */

  function viewGrammarList() {
    loading();
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
    loading();
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
    loading();
    Vamos.data.allCards().then(function (cards) {
      var srsMap = Vamos.store.srs();
      var c = Vamos.srs.counts(cards, srsMap);
      var log = Vamos.store.log();
      var s = streak(log);
      var total = Object.keys(log).reduce(function (a, k) { return a + log[k]; }, 0);

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
        '<div class="card"><div class="num">' + s + " 🔥</div><div class=\"lbl\">Streak</div></div>" +
        '<div class="card"><div class="num">' + total + "</div><div class=\"lbl\">Reviews</div></div>" +
        '<div class="card"><div class="num">' + c.due + "</div><div class=\"lbl\">Fällig</div></div>" +
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
      '<label class="setting">Design</label>' +
      '<select id="setTheme">' +
      '<option value="auto"' + (s.theme === "auto" ? " selected" : "") + ">Automatisch (System)</option>" +
      '<option value="light"' + (s.theme === "light" ? " selected" : "") + ">Hell</option>" +
      '<option value="dark"' + (s.theme === "dark" ? " selected" : "") + ">Dunkel</option>" +
      "</select>" +
      '<label class="setting">Tagesziel (Wiederholungen pro Tag)</label>' +
      '<input type="number" id="setGoal" min="5" max="500" value="' + s.dailyGoal + '">' +
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
        theme: document.getElementById("setTheme").value,
        dailyGoal: Math.max(1, parseInt(document.getElementById("setGoal").value, 10) || 30),
        newPerDay: Math.max(0, parseInt(document.getElementById("setNew").value, 10) || 0),
        direction: document.getElementById("setDir").value,
        voiceURI: document.getElementById("setVoice").value,
        speechRate: parseFloat(document.getElementById("setRate").value)
      });
      Vamos.ui.applyTheme(document.getElementById("setTheme").value);
      toast("Gespeichert");
    }
    ["setTheme", "setGoal", "setNew", "setDir", "setVoice"].forEach(function (id) {
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
    { re: /^#\/mix$/, fn: viewMix, tab: "learn" },
    { re: /^#\/listen$/, fn: viewListenGlobal, tab: "learn" },
    { re: /^#\/listen\/([\w-]+)$/, fn: function (id) { withUnit(id, function (u) { Vamos.quiz.renderListenQuiz(main, u.words, "#/unit/" + id, u.meta.title); }); }, tab: "units" },
    { re: /^#\/cloze\/([\w-]+)$/, fn: function (id) { withUnit(id, function (u) { Vamos.quiz.renderClozeQuiz(main, u.words, "#/unit/" + id); }); }, tab: "units" },
    { re: /^#\/order\/([\w-]+)$/, fn: function (id) { withUnit(id, function (u) { Vamos.quiz.renderOrderQuiz(main, u.words, "#/unit/" + id); }); }, tab: "units" },
    { re: /^#\/conj$/, fn: viewConj, tab: "learn" },
    { re: /^#\/quiz\/([\w-]+)$/, fn: function (id) { withUnit(id, function (u) { Vamos.quiz.renderMcQuiz(main, u); }); }, tab: "units" },
    { re: /^#\/type\/([\w-]+)$/, fn: function (id) { withUnit(id, function (u) { Vamos.quiz.renderTypeQuiz(main, u); }); }, tab: "units" },
    { re: /^#\/grammar$/, fn: viewGrammarList, tab: "grammar" },
    { re: /^#\/grammar\/([\w-]+)$/, fn: viewGrammar, tab: "grammar" },
    { re: /^#\/stats$/, fn: viewStats, tab: "stats" },
    { re: /^#\/search$/, fn: viewSearch, tab: "" },
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
        // View-Einblendung neu starten
        main.style.animation = "none";
        void main.offsetHeight;
        main.style.animation = "";
        routes[i].fn(m[1]);
        return;
      }
    }
    location.hash = "#/";
  }

  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", function () {
    main = document.getElementById("app");
    Vamos.ui.applyTheme(Vamos.store.settings().theme);
    route();
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  });
})();
