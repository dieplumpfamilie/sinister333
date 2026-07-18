import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sinister Scaring Theo — Akte 333",
  description:
    "Sinister Scaring Theo: ein außerirdischer Fluchtversuch. Sammle Energy Drinks, entkomme den Verfolgerinnen, durchstöbere die geheime Feldausrüstung.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
