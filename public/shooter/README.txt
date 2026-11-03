THEO SHOOTER – Assets
=====================

Alle Dateien in diesem Ordner kannst du einfach austauschen/bearbeiten.
Der Dateiname muss gleich bleiben – dann braucht es KEINE Code-Änderung.
(Die Zuordnung steht oben in components/ShooterGame.tsx im ASSETS-Objekt.)

TEXTUREN (SVG – editierbar in Inkscape, Figma, Illustrator oder Texteditor)
---------------------------------------------------------------------------
Wichtig: Figuren und Geschosse müssen nach RECHTS schauen. Das Spiel dreht
sie selbst Richtung Maus bzw. Richtung Spieler.

  player.svg       64x64   Spielfigur
  enemy.svg        64x64   Standard-Gegner (1 Treffer)
  enemy_tank.svg   64x64   Schwerer Gegner (5 Treffer)
  bullet.svg       24x8    Geschoss
  crate.svg        64x64   Kiste / Deckung
  medkit.svg       32x32   Heil-Item (+25 Leben)
  floor.svg        64x64   Boden-Kachel, wird nahtlos wiederholt

Du kannst auch PNGs verwenden: Datei anlegen und den Pfad im ASSETS-Objekt
in ShooterGame.tsx auf z. B. "/shooter/player.png" ändern.

Vorschaubild für die Startseite (4:3): public/games/shooter-thumb.svg

SOUNDS (WAV, mono, 44,1 kHz – editierbar in Audacity, GarageBand, Reaper, ...)
------------------------------------------------------------------------------
  shoot.wav        Schuss (sehr kurz halten, wird oft abgespielt)
  hit.wav          Gegner getroffen
  explosion.wav    Gegner stirbt
  hurt.wav         Spieler wird getroffen
  pickup.wav       Heil-Item eingesammelt
  gameover.wav     Game Over
  music.wav        Hintergrundmusik, läuft in einer Schleife (ca. 15 s)

Tipp: Bei music.wav auf einen nahtlosen Loop achten (Anfang = Ende).
Große Dateien (v. a. Musik) am besten als WAV lassen oder .mp3/.ogg nutzen
und den Pfad im ASSETS-Objekt anpassen.

BALANCING
---------
Geschwindigkeit, Leben, Schaden, Feuerrate usw. stehen als Konstanten am
Anfang von components/ShooterGame.tsx (Abschnitt "Balancing").
Kisten-Positionen: Liste CRATES in derselben Datei.
