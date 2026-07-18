"use client";

import { useEffect, useState } from "react";

type GameEntry = {
  tag: string;
  name: string;
  image: string;
  description: string;
  href: string;
  cta: string;
};

function text(el: Element, tagName: string): string {
  return el.querySelector(tagName)?.textContent?.trim() ?? "";
}

function parseGamesXml(xml: string): GameEntry[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  const errorNode = doc.querySelector("parsererror");
  if (errorNode) return [];

  return Array.from(doc.querySelectorAll("games > game")).map((el) => ({
    tag: text(el, "tag") || "SPIEL",
    name: text(el, "name") || "Unbenanntes Spiel",
    image: text(el, "image"),
    description: text(el, "description"),
    href: text(el, "href") || "#",
    cta: text(el, "cta") || "SPIELEN",
  }));
}

export default function GamesGrid() {
  const [games, setGames] = useState<GameEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/games.xml", { cache: "no-store" })
      .then((res) => res.text())
      .then((xml) => {
        if (!cancelled) setGames(parseGamesXml(xml));
      })
      .catch(() => {
        if (!cancelled) setGames([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="shop-section" id="spiele">
      <div className="section-head">
        <span className="section-number">I.</span>
        <h2 className="section-title">Sichtungsprotokolle</h2>
      </div>
      <p className="section-note">
        Alle bekannten Fluchtversuche von Theo, katalogisiert nach Akte. Der
        Bestand wird über <code>public/games.xml</code> gepflegt — neue
        Karten, Bilder und Links lassen sich dort ohne Code-Änderung
        eintragen.
      </p>

      {games === null && <p className="shop-empty">Akten werden geladen …</p>}
      {games !== null && games.length === 0 && (
        <p className="shop-empty">
          Keine Einträge gefunden. Prüfe die Datei public/games.xml.
        </p>
      )}

      {games !== null && games.length > 0 && (
        <div className="shop-grid">
          {games.map((game, i) => (
            <article className="item-card" data-tag={game.tag} key={i}>
              <div className="item-thumb">
                {game.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.image} alt={game.name} loading="lazy" />
                )}
              </div>
              <h3 className="item-name">{game.name}</h3>
              <p className="item-desc">{game.description}</p>
              <div className="item-footer">
                <a className="btn-buy" href={game.href}>
                  {game.cta}
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
