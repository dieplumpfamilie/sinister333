# Sinister Scaring Theo

Next.js-Website mit einem Pac-Man-artigen Browser-Spiel und einem Shop.

## Struktur

```
app/
  layout.tsx      Root-Layout, Metadaten
  page.tsx         Startseite (Spiel + Shop)
  globals.css      Gesamtes Styling / Design-Tokens
components/
  AlienGame.tsx    Das Spiel (Canvas, Steuerung, Spiellogik)
  Shop.tsx         Lädt & rendert public/shop.xml
public/
  shop.xml         ← HIER den Shop bearbeiten
  items/*.svg       Platzhalter-Bilder für die Artikel
```

## Starten

```bash
npm install
npm run dev
```

Danach [http://localhost:3000](http://localhost:3000) öffnen.

## Spiel

- Steuerung: Pfeiltasten oder WASD
- Theo (der Alien) sammelt weiße Energy Drinks ein
- Drei Verfolgerinnen jagen ihn durchs Labyrinth (einfache Wegfindung)
- 3 Leben, Punkte pro Energy Drink, Neustart per Knopf oder Tastendruck

Die Maze-Größe, Geschwindigkeit (`TICK_MS`) und Zellengröße (`CELL`) lassen
sich oben in `components/AlienGame.tsx` anpassen.

## Shop bearbeiten

Der komplette Shop-Inhalt kommt aus `public/shop.xml`. Kein Code nötig:

```xml
<item>
  <tag>DRINK</tag>
  <name>Weißer Energy Drink</name>
  <image>/items/energy-drink.svg</image>
  <description>Kurze Beschreibung des Artikels.</description>
  <price>5 Credits</price>
</item>
```

- Neuen Artikel hinzufügen: einen weiteren `<item>`-Block einfügen
- Artikel entfernen: den Block löschen
- Eigene Bilder: Datei nach `public/items/` legen und in `<image>` verlinken
  (z.B. `/items/mein-bild.png`)
- Der „Kaufen"-Button ist absichtlich funktionslos — die Logik dafür lässt
  sich in `components/Shop.tsx` in der Funktion `handleBuy` ergänzen.

## Design

Motiv: geheime „Akte 333" / Überwachungsprotokoll über einen außerirdischen
Ausreißer. Typografie: Stencil-Headline (Black Ops One), Schreibmaschine
(Special Elite) für Fließtext, Mono (Space Mono) für Zahlen/HUD. Der
Spielbereich ist als Überwachungsmonitor mit Scanlines gestaltet, der Shop
als Karteikarten-Ablage.
