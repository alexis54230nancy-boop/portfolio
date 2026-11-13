"use client";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { site } from "@/lib/content";
import { signals } from "@/lib/signals";
import { asset, eggs } from "@/lib/store";
import { FileIcon, GithubIcon, LinkedinIcon, MailIcon, PhoneIcon } from "../Icons";
import { Decode } from "../ui";
import { useSystem } from "../system/context";

type State = "idle" | "sending" | "sent" | "error";

/** PAGE 7 — CONNEXION : un terminal, un portail, un message. */
export default function Connexion() {
  const { three, reboot, reduced } = useSystem();
  const [state, setState] = useState<State>("idle");
  const [focus, setFocus] = useState(false);
  const [rec, setRec] = useState<null | { t: number; done: boolean }>(null);
  const [bye, setBye] = useState("");
  const [viaMail, setViaMail] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLDivElement>(null);

  useEffect(() => {
    signals.portal.open = focus ? 1 : 0;
  }, [focus]);
  useEffect(
    () => () => {
      signals.portal.open = 0;
      signals.portal.collapse = 0;
    },
    [],
  );

  const collapse = () => {
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 600);
      signals.portal.collapse = k;
      if (k < 1) requestAnimationFrame(step);
    };
    if (reduced) signals.portal.collapse = 1;
    else step();
  };

  // "À BIENT" … le signal se coupe, puis se rétablit : "À BIENTÔT."
  const sayBye = () => {
    const a = "HÔTE, À BIENT";
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setBye(a.slice(0, i));
      if (i >= a.length) {
        clearInterval(id);
        audio.sfx("cut");
        window.setTimeout(() => setBye("HÔTE, À BIENTÔT."), 900);
      }
    }, 45);
  };

  const afterSent = () => {
    setState("sent");
    collapse();
    audio.sfx("whoosh");
    window.setTimeout(() => status.current?.focus(), 50);
    // Easter egg "Screen Recorder"
    if (!reduced && eggs.claim("recorder")) {
      window.setTimeout(() => {
        audio.sfx("rec");
        setRec({ t: 1, done: false });
        let t = 1;
        const id = window.setInterval(() => {
          t++;
          if (t > 3) {
            clearInterval(id);
            setRec({ t: 3, done: true });
            window.setTimeout(() => {
              setRec(null);
              sayBye();
            }, 1500);
          } else setRec({ t, done: false });
        }, 1000);
      }, 900);
    } else {
      window.setTimeout(sayBye, 700);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    const data = new FormData(form.current!);
    if (data.get("_gotcha")) return; // pot de miel anti-robots
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    setState("sending");
    if (site.formEndpoint) {
      try {
        const r = await fetch(site.formEndpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data,
        });
        if (!r.ok) throw new Error(String(r.status));
        afterSent();
      } catch {
        setState("error");
        audio.sfx("buzz");
      }
    } else {
      // Sans service d'envoi configuré : on ouvre la messagerie du visiteur, message pré-rempli.
      const subject = encodeURIComponent(`Portfolio — message de ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
      setViaMail(true);
      afterSent();
    }
  };

  const sent = state === "sent";

  return (
    <div className="min-h-[100svh] flex flex-col justify-center pt-20">
      <div className="wrap max-w-[560px]! relative">
        {!three && <div className={`portal-css ${focus ? "is-open" : ""} ${sent ? "is-collapsed" : ""}`} aria-hidden="true" />}
        <header className="mb-7">
          <p className="label mb-4">
            <span className="text-green">07</span> — CHAPITRE
          </p>
          <h1 className="title !text-[clamp(30px,5vw,56px)] glitch" data-text="CONNEXION">
            <Decode text="CONNEXION" speed={45} />
          </h1>
          <div className="mt-5 space-y-1">
            <Decode as="p" mode="type" className="sys text-[15px]" text="Le canal est ouvert. Je t'écoute." delay={300} />
            <Decode as="p" mode="type" className="sys text-[15px]" text="Ce que tu écris ici arrive jusqu'à moi." delay={800} />
          </div>
          <p className="fact mt-4 text-[15px]">
            Une alternance à proposer à partir de janvier 2027, une question, un projet : je réponds vite.
          </p>
        </header>

        {!sent ? (
          <form
            ref={form}
            onSubmit={submit}
            onFocus={() => setFocus(true)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocus(false)}
            aria-labelledby="form-t"
            className="space-y-5"
          >
            <h2 id="form-t" className="mono text-[13px] tracking-[0.18em] text-green">
              ENVOYER_UN_MESSAGE:
            </h2>
            <label className="field">
              <span className="field__label">NOM</span>
              <input className="field__input" name="name" type="text" autoComplete="name" required maxLength={80} />
            </label>
            <label className="field">
              <span className="field__label">E-MAIL</span>
              <input className="field__input" name="email" type="email" autoComplete="email" required maxLength={120} />
            </label>
            <label className="field">
              <span className="field__label">MESSAGE</span>
              <textarea className="field__input" name="message" required rows={3} maxLength={4000} />
            </label>
            <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" className="sys-btn sys-btn--primary" disabled={state === "sending"}>
                {state === "sending" ? "TRANSMISSION…" : "TRANSMETTRE"}
              </button>
              {!site.formEndpoint && (
                <span className="mono text-[11px] text-dim">Ouvre ta messagerie avec le message pré-rempli.</span>
              )}
            </div>
            {state === "error" && (
              <p role="alert" className="mono text-[13px] text-red">
                &gt; ÉCHEC DE LA TRANSMISSION. Réessaie, ou écris-moi directement :{" "}
                <a className="link" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </p>
            )}
          </form>
        ) : (
          <div ref={status} tabIndex={-1} role="status" aria-live="polite" className="mono text-[14px] tracking-[0.14em] leading-loose text-green min-h-[240px] outline-none">
            <p>{viaMail ? "> MESSAGE PRÊT DANS TA MESSAGERIE. IL NE RESTE QU'À L'ENVOYER." : "> MESSAGE TRANSMIS."}</p>
            {rec && (
              <>
                <p className="rec mt-4">
                  <i aria-hidden="true" /> REC 00:0{rec.t}
                </p>
                <p className="text-dim">{rec.done ? "> ENREGISTREMENT TERMINÉ." : "> ENREGISTREMENT DU DIALOGUE…"}</p>
              </>
            )}
            {bye && <p className="mt-4">&gt; MERCI. {bye}</p>}
          </div>
        )}

        <nav className="mt-12 border-t border-[#1a1a1a] pt-6" aria-label="Coordonnées et réseaux">
          <ul className="grid gap-x-8 sm:grid-cols-2">
            <li>
              <a className="link-arrow" href={`mailto:${site.email}`}>
                <MailIcon /> {site.email} <span className="arr" aria-hidden="true">→</span>
              </a>
            </li>
            <li>
              <a className="link-arrow" href={site.phoneHref}>
                <PhoneIcon /> {site.phone} <span className="arr" aria-hidden="true">→</span>
              </a>
            </li>
            <li>
              <a className="link-arrow" href={site.linkedin} target="_blank" rel="noopener noreferrer">
                <LinkedinIcon /> LINKEDIN <span className="arr" aria-hidden="true">→</span>
              </a>
            </li>
            <li>
              <a className="link-arrow" href={site.github} target="_blank" rel="noopener noreferrer">
                <GithubIcon /> GITHUB <span className="arr" aria-hidden="true">→</span>
              </a>
            </li>
            <li>
              <a className="link-arrow" href={asset(site.cv)} download="CV-Alexis-Michaux.pdf">
                <FileIcon /> TÉLÉCHARGER_LE_FICHIER.pdf <span className="arr" aria-hidden="true">→</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
          <button type="button" className="mono text-[13px] tracking-[0.2em] text-[#e0e0e0] min-h-[44px]" onClick={reboot}>
            <span className="glitch-perm inline-block">&gt; DÉCONNEXION</span>
          </button>
          <p className="text-[11px] text-dim max-w-[38ch] text-right">
            © 2026 Alexis Michaux. Polices JetBrains Mono, Space Grotesk et Inter (licence SIL OFL). Sons générés dans le
            navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
