import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SnapAuto — Documents de cession auto",
  description:
    "Remplissez automatiquement les Cerfa de vente de véhicule d'occasion depuis une photo de la carte grise et de la carte d'identité.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="antialiased">
        <div className="min-h-screen pb-24 sm:pb-28">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
