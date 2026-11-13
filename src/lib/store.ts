/** Accès sûr à localStorage / sessionStorage (navigation privée, SSR…). */
const mem = new Map<string, string>();

function area(kind: "local" | "session"): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function make(kind: "local" | "session") {
  return {
    get(key: string): string | null {
      try {
        return area(kind)?.getItem(key) ?? mem.get(kind + key) ?? null;
      } catch {
        return mem.get(kind + key) ?? null;
      }
    },
    set(key: string, value: string) {
      mem.set(kind + key, value);
      try {
        area(kind)?.setItem(key, value);
      } catch {
        /* stockage indisponible : on garde la valeur en mémoire */
      }
    },
    del(key: string) {
      mem.delete(kind + key);
      try {
        area(kind)?.removeItem(key);
      } catch {
        /* rien */
      }
    },
    num(key: string): number {
      const n = parseInt(this.get(key) ?? "0", 10);
      return Number.isFinite(n) ? n : 0;
    },
  };
}

export const local = make("local");
export const session = make("session");

/** Préfixe les fichiers de /public quand le site vit dans un sous-dossier. */
export function asset(path: string): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH || "") + path;
}

/* ---- Easter eggs : 3 au maximum par visite, chacun vu une seule fois ---- */

const EGG_MAX = 3;

export const eggs = {
  seen(id: string) {
    return local.get("egg." + id) === "1";
  },
  budget() {
    return EGG_MAX - session.num("egg.count");
  },
  /** Réserve un easter egg. Renvoie false s'il a déjà été vu ou si le quota est atteint. */
  claim(id: string, opts: { once?: boolean } = { once: true }) {
    if (opts.once !== false && this.seen(id)) return false;
    if (this.budget() <= 0) return false;
    session.set("egg.count", String(session.num("egg.count") + 1));
    if (opts.once !== false) local.set("egg." + id, "1");
    return true;
  },
};

export function ordinal(n: number) {
  return n === 1 ? "1er" : `${n}e`;
}
