/* Grammatik: Theorie-Anzeige und Übungs-Runner (Lückentext + Multiple Choice). */
window.Vamos = window.Vamos || {};

Vamos.grammar = (function () {
  var esc = function (s) { return Vamos.quiz.esc(s); };

  /* Mini-Markdown: **fett** und `code` */
  function md(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  }

  function renderTheory(el, g) {
    var html = "";
    if (g.intro) html += '<p class="muted">' + md(g.intro) + "</p>";
    (g.sections || []).forEach(function (sec) {
      html += '<div class="card theory">';
      if (sec.h) html += "<h3>" + esc(sec.h) + "</h3>";
      if (sec.p) html += "<p>" + md(sec.p) + "</p>";
      if (sec.table) {
        html += "<table><tr>";
        sec.table.head.forEach(function (h) { html += "<th>" + esc(h) + "</th>"; });
        html += "</tr>";
        sec.table.rows.forEach(function (row) {
          html += "<tr>";
          row.forEach(function (c) { html += "<td>" + md(c) + "</td>"; });
          html += "</tr>";
        });
        html += "</table>";
      }
      (sec.examples || []).forEach(function (ex) {
        html += '<div class="example">' + esc(ex.es) + " " + Vamos.quiz.speakBtn(ex.es) +
          '<div class="de">' + esc(ex.de) + "</div></div>";
      });
      if (sec.tip) html += '<div class="tip">💡 ' + md(sec.tip) + "</div>";
      html += "</div>";
    });
    el.innerHTML = html;
    Vamos.quiz.bindSpeak(el);
  }

  function normalize(s) {
    return s.toLowerCase().replace(/[¿¡?!.,;:]/g, "").replace(/\s+/g, " ").trim();
  }
  function stripAccents(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function answersOf(ex) {
    return Array.isArray(ex.answer) ? ex.answer : [ex.answer];
  }

  function renderExercises(el, g, onDone) {
    var list = g.exercises || [];
    var idx = 0, score = 0;

    function next() {
      if (idx >= list.length) return finish();
      var ex = list[idx];
      if (ex.type === "mc") renderMc(ex);
      else renderGap(ex);
    }

    function header() {
      return '<div class="session-bar"><span>Übung ' + (idx + 1) + " / " + list.length +
        "</span><span>" + score + " richtig</span></div>";
    }

    function renderGap(ex) {
      el.innerHTML = header() +
        '<div class="card"><div class="muted small">Setze die richtige Form ein:</div>' +
        '<div style="font-size:1.1rem;margin:.4rem 0 .8rem">' + esc(ex.text).replace(/___/g,
          '<span style="border-bottom:2px solid var(--accent);padding:0 1.2rem">&nbsp;</span>') + "</div>" +
        (ex.hint ? '<div class="muted small">💡 ' + esc(ex.hint) + "</div>" : "") +
        '<input class="answer-input" id="gapInput" autocomplete="off" autocapitalize="off" ' +
        'style="margin-top:.6rem" placeholder="Deine Antwort …">' +
        '<div id="feedback"></div>' +
        '<div class="btn-row"><button class="btn primary" id="checkBtn">Prüfen</button>' +
        '<button class="btn" id="skipBtn">Weiß ich nicht</button></div></div>';

      var input = el.querySelector("#gapInput");
      input.focus();
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
      el.querySelector("#checkBtn").addEventListener("click", check);
      el.querySelector("#skipBtn").addEventListener("click", function () { showResult(false, null, true); });

      function check() {
        var given = normalize(input.value);
        if (!given) return;
        var answers = answersOf(ex).map(normalize);
        if (answers.indexOf(given) >= 0) return showResult(true, "ok");
        var accentless = answers.map(stripAccents);
        if (accentless.indexOf(stripAccents(given)) >= 0) return showResult(true, "accents");
        showResult(false, "wrong");
      }

      function showResult(correct, kind, skipped) {
        if (correct) score += 1;
        var solution = "<strong>" + esc(answersOf(ex)[0]) + "</strong>";
        var fb = el.querySelector("#feedback");
        if (kind === "ok") fb.innerHTML = '<div class="feedback ok">✅ Richtig: ' + solution + "</div>";
        else if (kind === "accents")
          fb.innerHTML = '<div class="feedback almost">🟡 Richtig, aber achte auf die Akzente: ' + solution + "</div>";
        else fb.innerHTML = '<div class="feedback no">' + (skipped ? "" : "❌ ") +
          "Richtig wäre: " + solution + "</div>";
        if (ex.expl) fb.innerHTML += '<div class="muted small" style="margin:.4rem 0">' + esc(ex.expl) + "</div>";
        advanceUi(input);
      }
    }

    function renderMc(ex) {
      el.innerHTML = header() +
        '<div class="card"><div style="font-size:1.05rem;margin:.2rem 0 .8rem">' +
        esc(ex.q).replace(/___/g,
          '<span style="border-bottom:2px solid var(--accent);padding:0 1.2rem">&nbsp;</span>') +
        "</div><div id='options'></div><div id='feedback'></div>" +
        '<div class="btn-row"></div></div>';

      var optEl = el.querySelector("#options");
      ex.options.forEach(function (opt, i) {
        var b = document.createElement("button");
        b.className = "mc-option";
        b.textContent = opt;
        b.addEventListener("click", function () {
          if (optEl.dataset.done) return;
          optEl.dataset.done = "1";
          var correct = i === ex.answer;
          if (correct) score += 1;
          optEl.querySelectorAll(".mc-option").forEach(function (o, j) {
            if (j === ex.answer) o.classList.add("correct");
          });
          if (!correct) b.classList.add("wrong");
          var fb = el.querySelector("#feedback");
          if (ex.expl) fb.innerHTML = '<div class="muted small" style="margin:.4rem 0">' +
            esc(ex.expl) + "</div>";
          advanceUi(null);
        });
        optEl.appendChild(b);
      });
    }

    function advanceUi(inputToDisable) {
      if (inputToDisable) inputToDisable.disabled = true;
      var row = el.querySelector(".btn-row");
      row.innerHTML = '<button class="btn primary" id="nextBtn">Weiter</button>';
      var nb = el.querySelector("#nextBtn");
      nb.focus();
      nb.addEventListener("click", function () { idx += 1; next(); });
    }

    function finish() {
      Vamos.store.saveGrammarResult(g.id, score, list.length);
      var pct = list.length ? Math.round(100 * score / list.length) : 0;
      el.innerHTML =
        '<div class="empty-state"><div class="big">' + (pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚") + "</div>" +
        "<p><strong>" + score + " von " + list.length + " richtig (" + pct + " %)</strong></p>" +
        '<div class="btn-row" style="justify-content:center">' +
        '<button class="btn primary" id="againBtn">Nochmal üben</button>' +
        '<a class="btn" href="#/grammar">Alle Kapitel</a></div></div>';
      el.querySelector("#againBtn").addEventListener("click", function () {
        renderExercises(el, g, onDone);
      });
      if (onDone) onDone(score, list.length);
    }

    next();
  }

  return { renderTheory: renderTheory, renderExercises: renderExercises, md: md };
})();
