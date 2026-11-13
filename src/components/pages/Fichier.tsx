"use client";
import { type MouseEvent as RMouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { certifications, commits, deps, languages, site } from "@/lib/content";
import { asset, eggs } from "@/lib/store";
import { FileIcon, GithubIcon, LinkedinIcon, MailIcon, PhoneIcon } from "../Icons";
import { Decode, Reveal, SysLink } from "../ui";
import { useSystem } from "../system/context";

type Pop = { x: number; y: number; id: string } | null;

/**
 * Module du fichier : se "décompile" à l'entrée dans l'écran.
 * Easter egg : clic droit → faux terminal → code source visible 2 s.
 */
function Module({
  id,
  n,
  name,
  children,
  onContext,
  source,
}: {
  id: string;
  n: string;
  name: string;
  children: ReactNode;
  onContext: (e: RMouseEvent, id: string) => void;
  source: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (source && ref.current) {
      setSrc(ref.current.querySelector(".mod__body")?.innerHTML.replace(/></g, ">\n<").slice(0, 2400) ?? "");
    }
  }, [source]);
  return (
    <Reveal className="mod">
      <section ref={ref} aria-labelledby={`${id}-t`} onContextMenu={(e) => onContext(e, id)}>
        <h2 id={`${id}-t`} className="mono text-[13px] tracking-[0.18em] mb-6">
          <span className="text-green">MODULE_{n}</span> <span className="text-dim">—</span>{" "}
          <Decode text={name} sound />
        </h2>
        <div className="mod__body">{children}</div>
        {source && (
          <pre className="mod__src" aria-hidden="true">
            {`// MODULE_${n}.src — décompilation en cours…\n\n${src}`}
          </pre>
        )}
      </section>
    </Reveal>
  );
}

