import AlienGame from "@/components/AlienGame";
import SiteNav from "@/components/SiteNav";
import Link from "next/link";

export default function PacmanPage() {
  return (
    <main className="shell">
      <header className="site-header">
        <span className="case-tag">AKTE Nº 333-A — LIVE-ÜBERWACHUNG</span>
        <h1 className="site-title">
          PAC-<span>THEO</span>
        </h1>
        <p className="site-subtitle">
          Theo wurde auf dem Überwachungsmonitor lokalisiert. Steuere ihn zu
          den weißen Energy Drinks — und weg von den Verfolgerinnen.
        </p>
        <div className="stamp">GEHEIM</div>
        <SiteNav />
      </header>

      <section aria-label="Spiel">
        <AlienGame />
      </section>

      <p className="section-note" style={{ marginTop: 24 }}>
        <Link href="/">← zurück zur Startseite</Link>
      </p>

      <footer className="site-footer">
        <span>AKTE Nº 333-A · SEKTOR UNBEKANNT</span>
        <span>SINISTER SCARING THEO © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
