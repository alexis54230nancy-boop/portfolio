import type { Metadata } from "next";
import Connexion from "@/components/pages/Connexion";

export const metadata: Metadata = {
  title: "Connexion — contact",
  description:
    "Contacter Alexis Michaux : formulaire, e-mail, téléphone, LinkedIn et GitHub. Disponible pour une alternance à partir de janvier 2027 (Luxembourg, Grand Est).",
  alternates: { canonical: "/connexion/" },
};

export default function Page() {
  return <Connexion />;
}