export default function Fichier() {
  const { reduced, glitch } = useSystem();
  const [pop, setPop] = useState<Pop>(null);
  const [source, setSource] = useState<string | null>(null);
  const [openCommit, setOpenCommit] = useState<string | null>(null);

  // Clic droit sur un module : une seule fois, on propose de le "décompiler".
  const onContext = (e: RMouseEvent, id: string) => {
    if (reduced || pop || source) return;
    if (!eggs.claim("decompile")) return;
    e.preventDefault();
    audio.sfx("bip");
    setPop({ x: Math.min(e.clientX, window.innerWidth - 380), y: Math.min(e.clientY, window.innerHeight - 190), id });
  };
  const decompile = () => {
    if (!pop) return;
    const id = pop.id;
    setPop(null);
    audio.sfx("decode");
    setSource(id);
    window.setTimeout(() => {
      setSource(null);
      glitch();
    }, 2000);
  };
  useEffect(() => {
    if (!pop) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPop(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pop]);

  return (
    <>
      <header className="wrap pt-28 md:pt-36 pb-10">
        <p className="label mb-5">
          <span className="text-green">05</span> — CHAPITRE
        </p>
        <h1 className="title glitch">
          <Decode text="FICHIER_PERSO" speed={40} />
        </h1>
        <div className="mt-7 space-y-1 max-w-[60ch]">
          <Decode as="p" mode="type" className="sys text-[15px]" text="Ceci n'est pas un CV. C'est un fichier système." delay={300} />
          <Decode as="p" mode="type" className="sys text-[15px]" text="Fais défiler pour le décompiler, module après module." delay={800} />
        </div>
        <dl className="mono mt-10 grid max-w-[560px] grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[13px]">
          {[
            ["FICHIER", "ALEXIS_MICHAUX.exe"],
            ["TYPE", "HÔTE_BIOLOGIQUE"],
            ["VERSION", "2026.2"],
            ["TAILLE", "VARIABLE — dépend de qui regarde"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-dim tracking-[0.18em]">{k}:</dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div className="contents">
            <dt className="text-dim tracking-[0.18em]">STATUT:</dt>
            <dd className="text-green status-pulse">ACTIF</dd>
          </div>
        </dl>
      </header>

      <div className="wrap max-w-[980px]! space-y-6">
        <Module id="m1" n="01" name="IDENTITÉ" onContext={onContext} source={source === "m1"}>
          <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="duotone w-[132px] aspect-[3/4] overflow-hidden rounded-[3px] border border-[rgba(0,255,65,.3)]">
              <img src={asset("/img/portrait-sm.webp")} width={360} height={480} alt="Portrait d'Alexis Michaux." loading="lazy" decoding="async" />
            </div>
            <div>
              <p className="title-2">Alexis Michaux</p>
              <p className="fact mt-2">{site.role}</p>
              <p className="fact">{site.city} — {site.mobility}</p>
              <p className="sys mt-4 text-[14px]">Hôte biologique. Opérationnel depuis un soir d'octobre.</p>
            </div>
          </div>
        </Module>

        <Module id="m2" n="02" name="TRAJECTOIRE" onContext={onContext} source={source === "m2"}>
          <p className="mono text-[12px] text-dim mb-3">$ git log --oneline</p>
          <ol>
            {commits.map((c, i) => (
              <li key={c.hash}>
                <button
                  type="button"
                  className={`commit ${i === 0 ? "commit--head" : ""}`}
                  aria-expanded={openCommit === c.hash}
                  onClick={() => setOpenCommit((o) => (o === c.hash ? null : c.hash))}
                >
                  <span className="commit__hash">{c.hash}</span>
                  <span className="commit__year">[{c.year}]</span>
                  <span className="commit__msg">
                    {c.msg}
                    {i === 0 && <span className="text-dim"> (HEAD)</span>}
                  </span>
                  <span className="commit__detail">{c.detail}</span>
                </button>
              </li>
            ))}
          </ol>
        </Module>

        <Module id="m3" n="03" name="STACK" onContext={onContext} source={source === "m3"}>
          <div className="grid gap-8 md:grid-cols-2">
            {(["dependencies", "devDependencies"] as const).map((k) => (
              <div key={k}>
                <h3 className="mono text-[13px] font-normal text-[#cfcfcf]">{k}:</h3>
                <ul>
                  {deps[k].map((d) => (
                    <li key={d.name}>
                      <button type="button" className="dep">
                        <span>&quot;{d.name}&quot;</span>: <span className="dep__v">&quot;{d.version}&quot;</span>{" "}
                        <span className="dep__c">// {d.comment}</span>
                        <span className="dep__tip">→ {d.tip}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Module>

        <Module id="m4" n="04" name="CERTIFICATIONS & DIPLÔMES" onContext={onContext} source={source === "m4"}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {certifications.map((c) => (
              <li key={c.label} className="badge">
                <span className="badge__code" lang={c.code === "柔道" ? "ja" : undefined} aria-hidden="true">
                  {c.code}
                </span>
                <span>
                  <span className="block mono text-[11px] leading-tight text-[#e0e0e0]">{c.label}</span>
                  <span className="block text-[11px] leading-tight text-dim mt-1">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </Module>

        <Module id="m5" n="05" name="LANGUES" onContext={onContext} source={source === "m5"}>
          <ul className="space-y-3">
            {languages.map((l) => (
              <li key={l.name} className="mono grid grid-cols-[minmax(110px,170px)_auto_1fr] items-center gap-4 text-[13px]">
                <span>{l.name}</span>
                <span className="signal" role="img" aria-label={`Niveau ${l.level} sur 10`}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <i key={i} className={i < l.level ? "is-on" : ""} />
                  ))}
                </span>
                <span className="text-green">{l.label}</span>
              </li>
            ))}
          </ul>
        </Module>

        <Module id="m6" n="06" name="DISPONIBILITÉ" onContext={onContext} source={source === "m6"}>
          <p className="mono text-[15px] text-green status-pulse">&gt; STATUT: OUVERT AUX OPPORTUNITÉS</p>
          <p className="fact mt-3 max-w-[56ch]">
            Je recherche une entreprise d'accueil pour une alternance à partir de janvier 2027, au Luxembourg ou dans le
            Grand Est.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {site.booking ? (
              <a className="sys-btn sys-btn--primary" href={site.booking} target="_blank" rel="noopener noreferrer">
                PRENDRE_UN_RDV
              </a>
            ) : (
              <SysLink className="sys-btn sys-btn--primary" href="/connexion/">
                PRENDRE_UN_RDV
              </SysLink>
            )}
            <a className="sys-btn" href={asset(site.cv)} download="CV-Alexis-Michaux.pdf">
              <span className="arrow-down" aria-hidden="true">↓</span> TÉLÉCHARGER_LE_FICHIER.pdf
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-1">
            <li>
              <a className="link-arrow" href={`mailto:${site.email}`}>
                <MailIcon /> {site.email}
              </a>
            </li>
            <li>
              <a className="link-arrow" href={site.phoneHref}>
                <PhoneIcon /> {site.phone}
              </a>
            </li>
            <li>
              <a className="link-arrow" href={site.linkedin} target="_blank" rel="noopener noreferrer">
                <LinkedinIcon /> LinkedIn
              </a>
            </li>
            <li>
              <a className="link-arrow" href={site.github} target="_blank" rel="noopener noreferrer">
                <GithubIcon /> GitHub
              </a>
            </li>
            <li>
              <a className="link-arrow" href={asset(site.cv)} target="_blank" rel="noopener noreferrer">
                <FileIcon /> CV (PDF)
              </a>
            </li>
          </ul>
        </Module>
      </div>

      {pop && (
        <div className="popterm" style={{ left: Math.max(12, pop.x), top: Math.max(12, pop.y) }} role="alertdialog" aria-label="Décompilateur">
          <p>CLIC_DROIT_DÉTECTÉ.</p>
          <p>TU ESSAIES DE ME DÉCOMPILER ?</p>
          <p className="mt-2 flex gap-4">
            <button type="button" onClick={() => setPop(null)}>
              [ANNULER]
            </button>
            <button type="button" autoFocus onClick={decompile}>
              [CONTINUER]
            </button>
          </p>
        </div>
      )}
    </>
  );
}
