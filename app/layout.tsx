import type { Metadata, Viewport } from "next";
import { Abril_Fatface, Hanken_Grotesk, Metal_Mania } from "next/font/google";
import "./globals.css";

// Typographies relevées sur l'affiche : Metal Mania pour le lettrage HALLOWEEN,
// Abril Fatface pour les infos (« EYA CENTRE », « 31 oct »), Hanken Grotesk pour le texte courant.
const affiche = Abril_Fatface({ subsets: ["latin"], weight: "400", variable: "--font-affiche", display: "swap" });
const lettrage = Metal_Mania({ subsets: ["latin"], weight: "400", variable: "--font-lettrage", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-hanken", display: "swap" });

export const metadata: Metadata = {
  // URL de production Vercel : sert aux URL absolues (aperçu WhatsApp de l'affiche).
  metadataBase: new URL("https://halloween-bde.vercel.app"),
  title: "Halloween du BDE · 31 octobre à l'EYA Centre",
  description: "La soirée Halloween du BDE Epitech Bénin, samedi 31 octobre dès 19h à l'EYA Centre. 23 masques à réserver sur WhatsApp.",
  icons: { icon: "/assets/logo-bde.svg" },
  openGraph: {
    type: "website",
    title: "Halloween du BDE · 31 octobre",
    description: "Samedi 31 octobre dès 19h à l'EYA Centre. Choisis ton masque parmi 23 et réserve-le sur WhatsApp.",
    images: ["/assets/affiche.jpeg"],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#131212",
  colorScheme: "dark",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${affiche.variable} ${lettrage.variable} ${hanken.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
