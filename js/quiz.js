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
    return '<button class="speak-btn" data-speak="' + esc(text) + '" title="Anhören">🔊</button>';
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
        el.innerHTML =
          '<div class="empty-state"><div class="big">✅</div>' +
          "<p><strong>Session geschafft!</strong></p>" +
          '<p class="muted">' + doneCount + " Karten wiederholt.</p>" +
          '<a class="btn primary" href="#/">Zum Dashboard</a></div>';
        return;
      }
      showCard(queue[0]);
    }

    function showCard(card) {
      var dir = directionFor(card);
      var front = dir === "es-de" ? card.es : card.de;
      var frontLang = dir === "es-de" ? "🇪🇸" : "🇩🇪";
      var unitTitle = (Vamos.data.unitMeta(card.unitId) || {}).title || "";

      el.innerHTML =
        '<div class="session-bar"><span>Noch ' + queue.length + " von " + total +
        '</span><a href="#/" class="no-decoration">Beenden ✕</a></div>' +
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

  return {
    renderLearnSession: renderLearnSession,
    renderMcQuiz: renderMcQuiz,
    renderTypeQuiz: renderTypeQuiz,
    esc: esc, shuffle: shuffle, speakBtn: speakBtn, bindSpeak: bindSpeak
  };
})();
