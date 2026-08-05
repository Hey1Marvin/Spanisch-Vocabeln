/* KI-Tutor: Konversations-Simulation & Text-Korrektur.
   Der API-Key wird NUR in localStorage gespeichert – nie im Repo, nie im Backup. */
window.Vamos = window.Vamos || {};

Vamos.tutor = (function () {
  var esc = function (s) { return Vamos.quiz.esc(s); };

  function aiConfig() {
    try {
      return JSON.parse(localStorage.getItem("vamos.ai") || "{}");
    } catch (e) { return {}; }
  }
  function saveAiConfig(cfg) {
    localStorage.setItem("vamos.ai", JSON.stringify(cfg));
  }

  var DEFAULTS = {
    anthropic: { model: "claude-haiku-4-5-20251001" },
    openai: { model: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1" }
  };

  /* Einheitlicher Chat-Aufruf. messages: [{role:"user"|"assistant", content:"…"}] */
  function chat(system, messages) {
    var cfg = aiConfig();
    if (!cfg.key) return Promise.reject(new Error("Kein API-Key hinterlegt. Trage ihn oben in den Tutor-Einstellungen ein."));
    var provider = cfg.provider || "anthropic";

    if (provider === "anthropic") {
      return fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": cfg.key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: cfg.model || DEFAULTS.anthropic.model,
          max_tokens: 800,
          system: system,
          messages: messages
        })
      }).then(handleJson).then(function (d) {
        if (!d.content || !d.content[0]) throw new Error("Leere Antwort");
        return d.content[0].text;
      });
    }

    // OpenAI-kompatibel (auch Custom-Endpoints)
    var base = (cfg.baseUrl || DEFAULTS.openai.baseUrl).replace(/\/$/, "");
    return fetch(base + "/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": "Bearer " + cfg.key
      },
      body: JSON.stringify({
        model: cfg.model || DEFAULTS.openai.model,
        messages: [{ role: "system", content: system }].concat(messages)
      })
    }).then(handleJson).then(function (d) {
      if (!d.choices || !d.choices[0]) throw new Error("Leere Antwort");
      return d.choices[0].message.content;
    });
  }

  function handleJson(r) {
    return r.json().catch(function () { return {}; }).then(function (d) {
      if (!r.ok) {
        var msg = (d.error && (d.error.message || d.error.type)) || ("HTTP " + r.status);
        throw new Error(msg);
      }
      return d;
    });
  }

  var SCENARIOS = [
    { id: "libre", emoji: "💬", title: "Freies Gespräch", prompt: "Führe ein lockeres Alltagsgespräch." },
    { id: "restaurante", emoji: "🍽️", title: "Im Restaurant", prompt: "Du bist Kellner in einem Restaurant in Sevilla. Der Lerner ist Gast: begrüßen, Empfehlungen, Bestellung aufnehmen, Rechnung." },
    { id: "hotel", emoji: "🏨", title: "Hotel-Check-in", prompt: "Du bist Rezeptionist in einem Hotel in Madrid. Check-in, Fragen zum Zimmer, Frühstück, Tipps für die Umgebung." },
    { id: "taxi", emoji: "🚕", title: "Im Taxi", prompt: "Du bist Taxifahrer in Barcelona. Smalltalk, Ziel erfragen, über die Stadt reden, Preis." },
    { id: "mercado", emoji: "🛒", title: "Auf dem Markt", prompt: "Du bist Verkäufer auf einem Wochenmarkt in Valencia. Obst/Gemüse verkaufen, Preise, Mengen, Smalltalk." },
    { id: "conocer", emoji: "🍻", title: "Leute kennenlernen", prompt: "Du bist ein freundlicher Spanier in einer Tapas-Bar, der mit dem Lerner ins Gespräch kommt: Herkunft, Reise, Hobbys." }
  ];

  function systemPrompt(scenario) {
    return "Du bist ein geduldiger Spanisch-Tutor für einen deutschen Lerner auf Niveau A2–B1 " +
      "(Ziel: Konversation auf Reisen, europäisches Spanisch). Szenario: " + scenario.prompt + " " +
      "Regeln: Antworte kurz (2–4 Sätze) auf Spanisch, einfaches Niveau. " +
      "Wenn der Lerner einen Fehler macht, korrigiere ihn zuerst in einer Zeile im Format " +
      "»✏️ [falsch] → [richtig] (kurze Erklärung auf Deutsch)« und führe DANN das Gespräch auf Spanisch weiter. " +
      "Bei »?« oder wenn der Lerner nicht weiterweiß, gib einen deutschen Hinweis. " +
      "Bleib immer im Szenario und stelle am Ende deiner Antwort meist eine Gegenfrage.";
  }

  var CORRECT_PROMPT =
    "Du bist ein Spanisch-Lehrer. Korrigiere den folgenden spanischen Text eines deutschen Lerners (Niveau A2–B1). " +
    "Antworte auf Deutsch in genau diesem Format:\n" +
    "**Korrigierter Text:**\n[der komplette korrigierte Text auf Spanisch]\n\n" +
    "**Fehler & Erklärungen:**\n- [falsch] → [richtig]: kurze Erklärung\n(eine Zeile pro Fehler; wenn alles richtig ist, schreibe das und mach ein Kompliment)\n\n" +
    "**Stil-Tipp:** ein Vorschlag, wie es natürlicher klingen würde.";

  function correct(text) {
    return chat(CORRECT_PROMPT, [{ role: "user", content: text }]);
  }

  return {
    aiConfig: aiConfig, saveAiConfig: saveAiConfig, chat: chat, correct: correct,
    SCENARIOS: SCENARIOS, systemPrompt: systemPrompt, DEFAULTS: DEFAULTS
  };
})();
