import type { Metadata } from "next";
import Fichier from "@/components/pages/Fichier";

export const metadata: Metadata = {
  title: "Fichier_Perso — CV",
  description:
    "Le CV d'Alexis Michaux : formation, expériences, stack technique, certifications, langues et disponibilité. Téléchargement du CV en PDF.",
  alternates: { canonical: "/fichier/" },
};

export default function Page() {
  return <Fichier />;
}
