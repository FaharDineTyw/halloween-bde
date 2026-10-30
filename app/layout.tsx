import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const zodiak = localFont({
  src: [
    { path: "./fonts/zodiak-100.woff2", weight: "100" },
    { path: "./fonts/zodiak-300.woff2", weight: "300" },
    { path: "./fonts/zodiak-400.woff2", weight: "400" },
  ],
  variable: "--font-zodiak",
  display: "swap",
});
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-hanken", display: "swap" });

export const metadata: Metadata = {
  // ponytail: à remplacer par l'URL Vercel définitive pour l'aperçu WhatsApp
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
  themeColor: "#000000",
  colorScheme: "dark",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${zodiak.variable} ${hanken.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
