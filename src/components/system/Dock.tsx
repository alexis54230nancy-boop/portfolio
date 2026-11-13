"use client";
import { useEffect, useState } from "react";
import { chapters } from "@/lib/content";
import { ChapterIcon, ChevronIcon, MenuIcon, PowerIcon } from "../Icons";
import { SysLink } from "../ui";
import { useSystem } from "./context";

/** Dock flottant (bureau) / dock réduit + menu plein écran (mobile). */
export default function Dock({ hidden }: { hidden: boolean }) {
  const { chapter, mobile, reboot } = useSystem();
  const [open, setOpen] = useState(false);
  const main = chapters.filter((c) => !c.secret);
  const eye = chapters.find((c) => c.secret)!;

  useEffect(() => setOpen(false), [chapter.id]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (mobile) {
    const idx = main.findIndex((c) => c.id === chapter.id);
    const i = idx === -1 ? 2 : idx; // le Fragment se situe entre Fréquences et Chronique
    const prev = idx === -1 ? main[2] : main[(i - 1 + main.length) % main.length];
    const next = idx === -1 ? main[3] : main[(i + 1) % main.length];
    return (
      <>
        {open && (
          <div className="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu des chapitres">
            <nav aria-label="Chapitres">
              {main.map((c) => (
                <SysLink key={c.id} href={c.href} aria-current={c.id === chapter.id ? "page" : undefined}>
                  <small>{c.num}</small>
                  {c.label}
                </SysLink>
              ))}
              <SysLink href={eye.href} aria-current={chapter.id === eye.id ? "page" : undefined} aria-label="Le Fragment">
                <small>?</small>
                <span style={{ opacity: 0.6 }}>…</span>
              </SysLink>
            </nav>
            <button
              type="button"
              className="link-arrow mt-8"
              onClick={() => {
                setOpen(false);
                reboot();
              }}
            >
              <span className="arr">↺</span> RÉINITIALISER
            </button>
          </div>
        )}
        <nav className={`dock dock--mobile ${hidden ? "is-hidden" : ""}`} aria-label="Navigation principale" style={{ zIndex: 79 }}>
          <SysLink className="dock__item" href={prev.href} aria-label={`Chapitre précédent : ${prev.label}`}>
            <ChevronIcon dir="left" />
          </SysLink>
          <span className="dock__now" aria-current="page">
            {chapter.secret ? "…" : `${chapter.num} — ${chapter.label}`}
          </span>
          <SysLink className="dock__item" href={next.href} aria-label={`Chapitre suivant : ${next.label}`}>
            <ChevronIcon dir="right" />
          </SysLink>
          <button
            type="button"
            className="dock__item"
            aria-expanded={open}
            aria-controls="menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <MenuIcon open={open} />
          </button>
        </nav>
      </>
    );
  }

  return (
    <nav className={`dock ${hidden ? "is-hidden" : ""}`} aria-label="Navigation principale">
      {main.map((c) => (
        <SysLink
          key={c.id}
          href={c.href}
          className="dock__item"
          aria-current={c.id === chapter.id ? "page" : undefined}
          aria-label={c.tip}
        >
          <ChapterIcon id={c.id} />
          <span className="dock__tip" aria-hidden="true">
            {c.num} {c.tip}
          </span>
        </SysLink>
      ))}
      <span className="dock__sep" aria-hidden="true" />
      <SysLink
        href={eye.href}
        className="dock__item dock__eye"
        aria-current={chapter.id === eye.id ? "page" : undefined}
        aria-label="Le Fragment"
      >
        <ChapterIcon id="fragment" />
        <span className="dock__tip" aria-hidden="true">
          …
        </span>
      </SysLink>
      <button type="button" className="dock__item" onClick={reboot} aria-label="Réinitialiser le système">
        <PowerIcon />
        <span className="dock__tip" aria-hidden="true">
          RÉINITIALISER
        </span>
      </button>
    </nav>
  );
}
