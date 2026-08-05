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

        (c.mastered + c.learning === 0
          ? '<div class="card"><h2>So funktioniert’s 👋</h2>' +
            '<p class="muted small">1️⃣ <strong>Lernen</strong> zeigt dir neue Karten und fragt fällige ab – ' +
            "bewerte ehrlich, der Rest passiert automatisch (Spaced Repetition).<br>" +
            "2️⃣ Die Einheiten sind nach Wichtigkeit sortiert – einfach oben anfangen.<br>" +
            "3️⃣ 10–15 Minuten täglich schlagen jede Wochenend-Session. 🔥</p></div>"
          : "") +
        '<div class="quick-grid">' +
        '<a class="quick" href="#/mix"><span class="ico">' + Vamos.icons.svg("shuffle") + '</span><span class="lbl">Mix-Quiz</span></a>' +
        '<a class="quick" href="#/listen"><span class="ico">' + Vamos.icons.svg("headphones") + '</span><span class="lbl">Hör-Quiz</span></a>' +
        '<a class="quick" href="#/conj"><span class="ico">' + Vamos.icons.svg("zap") + '</span><span class="lbl">Konjugation</span></a>' +
        '<a class="quick" href="#/search"><span class="ico">' + Vamos.icons.svg("search") + '</span><span class="lbl">Suche</span></a>' +
        '<a class="quick" href="#/tutor"><span class="ico">' + Vamos.icons.svg("bot") + '</span><span class="lbl">KI-Tutor</span></a>' +
        '<a class="quick" href="#/write"><span class="ico">' + Vamos.icons.svg("pen") + '</span><span class="lbl">Text-Check</span></a>' +
        '<a class="quick" href="#/dict"><span class="ico">' + Vamos.icons.svg("book") + '</span><span class="lbl">Wörterbuch</span></a>' +
        '<a class="quick" href="#/verbs"><span class="ico">' + Vamos.icons.svg("table") + '</span><span class="lbl">Verbtabellen</span></a>' +
        '<a class="quick" href="#/speak"><span class="ico">' + Vamos.icons.svg("mic") + '</span><span class="lbl">Nachsprechen</span></a>' +
        '<a class="quick" href="#/review"><span class="ico">' + Vamos.icons.svg("refresh") + '</span><span class="lbl">Rückblick</span></a>' +
        '<a class="quick" href="#/grammar"><span class="ico">' + Vamos.icons.svg("reader") + '</span><span class="lbl">Lesetexte</span></a>' +
        '<a class="quick" href="#/units"><span class="ico">' + Vamos.icons.svg("download") + '</span><span class="lbl">Downloads</span></a>' +
        "</div>" +
        (function () {
          var w = wordOfDay(cards);
          return '<div class="card" style="display:flex;align-items:center;gap:.9rem">' +
            '<span style="color:var(--gold)">' + Vamos.icons.svg("star", "lg") + "</span>" +
            '<div style="flex:1;min-width:0"><div class="muted small">Wort des Tages</div>' +
            '<div style="font-weight:750;font-size:1.05rem">' + (w.emoji ? esc(w.emoji) + " " : "") +
            esc(w.es) + " " + Vamos.quiz.speakBtn(w.es) +
            ' <span class="muted" style="font-weight:400">– ' + esc(w.de) + "</span></div>" +
            (w.ex ? '<div class="muted small">' + esc(w.ex) + "</div>" : "") +
            "</div></div>";
        })() +

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
        Vamos.quiz.bindSpeak(main);
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

  /* ---------- Themen-Pakete: kuratierte Bündel quer über Einheiten ---------- */

  var THEMES = [
    { id: "essen", title: "Essen komplett", emoji: "🍽️", units: ["u07", "u08"] },
    { id: "reise-basics", title: "Reise-Basics", emoji: "🧳", units: ["u01", "u02", "u04", "u05"] },
    { id: "ankommen", title: "Ankommen & Zurechtfinden", emoji: "🏨", units: ["u06", "u09", "u10"] },
    { id: "konversation", title: "Konversation & Leute", emoji: "💬", units: ["u13", "u14", "u15", "u17"] },
    { id: "sicherheit", title: "Geld, Notfall & Orga", emoji: "🚨", units: ["u10", "u11", "u22"] },
    { id: "fluessig", title: "Flüssig klingen", emoji: "🔗", units: ["u19", "u20", "u23"] }
  ];

  function themeCards(theme, units) {
    var cards = [];
    units.forEach(function (u) {
      if (theme.units.indexOf(u.meta.id) >= 0) cards = cards.concat(u.words);
    });
    return cards;
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
      html += '<div class="card"><h2>' + Vamos.icons.svg("download") + ' Downloads</h2>' +
        '<p class="muted small">Anki-Dateien: In Anki über „Datei → Importieren“ laden. ' +
        "Erneuter Import aktualisiert die Karten, statt sie zu doppeln.</p>" +
        '<div class="btn-row">' +
        '<button class="btn" id="dlAnkiAll">Alle Vokabeln (Anki)</button>' +
        '<button class="btn" id="dlAnkiPhrases">Nur Sätze & Formulierungen (Anki)</button>' +
        '<button class="btn" id="dlCsvAll">Alles als CSV</button>' +
        "</div></div>" +
        '<div class="card"><h2>' + Vamos.icons.svg("gift") + ' Themen-Pakete</h2>' +
        '<p class="muted small">Fertig geschnürte Bündel quer über die Einheiten – z. B. alles rund ums Essen.</p>' +
        THEMES.map(function (t, i) {
          var n = themeCards(t, units).length;
          if (!n) return "";
          return '<div class="unit-row" style="cursor:default">' +
            '<span class="emoji">' + t.emoji + "</span>" +
            '<span class="body"><span class="title">' + esc(t.title) + "</span>" +
            '<span class="muted small" style="display:block">' + n + " Karten</span></span>" +
            '<span class="btn-row" style="margin:0">' +
            '<button class="btn small" data-theme-anki="' + i + '">Anki</button>' +
            '<button class="btn small" data-theme-csv="' + i + '">CSV</button>' +
            "</span></div>";
        }).join("") + "</div>";
      main.innerHTML = html;

      main.querySelectorAll("[data-theme-anki]").forEach(function (b) {
        b.addEventListener("click", function () {
          var t = THEMES[parseInt(b.getAttribute("data-theme-anki"), 10)];
          Vamos.data.download("vamos-thema-" + t.id + ".txt",
            Vamos.data.ankiTxt(themeCards(t, units), "Spanisch ¡Vamos!::Thema " + t.title,
              "vamos thema-" + t.id), "text/plain");
          toast("Anki-Paket heruntergeladen");
        });
      });
      main.querySelectorAll("[data-theme-csv]").forEach(function (b) {
        b.addEventListener("click", function () {
          var t = THEMES[parseInt(b.getAttribute("data-theme-csv"), 10)];
          Vamos.data.download("vamos-thema-" + t.id + ".csv",
            Vamos.data.cardsToCsv(themeCards(t, units)));
          toast("CSV heruntergeladen");
        });
      });

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
        '<a class="btn" href="#/listen/' + id + '">Hören</a>' +
        '<a class="btn" href="#/cloze/' + id + '">Satz-Lücke</a>' +
        '<a class="btn" href="#/order/' + id + '">Satzbau</a>' +
        "</div>" +
        '<div class="btn-row no-print">' +
        '<button class="btn small" id="ankiBtn">Anki</button>' +
        '<button class="btn small" id="csvBtn">CSV</button>' +
        '<button class="btn small" id="printBtn">Drucken</button>' +
        "</div></div>" +
        "";

      function vocabTable(words) {
        var rows = "";
        words.forEach(function (w) {
          var st = Vamos.srs.status(srsMap[w.id]);
          rows += "<tr><td>" +
            '<span class="dot ' + st + '"></span><span class="es">' + esc(w.es) + "</span> " +
            Vamos.quiz.speakBtn(w.es) +
            (w.ex ? '<div class="ex">' + esc(w.ex) + "</div>" : "") +
            "</td><td>" + (w.emoji ? esc(w.emoji) + " " : "") + esc(w.de) +
            (w.exDe ? '<div class="ex">' + esc(w.exDe) + "</div>" : "") +
            "</td></tr>";
        });
        return '<table class="vocab"><tbody>' + rows + "</tbody></table>";
      }

      var words = u.words.filter(function (w) { return w.type !== "phrase"; });
      var phrases = u.words.filter(function (w) { return w.type === "phrase"; });
      html += '<div class="card"><h2>Vokabeln <span class="muted small">(' + words.length +
        ")</span></h2>" + vocabTable(words) + "</div>";
      if (phrases.length) {
        html += '<div class="card"><h2>' + Vamos.icons.svg("message") + ' Sätze & Formulierungen <span class="muted small">(' +
          phrases.length + ")</span></h2>" + vocabTable(phrases) + "</div>";
      }
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

  function viewSpeak() {
    loading();
    Vamos.data.loadAllUnits().then(function (units) {
      Vamos.quiz.renderSpeakPractice(main, startedCards(units, Vamos.store.srs()));
    }).catch(fail);
  }

  function viewReview() {
    loading();
    Vamos.data.loadAllUnits().then(function (units) {
      Vamos.quiz.renderMixQuiz(main, units, { onlyLearned: true, title: "Rückblick" });
    }).catch(fail);
  }

  /* Wort des Tages: deterministisch aus dem Datum. */
  function wordOfDay(cards) {
    var d = new Date().toISOString().slice(0, 10);
    var h = 0;
    for (var i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
    return cards[h % cards.length];
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
        '<div class="card"><h2>' + Vamos.icons.svg("search") + ' Suche</h2>' +
        '<input class="answer-input" id="searchInput" autocomplete="off" ' +
        'placeholder="Spanisch oder Deutsch …">' +
        '<div id="results" style="margin-top:.6rem"></div>' +
        '<div class="btn-row" id="exportRow" style="display:none">' +
        '<button class="btn small" id="exportAnki">Treffer als Anki ⬇</button>' +
        '<button class="btn small" id="exportCsv">Treffer als CSV ⬇</button></div></div>';
      var input = document.getElementById("searchInput");
      var results = document.getElementById("results");
      var lastHits = [];
      document.getElementById("exportAnki").addEventListener("click", function () {
        if (!lastHits.length) return;
        Vamos.data.download("vamos-suche-" + input.value.trim() + ".txt",
          Vamos.data.ankiTxt(lastHits, "Spanisch ¡Vamos!::Suche " + input.value.trim(),
            "vamos suche"), "text/plain");
        toast("Anki-Datei heruntergeladen");
      });
      document.getElementById("exportCsv").addEventListener("click", function () {
        if (!lastHits.length) return;
        Vamos.data.download("vamos-suche-" + input.value.trim() + ".csv",
          Vamos.data.cardsToCsv(lastHits));
        toast("CSV heruntergeladen");
      });
      input.focus();

      function norm(s) {
        return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }

      input.addEventListener("input", function () {
        var q = norm(input.value.trim());
        var exportRow = document.getElementById("exportRow");
        if (q.length < 2) {
          results.innerHTML = '<p class="muted small">Mindestens 2 Zeichen …</p>';
          exportRow.style.display = "none";
          return;
        }
        var hits = all.filter(function (w) {
          return norm(w.es).indexOf(q) >= 0 || norm(w.de).indexOf(q) >= 0 ||
            (w.ex && norm(w.ex).indexOf(q) >= 0);
        }).slice(0, 50);
        lastHits = hits;
        exportRow.style.display = hits.length ? "" : "none";
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

  /* ---------- Verbtabellen ---------- */

  function viewVerbs() {
    var common = ["hablar", "comer", "vivir"].concat(Vamos.conj.irregularVerbs.slice(0, 15));
    main.innerHTML =
      '<div class="card"><h2>' + Vamos.icons.svg("table") + ' Verbtabellen</h2>' +
      '<p class="muted small">Beliebiges Verb im Infinitiv eingeben – alle 7 Zeitformen. ' +
      "Unregelmäßige Kernverben sind hinterlegt, der Rest wird nach den Regeln gebildet.</p>" +
      '<input class="answer-input" id="verbInput" autocomplete="off" autocapitalize="off" placeholder="z. B. hablar, tener, ir …">' +
      '<div style="margin:.5rem 0">' + common.map(function (v) {
        return '<button class="chip" data-verb="' + v + '">' + v + "</button>";
      }).join("") + "</div>" +
      '<div id="verbTables"></div></div>';

    var input = document.getElementById("verbInput");
    var out = document.getElementById("verbTables");

    function show(verb) {
      var t = Vamos.conj.TENSES;
      var html = "";
      var any = false;
      Object.keys(t).forEach(function (key) {
        var forms = Vamos.conj.conjugate(verb, key);
        if (!forms) return;
        any = true;
        html += '<h3 style="margin-top:1rem">' + esc(t[key]) + "</h3>" +
          '<table class="vocab"><tbody>' +
          forms.map(function (f, i) {
            return '<tr><td style="width:40%;color:var(--muted)">' +
              esc(Vamos.conj.PERSONS[i]) + '</td><td class="es">' + esc(f) + " " +
              Vamos.quiz.speakBtn(f) + "</td></tr>";
          }).join("") + "</tbody></table>";
      });
      if (!any) {
        out.innerHTML = '<p class="muted small">„' + esc(verb) + "“ sieht nicht nach einem spanischen Infinitiv aus (-ar/-er/-ir).</p>";
        return;
      }
      out.innerHTML = '<div class="theory"><p><strong>' + esc(verb) + "</strong>" +
        (Vamos.conj.isKnownIrregular(verb) ? ' <span class="pill phase">unregelmäßig</span>' :
          ' <span class="pill level">regelmäßig gebildet</span>') + "</p>" + html + "</div>";
      Vamos.quiz.bindSpeak(out);
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && input.value.trim()) show(input.value.trim());
    });
    input.addEventListener("input", function () {
      var v = input.value.trim().toLowerCase();
      if (/[aei]r$/.test(v) && v.length > 3) show(v);
    });
    main.querySelectorAll("[data-verb]").forEach(function (b) {
      b.addEventListener("click", function () {
        input.value = b.getAttribute("data-verb");
        show(input.value);
      });
    });
    show("hablar");
  }

  /* ---------- Wörterbuch (lokal + MyMemory-API) ---------- */

  function viewDict() {
    loading();
    Vamos.data.loadAllUnits().then(function (units) {
      var all = [];
      units.forEach(function (u) { u.words.forEach(function (w) { all.push(w); }); });

      main.innerHTML =
        '<div class="card"><h2>' + Vamos.icons.svg("book") + ' Wörterbuch</h2>' +
        '<input class="answer-input" id="dictInput" autocomplete="off" placeholder="Wort auf Deutsch oder Spanisch …">' +
        '<div class="btn-row"><button class="btn primary" id="deEs">DE → ES</button>' +
        '<button class="btn" id="esDe">ES → DE</button></div>' +
        '<div id="dictOut"></div>' +
        '<p class="muted small" style="margin-bottom:0">Nachschlagen im Web: ' +
        '<a id="lnkSd" href="#" target="_blank" rel="noopener">SpanishDict</a> · ' +
        '<a id="lnkWr" href="#" target="_blank" rel="noopener">WordReference</a> · ' +
        '<a id="lnkDl" href="#" target="_blank" rel="noopener">DeepL</a></p></div>';

      var input = document.getElementById("dictInput");
      var out = document.getElementById("dictOut");
      input.focus();

      function updateLinks() {
        var q = encodeURIComponent(input.value.trim());
        document.getElementById("lnkSd").href = "https://www.spanishdict.com/translate/" + q;
        document.getElementById("lnkWr").href = "https://www.wordreference.com/deses/" + q;
        document.getElementById("lnkDl").href = "https://www.deepl.com/translator#de/es/" + q;
      }
      input.addEventListener("input", updateLinks);
      updateLinks();

      function localHits(q) {
        var norm = function (s) {
          return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };
        var nq = norm(q);
        return all.filter(function (w) {
          return norm(w.es).indexOf(nq) >= 0 || norm(w.de).indexOf(nq) >= 0;
        }).slice(0, 6);
      }

      function lookup(pair) {
        var q = input.value.trim();
        if (!q) return;
        out.innerHTML = '<div class="skeleton" style="min-height:60px"></div>';
        var hits = localHits(q);
        fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(q) +
          "&langpair=" + pair)
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var html = "";
            if (hits.length) {
              html += '<h3 style="margin-top:.4rem">Aus deinen Vokabeln ⭐</h3>' +
                hits.map(function (w) {
                  var meta = Vamos.data.unitMeta(w.unitId) || {};
                  return '<div class="search-hit">' + (w.emoji ? esc(w.emoji) + " " : "") +
                    '<span class="es">' + esc(w.es) + "</span> " + Vamos.quiz.speakBtn(w.es) +
                    '<span class="muted">' + esc(w.de) + "</span>" +
                    '<a class="unit" href="#/unit/' + esc(w.unitId) + '">' + esc(meta.title || "") + "</a></div>";
                }).join("");
            }
            var seen = {};
            var alts = (d.matches || []).filter(function (m) {
              var k = (m.translation || "").toLowerCase();
              if (!k || seen[k]) return false;
              seen[k] = true;
              return m.quality >= 50;
            }).slice(0, 5);
            if (d.responseData && d.responseData.translatedText) {
              html += '<h3 style="margin-top:.8rem">Online-Übersetzung <span class="muted small">(MyMemory, ohne Gewähr)</span></h3>' +
                '<div class="feedback ok"><strong>' + esc(d.responseData.translatedText) + "</strong> " +
                Vamos.quiz.speakBtn(pair === "de|es" ? d.responseData.translatedText : q) +
                (alts.length > 1 ? '<br><span class="small">Auch: ' + alts.slice(1).map(function (m) {
                  return esc(m.translation);
                }).join(" · ") + "</span>" : "") + "</div>";
            }
            out.innerHTML = html || '<p class="muted small">Nichts gefunden.</p>';
            Vamos.quiz.bindSpeak(out);
          })
          .catch(function () {
            out.innerHTML = '<p class="muted small">Online-Wörterbuch nicht erreichbar' +
              (hits.length ? " – aber deine Vokabeln haben Treffer (siehe Suche)." : ".") + "</p>";
          });
      }

      document.getElementById("deEs").addEventListener("click", function () { lookup("de|es"); });
      document.getElementById("esDe").addEventListener("click", function () { lookup("es|de"); });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") lookup(/[áéíñü¿¡]/.test(input.value) ? "es|de" : "de|es");
      });
    }).catch(fail);
  }

  /* ---------- KI-Tutor: Konversations-Simulation ---------- */

  var tutorState = { scenario: null, messages: [] };

  function aiConfigCard(forceShow) {
    var cfg = Vamos.tutor.aiConfig();
    return '<div class="card" id="aiCfg"' + (cfg.key && !forceShow ? ' style="display:none"' : "") + ">" +
      '<h2>' + Vamos.icons.svg("key") + ' KI-Zugang einrichten</h2>' +
      '<p class="muted small">Dein API-Key wird <strong>nur in diesem Browser</strong> gespeichert – ' +
      "nie auf GitHub, nie im Backup. Du brauchst einen Key von Anthropic (console.anthropic.com) " +
      "oder OpenAI (platform.openai.com).</p>" +
      '<label class="setting">Anbieter</label>' +
      '<select id="aiProvider">' +
      '<option value="anthropic"' + ((cfg.provider || "anthropic") === "anthropic" ? " selected" : "") + ">Anthropic (Claude)</option>" +
      '<option value="openai"' + (cfg.provider === "openai" ? " selected" : "") + ">OpenAI / kompatibel</option>" +
      "</select>" +
      '<label class="setting">API-Key</label>' +
      '<input type="password" class="answer-input" id="aiKey" value="' + esc(cfg.key || "") + '" placeholder="sk-…">' +
      '<label class="setting">Modell (leer = Standard)</label>' +
      '<input class="answer-input" id="aiModel" value="' + esc(cfg.model || "") + '" placeholder="claude-haiku-4-5-20251001 / gpt-4o-mini">' +
      '<label class="setting">Base-URL (nur für OpenAI-kompatible Endpoints)</label>' +
      '<input class="answer-input" id="aiBase" value="' + esc(cfg.baseUrl || "") + '" placeholder="https://api.openai.com/v1">' +
      '<div class="btn-row"><button class="btn primary" id="aiSave">Speichern</button></div></div>';
  }

  function bindAiConfig(afterSave) {
    document.getElementById("aiSave").addEventListener("click", function () {
      Vamos.tutor.saveAiConfig({
        provider: document.getElementById("aiProvider").value,
        key: document.getElementById("aiKey").value.trim(),
        model: document.getElementById("aiModel").value.trim(),
        baseUrl: document.getElementById("aiBase").value.trim()
      });
      toast("KI-Zugang gespeichert");
      if (afterSave) afterSave();
    });
  }

  function viewTutor() {
    var html = aiConfigCard() +
      '<div class="card"><h2>' + Vamos.icons.svg("bot") + ' KI-Tutor <button class="btn small" id="aiCfgToggle" style="float:right">' + Vamos.icons.svg("key") + '</button></h2>' +
      '<p class="muted small">Wähle ein Szenario und sprich (schreib) Spanisch – der Tutor antwortet, ' +
      "korrigiert deine Fehler und hält das Gespräch am Laufen. Tippe <strong>?</strong> für einen Hinweis.</p>" +
      '<div id="scenarios">' + Vamos.tutor.SCENARIOS.map(function (s, i) {
        return '<button class="chip" data-sc="' + i + '">' + s.emoji + " " + esc(s.title) + "</button>";
      }).join("") + "</div>" +
      '<div class="chat-log" id="chatLog"></div>' +
      '<div style="display:flex;gap:.5rem;margin-top:.5rem">' +
      '<input class="answer-input" id="chatInput" autocomplete="off" placeholder="Escribe en español …" style="flex:1">' +
      '<button class="btn primary" id="chatSend">➤</button></div></div>';
    main.innerHTML = html;
    bindAiConfig(viewTutor);
    document.getElementById("aiCfgToggle").addEventListener("click", function () {
      var c = document.getElementById("aiCfg");
      c.style.display = c.style.display === "none" ? "" : "none";
    });

    var log = document.getElementById("chatLog");
    var input = document.getElementById("chatInput");

    function renderLog() {
      log.innerHTML = tutorState.messages.map(function (m) {
        if (m.role === "error") return '<div class="bubble err">' + esc(m.content) + "</div>";
        return '<div class="bubble ' + (m.role === "user" ? "user" : "ai") + '">' +
          esc(m.content) + (m.role === "assistant" ? " " + Vamos.quiz.speakBtn(m.content.replace(/✏️[^\n]*\n?/g, "")) : "") +
          "</div>";
      }).join("");
      Vamos.quiz.bindSpeak(log);
      log.scrollTop = log.scrollHeight;
    }

    function apiMessages() {
      return tutorState.messages.filter(function (m) {
        return m.role === "user" || m.role === "assistant";
      }).map(function (m) { return { role: m.role, content: m.content }; });
    }

    function startScenario(s) {
      tutorState.scenario = s;
      tutorState.messages = [{ role: "user", content: "Empieza la conversación con un saludo breve." }];
      log.innerHTML = '<div class="bubble ai">…</div>';
      Vamos.tutor.chat(Vamos.tutor.systemPrompt(s), apiMessages()).then(function (reply) {
        tutorState.messages = [{ role: "assistant", content: reply }];
        renderLog();
      }).catch(function (e) {
        tutorState.messages = [{ role: "error", content: e.message }];
        renderLog();
      });
    }

    main.querySelectorAll("[data-sc]").forEach(function (b) {
      b.addEventListener("click", function () {
        startScenario(Vamos.tutor.SCENARIOS[parseInt(b.getAttribute("data-sc"), 10)]);
      });
    });

    function send() {
      var text = input.value.trim();
      if (!text) return;
      if (!tutorState.scenario) {
        toast("Wähle zuerst ein Szenario");
        return;
      }
      input.value = "";
      tutorState.messages.push({ role: "user", content: text });
      renderLog();
      log.innerHTML += '<div class="bubble ai">…</div>';
      log.scrollTop = log.scrollHeight;
      Vamos.tutor.chat(Vamos.tutor.systemPrompt(tutorState.scenario), apiMessages())
        .then(function (reply) {
          tutorState.messages.push({ role: "assistant", content: reply });
          renderLog();
        }).catch(function (e) {
          tutorState.messages.push({ role: "error", content: e.message });
          renderLog();
        });
    }
    document.getElementById("chatSend").addEventListener("click", send);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

    if (tutorState.messages.length) renderLog();
  }

  /* ---------- Text schreiben & korrigieren lassen ---------- */

  function viewWrite() {
    main.innerHTML = aiConfigCard() +
      '<div class="card"><h2>' + Vamos.icons.svg("pen") + ' Text-Check <button class="btn small" id="aiCfgToggle" style="float:right">' + Vamos.icons.svg("key") + '</button></h2>' +
      '<p class="muted small">Schreib einen Text auf Spanisch (Tagebuch, E-Mail, Urlaubsbericht …) – ' +
      "die KI korrigiert ihn und erklärt jeden Fehler auf Deutsch.</p>" +
      '<textarea class="answer-input" id="writeText" rows="7" placeholder="Hoy he visitado la catedral y después…"></textarea>' +
      '<div class="btn-row"><button class="btn primary" id="checkText">KI-Korrektur</button>' +
      '<button class="btn" id="ltCheck">Schnell-Check (ohne KI, gratis)</button></div>' +
      '<div id="writeOut"></div></div>';
    bindAiConfig(viewWrite);
    document.getElementById("aiCfgToggle").addEventListener("click", function () {
      var c = document.getElementById("aiCfg");
      c.style.display = c.style.display === "none" ? "" : "none";
    });
    document.getElementById("checkText").addEventListener("click", function () {
      var text = document.getElementById("writeText").value.trim();
      if (text.length < 10) {
        toast("Schreib erst ein paar Sätze");
        return;
      }
      var out = document.getElementById("writeOut");
      out.innerHTML = '<div class="skeleton" style="min-height:80px"></div>';
      Vamos.tutor.correct(text).then(function (result) {
        out.innerHTML = '<div class="theory" style="margin-top:.6rem">' +
          Vamos.grammar.md(result).replace(/\n/g, "<br>") + "</div>";
      }).catch(function (e) {
        out.innerHTML = '<div class="feedback no">' + esc(e.message) + "</div>";
      });
    });
    // LanguageTool: kostenlose Rechtschreib-/Grammatikprüfung ohne Key
    document.getElementById("ltCheck").addEventListener("click", function () {
      var text = document.getElementById("writeText").value.trim();
      if (text.length < 5) {
        toast("Schreib erst etwas");
        return;
      }
      var out = document.getElementById("writeOut");
      out.innerHTML = '<div class="skeleton" style="min-height:60px"></div>';
      fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "language=es&text=" + encodeURIComponent(text)
      }).then(function (r) {
        if (!r.ok) throw new Error("LanguageTool nicht erreichbar (HTTP " + r.status + ")");
        return r.json();
      }).then(function (d) {
        if (!d.matches || !d.matches.length) {
          out.innerHTML = '<div class="feedback ok">✅ Keine Fehler gefunden – ¡muy bien! ' +
            '<span class="small">(automatische Prüfung, ohne Gewähr)</span></div>';
          return;
        }
        out.innerHTML = '<p class="muted small" style="margin:.6rem 0 .3rem">' + d.matches.length +
          " Hinweis(e) – LanguageTool:</p>" +
          d.matches.map(function (m) {
            var wrong = text.substr(m.offset, m.length);
            var sugg = (m.replacements || []).slice(0, 3).map(function (rp) { return rp.value; });
            return '<div class="feedback almost"><strong>' + esc(wrong) + "</strong>" +
              (sugg.length ? " → " + esc(sugg.join(" / ")) : "") +
              '<br><span class="small">' + esc(m.message) + "</span></div>";
          }).join("");
      }).catch(function (e) {
        out.innerHTML = '<div class="feedback no">' + esc(e.message) + "</div>";
      });
    });
  }

  /* ---------- Grammatik ---------- */

  function progressRow(href, emoji, title, level, r) {
    return '<a class="unit-row" href="' + href + '">' +
      '<span class="emoji">' + esc(emoji) + "</span>" +
      '<span class="body"><span class="title">' + esc(title) + "</span> " +
      '<span class="pill level">' + esc(level) + "</span>" +
      (r ? '<span class="muted small" style="display:block">Zuletzt: ' +
        r.score + "/" + r.total + " (" + r.date + ")</span>" :
        '<span class="muted small" style="display:block">Noch nicht geübt</span>') +
      "</span>" +
      (r && r.score / r.total >= 0.8 ? '<span class="pill done">✓</span>' : "") +
      "</a>";
  }

  function viewGrammarList() {
    loading();
    Vamos.data.loadManifest().then(function (m) {
      var results = Vamos.store.grammar();
      var html = '<div class="card"><h2>' + Vamos.icons.svg("cap") + ' Grammatik</h2>' +
        m.grammar.map(function (g) {
          return progressRow("#/grammar/" + g.id, g.emoji, g.title, g.level, results[g.id]);
        }).join("") + "</div>";
      if (m.reading && m.reading.length) {
        html += '<div class="card"><h2>' + Vamos.icons.svg("reader") + ' Lesetexte</h2>' +
          '<p class="muted small">Kurze Geschichten mit Audio, Übersetzung, Glossar und Verständnisfragen.</p>' +
          m.reading.map(function (r) {
            return progressRow("#/reading/" + r.id, r.emoji, r.title, r.level, results[r.id]);
          }).join("") + "</div>";
      }
      main.innerHTML = html;
    }).catch(fail);
  }

  function viewReading(id) {
    loading();
    Vamos.data.loadManifest().then(function (m) {
      var meta = (m.reading || []).filter(function (r) { return r.id === id; })[0];
      if (!meta) throw new Error("Lesetext nicht gefunden: " + id);
      return fetch(meta.file).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    }).then(function (t) {
      var paras = t.text.split(/\n\n+/);
      var parasDe = (t.textDe || "").split(/\n\n+/);
      var html =
        '<div class="card"><h2>' + esc(t.emoji) + " " + esc(t.title) +
        ' <span class="pill level">' + esc(t.level) + "</span></h2>" +
        '<div class="btn-row">' +
        '<button class="btn primary" id="readBtn">' + Vamos.icons.svg("speaker") + " Vorlesen</button>" +
        '<button class="btn" id="stopBtn">Stopp</button>' +
        '<button class="btn" id="transBtn">Übersetzung</button>' +
        "</div>" +
        paras.map(function (p, i) {
          return '<p style="font-size:1.05rem;line-height:1.7">' + esc(p) + "</p>" +
            '<p class="muted small trans" style="display:none;margin-top:-.4rem">' +
            esc(parasDe[i] || "") + "</p>";
        }).join("") + "</div>" +
        '<div class="card"><h2>' + Vamos.icons.svg("book") + " Glossar</h2><table class=\"vocab\"><tbody>" +
        (t.glossary || []).map(function (g) {
          return '<tr><td class="es">' + esc(g.es) + " " + Vamos.quiz.speakBtn(g.es) +
            "</td><td>" + esc(g.de) + "</td></tr>";
        }).join("") + "</tbody></table></div>" +
        '<div class="card"><h2>Verstanden?</h2>' +
        '<button class="btn primary" id="quizBtn">Fragen beantworten (' +
        (t.questions || []).length + ")</button></div>";
      main.innerHTML = html;
      Vamos.quiz.bindSpeak(main);

      document.getElementById("readBtn").addEventListener("click", function () {
        Vamos.audio.speakLong(t.text);
      });
      document.getElementById("stopBtn").addEventListener("click", function () {
        Vamos.audio.stop();
      });
      document.getElementById("transBtn").addEventListener("click", function () {
        main.querySelectorAll(".trans").forEach(function (p) {
          p.style.display = p.style.display === "none" ? "" : "none";
        });
      });
      document.getElementById("quizBtn").addEventListener("click", function () {
        var g = {
          id: t.id,
          exercises: (t.questions || []).map(function (q) {
            return { type: "mc", q: q.q, options: q.options, answer: q.answer, expl: q.expl };
          })
        };
        Vamos.grammar.renderExercises(main, g);
        window.scrollTo(0, 0);
      });
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
      '<div class="card"><h2>' + Vamos.icons.svg("sliders") + ' Einstellungen</h2>' +
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
      '<button class="btn small" id="testVoice">Stimme testen</button></div>' +
      "</div>" +
      aiConfigCard(true) +
      '<div class="card"><h2>' + Vamos.icons.svg("download") + ' Backup</h2>' +
      '<p class="muted small">Dein Fortschritt liegt nur in diesem Browser. Exportiere regelmäßig ein Backup, ' +
      "z. B. vor einem Gerätewechsel.</p>" +
      '<div class="btn-row">' +
      '<button class="btn primary" id="exportBtn">Backup exportieren</button>' +
      '<button class="btn" id="importBtn">Backup importieren</button>' +
      '<input type="file" id="importFile" accept=".json" style="display:none">' +
      "</div></div>" +
      '<div class="card"><h2>Zurücksetzen</h2>' +
      '<p class="muted small">Löscht den kompletten Lernfortschritt auf diesem Gerät.</p>' +
      '<button class="btn" id="resetBtn" style="color:var(--accent)">Fortschritt löschen …</button></div>' +
      '<p class="muted small" style="text-align:center">¡Vamos! · <a href="https://github.com/Hey1Marvin/Spanisch-Vocabeln">GitHub</a></p>';

    main.innerHTML = html;
    bindAiConfig(viewSettings);

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
    { re: /^#\/speak$/, fn: viewSpeak, tab: "learn" },
    { re: /^#\/review$/, fn: viewReview, tab: "learn" },
    { re: /^#\/quiz\/([\w-]+)$/, fn: function (id) { withUnit(id, function (u) { Vamos.quiz.renderMcQuiz(main, u); }); }, tab: "units" },
    { re: /^#\/type\/([\w-]+)$/, fn: function (id) { withUnit(id, function (u) { Vamos.quiz.renderTypeQuiz(main, u); }); }, tab: "units" },
    { re: /^#\/grammar$/, fn: viewGrammarList, tab: "grammar" },
    { re: /^#\/grammar\/([\w-]+)$/, fn: viewGrammar, tab: "grammar" },
    { re: /^#\/reading\/([\w-]+)$/, fn: viewReading, tab: "grammar" },
    { re: /^#\/stats$/, fn: viewStats, tab: "stats" },
    { re: /^#\/verbs$/, fn: viewVerbs, tab: "" },
    { re: /^#\/dict$/, fn: viewDict, tab: "" },
    { re: /^#\/tutor$/, fn: viewTutor, tab: "" },
    { re: /^#\/write$/, fn: viewWrite, tab: "" },
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
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        reg.update();
      }).catch(function () {});
      // Neuer Worker übernimmt → einmal neu laden, damit sofort die neue Version läuft
      var hadController = !!navigator.serviceWorker.controller;
      var reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (!hadController) { hadController = true; return; }
        if (reloaded) return;
        reloaded = true;
        location.reload();
      });
    }
  });
})();
