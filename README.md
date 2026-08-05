# ¡Vamos! – Spanisch lernen bis B1/B2

Persönliche Spanisch-Lern-App mit Fokus auf **Konversation & Reisen**.
Läuft komplett im Browser, offline-fähig, ohne Anmeldung – der Lernfortschritt
bleibt auf dem Gerät (localStorage).

**Live:** https://hey1marvin.github.io/Spanisch-Vocabeln/

## Features

- 📚 **Vokabel-Einheiten** nach Wichtigkeit gerankt (Wörter + ganze Sätze, mit Emoji & Beispielsatz)
- 🧠 **Spaced Repetition** wie in Anki: fällige Karten + neue Karten, Selbstbewertung
- ✍️ **Quiz-Modi**: Multiple Choice (beide Richtungen) und Tippen (akzent-tolerant)
- 📖 **Grammatik-Kapitel** mit Theorie, Eselsbrücken und Übungen
- 🔊 **Audio** per Text-to-Speech (spanische Systemstimme)
- 📊 **Statistik**: Streak, Fortschritt pro Einheit, Aktivität
- 📥 **CSV-Export** pro Einheit (Anki-kompatibel) + Druckansicht
- 📱 **PWA**: am Handy „zum Startbildschirm hinzufügen" → wie eine App, offline nutzbar
- 🤖 **KI-Tutor & Text-Check**: Konversations-Simulation und Textkorrektur (eigener API-Key, bleibt nur im Browser)
- 📕 **Lesetexte**: 8 Geschichten mit Audio, Übersetzung, Glossar und Fragen
- 📖 **Wörterbuch & Verbtabellen**: Nachschlagen und alle 7 Zeitformen für jedes Verb
- 🎁 **Themen-Pakete**: z. B. „Essen komplett" als Anki-Deck herunterladen

## Nutzung

Einfach die Live-URL öffnen. Lokal testen:

```bash
python3 -m http.server 8000
```

und http://localhost:8000 öffnen (Doppelklick auf `index.html` reicht nicht,
weil die App die Vokabel-JSONs per `fetch` lädt).

## Fortschritt sichern

Einstellungen → **Backup exportieren** (JSON-Datei). Auf neuem Gerät → **Backup importieren**.

## Inhalte erweitern

Vokabeln liegen als JSON in [data/vocab/](data/vocab/), Grammatik in [data/grammar/](data/grammar/).
Neue Einheit: JSON-Datei anlegen und in [data/manifest.json](data/manifest.json) eintragen – fertig.
Was geplant ist, steht in der [ROADMAP.md](ROADMAP.md), das technische Design in [docs/DESIGN.md](docs/DESIGN.md).
