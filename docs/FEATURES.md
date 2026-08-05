# Feature-Backlog (lebendes Dokument)

Status: ✅ fertig · 🟡 teilweise / v1 vorhanden · ⬜ offen
Inspiration: Duolingo, Busuu, Babbel, LingQ, Pimsleur, SpanishDict, Beelinguapp, Anki.
(Recherche 2026-08: HelloTalk/FluentU/Mezzoguild/ClassCentral-Vergleiche)

## Lernen & Üben

| Status | Feature | Vorbild | Notizen |
|---|---|---|---|
| ✅ | Spaced Repetition (SM-2, 4 Bewertungen) | Anki | Kern der App |
| ✅ | Multiple-Choice beide Richtungen | alle | pro Einheit |
| ✅ | Tipp-Modus akzent-tolerant | Babbel | |
| ✅ | Hör-Quiz (Audio zuerst) | Pimsleur | global + pro Einheit |
| ✅ | Satz-Lücke (Cloze im Beispielsatz) | Clozemaster | |
| ✅ | Satzbau (Wörter ordnen) | Duolingo | |
| ✅ | Mix-Quiz / Interleaving | Lernforschung | |
| ✅ | Konjugationstrainer | Ella Verbs | 15 Kernverben, 2 Zeiten |
| ✅ | Lesetexte mit Fragen, Glossar, Audio | Duolingo Stories, Beelinguapp | 8 Stück |
| 🟡 | Parallel-Lesen ES/DE | Beelinguapp | Toggle da; Satz-für-Satz-Hervorhebung offen |
| ✅ | Nachsprech-Modus (hören → nachsprechen → selbst bewerten) | Pimsleur | |
| ✅ | Meilenstein-/Rückblick-Test über Gelerntes | Busuu | |
| ⬜ | Einstufungstest (Startlevel bestimmen, Einheiten überspringen) | Busuu/Babbel | |
| ⬜ | Konjugationstrainer: alle 7 Zeiten + beliebige Verben (Engine existiert) | Ella Verbs | |
| ⬜ | Diktat-Modus (hören → tippen) | — | |
| ⬜ | Minimal-Paare-Hörtraining (pero/perro, casa/caza) | — | |
| ⬜ | KI-generierte personalisierte Übungen aus schwachen Karten | — | braucht KI-Key |

## KI & Sprach-Werkzeuge

| Status | Feature | Vorbild | Notizen |
|---|---|---|---|
| ✅ | KI-Tutor Konversations-Szenarien | Busuu-Tutoren | Key nur localStorage |
| ✅ | Text-Check per KI (Korrektur + Erklärung) | Busuu Community | |
| ✅ | Rechtschreibprüfung OHNE Key (LanguageTool-API) | — | Fallback im Text-Check |
| ✅ | Wörterbuch (eigene Vokabeln + MyMemory + Weblinks) | SpanishDict | |
| ✅ | Verbtabellen-Engine 7 Zeiten | SpanishDict | |
| ✅ | Text-to-Speech überall | alle | Systemstimmen |
| ⬜ | KI-Aussprache-Feedback | — | Web Speech Recognition unzuverlässig – bewusst zurückgestellt |

## Motivation & Fortschritt

| Status | Feature | Vorbild | Notizen |
|---|---|---|---|
| ✅ | Streak + Tagesziel-Ring | Duolingo | |
| ✅ | Statistik (Aktivität, pro Einheit, gesamt) | alle | |
| ✅ | Konfetti/Feier-Momente | Duolingo | dosiert |
| ✅ | Wort des Tages (Dashboard) | SpanishDict | |
| 🟡 | Achievements/Abzeichen | Duolingo | v1: Meilenstein-Zähler; Badge-Galerie offen |
| ⬜ | Wochenrückblick („Diese Woche: 120 Reviews, 34 neue Wörter…“) | Duolingo | |
| ⬜ | Tagesziel-Erinnerung (Web-Notification) | Duolingo | |

## Inhalte

| Status | Feature | Notizen |
|---|---|---|
| ✅ | 25 Vokabel-Einheiten (1300 Karten) nach Wichtigkeit | U01–U25 |
| ✅ | 14 Grammatik-Kapitel mit Übungen | G01–G14 |
| ✅ | 16 Lesetexte | r01–r16 |
| 🟡 | Ausbau: U26–U37 | U26+U30 fertig; U27–U29, U31–U37 nach Limit-Reset (23:10) |
| ✅ | Ausbau: r09–r16 Lesetexte | fertig |
| ✅ | Ausbau: G15–G18 (Pluscuamperfecto, se/Passiv, Relativsätze, indirekte Rede) | fertig |
| ⬜ | Dialog-Skripte zum Rollenspiel (A/B-Rollen mit Audio) | |
| ⬜ | Podcast-/Video-Linksammlung mit Level-Empfehlung | Immersion |

## Daten, Export & Sync

| Status | Feature | Notizen |
|---|---|---|
| ✅ | Anki-Export (GUID, Re-Import-fest): Einheit/alles/Sätze/Themen-Pakete/Suchtreffer | |
| ✅ | CSV überall, Druckansicht | |
| ✅ | JSON-Backup Export/Import | |
| 🟡 | Geräte-Sync | v1: Backup-Datei; GitHub-Gist-Sync (Token nur lokal) geplant |
| ⬜ | „Konto“ light: Profilname + Sync-Ziel, ohne jegliche Keys im Repo | DB-frei via Gist/Datei |
| ⬜ | Später: freies Hosting mit DB (z. B. Supabase Free) als optionales Sync-Backend | Architektur offen halten |

## Plattform & Design

| Status | Feature | Notizen |
|---|---|---|
| ✅ | PWA offline, installierbar; SW-Update-Fixes (cache:reload, no-cache, Auto-Reload) | |
| ✅ | SVG-Icon-System statt Emoji-UI, Dark/Light sauber | |
| ✅ | Settings: Theme, Tagesziel, neue Karten, Richtung, Stimme, Tempo, Backup | |
| ✅ | Settings-Überarbeitung: Gruppierung, KI-Konfiguration zentral, Über-Sektion | |
| ⬜ | Onboarding-Tour (3 Screens beim ersten Start) | |
| ⬜ | Tastatur-Shortcuts Desktop (1–4 fürs Bewerten, Enter = aufdecken) | |

**Sicherheits-Grundsatz:** API-Keys/Tokens (KI, GitHub, …) werden ausschließlich in
localStorage gehalten, tauchen nie im Repo, in Exporten oder Backups auf.
