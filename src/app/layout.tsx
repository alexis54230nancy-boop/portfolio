import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import Shell from "@/components/system/Shell";
import { site } from "@/lib/content";
import "./globals.css";

// Polices auto-hébergées (licence SIL Open Font) : aucun appel à un serveur tiers.
const mono = localFont({
  src: [
    { path: "../fonts/jetbrains-mono-latin-wght-normal.woff2", style: "normal", weight: "100 800" },
    { path: "../fonts/jetbrains-mono-latin-wght-italic.woff2", style: "italic", weight: "100 800" },
  ],
  variable: "--font-jb",
  display: "swap",
});
const grotesk = localFont({
  src: "../fonts/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-grotesk",
  display: "swap",
});
// Archivo Expanded Black : instance statique réduite aux caractères latins (10 Ko).
const wide = localFont({
  src: "../fonts/archivo-expanded-black.woff2",
  weight: "900",
  variable: "--font-archivo",
  display: "swap",
});
const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const description =
  "Portfolio d'Alexis Michaux, étudiant en Cybersécurité & Développement à Epitech Nancy. Projets, parcours, compétences et contact — en recherche d'alternance pour janvier 2027.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Alexis Michaux — Développement & Cybersécurité | Portfolio",
    template: "%s — Alexis Michaux",
  },
  description,
  applicationName: "Alexis Michaux",
  authors: [{ name: "Alexis Michaux", url: site.linkedin }],
  creator: "Alexis Michaux",
  keywords: [
    "Alexis Michaux",
    "portfolio",
    "développeur web",
    "cybersécurité",
    "Epitech Nancy",
    "alternance",
    "Next.js",
    "Luxembourg",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Alexis Michaux",
    title: "Alexis Michaux — Développement & Cybersécurité",
    description,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Alexis Michaux — un point vert sur fond noir" }],
  },
  twitter: { card: "summary_large_image", title: "Alexis Michaux — Portfolio", description, images: ["/og.png"] },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Alexis Michaux",
  url: site.url,
  jobTitle: "Étudiant en Cybersécurité & Développement",
  affiliation: { "@type": "CollegeOrUniversity", name: "Epitech Nancy" },
  address: { "@type": "PostalAddress", addressLocality: "Nancy", addressCountry: "FR" },
  sameAs: [site.github, site.linkedin],
  knowsLanguage: ["fr", "en"],
};

const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`no-js ${mono.variable} ${grotesk.variable} ${inter.variable} ${wide.variable}`}>
      <body>
        <Shell>{children}</Shell>
        <noscript>
          <style>{`.seuil,.boot,.activate{display:none!important}`}</style>
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {plausible ? (
          <script defer data-domain={plausible} src="https://plausible.io/js/script.js" />
        ) : null}
      </body>
    </html>
  );
}
