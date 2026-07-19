# Sinister Scaring Theo

Next.js-Website mit zwei Browser-Spielen und einer Startseite, die beide als
Karten verlinkt.

## Struktur

```
app/
  layout.tsx        Root-Layout, Metadaten
  page.tsx           Startseite (Kartenraster der Spiele)
  pacman/page.tsx     Seite für "Pac-Theo"
  flappy/page.tsx     Seite für "Flappy Theo"
  globals.css         Gesamtes Styling / Design-Tokens
components/
  SiteNav.tsx         Navigation (auf allen Seiten)
  GamesGrid.tsx        Kartenraster, liest public/games.xml
  AlienGame.tsx         Pac-Man-artiges Spiel (Canvas)
  FlappyGame.tsx         Flappy-Bird-artiges Spiel (Canvas)
public/
  games.xml            ← Karten auf der Startseite bearbeiten
  games/*.svg            Vorschaubilder der Karten
  flappy/                ← Grafiken & Sounds von Flappy Theo bearbeiten
```

## Starten

```bash
npm install
npm run dev
```

Danach [http://localhost:3000](http://localhost:3000) öffnen.

## Startseite bearbeiten

Die Kartenübersicht kommt komplett aus `public/games.xml`:

```xml
<game>
  <tag>AKTE 333</tag>
  <name>Pac-Theo</name>
  <image>/games/pacman-thumb.svg</image>
  <description>Kurzbeschreibung.</description>
  <href>/pacman</href>
  <cta>SPIELEN</cta>
</game>
```

Neue Karte = neuer `<game>`-Block (z. B. für ein drittes Spiel), Karte
entfernen = Block löschen, eigenes Bild = Datei in `public/games/` ablegen
und in `<image>` verlinken. Der Shop wurde entfernt.

## Musik auf der Startseite

Oben auf der Startseite gibt es einen kleinen Player mit Play/Pause-Knopf
und Lautstärkeregler (`components/MusicPlayer.tsx`).

- Titel ändern: Datei unter `public/music/theme.wav` durch eine eigene
  ersetzen (gleicher Dateiname), oder in `MUSIC_PLAYER`-Konstante
  `TRACK_SRC` in `components/MusicPlayer.tsx` einen anderen Pfad eintragen
- Standardlautstärke ändern: Konstante `DEFAULT_VOLUME` in derselben Datei
  (Wert zwischen 0 und 1)
- Die Musik startet nicht automatisch (Browser blockieren Autoplay mit
  Ton) — Besucher starten sie über den Play-Knopf selbst

## Pac-Theo (`/pacman`)

- Steuerung: Pfeiltasten oder WASD
- Sammelt weiße Energy Drinks, wird von drei Verfolgerinnen gejagt
  (einfache Wegfindung)
- 3 Leben, Punktestand, Neustart per Knopf oder Tastendruck
- Bugfix: drei Energy Drinks waren zuvor komplett von Wänden eingeschlossen
  und unerreichbar. Die betroffene Wand-Reihe im Labyrinth (in
  `components/AlienGame.tsx`) wurde geschlossen, sodass jetzt alle Drinks
  erreichbar sind.

## Flappy Theo (`/flappy`)

Alle Grafiken und Sounds liegen unter `public/flappy/` und lassen sich ohne
Code-Änderung ersetzen — einfach eine Datei mit demselben Namen hochladen:

| Datei             | Bedeutung                            |
|-------------------|----------------------------------------|
| `background.svg`  | Hintergrund                             |
| `tower.svg`       | Turm/Hindernis (oben gespiegelt)        |
| `character.svg`   | Spielfigur                              |
| `jump.wav`        | Sound beim Flügelschlag                 |
| `hit.wav`         | Sound bei Kollision                     |
| `music.wav`       | Hintergrundmusik (läuft in Schleife)    |

Steuerung: Leertaste, Pfeiltaste hoch oder Klick auf den Bildschirm. Ein
Ton-Knopf im HUD schaltet Musik und Effekte stumm.

Das Spielfenster ist bewusst schmaler begrenzt (`.monitor--compact` in
`app/globals.css`), damit es auf einem normalen PC-Monitor komplett
sichtbar ist, statt über die volle Seitenbreite gestreckt zu werden. Breite
lässt sich dort über `max-width` anpassen.

## Design

Motiv: geheime „Akte 333" / Überwachungsprotokoll über einen außerirdischen
Ausreißer. Typografie: Stencil-Headline (Black Ops One), Schreibmaschine
(Special Elite) für Fließtext, Mono (Space Mono) für Zahlen/HUD. Spielseiten
sind als Überwachungsmonitor mit Scanlines gestaltet, die Startseite als
Karteikarten-Übersicht.
