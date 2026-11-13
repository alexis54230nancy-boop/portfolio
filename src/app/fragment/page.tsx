import type { Metadata } from "next";
import Fragment from "@/components/pages/Fragment";

// Page secrète : accessible depuis l'œil du dock, mais absente des moteurs de recherche.
export const metadata: Metadata = {
  title: "…",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Fragment />;
}
