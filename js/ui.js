/* UI-Bausteine: Tagesziel-Ring (SVG), Konfetti, Skeleton. */
window.Vamos = window.Vamos || {};

Vamos.ui = (function () {

  /* Kreisring mit Fortschritt 0..1, Zahl in der Mitte. */
  function ring(value, label, size) {
    size = size || 88;
    var r = (size - 10) / 2;
    var c = 2 * Math.PI * r;
    var off = c * (1 - Math.min(1, Math.max(0, value)));
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' +
      '<circle class="track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r +
      '" fill="none" stroke-width="7"/>' +
      '<circle class="val" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r +
      '" fill="none" stroke-width="7" stroke-dasharray="' + c.toFixed(1) +
      '" stroke-dashoffset="' + off.toFixed(1) +
      '" transform="rotate(-90 ' + size / 2 + " " + size / 2 + ')"/>' +
      '<text class="ring-num" x="50%" y="50%" text-anchor="middle" dominant-baseline="central">' +
      label + "</text></svg>";
  }

  var CONFETTI = ["🎉", "🎊", "⭐", "🇪🇸", "☀️", "💃", "🏆"];

  function confetti(n) {
    n = n || 22;
    for (var i = 0; i < n; i++) {
      var s = document.createElement("span");
      s.className = "confetti-piece";
      s.textContent = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDelay = (Math.random() * 0.7) + "s";
      s.style.fontSize = (0.9 + Math.random() * 0.9) + "rem";
      document.body.appendChild(s);
      setTimeout(function (el) { return function () { el.remove(); }; }(s), 3400);
    }
  }

  function skeleton(n) {
    var html = "";
    for (var i = 0; i < (n || 3); i++) html += '<div class="skeleton"></div>';
    return html;
  }

  /* Theme anwenden: "auto" | "light" | "dark" */
  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  return { ring: ring, confetti: confetti, skeleton: skeleton, applyTheme: applyTheme };
})();
