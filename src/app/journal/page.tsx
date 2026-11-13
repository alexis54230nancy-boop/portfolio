import type { Metadata } from "next";
import Journal from "@/components/pages/Journal";

export const metadata: Metadata = {
  title: "Journal — ce que j'apprends",
  description:
    "Le journal d'apprentissage d'Alexis Michaux : la piscine Epitech, un premier portfolio en HTML et CSS, puis sa reconstruction avec Next.js et Three.js.",
  alternates: { canonical: "/journal/" },
};

export default function Page() {
  return <Journal />;
}
