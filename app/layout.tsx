import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { Footer } from "@/components/footer";
import { IntroSplash } from "@/components/intro-splash";

export const metadata: Metadata = {
  title: "Mergence — M&A Screener & Deal Intelligence",
  description:
    "Screen acquisition targets and model M&A deals — completed, announced, and rumored — with accretion/dilution, synergies, and bull/bear analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <IntroSplash />
        <TopNav />
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
