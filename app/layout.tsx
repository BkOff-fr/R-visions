import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./icons";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Icam Revision Hub",
  description:
    "Plateforme de révision interactive pour les examens ICAM avec synchronisation PDF et quiz interactifs.",
  keywords: [
    "ICAM",
    "révisions",
    "quiz",
    "examen",
    "industrialisation",
    "étudiants",
    "apprentissage",
  ],
  authors: [{ name: "ICAM" }],
  openGraph: {
    title: "Icam Revision Hub",
    description:
      "Plateforme de révision interactive pour les examens ICAM avec synchronisation PDF",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Icam Revision Hub",
    description:
      "Plateforme de révision interactive pour les examens ICAM avec synchronisation PDF",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-white text-slate-800`}>
        {children}
      </body>
    </html>
  );
}

