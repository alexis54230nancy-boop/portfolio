"use client";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { type Project, projects, site } from "@/lib/content";
import { session } from "@/lib/store";
import { LockIcon } from "../Icons";
import { ChapterHead, Decode, Reveal, Segmented } from "../ui";
import { useSystem } from "../system/context";

type Filter = "tout" | "perso" | "ecole";
type Repo = { name: string; html_url: string; language: string | null; pushed_at: string; description: string | null; fork: boolean };

/** Carte "strate" : 3 couches empilées qui se séparent au survol + tilt 3D. */
function Strate({ p, index, dim, onOpen }: { p: Project; index: number; dim: boolean; onOpen: (p: Project) => void }) {
  const { reduced } = useSystem();
  const root = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const num = String(index + 1).padStart(2, "0");

  useEffect(() => {
    const el = root.current;
    const t = tilt.current;
    if (!el || !t || reduced || p.locked) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    const rx = gsap.quickTo(t, "rotationX", { duration: 0.4, ease: "power3.out" });
    const ry = gsap.quickTo(t, "rotationY", { duration: 0.4, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 12); // ±6°
      rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
    };
    const enter = () => {
      gsap.to(back.current, { z: -48, duration: 0.4, ease: "power3.out" });
      gsap.to(front.current, { z: 48, duration: 0.4, ease: "power3.out" });
    };
    const leave = () => {
      // Recomposition avec rebond (0,5 s)
      gsap.to(t, { rotationX: 0, rotationY: 0, duration: 0.5, ease: "back.out(2.2)" });
      gsap.to(back.current, { z: -20, duration: 0.5, ease: "back.out(2.6)" });
      gsap.to(front.current, { z: 20, duration: 0.5, ease: "back.out(2.6)" });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf([t, back.current, front.current]);
    };
  }, [reduced, p.locked]);

  const click = () => {
    if (p.locked) {
      audio.sfx("buzz");
      const el = root.current;
      if (el && !reduced) {
        el.classList.remove("fx-shake");
        void el.offsetWidth;
        el.classList.add("fx-shake");
      }
      return;
    }
    onOpen(p);
  };

  return (
    <article
      ref={root}
      className={`strate strate--${p.size} ${p.locked ? "strate--locked" : ""}`}
      style={{ opacity: dim ? 0.22 : 1, transition: "opacity .4s" }}
    >
      <button
        type="button"
        className="strate__hit"
        onClick={click}
        aria-haspopup={p.locked ? undefined : "dialog"}
        aria-label={p.locked ? `Strate ${num} : accès refusé` : `Ouvrir le dossier ${p.title}`}
      />
      <div ref={tilt} className="strate__tilt">
        <div ref={back} className="strate__layer strate__back" />
        <div className="strate__layer strate__mid" />
        <div ref={front} className="strate__layer strate__front">
          <div className="flex items-start justify-between gap-4">
            <span className="strate__num">STRATE_{num}</span>
            <span className="mono text-[11px] tracking-[0.14em] text-dim">{p.year}</span>
          </div>
          {p.locked ? (
            <div className="flex flex-col items-start gap-3 text-red">
              <LockIcon />
              <span className="mono text-xl font-bold glitch-perm">ACCÈS REFUSÉ</span>
              <span className="mono text-[12px] text-dim">{p.narrative}</span>
            </div>
          ) : (
            <div>
              <h3 className="strate__title">{p.title}</h3>
              <p className="mt-2 mono text-[11px] tracking-[0.12em] text-dim uppercase">{p.kind}</p>
              <p className={`sys mt-4 text-[13px] leading-relaxed max-w-[46ch] ${p.size === "sm" ? "hidden xl:block" : ""}`}>{p.narrative}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Technologies">
                {p.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Strates() {
  const [filter, setFilter] = useState<Filter>("tout");
  const [open, setOpen] = useState<Project | null>(null);
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [repoState, setRepoState] = useState<"loading" | "ok" | "error">("loading");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      audio.sfx("decode");
    }
  }, [open]);

  // Modules : dépôts publics, récupérés en direct depuis l'API GitHub.
  useEffect(() => {
    const cached = session.get("gh.repos");
    if (cached) {
      try {
        setRepos(JSON.parse(cached));
        setRepoState("ok");
        return;
      } catch {
        /* cache illisible : on recharge */
      }
    }
    const ctl = new AbortController();
    fetch(`https://api.github.com/users/${site.githubUser}/repos?sort=pushed&per_page=20`, {
      signal: ctl.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Repo[]) => {
        const list = data
          .filter((r) => !r.fork)
          .slice(0, 8)
          .map(({ name, html_url, language, pushed_at, description, fork }) => ({ name, html_url, language, pushed_at, description, fork }));
        setRepos(list);
        setRepoState("ok");
        session.set("gh.repos", JSON.stringify(list));
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setRepoState("error");
      });
    return () => ctl.abort();
  }, []);

  const matches = (p: Project) =>
    filter === "tout" || (filter === "ecole" ? p.kind.includes("Epitech") : !p.kind.includes("Epitech") && !p.locked);

  return (
    <>
      <ChapterHead
        num="02"
        title="STRATES"
        narrative={[
          "Chaque strate est une émotion que j'ai codée.",
          "Certaines tournent en production. D'autres cherchent encore leur forme.",
        ]}
      />

      <section className="wrap" aria-labelledby="strates-titre">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 id="strates-titre" className="label">
            <span className="text-green">&gt;</span> {projects.filter((p) => !p.locked).length} STRATES ACCESSIBLES — 1 VERROUILLÉE
          </h2>
          <Segmented
            label="Filtrer les projets"
            value={filter}
            onChange={setFilter}
            options={[
              { id: "tout", label: "TOUT" },
              { id: "perso", label: "PERSONNEL" },
              { id: "ecole", label: "EPITECH" },
            ]}
          />
        </div>
        <ul className="bento">
          {projects.map((p, i) => (
            <li key={p.id} className="min-h-[230px]">
              <Strate p={p} index={i} dim={!matches(p)} onOpen={setOpen} />
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap pt-[14vh]" aria-labelledby="modules-titre">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="modules-titre" className="title-2">
              <Decode text="MODULES" />
            </h2>
            <p className="sys mt-4 text-[14px]">Les dépôts publics, lus en direct sur GitHub. Cette liste se met à jour toute seule.</p>
            <a className="link-arrow mt-4" href={site.github} target="_blank" rel="noopener noreferrer">
              <span className="arr" aria-hidden="true">→</span> github.com/{site.githubUser}
            </a>
          </div>
          <Reveal>
            {repoState === "loading" && <p className="mono text-[13px] text-dim caret">&gt; LECTURE DES MODULES</p>}
            {repoState === "error" && (
              <p className="mono text-[13px] text-dim">
                &gt; SIGNAL GITHUB INDISPONIBLE.{" "}
                <a className="link" href={site.github} target="_blank" rel="noopener noreferrer">
                  Ouvrir le profil
                </a>
              </p>
            )}
            {repos && (
              <ul>
                {repos.map((r) => (
                  <li key={r.name}>
                    <a className="module" href={r.html_url} target="_blank" rel="noopener noreferrer">
                      <span>{r.name}</span>
                      <small>
                        {r.language ?? "—"} · {new Date(r.pushed_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                      </small>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        </div>
      </section>

      <dialog
        ref={dialog}
        className="dossier"
        aria-labelledby="dossier-titre"
        data-lenis-prevent
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        {open && (
          <div className="p-6 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="strate__num">
                  STRATE_{String(projects.indexOf(open) + 1).padStart(2, "0")} — {open.year}
                </p>
                <h2 id="dossier-titre" className="title-2 mt-3">
                  {open.title}
                </h2>
                <p className="mono mt-2 text-[11px] uppercase tracking-[0.14em] text-dim">{open.kind}</p>
              </div>
              <button type="button" className="sys-btn sys-btn--ghost !min-h-[44px] !px-4" onClick={() => dialog.current?.close()}>
                FERMER
              </button>
            </div>
            <p className="sys my-7 text-[15px]">{open.narrative}</p>
            <dl>
              <dt>CONTEXTE</dt>
              <dd>{open.context}</dd>
              <dt>OBJECTIF</dt>
              <dd>{open.objective}</dd>
              <dt>CE QUE J'Y AI APPRIS</dt>
              <dd>{open.learned}</dd>
              <dt>COMPÉTENCES</dt>
              <dd>
                <ul className="flex flex-wrap gap-1.5">
                  {open.skills.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>
              </dd>
              <dt>TECHNOLOGIES</dt>
              <dd>
                <ul className="flex flex-wrap gap-1.5">
                  {open.stack.map((s) => (
                    <li key={s} className="chip !text-green !border-[rgba(0,255,65,.25)]">
                      {s}
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
            <div className="flex flex-wrap gap-3">
              {open.links.map((l) => (
                <a key={l.href + l.label} className="sys-btn" href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label} <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              ))}
            </div>
            {open.note && <p className="mt-6 text-[12px] text-dim">{open.note}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
