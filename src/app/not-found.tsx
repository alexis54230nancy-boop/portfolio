import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "404 — strate introuvable", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="wrap min-h-[100svh] flex flex-col justify-center">
      <p className="label mb-5">
        <span className="text-green">404</span> — ERREUR SYSTÈME
      </p>
      <h1 className="title" data-text="INTROUVABLE" style={{ ["--len" as string]: 11 }}>
        INTROUVABLE
      </h1>
      <p className="sys mt-6">Cette strate n'existe pas. Ou elle n'existe plus.</p>
      <p className="mt-8">
        <Link href="/" className="sys-btn sys-btn--primary">
          RETOUR_À_L_IDENTITÉ
        </Link>
      </p>
    </section>
  );
}
