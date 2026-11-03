import ShooterGame from "@/components/ShooterGame";
import SiteNav from "@/components/SiteNav";
import Link from "next/link";

export default function ShooterPage() {
  return (
    <main className="shell">
      <header className="site-header">
        <span className="case-tag">AKTE Nº 333-C — BEWAFFNETER WIDERSTAND</span>
        <h1 className="site-title">
          THEO <span>SHOOTER</span>
        </h1>
        <p className="site-subtitle">
          Theo sitzt in der Arena fest und die Verfolgerinnen kommen in
          Wellen. Zielen, schießen, Deckung hinter den Kisten suchen — und
          Heil-Items nicht vergessen.
        </p>
        <div className="stamp">GEHEIM</div>
        <SiteNav />
      </header>

      <section aria-label="Spiel">
        <ShooterGame />
      </section>

      <p className="section-note" style={{ marginTop: 24 }}>
        <Link href="/">← zurück zur Startseite</Link>
      </p>

      <footer className="site-footer">
        <span>AKTE Nº 333-C · SEKTOR UNBEKANNT</span>
        <span>SINISTER SCARING THEO © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
