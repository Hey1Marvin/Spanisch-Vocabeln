# Design: Spanisch-Lern-App (¡Vamos! – Spanisch bis B1/B2)

**Datum:** 2026-08-04 · **Ziel-Level:** B1–B2 · **Fokus:** Konversation & Reisen

## Ziel

Eine persönliche, selbst gehostete Spanisch-Lern-App für Marvin (Vorkenntnisse: 4 Jahre
Schulspanisch, 6 Jahre her). Hauptziel: sich im Urlaub und auf Reisen solide verständigen
und Konversationen führen können. Die App läuft auf GitHub Pages, funktioniert offline
(PWA) und trackt den Lernfortschritt lokal.

## Framework-Entscheidung

Abgewogen wurden:

| Option | Pro | Contra |
|---|---|---|
| React/Vue + Vite | Komponenten, Ökosystem | Build-Schritt + CI nötig, Dependencies altern, Overkill |
| Astro/Eleventy (SSG) | Gute Content-Struktur | Build-Schritt, Interaktivität braucht trotzdem eigenes JS |
| **Vanilla JS PWA (ohne Build)** | Direkt von `main` deploybar, null Dependencies, JSON-Daten direkt auf GitHub editierbar, offline-fähig | UI von Hand (bei diesem Umfang gut machbar) |

**Entscheidung: Vanilla JS ohne Build-Schritt.** Für eine persönliche Lern-App, die
jahrelang wartungsfrei laufen soll, ist "keine Toolchain" das robusteste Setup.

## Architektur

```
Spanisch-Vocabeln/
├── index.html              SPA-Shell (Hash-Router)
├── css/style.css           Design (responsive, mobile-first, dark mode)
├── js/
│   ├── store.js            localStorage-Wrapper, Export/Import des Fortschritts
│   ├── srs.js              Spaced-Repetition-Scheduler (SM-2 vereinfacht)
│   ├── data.js             Laden von manifest + Einheiten, Karten-IDs
│   ├── audio.js            Text-to-Speech (Web Speech API, es-ES)
│   ├── quiz.js             Lernmodus: Flashcards, Multiple Choice, Tippen
│   ├── grammar.js          Grammatik-Theorie + Übungen (Lücken, MC)
│   └── app.js              Router, Views (Dashboard, Einheiten, Statistik, Einstellungen)
├── data/
│   ├── manifest.json       Alle Einheiten mit Rang, Level, Typ
│   ├── vocab/uXX-*.json    Vokabel-Einheiten (Wörter + Sätze/Formulierungen)
│   └── grammar/gXX-*.json  Grammatik-Kapitel (Theorie + Übungen)
├── sw.js                   Service Worker (offline)
├── manifest.webmanifest    PWA-Installierbarkeit
└── icons/                  App-Icons
```

## Datenmodell

**Vokabel-Eintrag** (`data/vocab/*.json`):
```json
{"es": "la cuenta", "de": "die Rechnung", "emoji": "🧾",
 "ex": "La cuenta, por favor.", "exDe": "Die Rechnung, bitte.", "type": "word"}
```
- `emoji` = "Bild" zur Vokabel (offline, überall verfügbar); `type`: `word` | `phrase`.
- Karten-ID = Einheit + Slug des spanischen Worts → stabil, auch wenn Listen wachsen.

**Grammatik-Kapitel**: `theory` (Abschnitte mit Beispielen + Merksätzen) und
`exercises` (`gap` = Lückentext mit Verb in Klammern, `mc` = Multiple Choice, je mit Erklärung).

## Spaced Repetition (SM-2 vereinfacht)

Pro Karte: `reps`, `ease` (Start 2.5), `interval` (Tage), `due`, `lapses`.
Bewertung wie Anki: **Nochmal / Schwer / Gut / Einfach**.
- Nochmal → Karte kommt in derselben Session wieder, Intervall zurück auf 0
- Gut → 1 Tag → 3 Tage → interval × ease
- Einfach → größerer Sprung, ease steigt; Schwer → kleiner Schritt, ease sinkt
- Lernsession = alle fälligen Karten + N neue (Standard 15, einstellbar)
- "Gelernt" = Intervall ≥ 21 Tage

Der Fortschritt liegt in `localStorage` (Schlüssel `vamos-*`), mit **JSON-Export/Import**
in den Einstellungen (Backup / Gerätewechsel).

## Lernmodi

1. **Lernen (SRS)** – global über alle aktivierten Einheiten: fällige + neue Karten,
   Flashcard mit Emoji, Beispielsatz, Audio-Button, Selbstbewertung.
2. **Einheiten-Quiz** – Multiple Choice (ES→DE und DE→ES) pro Einheit, ohne SRS-Einfluss.
3. **Tipp-Modus** – DE→ES eintippen, akzent-tolerant bewertet (Hinweis bei Akzentfehlern).
4. **Grammatik-Übungen** – Lückentexte und Multiple Choice mit Erklärungen, Ergebnis pro Kapitel gespeichert.

## Audio

Web Speech API (`speechSynthesis`) mit spanischer Stimme (es-ES), Sprechtempo 0.9.
Kostenlos, offline (Systemstimmen), auf Android/iOS/Desktop verfügbar. Stimme in den
Einstellungen wählbar. Kein Audio-Hosting nötig.

## Downloads

- **CSV-Export pro Einheit** (auch Anki-kompatibel: Front/Back/Beispiel)
- **Druckansicht** der Vokabelliste (sauberes Print-CSS)
- Roh-JSON jederzeit direkt auf GitHub einsehbar

## Statistik / Fortschritt

Dashboard: fällige Karten heute, Streak (Lerntage in Folge), Karten gelernt/in Arbeit/neu,
Fortschrittsbalken pro Einheit, Aktivität der letzten 14 Tage (SVG-Balken).

## Fehlerbehandlung

- `fetch`-Fehler → verständliche Meldung mit Retry
- Service Worker: network-first für `data/*` (Inhalts-Updates kommen an), cache-first für Shell
- localStorage defensiv lesen (try/parse mit Fallback), Versionsfeld für spätere Migrationen

## Hosting

GitHub Pages, Branch `main`, Root. Repo ist public (Voraussetzung für Pages im Free-Plan);
der Lernfortschritt liegt nur im Browser, nie im Repo.
