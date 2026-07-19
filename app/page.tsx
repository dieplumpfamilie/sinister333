import SiteNav from "@/components/SiteNav";
import GamesGrid from "@/components/GamesGrid";

export default function Home() {
  return (
    <main className="shell">
      <header className="site-header">
        <span className="case-tag">333IQ JOE GOLDBERG-MAXXING</span>
        <h1 className="site-title">
          BIG <span> BAD</span> JONNY
        </h1>
        <p className="site-subtitle">
          DIE LINKEN HABEN ANGST VOR DIESER WEBSITE DIGGA MAN DIGGA
        </p>
        <div className="stamp">NIGGA</div>
        <SiteNav />
      </header>

      <GamesGrid />

      <footer className="site-footer">
        <span>SEI SCHLAU WÄHL BLAU LIEBER TOT ALS ROT</span>
        <span>S.T. MAFIA © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
