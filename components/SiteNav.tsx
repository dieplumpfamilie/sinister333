import Link from "next/link";

export default function SiteNav() {
  return (
    <nav className="site-nav">
      <Link href="/">Startseite</Link>
      <Link href="/pacman">Pac-Theo</Link>
      <Link href="/flappy">Flappy Theo</Link>
    </nav>
  );
}
