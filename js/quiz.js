/* Lernmodi: SRS-Session (Flashcards), Multiple Choice, Tipp-Modus. */
window.Vamos = window.Vamos || {};

Vamos.quiz = (function () {

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function speakBtn(text) {
    if (!Vamos.audio.available()) return "";
    return '<button class="speak-btn" data-speak="' + esc(text) +
      '" title="Anhören" aria-label="Anhören: ' + esc(text) + '">' + Vamos.icons.svg("speaker") + "</button>";
  }

  function bindSpeak(el) {
    el.querySelectorAll("[data-speak]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        Vamos.audio.speak(b.getAttribute("data-speak"));
      });
    });
  }

  /* Richtung pro Karte: bei "mixed" deterministisch aus der ID. */
  function directionFor(card) {
    var d = Vamos.store.settings().direction;
    if (d !== "mixed") return d;
    var h = 0;
    for (var i = 0; i < card.id.length; i++) h = (h * 31 + card.id.charCodeAt(i)) | 0;
    return (h & 1) ? "de-es" : "es-de";
  }

  /* ---------- SRS-Lernsession ---------- */

  function renderLearnSession(el, cards, onExit) {
    var srsMap = Vamos.store.srs();
    var queue = Vamos.srs.buildQueue(cards, srsMap, Vamos.store.settings().newPerDay);
    var doneCount = 0;
    var total = queue.length;

    if (!total) {
      el.innerHTML =
        '<div class="empty-state"><div class="big">🎉</div>' +
        "<p>Nichts fällig – alles gelernt für heute!</p>" +
        '<p class="muted small">Komm morgen wieder oder mach ein Einheiten-Quiz.</p>' +
        '<a class="btn" href="#/units">Zu den Einheiten</a></div>';
      return;
    }

    function next() {
      if (!queue.length) {
        Vamos.store.bumpLog(0); // Tag als Lerntag markieren, auch ohne neue Bewertung
        var today = Vamos.store.log()[new Date().toISOString().slice(0, 10)] || 0;
        var goal = Vamos.store.settings().dailyGoal;
        var goalHit = today >= goal;
        Vamos.ui.confetti(goalHit ? 26 : 14);
        el.innerHTML =
          '<div class="empty-state"><div class="big">' + (goalHit ? "🏆" : "✅") + "</div>" +
          "<p><strong>Session geschafft – ¡muy bien!</strong></p>" +
          '<p class="muted">' + doneCount + " Karten wiederholt · heute " + today +
          " von " + goal + (goalHit ? " – Tagesziel erreicht! 🔥" : "") + "</p>" +
          '<div class="btn-row" style="justify-content:center">' +
          (goalHit ? "" : '<a class="btn primary" href="#/learn">Weiterlernen</a>') +
          '<a class="btn' + (goalHit ? " primary" : "") + '" href="#/">Zum Dashboard</a></div></div>';
        return;
      }
      showCard(queue[0]);
    }

    function showCard(card) {
      var dir = directionFor(card);
      var front = dir === "es-de" ? card.es : card.de;
      var frontLang = dir === "es-de" ? "🇪🇸" : "🇩🇪";
      var unitTitle = (Vamos.data.unitMeta(card.unitId) || {}).title || "";

      var done = total - queue.length;
      el.innerHTML =
        '<div class="session-bar"><span>Noch ' + queue.length + " von " + total +
        '</span><a href="#/" class="no-decoration">Beenden ✕</a></div>' +
        '<div class="session-progress"><i style="width:' +
        Math.round(100 * done / total) + '%"></i></div>' +
        '<div class="card flashcard">' +
        (card.emoji ? '<div class="emoji">' + esc(card.emoji) + "</div>" : "") +
        '<div class="tag">' + frontLang + " · " + esc(unitTitle) + "</div>" +
        '<div class="word">' + esc(front) +
        (dir === "es-de" ? " " + speakBtn(card.es) : "") + "</div>" +
        '<div id="cardBack"></div></div>' +
        '<div id="cardActions"><button class="btn primary reveal-btn" id="revealBtn">Aufdecken</button></div>';

      bindSpeak(el);
      if (dir === "es-de" && Vamos.audio.available()) Vamos.audio.speak(card.es);

      el.querySelector("#revealBtn").addEventListener("click", function () {
        reveal(card, dir);
      });
    }

    function reveal(card, dir) {
      var back = dir === "es-de" ? card.de : card.es;
      var backEl = el.querySelector("#cardBack");
      backEl.innerHTML =
        '<div class="answer">' + esc(back) +
        (dir === "de-es" ? " " + speakBtn(card.es) : "") + "</div>" +
        (card.ex ? '<div class="example">' + esc(card.ex) + " " + speakBtn(card.ex) +
          (card.exDe ? '<br><span class="small">' + esc(card.exDe) + "</span>" : "") + "</div>" : "");
      bindSpeak(backEl);
      if (dir === "de-es" && Vamos.audio.available()) Vamos.audio.speak(card.es);

      var st = Vamos.store.srs()[card.id];
      var labels = ["Nochmal", "Schwer", "Gut", "Einfach"];
      var classes = ["g-again", "g-hard", "g-good", "g-easy"];
      var html = '<div class="grade-row">';
      for (var g = 0; g < 4; g++) {
        html += '<button class="' + classes[g] + '" data-grade="' + g + '">' + labels[g] +
          '<span class="sub">' + Vamos.srs.previewInterval(st, g) + "</span></button>";
      }
      html += "</div>";
      el.querySelector("#cardActions").innerHTML = html;

      el.querySelectorAll("[data-grade]").forEach(function (b) {
        b.addEventListener("click", function () {
          grade(card, parseInt(b.getAttribute("data-grade"), 10));
        });
      });
    }

    function grade(card, g) {
      var map = Vamos.store.srs();
      map[card.id] = Vamos.srs.rate(map[card.id], g);
      Vamos.store.saveSrs(map);
      Vamos.store.bumpLog(1);
      queue.shift();
      doneCount += 1;
      if (g === 0) queue.push(card); // "Nochmal" → hinten wieder einreihen
      next();
    }

    next();
  }

  /* ---------- Multiple Choice ---------- */

  function renderMcQuiz(el, unit) {
    var pool = unit.words;
    var questions = shuffle(pool).slice(0, Math.min(15, pool.length));
    var idx = 0, score = 0;

    function next() {
      if (idx >= questions.length) return finish();
      var card = questions[idx];
      var dir = Math.random() < 0.5 ? "es-de" : "de-es";
      var prompt = dir === "es-de" ? card.es : card.de;
      var answer = dir === "es-de" ? card.de : card.es;

      var wrong = shuffle(pool.filter(function (w) { return w.id !== card.id; }))
        .slice(0, 3)
        .map(function (w) { return dir === "es-de" ? w.de : w.es; });
      var options = shuffle([answer].concat(wrong));

      el.innerHTML =
        '<div class="session-bar"><span>Frage ' + (idx + 1) + " / " + questions.length +
        "</span><span>" + score + " richtig</span></div>" +
        '<div class="card"><div class="muted small">' +
        (dir === "es-de" ? "Was heißt auf Deutsch:" : "Was heißt auf Spanisch:") + "</div>" +
        '<div class="word" style="font-size:1.3rem;font-weight:700;margin:.3rem 0 .8rem">' +
        esc(prompt) + (dir === "es-de" ? " " + speakBtn(card.es) : "") + "</div>" +
        '<div id="options"></div></div>';
      bindSpeak(el);

      var optEl = el.querySelector("#options");
      options.forEach(function (opt) {
        var b = document.createElement("button");
        b.className = "mc-option";
        b.textContent = opt;
        b.addEventListener("click", function () {
          if (optEl.dataset.done) return;
          optEl.dataset.done = "1";
          optEl.querySelectorAll(".mc-option").forEach(function (o) {
            if (o.textContent === answer) o.classList.add("correct");
          });
          if (opt === answer) {
            score += 1;
          } else {
            b.classList.add("wrong");
          }
          if (dir === "de-es" && Vamos.audio.available()) Vamos.audio.speak(card.es);
          setTimeout(function () { idx += 1; next(); }, opt === answer ? 700 : 1600);
        });
        optEl.appendChild(b);
      });
    }

    function finish() {
      var pct = Math.round(100 * score / questions.length);
      el.innerHTML =
        '<div class="empty-state"><div class="big">' + (pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚") + "</div>" +
        "<p><strong>" + score + " von " + questions.length + " richtig (" + pct + " %)</strong></p>" +
        '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn primary" id="againBtn">Nochmal</button>' +
        '<a class="btn" href="#/unit/' + unit.meta.id + '">Zur Einheit</a></div></div>';
      el.querySelector("#againBtn").addEventListener("click", function () {
        renderMcQuiz(el, unit);
      });
    }

    next();
  }

  /* ---------- Tipp-Modus (DE → ES) ---------- */

  function normalize(s) {
    return s.toLowerCase()
      .replace(/[¿¡?!.,;:()"]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function stripAccents(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function stripArticle(s) {
    return s.replace(/^(el|la|los|las|un|una)\s+/, "");
  }

  function renderTypeQuiz(el, unit) {
    var questions = shuffle(unit.words).slice(0, Math.min(12, unit.words.length));
    var idx = 0, score = 0;

    function next() {
      if (idx >= questions.length) return finish();
      var card = questions[idx];

      el.innerHTML =
        '<div class="session-bar"><span>Frage ' + (idx + 1) + " / " + questions.length +
        "</span><span>" + score + " Punkte</span></div>" +
        '<div class="card"><div class="muted small">Übersetze auf Spanisch:</div>' +
        '<div class="word" style="font-size:1.25rem;font-weight:700;margin:.3rem 0 .8rem">' +
        (card.emoji ? esc(card.emoji) + " " : "") + esc(card.de) + "</div>" +
        '<input class="answer-input" id="answerInput" autocomplete="off" autocapitalize="off" ' +
        'placeholder="Antwort eintippen …">' +
        '<div id="feedback"></div>' +
        '<div class="btn-row"><button class="btn primary" id="checkBtn">Prüfen</button>' +
        '<button class="btn" id="skipBtn">Weiß ich nicht</button></div></div>';

      var input = el.querySelector("#answerInput");
      input.focus();
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") check();
      });
      el.querySelector("#checkBtn").addEventListener("click", check);
      el.querySelector("#skipBtn").addEventListener("click", function () { resolve(0, null); });

      function check() {
        var given = normalize(input.value);
        if (!given) return;
        var want = normalize(card.es);
        if (given === want) return resolve(2, "ok");
        if (stripAccents(given) === stripAccents(want)) return resolve(1, "accents");
        if (stripArticle(stripAccents(given)) === stripArticle(stripAccents(want)))
          return resolve(1, "article");
        return resolve(0, "wrong");
      }

      function resolve(points, kind) {
        score += points;
        var fb = el.querySelector("#feedback");
        var solution = "<strong>" + esc(card.es) + "</strong> " + speakBtn(card.es);
        if (kind === "ok") {
          fb.innerHTML = '<div class="feedback ok">✅ Richtig! ' + solution + "</div>";
        } else if (kind === "accents") {
          fb.innerHTML = '<div class="feedback almost">🟡 Fast – achte auf die Akzente: ' + solution + "</div>";
        } else if (kind === "article") {
          fb.innerHTML = '<div class="feedback almost">🟡 Fast – der Artikel fehlt/stimmt nicht: ' + solution + "</div>";
        } else {
          fb.innerHTML = '<div class="feedback no">❌ Richtig wäre: ' + solution +
            (card.ex ? '<br><span class="small muted">' + esc(card.ex) + "</span>" : "") + "</div>";
        }
        bindSpeak(fb);
        if (Vamos.audio.available()) Vamos.audio.speak(card.es);
        el.querySelector("#checkBtn").style.display = "none";
        el.querySelector("#skipBtn").textContent = "Weiter";
        var skip = el.querySelector("#skipBtn");
        var clone = skip.cloneNode(true);
        skip.parentNode.replaceChild(clone, skip);
        clone.addEventListener("click", function () { idx += 1; next(); });
        input.disabled = true;
      }
    }

    function finish() {
      var max = questions.length * 2;
      var pct = Math.round(100 * score / max);
      el.innerHTML =
        '<div class="empty-state"><div class="big">' + (pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚") + "</div>" +
        "<p><strong>" + score + " von " + max + " Punkten (" + pct + " %)</strong></p>" +
        '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn primary" id="againBtn">Nochmal</button>' +
        '<a class="btn" href="#/unit/' + unit.meta.id + '">Zur Einheit</a></div></div>';
      el.querySelector("#againBtn").addEventListener("click", function () {
        renderTypeQuiz(el, unit);
      });
    }

    next();
  }

  /* ---------- Hör-Quiz: erst Audio, dann Bedeutung wählen ---------- */

  function renderListenQuiz(el, cards, backLink, title) {
    var pool = cards.filter(function (w) { return w.es; });
    var questions = shuffle(pool).slice(0, Math.min(12, pool.length));
    var idx = 0, score = 0;

    if (!Vamos.audio.available()) {
      el.innerHTML = '<div class="empty-state"><div class="big">🔇</div>' +
        "<p>Dein Browser unterstützt keine Sprachausgabe.</p>" +
        '<a class="btn" href="' + backLink + '">Zurück</a></div>';
      return;
    }

    function next() {
      if (idx >= questions.length) return finish();
      var card = questions[idx];
      var wrong = shuffle(pool.filter(function (w) { return w.id !== card.id; }))
        .slice(0, 3).map(function (w) { return w.de; });
      var options = shuffle([card.de].concat(wrong));

      el.innerHTML =
        '<div class="session-bar"><span>' + (title || "Hör-Quiz") + " · " + (idx + 1) + " / " +
        questions.length + "</span><span>" + score + " richtig</span></div>" +
        '<div class="card" style="text-align:center">' +
        '<div class="muted small">Hör zu – was bedeutet das?</div>' +
        '<button class="listen-big" id="playBtn" title="Nochmal anhören">' + Vamos.icons.svg("speaker", "lg") + '</button>' +
        '<div id="options" style="text-align:left"></div></div>';

      var play = function () { Vamos.audio.speak(card.es); };
      el.querySelector("#playBtn").addEventListener("click", play);
      setTimeout(play, 250);

      var optEl = el.querySelector("#options");
      options.forEach(function (opt) {
        var b = document.createElement("button");
        b.className = "mc-option";
        b.textContent = opt;
        b.addEventListener("click", function () {
          if (optEl.dataset.done) return;
          optEl.dataset.done = "1";
          optEl.querySelectorAll(".mc-option").forEach(function (o) {
            if (o.textContent === card.de) o.classList.add("correct");
          });
          var ok = opt === card.de;
          if (ok) score += 1; else b.classList.add("wrong");
          // Auflösung zeigen: das gesprochene Wort
          var sol = document.createElement("div");
          sol.className = "feedback " + (ok ? "ok" : "no");
          sol.innerHTML = (ok ? "✅ " : "❌ Das war: ") + "<strong>" + esc(card.es) + "</strong>" +
            (card.ex ? ' <span class="small">– ' + esc(card.ex) + "</span>" : "");
          optEl.appendChild(sol);
          setTimeout(function () { idx += 1; next(); }, ok ? 900 : 2000);
        });
        optEl.appendChild(b);
      });
    }

    function finish() {
      var pct = Math.round(100 * score / questions.length);
      if (pct >= 80) Vamos.ui.confetti(14);
      el.innerHTML =
        '<div class="empty-state"><div class="big">' + (pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "👂") + "</div>" +
        "<p><strong>" + score + " von " + questions.length + " gehört (" + pct + " %)</strong></p>" +
        '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn primary" id="againBtn">Nochmal</button>' +
        '<a class="btn" href="' + backLink + '">Zurück</a></div></div>';
      el.querySelector("#againBtn").addEventListener("click", function () {
        renderListenQuiz(el, cards, backLink, title);
      });
    }

    next();
  }

  /* ---------- Satz-Lücke (Cloze): Zielwort im Beispielsatz eintippen ---------- */

  function clozeCandidates(cards) {
    return cards.filter(function (w) {
      if (!w.ex || w.type === "phrase") return false;
      var word = w.es.replace(/^(el|la|los|las)\s+/, "");
      return w.ex.toLowerCase().indexOf(word.toLowerCase()) >= 0;
    });
  }

  function renderClozeQuiz(el, cards, backLink) {
    var pool = clozeCandidates(cards);
    if (pool.length < 4) {
      el.innerHTML = '<div class="empty-state"><div class="big">🤷</div>' +
        "<p>Für diese Auswahl gibt es zu wenige Lücken-Sätze.</p>" +
        '<a class="btn" href="' + backLink + '">Zurück</a></div>';
      return;
    }
    var questions = shuffle(pool).slice(0, Math.min(10, pool.length));
    var idx = 0, score = 0;

    function next() {
      if (idx >= questions.length) return finish();
      var card = questions[idx];
      var word = card.es.replace(/^(el|la|los|las)\s+/, "");
      var re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      var gapped = esc(card.ex).replace(re, '<span class="cloze-gap">&nbsp;?&nbsp;</span>');

      el.innerHTML =
        '<div class="session-bar"><span>Satz-Lücke · ' + (idx + 1) + " / " + questions.length +
        "</span><span>" + score + " richtig</span></div>" +
        '<div class="card"><div class="muted small">Welches Wort fehlt? (' +
        esc(card.de) + ")</div>" +
        '<div class="cloze-sentence">' + gapped + "</div>" +
        (card.exDe ? '<div class="muted small">' + esc(card.exDe) + "</div>" : "") +
        '<input class="answer-input" id="clozeInput" autocomplete="off" autocapitalize="off" ' +
        'style="margin-top:.6rem" placeholder="Fehlendes Wort …">' +
        '<div id="feedback"></div>' +
        '<div class="btn-row"><button class="btn primary" id="checkBtn">Prüfen</button>' +
        '<button class="btn" id="skipBtn">Weiß ich nicht</button></div></div>';

      var input = el.querySelector("#clozeInput");
      input.focus();
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
      el.querySelector("#checkBtn").addEventListener("click", check);
      el.querySelector("#skipBtn").addEventListener("click", function () { resolve(false, true); });

      function check() {
        var given = normalize(input.value);
        if (!given) return;
        var want = normalize(word);
        if (given === want || stripAccents(given) === stripAccents(want)) return resolve(true);
        resolve(false);
      }

      function resolve(ok, skipped) {
        if (ok) score += 1;
        var fb = el.querySelector("#feedback");
        var full = esc(card.ex) + " " + speakBtn(card.ex);
        fb.innerHTML = ok
          ? '<div class="feedback ok">✅ ¡Exacto! ' + full + "</div>"
          : '<div class="feedback no">' + (skipped ? "" : "❌ ") + "Es fehlte: <strong>" +
            esc(word) + "</strong><br>" + full + "</div>";
        bindSpeak(fb);
        Vamos.audio.speak(card.ex);
        input.disabled = true;
        el.querySelector("#checkBtn").style.display = "none";
        var skip = el.querySelector("#skipBtn");
        var clone = skip.cloneNode(true);
        clone.textContent = "Weiter";
        skip.parentNode.replaceChild(clone, skip);
        clone.addEventListener("click", function () { idx += 1; next(); });
        clone.focus();
      }
    }

    function finish() {
      var pct = Math.round(100 * score / questions.length);
      if (pct >= 80) Vamos.ui.confetti(14);
      el.innerHTML =
        '<div class="empty-state"><div class="big">' + (pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "✍️") + "</div>" +
        "<p><strong>" + score + " von " + questions.length + " richtig (" + pct + " %)</strong></p>" +
        '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn primary" id="againBtn">Nochmal</button>' +
        '<a class="btn" href="' + backLink + '">Zurück</a></div></div>';
      el.querySelector("#againBtn").addEventListener("click", function () {
        renderClozeQuiz(el, cards, backLink);
      });
    }

    next();
  }

  /* ---------- Mix-Quiz: Interleaving über angefangene Einheiten ---------- */

  function renderMixQuiz(el, units) {
    var srsMap = Vamos.store.srs();
    // Karten aus Einheiten, in denen schon gelernt wurde; sonst die ersten zwei Einheiten
    var started = units.filter(function (u) {
      return u.words.some(function (w) {
        var st = srsMap[w.id];
        return st && st.r > 0;
      });
    });
    if (!started.length) started = units.slice(0, 2);
    var pool = [];
    started.forEach(function (u) { pool = pool.concat(u.words); });

    var questions = shuffle(pool).slice(0, Math.min(15, pool.length));
    var idx = 0, score = 0;
    var canListen = Vamos.audio.available();

    function next() {
      if (idx >= questions.length) return finish();
      var card = questions[idx];
      // Format wechselt durch: MC ES→DE, MC DE→ES, Hör-Frage
      var mode = idx % 3;
      if (mode === 2 && !canListen) mode = 0;

      var prompt, answer, optionPool, header;
      if (mode === 0) {
        prompt = card.es; answer = card.de; header = "Was heißt auf Deutsch:";
        optionPool = function (w) { return w.de; };
      } else if (mode === 1) {
        prompt = card.de; answer = card.es; header = "Was heißt auf Spanisch:";
        optionPool = function (w) { return w.es; };
      } else {
        prompt = null; answer = card.de; header = "Hör zu – was bedeutet das?";
        optionPool = function (w) { return w.de; };
      }

      var wrong = shuffle(pool.filter(function (w) { return w.id !== card.id; }))
        .slice(0, 3).map(optionPool);
      var options = shuffle([answer].concat(wrong));
      var unitTitle = (Vamos.data.unitMeta(card.unitId) || {}).title || "";

      el.innerHTML =
        '<div class="session-bar"><span>Mix-Quiz · ' + (idx + 1) + " / " + questions.length +
        "</span><span>" + score + " richtig</span></div>" +
        '<div class="card"' + (mode === 2 ? ' style="text-align:center"' : "") + ">" +
        '<div class="muted small">' + header + " <span class=\"pill phase\">" +
        esc(unitTitle) + "</span></div>" +
        (mode === 2
          ? '<button class="listen-big" id="playBtn">' + Vamos.icons.svg("speaker", "lg") + '</button>'
          : '<div class="word" style="font-size:1.3rem;font-weight:700;margin:.3rem 0 .8rem">' +
            esc(prompt) + (mode === 0 ? " " + speakBtn(card.es) : "") + "</div>") +
        '<div id="options" style="text-align:left"></div></div>';
      bindSpeak(el);

      if (mode === 2) {
        var play = function () { Vamos.audio.speak(card.es); };
        el.querySelector("#playBtn").addEventListener("click", play);
        setTimeout(play, 250);
      }

      var optEl = el.querySelector("#options");
      options.forEach(function (opt) {
        var b = document.createElement("button");
        b.className = "mc-option";
        b.textContent = opt;
        b.addEventListener("click", function () {
          if (optEl.dataset.done) return;
          optEl.dataset.done = "1";
          optEl.querySelectorAll(".mc-option").forEach(function (o) {
            if (o.textContent === answer) o.classList.add("correct");
          });
          var ok = opt === answer;
          if (ok) score += 1; else b.classList.add("wrong");
          if (mode !== 0 && canListen) Vamos.audio.speak(card.es);
          if (mode === 2 && !ok) {
            var sol = document.createElement("div");
            sol.className = "feedback no";
            sol.innerHTML = "Das war: <strong>" + esc(card.es) + "</strong>";
            optEl.appendChild(sol);
          }
          setTimeout(function () { idx += 1; next(); }, ok ? 750 : 1800);
        });
        optEl.appendChild(b);
      });
    }

    function finish() {
      var pct = Math.round(100 * score / questions.length);
      if (pct >= 80) Vamos.ui.confetti(18);
      el.innerHTML =
        '<div class="empty-state"><div class="big">' + (pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "🔀") + "</div>" +
        "<p><strong>" + score + " von " + questions.length + " richtig (" + pct + " %)</strong></p>" +
        '<p class="muted small">Gemischt aus ' + started.length + " Einheiten – genau so bleibt es hängen.</p>" +
        '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn primary" id="againBtn">Nochmal</button>' +
        '<a class="btn" href="#/">Zum Dashboard</a></div></div>';
      el.querySelector("#againBtn").addEventListener("click", function () {
        renderMixQuiz(el, units);
      });
    }

    next();
  }

  /* ---------- Satzbau: Wörter in die richtige Reihenfolge tippen ---------- */

  function renderOrderQuiz(el, cards, backLink) {
    var pool = cards.filter(function (w) {
      if (!w.ex) return false;
      var n = w.ex.split(/\s+/).length;
      return n >= 4 && n <= 9;
    });
    if (pool.length < 4) {
      el.innerHTML = '<div class="empty-state"><div class="big">🤷</div>' +
        "<p>Zu wenige passende Sätze in dieser Auswahl.</p>" +
        '<a class="btn" href="' + backLink + '">Zurück</a></div>';
      return;
    }
    var questions = shuffle(pool).slice(0, Math.min(8, pool.length));
    var idx = 0, score = 0;

    function next() {
      if (idx >= questions.length) return finish();
      var card = questions[idx];
      var tokens = card.ex.split(/\s+/);
      var chips = shuffle(tokens.map(function (t, i) { return { t: t, i: i }; }));
      var picked = [];

      function render() {
        el.innerHTML =
          '<div class="session-bar"><span>Satzbau · ' + (idx + 1) + " / " + questions.length +
          "</span><span>" + score + " richtig</span></div>" +
          '<div class="card"><div class="muted small">Baue den Satz: „' +
          esc(card.exDe || card.de) + "“</div>" +
          '<div class="order-area" id="orderArea">' +
          (picked.length
            ? picked.map(function (p, k) {
                return '<button class="chip picked" data-k="' + k + '">' + esc(p.t) + "</button>";
              }).join("")
            : '<span class="muted small" style="padding:.3rem">Tippe die Wörter unten an …</span>') +
          "</div>" +
          '<div id="chipPool">' +
          chips.map(function (c, k) {
            var used = picked.indexOf(c) >= 0;
            return '<button class="chip' + (used ? " used" : "") + '" data-c="' + k + '"' +
              (used ? " disabled" : "") + ">" + esc(c.t) + "</button>";
          }).join("") + "</div>" +
          '<div id="feedback"></div>' +
          '<div class="btn-row"><button class="btn primary" id="checkBtn"' +
          (picked.length === tokens.length ? "" : " disabled") + ">Prüfen</button>" +
          '<button class="btn" id="resetBtn">Zurücksetzen</button></div></div>';

        el.querySelectorAll("[data-c]").forEach(function (b) {
          b.addEventListener("click", function () {
            picked.push(chips[parseInt(b.getAttribute("data-c"), 10)]);
            render();
          });
        });
        el.querySelectorAll("[data-k]").forEach(function (b) {
          b.addEventListener("click", function () {
            picked.splice(parseInt(b.getAttribute("data-k"), 10), 1);
            render();
          });
        });
        el.querySelector("#resetBtn").addEventListener("click", function () {
          picked = [];
          render();
        });
        el.querySelector("#checkBtn").addEventListener("click", check);
      }

      function check() {
        var ok = picked.length === tokens.length && picked.every(function (p, k) {
          return p.i === k;
        });
        // Alternative: gleicher Wortlaut zählt auch (bei doppelten Wörtern)
        if (!ok) {
          ok = picked.map(function (p) { return p.t; }).join(" ") === tokens.join(" ");
        }
        if (ok) score += 1;
        var fb = el.querySelector("#feedback");
        fb.innerHTML = ok
          ? '<div class="feedback ok">✅ ¡Perfecto! ' + esc(card.ex) + " " + speakBtn(card.ex) + "</div>"
          : '<div class="feedback no">❌ Richtig wäre:<br><strong>' + esc(card.ex) +
            "</strong> " + speakBtn(card.ex) + "</div>";
        bindSpeak(fb);
        Vamos.audio.speak(card.ex);
        var row = el.querySelector(".btn-row");
        row.innerHTML = '<button class="btn primary" id="nextBtn">Weiter</button>';
        el.querySelector("#nextBtn").addEventListener("click", function () { idx += 1; next(); });
        el.querySelectorAll(".chip").forEach(function (c) { c.disabled = true; });
      }

      render();
    }

    function finish() {
      var pct = Math.round(100 * score / questions.length);
      if (pct >= 80) Vamos.ui.confetti(14);
      el.innerHTML =
        '<div class="empty-state"><div class="big">' + (pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "🧩") + "</div>" +
        "<p><strong>" + score + " von " + questions.length + " Sätzen gebaut (" + pct + " %)</strong></p>" +
        '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn primary" id="againBtn">Nochmal</button>' +
        '<a class="btn" href="' + backLink + '">Zurück</a></div></div>';
      el.querySelector("#againBtn").addEventListener("click", function () {
        renderOrderQuiz(el, cards, backLink);
      });
    }

    next();
  }

  /* ---------- Konjugationstrainer ---------- */

  function renderConjQuiz(el, conj) {
    var tenseKeys = Object.keys(conj.tenses);
    var questions = [];
    for (var i = 0; i < 12; i++) {
      var verb = conj.verbs[Math.floor(Math.random() * conj.verbs.length)];
      var tense = tenseKeys[Math.floor(Math.random() * tenseKeys.length)];
      var person = Math.floor(Math.random() * conj.persons.length);
      questions.push({ verb: verb, tense: tense, person: person });
    }
    var idx = 0, score = 0;

    function next() {
      if (idx >= questions.length) return finish();
      var q = questions[idx];
      var answer = q.verb[q.tense][q.person];

      el.innerHTML =
        '<div class="session-bar"><span>Konjugation · ' + (idx + 1) + " / " + questions.length +
        "</span><span>" + score + " richtig</span></div>" +
        '<div class="card" style="text-align:center">' +
        '<div class="muted small">' + esc(conj.tenses[q.tense]) + "</div>" +
        '<div class="word" style="font-size:1.5rem;font-weight:800;margin:.2rem 0">' +
        esc(q.verb.inf) + '</div>' +
        '<div class="muted small">' + esc(q.verb.de) + "</div>" +
        '<div style="font-size:1.15rem;font-weight:700;margin:.7rem 0 .4rem">' +
        esc(conj.persons[q.person]) + " ___</div>" +
        '<input class="answer-input" id="conjInput" autocomplete="off" autocapitalize="off" ' +
        'style="max-width:280px;text-align:center" placeholder="Form eintippen …">' +
        '<div id="feedback"></div>' +
        '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn primary" id="checkBtn">Prüfen</button>' +
        '<button class="btn" id="skipBtn">Weiß ich nicht</button></div></div>';

      var input = el.querySelector("#conjInput");
      input.focus();
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
      el.querySelector("#checkBtn").addEventListener("click", check);
      el.querySelector("#skipBtn").addEventListener("click", function () { resolve(0, true); });

      function check() {
        var given = normalize(input.value);
        if (!given) return;
        if (given === normalize(answer)) return resolve(2);
        if (stripAccents(given) === stripAccents(normalize(answer))) return resolve(1);
        resolve(0);
      }

      function resolve(points, skipped) {
        score += points > 0 ? 1 : 0;
        var fb = el.querySelector("#feedback");
        var sol = "<strong>" + esc(conj.persons[q.person]) + " " + esc(answer) + "</strong> " +
          speakBtn(conj.persons[q.person].split("/")[0] + " " + answer);
        if (points === 2) fb.innerHTML = '<div class="feedback ok">✅ ¡Muy bien! ' + sol + "</div>";
        else if (points === 1) fb.innerHTML = '<div class="feedback almost">🟡 Fast – Akzent beachten: ' + sol + "</div>";
        else fb.innerHTML = '<div class="feedback no">' + (skipped ? "" : "❌ ") + "Richtig: " + sol + "</div>";
        bindSpeak(fb);
        input.disabled = true;
        el.querySelector("#checkBtn").style.display = "none";
        var skip = el.querySelector("#skipBtn");
        var clone = skip.cloneNode(true);
        clone.textContent = "Weiter";
        skip.parentNode.replaceChild(clone, skip);
        clone.addEventListener("click", function () { idx += 1; next(); });
        clone.focus();
      }
    }

    function finish() {
      var pct = Math.round(100 * score / questions.length);
      if (pct >= 80) Vamos.ui.confetti(14);
      el.innerHTML =
        '<div class="empty-state"><div class="big">' + (pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "🏃") + "</div>" +
        "<p><strong>" + score + " von " + questions.length + " Formen richtig (" + pct + " %)</strong></p>" +
        '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn primary" id="againBtn">Nochmal</button>' +
        '<a class="btn" href="#/">Zum Dashboard</a></div></div>';
      el.querySelector("#againBtn").addEventListener("click", function () {
        renderConjQuiz(el, conj);
      });
    }

    next();
  }

  return {
    renderLearnSession: renderLearnSession,
    renderMcQuiz: renderMcQuiz,
    renderTypeQuiz: renderTypeQuiz,
    renderListenQuiz: renderListenQuiz,
    renderClozeQuiz: renderClozeQuiz,
    renderMixQuiz: renderMixQuiz,
    renderOrderQuiz: renderOrderQuiz,
    renderConjQuiz: renderConjQuiz,
    esc: esc, shuffle: shuffle, speakBtn: speakBtn, bindSpeak: bindSpeak
  };
})();
