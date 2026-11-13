import type { Metadata } from "next";
import Frequences from "@/components/pages/Frequences";

export const metadata: Metadata = {
  title: "Fréquences — compétences & passions",
  description:
    "Les compétences d'Alexis Michaux (Next.js, TypeScript, Supabase, PHP, SQL, cybersécurité en formation) et ses passions : judo, mode, rap, jeux vidéo, cinéma, voyages.",
  alternates: { canonical: "/frequences/" },
};

export default function Page() {
  return <Frequences />;
}
