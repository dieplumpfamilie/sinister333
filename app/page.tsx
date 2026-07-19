import SiteNav from "@/components/SiteNav";
import GamesGrid from "@/components/GamesGrid";
import MusicPlayer from "@/components/MusicPlayer";

export default function Home() {
  return (
    <main className="shell">
      <header className="site-header">
        <span className="case-tag">STAVENGER BESSER ALS MALLORCA</span>
        <h1 className="site-title">
          ALICE <span>AFD</span> PLUMP
        </h1>
        <p className="site-subtitle">
          LENNA503 WENN DU DAS LIEST HAST DU SERIÖSE PROBLEME MUCHACHO
        </p>
        <div className="stamp">NAGELNEUERBENZERARMEAUSDEMFENSTER</div>
        <SiteNav />
        <MusicPlayer />
      </header>

      <GamesGrid />

      <footer className="site-footer">
        <span>SEI SCHLAU WÄHL BLAU | LIEBER TOT ALS ROT</span>
        <span>S.T. 11 MAFIA © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
