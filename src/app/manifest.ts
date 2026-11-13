import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alexis Michaux — Portfolio",
    short_name: "A. Michaux",
    description: "Portfolio d'Alexis Michaux, étudiant en Cybersécurité & Développement à Epitech Nancy.",
    lang: "fr",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: `${base}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
