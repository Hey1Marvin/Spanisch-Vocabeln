/* Text-to-Speech über die Web Speech API mit spanischer Stimme. */
window.Vamos = window.Vamos || {};

Vamos.audio = (function () {
  var voices = [];

  function refresh() {
    if (!window.speechSynthesis) return;
    voices = speechSynthesis.getVoices().filter(function (v) {
      return v.lang && v.lang.toLowerCase().indexOf("es") === 0;
    });
  }

  if (window.speechSynthesis) {
    refresh();
    speechSynthesis.onvoiceschanged = refresh;
  }

  function spanishVoices() { return voices; }

  function pickVoice() {
    var wanted = Vamos.store.settings().voiceURI;
    if (wanted) {
      for (var i = 0; i < voices.length; i++)
        if (voices[i].voiceURI === wanted) return voices[i];
    }
    // es-ES bevorzugen, sonst erste spanische Stimme
    for (var j = 0; j < voices.length; j++)
      if (voices[j].lang.toLowerCase().indexOf("es-es") === 0) return voices[j];
    return voices[0] || null;
  }

  function speak(text) {
    if (!window.speechSynthesis) return false;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = Vamos.store.settings().speechRate || 0.9;
    var v = pickVoice();
    if (v) u.voice = v;
    speechSynthesis.speak(u);
    return true;
  }

  function available() {
    return !!window.speechSynthesis;
  }

  return { speak: speak, spanishVoices: spanishVoices, available: available };
})();
