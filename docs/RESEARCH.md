# Research: Besser lernen & bessere App

**Datum:** 2026-08-04 · Grundlage: Lernforschung (Retrieval Practice, Spacing, Interleaving,
Dual Coding) + UX-Praxis erfolgreicher Lern-Apps.

## 1. Was die Lernforschung sagt (und was wir daraus bauen)

| Prinzip | Erkenntnis | Umsetzung in ¡Vamos! |
|---|---|---|
| **Retrieval Practice** | Aktives Abrufen (sich testen) schlägt passives Wiederlesen deutlich – der stärkste bekannte Effekt | SRS-Abfrage ist Kern der App; neu: mehr aktive Formate (Tippen, Lücken, Hören) statt nur Aufdecken |
| **Spacing** | Wachsende Intervalle → Behalten über Jahre, auch bei L2-Vokabeln belegt | SM-2-Scheduler (vorhanden) |
| **Interleaving** | Gemischte Themen/Aufgabentypen schlagen Blocklernen bei verzögerten Tests | Neu: **Mix-Quiz** über alle angefangenen Einheiten + gemischte Übungsformate in einer Session |
| **Dual Coding** | Wort + Bild = reichere Gedächtnisspur | Emojis groß auf Karten (vorhanden), konsequenter pflegen |
| **Generation Effect** | Selbst erzeugen (produzieren) > wiedererkennen | Neu: **Satz-Lücken-Modus** – Beispielsatz mit Lücke, Wort selbst eintippen |
| **Testing in Kontext** | Vokabeln im Satz lernen → bessere Übertragung ins Sprechen | Jede Vokabel hat Beispielsatz (vorhanden); neu: Lücken & Satzbau nutzen die Sätze aktiv |
| **Hörverstehen** | Ohne Hörpraxis kein Verstehen im Urlaub – Erkennen ≠ Hören | Neu: **Hör-Quiz** – erst Audio, dann antworten |
| **Sofortiges Feedback** | Fehler + sofortige Korrektur mit Erklärung = Lerngewinn statt Frust | Vorhanden bei Grammatik; überall beibehalten |
| **Kleine Einheiten & Ziele** | 10–15 min täglich schlägt 2 h am Wochenende; Ziele + Streaks halten dran | Neu: **Tagesziel-Ring** auf dem Dashboard, Session-Länge begrenzt |

Kernquellen: Karatas et al. 2025 (Language Teaching Research), Dunlosky et al.,
Anki/Expanded-Retrieval-Studien, Keyword-Method-Forschung.

## 2. UX-Prinzipien für die App

1. **Ein Tap zum Lernen:** Dashboard = „Heute“: ein großer Button, Rest sekundär.
2. **Session-Gefühl:** Fortschrittsbalken in der Session, klarer Abschluss mit Feier-Moment.
3. **Flow statt Menü-Dschungel:** max. 5 Tabs, alles Wichtige max. 2 Taps entfernt.
4. **Mobile first:** Daumen-Reichweite (Aktionen unten), große Touchflächen, kein Scrollen im Quiz.
5. **Schnell:** kein Framework, keine Webfonts, JSON lazy pro Einheit, Service Worker – Start < 1 s.
6. **Belohnung dosiert:** Streak + Tagesziel ja, aber kein Punkte-Spam; Fokus bleibt Lernen.
7. **Schön = ruhig:** warme spanische Palette (Terracotta/Safran/Oliv), viel Weißraum,
   eine Akzentfarbe pro Aktion, sanfte Übergänge statt Effekt-Feuerwerk.

## 3. Feature-Ideen, bewertet (Aufwand × Lernwert)

**Jetzt bauen (hoher Lernwert, einfach):**
- 🔊 **Hör-Quiz**: TTS spielt Wort/Satz, du wählst/tippst die Bedeutung → trainiert Urlaubs-Ohr
- ✍️ **Satz-Lücke (Cloze)**: Beispielsatz mit ausgeblendetem Zielwort, selbst eintippen
- 🔀 **Mix-Quiz**: 15 Fragen quer durch alle angefangenen Einheiten (Interleaving), wechselnde Formate
- 🎯 **Tagesziel-Ring** + Feier-Screen am Session-Ende
- 📥 **Anki-Export** pro Einheit & gesamt, inkl. Sätze-only („Phrasenpaket“), mit GUID
  (Re-Import aktualisiert statt dupliziert; Format: `#separator/#deck/#notetype/#guid column`)
- 🔍 **Suche** über alle Vokabeln

**Bald (mittlerer Aufwand):**
- 🧩 **Satzbau-Übung**: Wörter des Beispielsatzes mischen, antippen in richtiger Reihenfolge
- 🏃 **Konjugationstrainer**: Verb + Zeit + Person drillen (nutzt Grammatik-Tabellen)
- 📆 **Meilenstein-Checks**: alle ~50 gelernten Karten ein gemischter Rückblick-Test
- 🗣️ **Nachsprechen**: TTS vorsprechen, selbst laut nachsprechen (Selbstbewertung)

**Später / bewusst NICHT:**
- Spracherkennung (Web Speech Recognition): unzuverlässig für L2-Aussprache → frustriert
- Echte Fotos pro Vokabel: Lizenz-/Lade-Aufwand, Emojis + Sätze leisten das meiste
- Accounts/Cloud-Sync: localStorage + Backup-Export reicht, hält die App wartungsfrei

## 4. Content-Lücken (komplette Ziel-Liste → ROADMAP.md)

Für B1/B2-Reise-Konversation fehlen vor allem: Einkaufen/Geld, Notfall/Gesundheit,
Smalltalk/Kennenlernen, Freizeit/Hobbys, Wetter, Gefühle/Meinung, **Konnektoren &
Füllwörter** (größter Flüssigkeits-Hebel!), Familie/Personen beschreiben, Unterkunft
Airbnb/Probleme, Strand/Natur/Ausflüge, Feiern/Ausgehen, Telefon/Internet/Behörden,
Zeit-Ausdrücke, Adjektive Grundstock, LatAm-Unterschiede. Grammatik: Imperfecto,
Perfecto, Objektpronomen, Gustar, Futur, Condicional, Imperativ, Subjuntivo I+II,
Vergleiche, Por/Para.
