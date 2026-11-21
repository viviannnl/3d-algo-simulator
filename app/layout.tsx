import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Algorithm Visualizer · Watch algorithms think",
  description:
    "A precision instrument for algorithms — step, scrub, and replay sorting, graph, and tree algorithms frame by frame.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // font variables live on <html> so the :root tokens that reference them resolve
    <html lang="en" className={`${inter.variable} ${plexMono.variable} ${instrument.variable}`}>
      {/* Extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body> before React
          hydrates. This silences only body's own attributes — children are still checked. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
