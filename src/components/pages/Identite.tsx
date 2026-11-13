"use client";
import { useEffect, useRef, useState } from "react";
import { identite, site } from "@/lib/content";
import { asset, eggs, local } from "@/lib/store";
import { Decode, Reveal, SysLink } from "../ui";
import { useSystem } from "../system/context";

/** PAGE 1 — IDENTITÉ : le nom, le portrait, deux commandes. */
export default function Identite() {
  const { booting, reduced, three, phantom } = useSystem();
  const [live, setLive] = useState(false);
  const [phantomCta, setPhantomCta] = useState(false);
  const name = useRef<HTMLHeadingElement>(null);
  const portrait = useRef<HTMLDivElement>(null);
  const mirror = useRef<HTMLDivElement>(null);

  // Le contenu ne se "décode" qu'une fois le boot terminé.
  useEffect(() => {
    if (booting) return;
    const t = window.setTimeout(() => setLive(true), 250);
    const h = name.current;
    if (h && !reduced) {
      h.classList.add("is-glitch");
      window.setTimeout(() => h.classList.remove("is-glitch"), 400);
    }
    // Phantom : une visite sur dix, une seule fois dans la vie du navigateur.
    const v = local.num("sys.visits");
    if (v > 0 && v % 10 === 0 && !eggs.seen("phantom") && eggs.budget() > 0) setPhantomCta(true);
    return () => clearTimeout(t);
  }, [booting, reduced]);

  // Parallaxe 3D du portrait + ondulation du reflet.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let frozen = false;
    const turb = document.getElementById("wave-turb");
    const m = mirror.current;
    const freeze = () => (frozen = true);
    const thaw = () => (frozen = false);
    m?.addEventListener("pointerenter", freeze);
    m?.addEventListener("pointerleave", thaw);
    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    let rx = 0;
    let ry = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const p = portrait.current;
      if (p) {
        const s = Math.min(1, window.scrollY / window.innerHeight);
        rx += (-my * 3 + s * 10 - rx) * 0.08;
        ry += (mx * 3 - ry) * 0.08;
        p.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(${(-s * 40).toFixed(1)}px)`;
      }
      if (turb && !frozen && window.scrollY < window.innerHeight) {
        const f = 0.09 + Math.sin(now / 1400) * 0.025;
        turb.setAttribute("baseFrequency", `0.006 ${f.toFixed(4)}`);
        turb.setAttribute("seed", String(2 + Math.floor(now / 160) % 40));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      m?.removeEventListener("pointerenter", freeze);
      m?.removeEventListener("pointerleave", thaw);
    };
  }, [reduced]);

  const runPhantom = () => {
    if (!eggs.claim("phantom")) return setPhantomCta(false);
    setPhantomCta(false);
    phantom();
  };

  return (
    <>
      <section className="hero" aria-labelledby="nom">
        {!three && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="css-torus" />
          </div>
        )}
        <div className="wrap relative grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="label mb-6">
              <span className="text-green">01</span> — IDENTITÉ
            </p>
            <h1 id="nom" ref={name} className="hero__name glitch">
              <span>{site.firstName}</span>
              <span className="is-green">{site.lastName}</span>
            </h1>
            <p className="mono mt-6 text-[13px] md:text-sm tracking-[0.12em] text-dim">
              <Decode text={identite.version} when={live} />
            </p>
            <div className="mt-8 max-w-[56ch]">
              <Decode as="p" mode="type" className="sys text-[15px] md:text-[17px] leading-relaxed" text={identite.narrative} when={live} delay={500} />
              <p className="mt-5 fact text-[15px]">{site.pitch}</p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <SysLink href="/strates/" className="sys-btn sys-btn--primary">
                EXPLORER_LES_STRATES
              </SysLink>
              <SysLink href="/connexion/" className="sys-btn">
                OUVRIR_LE_CANAL
              </SysLink>
              <a href={asset(site.cv)} download="CV-Alexis-Michaux.pdf" className="sys-btn sys-btn--ghost">
                <span className="arrow-down" aria-hidden="true">↓</span> TÉLÉCHARGER_LE_FICHIER.pdf
              </a>
              {phantomCta && (
                <button type="button" className="sys-btn" onClick={runPhantom}>
                  <span className="glitch-perm">&gt; REGARDER_LE_PHANTOM</span>
                </button>
              )}
            </div>
          </div>
          <div ref={portrait} className="portrait duotone justify-self-start md:justify-self-end md:mb-2">
            <img
              src={asset("/img/portrait.webp")}
              srcSet={`${asset("/img/portrait-sm.webp")} 360w, ${asset("/img/portrait.webp")} 720w`}
              sizes="280px"
              width={720}
              height={960}
              alt="Portrait d'Alexis Michaux, cheveux bouclés, chemise claire, souriant."
              fetchPriority="high"
              decoding="async"
            />
            <span className="portrait__tag" aria-hidden="true">HÔTE_BIOLOGIQUE.webp</span>
          </div>
        </div>

        {/* Miroir : le nom reflété, qui se fige au survol */}
        <div ref={mirror} className="mirror hidden md:block" aria-hidden="true">
          <div className="wrap">
            <div className="mirror__in">{site.lastName}</div>
          </div>
        </div>
        <div className="marquee" aria-hidden="true">
          <div className="marquee__in">
            {identite.marquee}
            {identite.marquee}
          </div>
        </div>
      </section>

      <section className="wrap py-[16vh]" aria-labelledby="manifeste">
        <h2 id="manifeste" className="label mb-8">
          <span className="text-green">&gt;</span> README.md
        </h2>
        <div className="grid gap-12 md:grid-cols-[1.25fr_1fr]">
          <div className="space-y-5">
            <Decode
              as="p"
              mode="type"
              className="title-2"
              text="Tu n'es pas un visiteur. Tu es un hôte."
            />
            <p className="max-w-[58ch] text-[#cfcfcf]">
              Ce que tu vas voir n'est pas tout à fait un portfolio. C'est un système qui essaie de comprendre
              pourquoi il existe : chaque chapitre est une couche de ce que j'ai construit, appris ou traversé.
            </p>
            <p className="max-w-[58ch] fact">
              Avant le code, il y a eu le commerce : un BTS en alternance et deux ans de terrain comme commercial
              itinérant. J'y ai appris à écouter un besoin avant de proposer une solution. Aujourd'hui, je me forme
              au développement et à la cybersécurité à Epitech Nancy, et je construis mes propres produits.
            </p>
            <p className="sys pt-2">« {site.mantra} »</p>
          </div>
          <Reveal as="ul" className="mono text-[13px] self-end">
            {[
              ["STATUT", "Recherche une alternance — janvier 2027"],
              ["FORMATION", "Pré-MSc → MSc Cybersécurité & Développement"],
              ["LOCALISATION", "Nancy · Luxembourg · Grand Est"],
              ["EN PRODUCTION", "PasseFrontière (SaaS)"],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between gap-6 border-b border-[#1a1a1a] py-3">
                <span className="text-dim tracking-[0.18em] text-[11px]">{k}</span>
                <span className="text-right">{v}</span>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      <nav className="wrap pb-[12vh]" aria-label="Chapitres suivants">
        <h2 className="label mb-6">
          <span className="text-green">&gt;</span> INDEX DU SYSTÈME
        </h2>
        <ul className="grid gap-x-10 md:grid-cols-2">
          {[
            ["/strates/", "02", "STRATES", "Ce que j'ai construit."],
            ["/frequences/", "03", "FRÉQUENCES", "Ce que je sais faire, et ce qui me fait vibrer."],
            ["/chronique/", "04", "CHRONIQUE", "D'où je viens."],
            ["/fichier/", "05", "FICHIER_PERSO", "Mon CV, décompilé."],
            ["/journal/", "06", "JOURNAL", "Ce que j'apprends, au fil des versions."],
            ["/connexion/", "07", "CONNEXION", "Le canal est ouvert."],
          ].map(([href, n, label, line]) => (
            <li key={href}>
              <SysLink href={href} className="module">
                <span>
                  <small className="mr-4">{n}</small>
                  {label}
                </span>
                <span className="arr text-green" aria-hidden="true">→</span>
                <small className="col-span-2 !tracking-normal !text-[13px] font-sans">{line}</small>
              </SysLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
