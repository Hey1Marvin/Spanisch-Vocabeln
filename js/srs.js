/* Spaced Repetition: vereinfachtes SM-2 (Anki-Stil).
   Zustand pro Karte: r = Wiederholungen, e = Ease-Faktor, i = Intervall in Tagen,
   due = Fälligkeit (ms), l = Lapses. */
window.Vamos = window.Vamos || {};

Vamos.srs = (function () {
  var DAY = 86400000;
  var MASTERED_DAYS = 21;

  function fresh() {
    return { r: 0, e: 2.5, i: 0, due: 0, l: 0 };
  }

  /* grade: 0=Nochmal 1=Schwer 2=Gut 3=Einfach */
  function rate(state, grade, now) {
    var s = state ? {
      r: state.r, e: state.e, i: state.i, due: state.due, l: state.l
    } : fresh();
    now = now || Date.now();

    if (grade === 0) {
      s.l += (s.r > 0 ? 1 : 0);
      s.i = 0;
      s.e = Math.max(1.3, s.e - 0.2);
      s.due = now + 600000; // 10 min, kommt in der Session wieder
    } else if (grade === 1) {
      s.e = Math.max(1.3, s.e - 0.15);
      s.i = s.i < 1 ? 0.5 : Math.max(1, Math.round(s.i * 1.2));
      s.due = now + s.i * DAY;
    } else if (grade === 2) {
      if (s.i < 1) s.i = s.r === 0 ? 1 : 3;
      else s.i = Math.round(s.i * s.e);
      s.due = now + s.i * DAY;
    } else {
      s.e = Math.min(3.2, s.e + 0.15);
      s.i = s.i < 1 ? 4 : Math.round(s.i * s.e * 1.35);
      s.due = now + s.i * DAY;
    }
    s.r += 1;
    return s;
  }

  function previewInterval(state, grade) {
    var s = rate(state, grade, Date.now());
    if (grade === 0) return "10 Min";
    if (s.i < 1) return "12 Std";
    if (s.i < 30) return s.i + " T";
    return Math.round(s.i / 30) + " Mon";
  }

  function isDue(state, now) {
    return state && state.r > 0 && state.due <= (now || Date.now());
  }

  function status(state) {
    if (!state || state.r === 0) return "new";
    return state.i >= MASTERED_DAYS ? "mastered" : "learning";
  }

  /* Session-Queue: erst fällige (nach Fälligkeit), dann neue (in Manifest-Reihenfolge). */
  function buildQueue(cards, srsMap, newLimit, now) {
    now = now || Date.now();
    var due = [], fresh_ = [];
    cards.forEach(function (c) {
      var st = srsMap[c.id];
      if (isDue(st, now)) due.push(c);
      else if (!st || st.r === 0) fresh_.push(c);
    });
    due.sort(function (a, b) { return srsMap[a.id].due - srsMap[b.id].due; });
    return due.concat(fresh_.slice(0, newLimit));
  }

  function counts(cards, srsMap, now) {
    now = now || Date.now();
    var out = { total: cards.length, due: 0, "new": 0, learning: 0, mastered: 0 };
    cards.forEach(function (c) {
      var st = srsMap[c.id];
      var t = status(st);
      out[t] += 1;
      if (isDue(st, now)) out.due += 1;
    });
    return out;
  }

  return {
    rate: rate, previewInterval: previewInterval, isDue: isDue,
    status: status, buildQueue: buildQueue, counts: counts,
    MASTERED_DAYS: MASTERED_DAYS
  };
})();
