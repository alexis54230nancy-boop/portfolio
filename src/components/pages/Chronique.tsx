"use client";
import { useEffect, useRef, useState } from "react";
import { chronique, site } from "@/lib/content";
import { signals } from "@/lib/signals";
import { ChapterHead, Decode, SysLink } from "../ui";

/** PAGE 4 — CHRONIQUE : le parcours, un nœud après l'autre. */
export default function Chronique() {
  const list = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const nodes = Array.from(el.children).filter((c) => c.classList.contains("node")) as HTMLElement[];
    const onScroll = () => {
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const line = vh * 0.62; // la "tête de lecture"
      const thread = Math.min(1, Math.max(0, (line - r.top) / r.height));
      el.style.setProperty("--thread", thread.toFixed(4));
      let a = -1;
      let exact = 0;
      nodes.forEach((n, i) => {
        const b = n.getBoundingClientRect();
        const c = b.top + b.height / 2;
        if (c < line) a = i;
        if (i < nodes.length - 1) {
          const nb = nodes[i + 1].getBoundingClientRect();
          const cn = nb.top + nb.height / 2;
          if (c < line && cn >= line) exact = i + (line - c) / (cn - c);
        } else if (c < line) exact = i;
      });
      setActive(a);
      signals.chronique.progress = nodes.length > 1 ? Math.max(0, exact) / (nodes.length - 1) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      signals.chronique.progress = 0;
    };
  }, []);

  return (
    <>
      <ChapterHead
        num="04"
        title="CHRONIQUE"
        narrative={[
          "Un fichier journal ne ment pas. Il ne commente pas non plus.",
          "Voici le mien, restauré dans l'ordre où je l'ai vécu.",
        ]}
      >
        <p className="mt-6 fact max-w-[58ch] text-[15px]">
          Formation, expériences professionnelles, projets : tout ce qui s'est passé avant, pendant et en dehors de
          l'école.
        </p>
      </ChapterHead>

      <section className="wrap" aria-label="Parcours chronologique">
        <ol ref={list} className="timeline">
          <li className="timeline__rail" aria-hidden="true" />
          <li className="timeline__thread" aria-hidden="true" />
          {chronique.map((n, i) => (
            <li key={n.title} className={`node ${i <= active ? "is-active" : ""} ${n.empty ? "node--empty" : ""}`}>
              <span className="node__dot" aria-hidden="true" />
              <article className="node__card">
                <p className="mono text-[11px] tracking-[0.2em] text-dim">
                  <span className="text-green">{String(i + 1).padStart(2, "0")}</span> — {n.date}
                  <span className="ml-3 chip !text-[10px] uppercase">{n.tag}</span>
                </p>
                <h2 className="title-2 mt-3">{n.title}</h2>
                <Decode as="p" mode="type" className="sys mt-3 text-[15px] md:text-[17px]" text={n.narrative} />
                <p className="fact mt-3 text-[15px] max-w-[52ch]">{n.fact}</p>
                {n.empty && (
                  <SysLink href="/connexion/" className="sys-btn sys-btn--primary mt-6">
                    REMPLIR_CE_NŒUD
                  </SysLink>
                )}
              </article>
            </li>
          ))}
        </ol>

        <div className="py-[14vh] text-center mono text-[13px] tracking-[0.2em]">
          <p className="text-dim">&gt; FIN DU FICHIER</p>
          <p className="mt-3">
            <SysLink href="/fichier/" className="link">
              &gt; …ou pas.
            </SysLink>
          </p>
          <p className="sys mt-12 text-[15px] tracking-normal">« {site.mantra} »</p>
        </div>
      </section>
    </>
  );
}
