import SiteNav from "@/components/SiteNav";
import GamesGrid from "@/components/GamesGrid";
import MusicPlayer from "@/components/MusicPlayer";

export default function Home() {
  return (
    <main className="shell">
      <header className="site-header">
        <span className="case-tag">AKTE Nº 333 — NICHT FREIGEGEBEN</span>
        <h1 className="site-title">
          SINISTER <span>SCARING</span> THEO
        </h1>
        <p className="site-subtitle">
          Sichtungsprotokoll: außerirdisches Subjekt „Theo“, mehrfach bei
          Fluchtversuchen durch Sektor 333 beobachtet.
        </p>
        <div className="stamp">GEHEIM</div>
        <SiteNav />
        <MusicPlayer />
      </header>

      <GamesGrid />

      <footer className="site-footer">
        <span>AKTE Nº 333 · SEKTOR UNBEKANNT</span>
        <span>SINISTER SCARING THEO © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
