import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import "./globals.css";

const firaCode = Fira_Code({ variable: "--font-fira", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "AlgoViz · Watch algorithms think",
  description:
    "An interactive blueprint for algorithms — step, scrub, and replay sorting, graph, and tree algorithms frame by frame.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={firaCode.variable}>{children}</body>
    </html>
  );
}
