/**
 * Pont entre les pages (React) et les scènes 3D (Three.js).
 * Objet mutable, lu à chaque image par la scène active : aucune dépendance
 * à Three.js ici, pour que les pages puissent écrire dedans sans le charger.
 */
export const signals = {
  /** Progression du scroll de la page, 0 → 1. */
  scroll: 0,
  /** Souris normalisée, -1 → 1. */
  mouse: { x: 0, y: 0, px: 0, py: 0 },
  /** 0 → 1 : mode profond (vert → rouge). */
  deep: 0,
  /** true : animations figées (prefers-reduced-motion). */
  frozen: false,
  /** Facteur de qualité (1 = normal, 0.5 = particules réduites). */
  quality: 1,

  freq: {
    group: -1,
    disperse: 0,
    passionsIn: 0,
    passion: -1,
    onPassion: null as null | ((i: number) => void),
  },
  fragment: {
    /** Progression globale de l'histoire, 0 → 1. */
    t: 0,
    frame: 0,
    shatter: 0,
    split: 0,
    eye: 0,
    explode: 0,
    leave: 0,
    approach: 0,
    decay: 1,
    pulse: 0,
    glitch: 0,
    visible: 0,
  },
  chronique: { progress: 0 },
  portal: { open: 0, collapse: 0 },
};

export type Signals = typeof signals;
