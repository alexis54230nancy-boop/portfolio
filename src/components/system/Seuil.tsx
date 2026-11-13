"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { eggs, local, ordinal } from "@/lib/store";
import { Typewriter } from "../ui";
import { useSystem } from "./context";

const BOOT_LINES = [
  "INITIALISATION DU SYSTÈME…",
  "CHARGEMENT DES MODULES…",
  "ACCÈS AUTORISÉ.",
  "BIENVENUE, HÔTE.",
];

/**
 * PAGE -1 "LE SEUIL" puis PAGE 0 "BOOT".
 * Un point qui respire, deux lignes de texte, un clic pour entrer.
 * Aucun son avant le premier geste du visiteur.
 */
export default function Seuil({ onDone }: { onDone: () => void }) {
  const { reduced, deepMode } = useSystem();
  const [phase, setPhase] = useState<"seuil" | "burst" | "boot" | "leaving">("seuil");
  const [lines, setLines] = useState(0);
  const [idle, setIdle] = useState(false);
  const [egg, setEgg] = useState<string[] | null>(null);
  const [bootGlitch, setBootGlitch] = useState(false);
  const clicks = useRef(0);
  const clickTimer = useRef(0);
  const entered = useRef(false);
  const dot = useRef<HTMLButtonElement>(null);

  // Apparition des deux lignes, puis pulsation si le visiteur n'a rien fait.
  useEffect(() => {
    if (phase !== "seuil") return;
    if (reduced) {
      setLines(2);
      return;
    }
    const t = [
      window.setTimeout(() => setLines(1), 2000),
      window.setTimeout(() => setLines(2), 4000),
      window.setTimeout(() => setIdle(true), 8000),
      window.setTimeout(() => setIdle(false), 10600),
    ];
    return () => t.forEach(clearTimeout);
  }, [phase, reduced]);

  useEffect(() => {
    dot.current?.focus({ preventScroll: true });
  }, []);

  const enter = useCallback(() => {
    if (entered.current) return;
    entered.current = true;
    audio.unlock();
    audio.sfx("brouhaha");
    setPhase("burst");
    window.setTimeout(
      () => {
        setPhase("boot");
        audio.setMood("boot", 0.4);
      },
      reduced ? 50 : 900,
    );
  }, [reduced]);

  // Clics sur le point : 1-2 = entrer, 3 = message caché, 5 = mode profond.
  const onDot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entered.current) return;
    audio.unlock();
    if (e.detail === 0) {
      enter(); // clavier
      return;
    }
    clicks.current++;
    clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      const n = clicks.current;
      clicks.current = 0;
      if (n >= 5) {
        deepMode();
        window.setTimeout(enter, 1200);
      } else if (n >= 3 && eggs.claim("hosts", { once: false })) {
        const v = Math.max(1, local.num("sys.visits"));
        setEgg(
          v >= 100
            ? [`> TU ES LE ${v}e. LE SYSTÈME TE CONNAÎT.`]
            : [`TU ES LE ${ordinal(v)} HÔTE.`, `LES ${v - 1} AUTRES SONT PARTIS.`, "TOI, TU RESTES."],
        );
        audio.sfx("bip");
        window.setTimeout(enter, 2600);
      } else {
        enter();
      }
    }, 430);
  };

  const finishBoot = useCallback(() => {
    if (phase !== "boot") return;
    window.setTimeout(
      () => {
        setBootGlitch(true);
        audio.sfx("whoosh");
        window.setTimeout(
          () => {
            setPhase("leaving");
            window.setTimeout(onDone, 420);
          },
          reduced ? 0 : 300,
        );
      },
      reduced ? 500 : 650,
    );
  }, [phase, reduced, onDone]);

  if (phase === "boot" || phase === "leaving") {
    return (
      <div
        className={`boot ${phase === "leaving" ? "is-leaving" : ""} ${bootGlitch ? "is-glitch" : ""}`}
        role="status"
      >
        <Typewriter className="boot__box" lines={BOOT_LINES} speed={30} linePause={260} onDone={finishBoot} />
      </div>
    );
  }

  return (
    <div
      className={`seuil ${idle ? "is-idle" : ""} ${phase === "burst" ? "is-burst" : ""}`}
      onClick={enter}
    >
      <div className="seuil__center">
        <button ref={dot} type="button" className="seuil__dot" onClick={onDot} aria-label="Entrer dans le système">
          <i />
        </button>
        <div className="seuil__lines" aria-live="polite">
          <p className={lines >= 1 ? "is-in" : ""}>IL Y A QUELQUE CHOSE ICI.</p>
          <p className={lines >= 2 ? "is-in" : ""}>TOUCHE POUR ENTRER.</p>
        </div>
      </div>
      {egg && (
        <div className="seuil__egg" role="status">
          {egg.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      )}
    </div>
  );
}
