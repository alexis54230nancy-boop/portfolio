import type { Metadata } from "next";
import Chronique from "@/components/pages/Chronique";

export const metadata: Metadata = {
  title: "Chronique — parcours",
  description:
    "Le parcours d'Alexis Michaux : Bac pro Systèmes Numériques, BTS NDRC en alternance chez Poujoulat, Micromania-Zing, puis Epitech Nancy en Cybersécurité & Développement.",
  alternates: { canonical: "/chronique/" },
};

export default function Page() {
  return <Chronique />;
}
