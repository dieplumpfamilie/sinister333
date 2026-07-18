import FlappyGame from "@/components/FlappyGame";
import SiteNav from "@/components/SiteNav";
import Link from "next/link";

export default function FlappyPage() {
  return (
    <main className="shell">
      <header className="site-header">
        <span className="case-tag">AKTE Nº 333-B — FLUCHT PER LUFTWEG</span>
        <h1 className="site-title">
          FLAPPY <span>THEO</span>
        </h1>
        <p className="site-subtitle">
          Theo versucht, sich über die Sektor-Türme hinweg abzusetzen. Ein
          Klick, ein Flügelschlag — und hoffentlich keine Kollision.
        </p>
        <div className="stamp">GEHEIM</div>
        <SiteNav />
      </header>

      <section aria-label="Spiel">
        <FlappyGame />
      </section>

      <p className="section-note" style={{ marginTop: 24 }}>
        <Link href="/">← zurück zur Startseite</Link>
      </p>

      <footer className="site-footer">
        <span>AKTE Nº 333-B · SEKTOR UNBEKANNT</span>
        <span>SINISTER SCARING THEO © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
