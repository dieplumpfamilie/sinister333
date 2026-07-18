"use client";

import { useEffect, useState } from "react";

type ShopItem = {
  tag: string;
  name: string;
  image: string;
  description: string;
  price: string;
};

function text(el: Element, tagName: string): string {
  return el.querySelector(tagName)?.textContent?.trim() ?? "";
}

function parseShopXml(xml: string): ShopItem[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  const errorNode = doc.querySelector("parsererror");
  if (errorNode) return [];

  return Array.from(doc.querySelectorAll("shop > item")).map((el) => ({
    tag: text(el, "tag") || "ITEM",
    name: text(el, "name") || "Unbenannter Artikel",
    image: text(el, "image"),
    description: text(el, "description"),
    price: text(el, "price"),
  }));
}

export default function Shop() {
  const [items, setItems] = useState<ShopItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/shop.xml", { cache: "no-store" })
      .then((res) => res.text())
      .then((xml) => {
        if (!cancelled) setItems(parseShopXml(xml));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBuy = () => {
    // Absichtlich ohne Funktion — hier später Checkout-Logik einhängen.
  };

  return (
    <section className="shop-section" id="shop">
      <div className="section-head">
        <span className="section-number">II.</span>
        <h2 className="section-title">Feldausrüstung</h2>
      </div>
      <p className="section-note">
        Requirierte Gegenstände aus Theos Ausrüstung. Der Bestand wird über{" "}
        <code>public/shop.xml</code> gepflegt — neue Artikel, Bilder und
        Preise lassen sich dort ohne Code-Änderung eintragen.
      </p>

      {items === null && <p className="shop-empty">Bestand wird geladen …</p>}
      {items !== null && items.length === 0 && (
        <p className="shop-empty">
          Keine Artikel gefunden. Prüfe die Datei public/shop.xml.
        </p>
      )}

      {items !== null && items.length > 0 && (
        <div className="shop-grid">
          {items.map((item, i) => (
            <article className="item-card" data-tag={item.tag} key={i}>
              <div className="item-thumb">
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} loading="lazy" />
                )}
              </div>
              <h3 className="item-name">{item.name}</h3>
              <p className="item-desc">{item.description}</p>
              <div className="item-footer">
                {item.price && (
                  <span className="item-price">{item.price}</span>
                )}
                <button className="btn-buy" onClick={handleBuy}>
                  KAUFEN
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
