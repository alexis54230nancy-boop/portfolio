"use client";
import { createContext, useContext } from "react";
import type { Chapter } from "@/lib/content";

export type Sys = {
  chapter: Chapter;
  /** Change de chapitre avec la transition narrative. */
  navigate: (href: string) => void;
  /** Retour au Seuil (boucle narrative). */
  reboot: () => void;
  reduced: boolean;
  mobile: boolean;
  /** true quand la 3D temps réel est active (bureau, WebGL disponible). */
  three: boolean;
  booting: boolean;
  glitch: () => void;
  toast: (lines: string[], ms?: number) => void;
  deepMode: () => void;
  phantom: () => void;
};

export const SysContext = createContext<Sys | null>(null);

export function useSystem(): Sys {
  const v = useContext(SysContext);
  if (!v) throw new Error("useSystem doit être utilisé dans <Shell>");
  return v;
}
