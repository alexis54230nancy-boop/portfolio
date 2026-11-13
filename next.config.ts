import type { NextConfig } from "next";

// Export 100 % statique : aucun serveur, aucun backend.
// NEXT_PUBLIC_BASE_PATH ne sert que si le site est publié dans un sous-dossier
// (GitHub Pages : "/portfolio"). Sur Vercel, on le laisse vide.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default config;
