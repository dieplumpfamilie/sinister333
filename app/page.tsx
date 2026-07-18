import AlienGame from "@/components/AlienGame";
import Shop from "@/components/Shop";

export default function Home() {
  return (
    <main className="shell">
      <header className="site-header">
        <span className="case-tag">AKTE Nº 333 — NICHT FREIGEGEBEN</span>
        <h1 className="site-title">
          SINISTER <span>SCARING</span> THEO
        </h1>
        <p className="site-subtitle">
          Sichtungsprotokoll: außerirdisches Subjekt „Theo“, zuletzt gesehen
          auf der Flucht durch Sektor 333.
        </p>
        <div className="stamp">GEHEIM</div>
      </header>

      <section aria-label="Spiel">
        <div className="section-head">
          <span className="section-number">I.</span>
          <h2 className="section-title">Live-Überwachung</h2>
        </div>
        <p className="section-note">
          Theo wurde auf dem Überwachungsmonitor lokalisiert. Steuere ihn zu
          den weißen Energy Drinks — und weg von den Verfolgerinnen.
        </p>
        <AlienGame />
      </section>

      <Shop />

      <footer className="site-footer">
        <span>AKTE Nº 333 · SEKTOR UNBEKANNT</span>
        <span>SINISTER SCARING THEO © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
