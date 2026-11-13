import type { Metadata } from "next";
import Strates from "@/components/pages/Strates";

export const metadata: Metadata = {
  title: "Strates — projets",
  description:
    "Les projets d'Alexis Michaux : PasseFrontière (SaaS en production), Atelier Kura, Pokémon Survivor, Jobboard Epitech. Contexte, objectif, technologies et liens.",
  alternates: { canonical: "/strates/" },
};

export default function Page() {
  return <Strates />;
}
