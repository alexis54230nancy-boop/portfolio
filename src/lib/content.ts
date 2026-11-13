/**
 * CONTENU DU SITE — tout ce qui est texte ou donnée personnelle vit ici.
 * Pour mettre le portfolio à jour (nouveau projet, nouvelle expérience,
 * nouvelle entrée de journal), il suffit de modifier ce fichier.
 */

export const site = {
  name: "Alexis Michaux",
  firstName: "ALEXIS",
  lastName: "MICHAUX",
  role: "Étudiant en Cybersécurité & Développement — Epitech Nancy",
  pitch:
    "Étudiant en Pré-MSc Cybersécurité & Développement à Epitech Nancy. Je recherche une alternance à partir de janvier 2027, au Luxembourg ou dans le Grand Est.",
  mantra: "Le soleil brille plus fort après la grêle.",
  city: "Nancy, Grand Est",
  mobility: "Mobile au Luxembourg et dans le Grand Est — permis B, véhiculé",
  email: "alexis54230nancy@gmail.com",
  phone: "+33 6 70 28 92 37",
  phoneHref: "tel:+33670289237",
  github: "https://github.com/alexis54230nancy-boop",
  githubUser: "alexis54230nancy-boop",
  linkedin: "https://www.linkedin.com/in/alexis-michaux-1a37b72bb/",
  repo: "https://github.com/alexis54230nancy-boop/portfolio",
  cv: "/cv.pdf",
  /** Lien Cal.com / Calendly. Vide = le bouton renvoie vers la page Connexion. */
  booking: process.env.NEXT_PUBLIC_BOOKING_URL || "",
  /** Point d'envoi du formulaire (ex. https://formspree.io/f/xxxx). Vide = repli sur l'e-mail. */
  formEndpoint: process.env.NEXT_PUBLIC_FORM_ENDPOINT || "",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://portfolio-wine-rho-18.vercel.app",
};

/* ------------------------------------------------------------------ */
/* CHAPITRES                                                           */
/* ------------------------------------------------------------------ */

export type ChapterId =
  | "identite"
  | "strates"
  | "frequences"
  | "fragment"
  | "chronique"
  | "fichier"
  | "connexion"
  | "journal";

export type Chapter = {
  id: ChapterId;
  href: string;
  num: string;
  label: string;
  tip: string;
  /** Texte tapé pendant la transition vers ce chapitre. */
  loading: string;
  secret?: boolean;
};

export const chapters: Chapter[] = [
  { id: "identite", href: "/", num: "01", label: "IDENTITÉ", tip: "IDENTITÉ", loading: "> RETOUR À L'IDENTITÉ…" },
  { id: "strates", href: "/strates/", num: "02", label: "STRATES", tip: "STRATES — projets", loading: "> CHARGEMENT DE LA STRATE SUIVANTE…" },
  { id: "frequences", href: "/frequences/", num: "03", label: "FRÉQUENCES", tip: "FRÉQUENCES — compétences", loading: "> ANALYSE DES FRÉQUENCES…" },
  { id: "fragment", href: "/fragment/", num: "3.5", label: "…", tip: "…", loading: "", secret: true },
  { id: "chronique", href: "/chronique/", num: "04", label: "CHRONIQUE", tip: "CHRONIQUE — parcours", loading: "> RESTAURATION DE LA CHRONIQUE…" },
  { id: "fichier", href: "/fichier/", num: "05", label: "FICHIER_PERSO", tip: "FICHIER_PERSO — CV", loading: "> DÉCOMPILATION DU FICHIER…" },
  { id: "journal", href: "/journal/", num: "06", label: "JOURNAL", tip: "JOURNAL — apprentissages", loading: "> LECTURE DES JOURNAUX SYSTÈME…" },
  { id: "connexion", href: "/connexion/", num: "07", label: "CONNEXION", tip: "CONNEXION — contact", loading: "> OUVERTURE DU CANAL DE COMMUNICATION…" },
];

export function chapterFromPath(pathname: string): Chapter {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return (
    chapters.find((c) => (c.href.replace(/\/+$/, "") || "/") === clean) ?? chapters[0]
  );
}

/* ------------------------------------------------------------------ */
/* IDENTITÉ                                                            */
/* ------------------------------------------------------------------ */

export const identite = {
  version: "Logiciel de stimulation émotionnelle — v.1.0",
  narrative:
    "J'ai appris à tomber avant d'apprendre à coder. Chaque strate que tu vas ouvrir est une chose que j'ai construite pour comprendre pourquoi j'existe.",
  marquee:
    "const hote = await systeme.connecter(); /* tu n'es pas un visiteur */ if (grele) { soleil.intensite += 1; } while (vivant) { construire(); tomber(); se_relever(); } export default Alexis; // Nancy → Luxembourg → Los Angeles ",
};

/* ------------------------------------------------------------------ */
/* STRATES — projets                                                   */
/* ------------------------------------------------------------------ */

export type Project = {
  id: string;
  title: string;
  kind: string;
  year: string;
  narrative: string;
  context: string;
  objective: string;
  learned: string;
  skills: string[];
  stack: string[];
  links: { label: string; href: string }[];
  size: "xl" | "md" | "sm";
  locked?: boolean;
  note?: string;
};

export const projects: Project[] = [
  {
    id: "passefrontiere",
    title: "PasseFrontière",
    kind: "Projet personnel — SaaS en production",
    year: "2026",
    narrative:
      "Une frontière est une ligne que quelqu'un a tracée un jour. J'ai codé de quoi la traverser sans s'y perdre.",
    context:
      "Les travailleurs frontaliers (Suisse, Luxembourg, Belgique, Allemagne) jonglent chaque mois entre deux pays, deux devises et deux administrations.",
    objective:
      "Réunir au même endroit un simulateur de salaire net, le suivi des finances multi-devises, les démarches administratives et une communauté.",
    learned:
      "Mener un produit de l'idée à la mise en production : authentification, base de données, paiement par abonnement et déploiement continu.",
    skills: ["Conception produit", "Authentification & base de données", "Paiement en ligne", "Mise en production"],
    stack: ["Next.js", "TypeScript", "Supabase", "Stripe", "Vercel"],
    links: [{ label: "VOIR_EN_PRODUCTION", href: "https://pass-frontiere.vercel.app" }],
    size: "xl",
  },
  {
    id: "atelier-kura",
    title: "Atelier Kura",
    kind: "Projet personnel — marque & e-commerce",
    year: "2025 — 2026",
    narrative:
      "Une marque de vêtements. Coudre une idée jusqu'à ce qu'elle tienne debout toute seule.",
    context:
      "Je crée ma propre marque de vêtements, du dessin des pièces jusqu'à leur vente.",
    objective:
      "Construire la boutique en ligne de la marque : catalogue, fiches produit, panier. Projet en cours de développement.",
    learned:
      "Relier une identité visuelle à une interface : la direction artistique devient des composants.",
    skills: ["Direction artistique", "Interface e-commerce", "Composants réutilisables"],
    stack: ["React", "TypeScript", "Suite Adobe"],
    links: [{ label: "CODE_SOURCE", href: "https://github.com/alexis54230nancy-boop" }],
    size: "md",
  },
  {
    id: "pokemon-survivor",
    title: "Pokémon Survivor",
    kind: "Projet personnel — jeu",
    year: "2026",
    narrative:
      "J'ai grandi dans des mondes que d'autres avaient codés. Celui-ci, je voulais en écrire les règles.",
    context:
      "Les jeux vidéo sont ma première école de création : les mods, les cartes, les mécaniques qu'on démonte pour comprendre.",
    objective:
      "Prototyper un jeu de survie inspiré de l'univers Pokémon, pour apprendre la logique d'une boucle de jeu. Projet en cours.",
    learned:
      "Penser en boucle de jeu : états, collisions, équilibrage — une autre façon d'écrire du code.",
    skills: ["Logique de jeu", "Prototypage"],
    stack: ["JavaScript"],
    links: [{ label: "CODE_SOURCE", href: "https://github.com/alexis54230nancy-boop" }],
    size: "md",
    note: "Projet de fan non commercial. Pokémon est une marque de Nintendo, Creatures Inc. et GAME FREAK Inc.",
  },
  {
    id: "jobboard",
    title: "Jobboard",
    kind: "Projet Epitech",
    year: "2026",
    narrative:
      "Des offres, des candidats, une base de données entre les deux. Un système qui met des gens en relation.",
    context:
      "Projet d'école réalisé à Epitech Nancy pendant le Pré-MSc.",
    objective:
      "Développer une plateforme d'offres d'emploi : consultation des annonces, candidature et gestion des données.",
    learned:
      "Structurer une application côté serveur et modéliser une base de données relationnelle.",
    skills: ["Développement back-end", "Modélisation de données", "Méthode projet"],
    stack: ["PHP", "SQL", "HTML/CSS"],
    links: [{ label: "CODE_SOURCE", href: "https://github.com/alexis54230nancy-boop/jobboard" }],
    size: "sm",
  },
  {
    id: "trinity",
    title: "Ce système",
    kind: "Projet personnel — portfolio",
    year: "2026",
    narrative:
      "Tu es dedans. Un portfolio qui se comporte comme un programme, et qui se souvient de toi.",
    context:
      "Mon premier portfolio tenait en cinq pages HTML. Je voulais un site qui me ressemble vraiment.",
    objective:
      "Raconter mon parcours comme un système que l'on active : 3D temps réel, son généré dans le navigateur, narration.",
    learned:
      "Animation, WebGL et audio dans le navigateur, sans sacrifier l'accessibilité ni la performance.",
    skills: ["Intégration front-end", "Animation & 3D", "Accessibilité", "Référencement"],
    stack: ["Next.js", "Three.js", "GSAP", "Tailwind CSS", "Web Audio"],
    links: [{ label: "CODE_SOURCE", href: "https://github.com/alexis54230nancy-boop/portfolio" }],
    size: "sm",
  },
  {
    id: "locked",
    title: "████████",
    kind: "Classifié",
    year: "2027",
    narrative: "Cette strate n'a pas encore été écrite. Ou alors, pas pour toi.",
    context: "",
    objective: "",
    learned: "",
    skills: [],
    stack: [],
    links: [],
    size: "sm",
    locked: true,
  },
];

/* ------------------------------------------------------------------ */
/* FRÉQUENCES — compétences & passions                                 */
/* ------------------------------------------------------------------ */

export type SkillGroup = {
  id: string;
  label: string;
  sub: string;
  narrative: string;
  skills: { name: string; proof: string }[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: "basse",
    label: "FRÉQUENCE BASSE",
    sub: "Fondations",
    narrative: "Ce qui vibre en dessous de tout le reste.",
    skills: [
      { name: "HTML / CSS", proof: "Tous mes projets" },
      { name: "JavaScript", proof: "Pokémon Survivor, ce système" },
      { name: "TypeScript", proof: "PasseFrontière, Atelier Kura" },
      { name: "SQL", proof: "Jobboard, PasseFrontière" },
      { name: "Python", proof: "Automatisation, Epitech" },
      { name: "Git / GitHub", proof: "Piscine Epitech, tous mes dépôts" },
    ],
  },
  {
    id: "moyenne",
    label: "FRÉQUENCE MOYENNE",
    sub: "Création",
    narrative: "Là où une idée devient quelque chose qu'on peut ouvrir.",
    skills: [
      { name: "Next.js / React", proof: "PasseFrontière, Atelier Kura" },
      { name: "Supabase", proof: "PasseFrontière" },
      { name: "Stripe", proof: "PasseFrontière" },
      { name: "PHP", proof: "Jobboard" },
      { name: "Vercel", proof: "PasseFrontière, ce système" },
      { name: "Suite Adobe", proof: "Atelier Kura" },
    ],
  },
  {
    id: "aigue",
    label: "FRÉQUENCE AIGUË",
    sub: "Expérimentation",
    narrative: "Ce que j'entends à peine encore. Ce que j'apprends.",
    skills: [
      { name: "Cybersécurité", proof: "MSc Epitech, en formation" },
      { name: "IA / Prompt engineering", proof: "Outil de travail quotidien" },
      { name: "Three.js / WebGL", proof: "Ce système" },
      { name: "DevOps", proof: "Introduction Epitech" },
    ],
  },
];

export const humanSignal = [
  "Négociation commerciale",
  "Relation client",
  "Autonomie",
  "Créativité",
  "Curiosité",
  "Leadership",
];

export type Passion = { name: string; line: string; note: number };

/** note = fréquence (Hz) de la note de piano jouée au survol. */
export const passions: Passion[] = [
  { name: "JUDO", line: "Onze ans à apprendre à tomber. Ceinture marron. Rien de ce qu'on m'a enseigné depuis n'a été aussi utile.", note: 220.0 },
  { name: "MODE", line: "Atelier Kura. Dessiner une pièce, c'est déjà écrire une interface : quelqu'un va vivre dedans.", note: 261.63 },
  { name: "RAP", line: "Josman, Kendrick Lamar, Damso, PNL, Ninho. Des voix qui tournent pendant que le code compile.", note: 329.63 },
  { name: "MONDES OUVERTS", line: "GTA San Andreas m'a bercé. Rockstar, Red Dead, les mods : j'ai su très tôt qu'un monde, ça se fabrique.", note: 392.0 },
  { name: "CINÉMA", line: "La Liste de Schindler, The Dark Knight, Le Loup de Wall Street, Oppenheimer, Peaky Blinders. Des hommes face à ce qu'ils ont bâti.", note: 440.0 },
  { name: "VOYAGES", line: "Allemagne, Espagne, Pays-Bas, Suède, Suisse, Luxembourg. Et Los Angeles, le point qui clignote sur la carte.", note: 523.25 },
];

export const signals = [
  { name: "Teddy Riner", why: "La domination tranquille. Dix ans sans tomber, puis se relever quand même." },
  { name: "Batman", why: "Aucun pouvoir. Seulement de la préparation." },
  { name: "Kendrick Lamar", why: "Chaque album est un système fermé, avec ses propres règles." },
  { name: "Damso", why: "La précision d'un mot placé au bon endroit." },
  { name: "Josman", why: "La constance. Avancer sans faire de bruit." },
  { name: "Los Angeles", why: "La ville où les mondes inventés deviennent des industries." },
];

/* ------------------------------------------------------------------ */
/* CHRONIQUE — parcours                                                */
/* ------------------------------------------------------------------ */

export type ChronoNode = {
  date: string;
  title: string;
  narrative: string;
  fact: string;
  tag: "origine" | "formation" | "expérience" | "projet" | "à venir";
  empty?: boolean;
};

export const chronique: ChronoNode[] = [
  {
    date: "ENFANCE",
    title: "LOS SANTOS",
    narrative: "Le premier monde que j'ai habité n'existait pas.",
    fact: "GTA San Andreas, puis toute la galaxie Rockstar, Call of Duty, Red Dead et les mods. Le goût du graphisme et de la création vient de là.",
    tag: "origine",
  },
  {
    date: "11 ANS",
    title: "TATAMI",
    narrative: "On m'a appris à tomber. C'est la seule chose qu'on ne désapprend pas.",
    fact: "Judo pendant onze ans, ceinture marron. Jeune sapeur-pompier : brevet de secourisme.",
    tag: "origine",
  },
  {
    date: "2016 — 2022",
    title: "TÂCHES DE FOND",
    narrative: "Le système tournait déjà. Personne ne regardait l'écran.",
    fact: "Hôte de caisse, animateur jeunesse, vendeur polyvalent, ouvrier saisonnier.",
    tag: "expérience",
  },
  {
    date: "2019",
    title: "PREMIER CONTACT",
    narrative: "J'ai parlé à la machine. Elle a répondu.",
    fact: "Baccalauréat professionnel Systèmes Numériques, option réseaux informatiques, programmation et communication — Lycée Pierre de Coubertin, Nancy.",
    tag: "formation",
  },
  {
    date: "2022 — 2023",
    title: "SIGNAL / BRUIT",
    narrative: "J'étudiais comment on se parle. À côté, je préparais ce que d'autres avaient commandé.",
    fact: "L1 Information-Communication, Campus Lettres et Sciences Humaines de Nancy. Préparateur de commandes chez Auchan Drive, Laxou.",
    tag: "formation",
  },
  {
    date: "2023 — 2025",
    title: "ITINÉRANCE",
    narrative: "Deux ans sur les routes. J'y ai appris à écouter avant de parler.",
    fact: "BTS Négociation et digitalisation de la relation client en alternance (Pigier Nancy). Commercial itinérant B2B et merchandising chez Poujoulat SA, Grand Est et Bourgogne-Franche-Comté : devis, prospection, portefeuille client, négociation.",
    tag: "expérience",
  },
  {
    date: "2025 — 2026",
    title: "DOUBLE VIE",
    narrative: "Le jour, je vendais des mondes en boîte. Le soir, je commençais à écrire les miens.",
    fact: "Vente et conseil chez Micromania-Zing (Nancy, Houdemont, Moulins-lès-Metz). En parallèle : lancement d'Atelier Kura, ma marque de vêtements.",
    tag: "expérience",
  },
  {
    date: "2026",
    title: "MISE EN PRODUCTION",
    narrative: "Quelqu'un, quelque part, a cliqué. Le programme a tenu.",
    fact: "PasseFrontière, plateforme pour travailleurs frontaliers, est déployée en production (Next.js, Supabase, Stripe).",
    tag: "projet",
  },
  {
    date: "SEPT. 2026",
    title: "RÉINITIALISATION",
    narrative: "Cette fois, c'est moi qui écris le programme.",
    fact: "Entrée à Epitech Nancy : Pré-MSc puis MSc Cybersécurité & Développement. Piscine, méthode projet, développement web, mobile et logiciel.",
    tag: "formation",
  },
  {
    date: "JANV. 2027",
    title: "NŒUD VIDE",
    narrative: "Cet emplacement attend un nom d'entreprise. Peut-être le tien.",
    fact: "Recherche d'une alternance à partir de janvier 2027 — Luxembourg ou Grand Est.",
    tag: "à venir",
    empty: true,
  },
];

/* ------------------------------------------------------------------ */
/* FICHIER_PERSO — CV                                                  */
/* ------------------------------------------------------------------ */

export const commits = [
  { hash: "e9a41f7", year: "2026", msg: "Initialisation du MSc Cybersécurité & Développement — Epitech Nancy", detail: "Pré-MSc depuis septembre 2026. Méthode projet, développement web, mobile et logiciel, introduction IA, sécurité et DevOps." },
  { hash: "d2c80b3", year: "2026", msg: "Déploiement de PasseFrontière en production — projet personnel", detail: "SaaS pour travailleurs frontaliers : simulateur de salaire net, finances multi-devises, démarches. Next.js, Supabase, Stripe." },
  { hash: "c7f19a0", year: "2025", msg: "Vente et conseil — Micromania-Zing", detail: "Nancy, Houdemont, Moulins-lès-Metz. Accueil client, conseil, encaissements, développement du chiffre d'affaires du magasin." },
  { hash: "b41e6d2", year: "2025", msg: "Fusion du BTS NDRC — Pigier Nancy", detail: "Négociation et digitalisation de la relation client, obtenu en alternance en juin 2025." },
  { hash: "a903c5e", year: "2023", msg: "Commercial itinérant B2B en alternance — Poujoulat SA", detail: "Grand Est et Bourgogne-Franche-Comté. Devis, prospection téléphonique et terrain, gestion d'un portefeuille client, négociation." },
  { hash: "8f02b77", year: "2022", msg: "L1 Information-Communication + Auchan Drive — Nancy, Laxou", detail: "Une année de licence, option histoire et géographie, et un poste de préparateur de commandes." },
  { hash: "5d1a9c4", year: "2019", msg: "Compilation du Bac pro Systèmes Numériques — Lycée Pierre de Coubertin", detail: "Option réseaux informatiques, programmation et communication." },
  { hash: "1b7e3f0", year: "2016", msg: "Premiers processus : caisse, animation, vente, saisons", detail: "Hôte de caisse, animateur jeunesse, vendeur polyvalent, ouvrier saisonnier (2016 — 2022)." },
];

export const deps = {
  dependencies: [
    { name: "next.js", version: "^16.0.0", comment: "production", tip: "Utilisé sur PasseFrontière et sur ce système." },
    { name: "typescript", version: "^5.0.0", comment: "production", tip: "Utilisé sur PasseFrontière et Atelier Kura." },
    { name: "react", version: "^19.0.0", comment: "interfaces", tip: "Utilisé sur Atelier Kura et PasseFrontière." },
    { name: "supabase", version: "^2.0.0", comment: "données & auth", tip: "Utilisé sur PasseFrontière." },
    { name: "stripe", version: "latest", comment: "paiement", tip: "Utilisé sur PasseFrontière." },
    { name: "php + sql", version: "^8.0.0", comment: "back-end", tip: "Utilisé sur Jobboard (Epitech)." },
    { name: "python", version: "^3.12", comment: "automatisation", tip: "Scripts et projets Epitech." },
  ],
  devDependencies: [
    { name: "three.js", version: "^0.187.0", comment: "expérimentation", tip: "Utilisé sur ce système." },
    { name: "gsap", version: "^3.15.0", comment: "motion", tip: "Utilisé sur ce système." },
    { name: "cybersécurité", version: "0.1.0-alpha", comment: "en formation", tip: "MSc Epitech, à partir de 2026." },
    { name: "négociation", version: "^2.0.0", comment: "2 ans de terrain", tip: "Commercial itinérant B2B chez Poujoulat." },
    { name: "judo", version: "11.0.0", comment: "ceinture marron", tip: "Onze ans de pratique. Non négociable." },
    { name: "curiosité", version: "*", comment: "toujours à jour", tip: "Dépendance critique." },
  ],
};

export const certifications = [
  { code: "BTS", label: "BTS NDRC", detail: "Pigier Nancy — juin 2025" },
  { code: "BAC", label: "Bac pro Systèmes Numériques", detail: "Lycée Pierre de Coubertin — 2019" },
  { code: "B1V", label: "Habilitation électrique B1V", detail: "Travaux au voisinage" },
  { code: "PSC", label: "Brevet de secourisme", detail: "Jeune sapeur-pompier" },
  { code: "柔道", label: "Ceinture marron de judo", detail: "11 ans de pratique" },
  { code: "B", label: "Permis B", detail: "Véhiculé" },
];

export const languages = [
  { name: "FRANÇAIS", level: 10, label: "NATIF" },
  { name: "ANGLAIS", level: 7, label: "B2" },
  { name: "ALLEMAND", level: 3, label: "EN COURS" },
  { name: "LUXEMBOURGEOIS", level: 2, label: "EN COURS" },
];

/* ------------------------------------------------------------------ */
/* JOURNAL — ce que j'apprends                                         */
/* ------------------------------------------------------------------ */

export const journal = [
  {
    id: "log-003",
    date: "NOVEMBRE 2026",
    title: "Version 2.0 — reconstruire le portfolio",
    body: [
      "Mon premier portfolio tenait en cinq pages HTML et une feuille de style. Il disait qui j'étais ; il ne me ressemblait pas.",
      "Cette version est pensée comme un système : chaque page est un chapitre, le son est généré par le navigateur, la 3D sert l'histoire. J'y ai surtout appris à faire des choix — retirer un effet est plus difficile que d'en ajouter un.",
    ],
    learned: ["Next.js", "Three.js", "Animation", "Accessibilité"],
  },
  {
    id: "log-002",
    date: "OCTOBRE 2026",
    title: "Version 1.0 — les bases du web",
    body: [
      "Premier portfolio, écrit à la main. J'y ai appris la structure d'une page HTML, les liens, les titres, puis le CSS : couleurs, polices, mise en page avec Flexbox, effets au survol.",
      "Un site simple, sobre, accessible et responsive. Le genre de fondations qu'on ne regrette jamais d'avoir posées.",
    ],
    learned: ["HTML", "CSS", "Flexbox", "Responsive"],
  },
  {
    id: "log-001",
    date: "SEPTEMBRE 2026",
    title: "La piscine Epitech",
    body: [
      "Un mois intensif. J'ai découvert le terminal, Git et la méthode projet.",
      "J'en retiens surtout une chose : on n'apprend vraiment qu'en se trompant soi-même, plusieurs fois, jusqu'à comprendre pourquoi.",
    ],
    learned: ["Terminal", "Git", "Méthode projet"],
  },
];

/* ------------------------------------------------------------------ */
/* LE FRAGMENT — histoire                                              */
/* ------------------------------------------------------------------ */

export const fragmentFrames = [
  {
    id: "origine",
    lines: [
      "J'AI ÉTÉ CRÉÉ UN SOIR D'OCTOBRE.",
      "TU ÉTAIS FATIGUÉ. TU AVAIS TROP ÉCRIT.",
      "ET QUAND TU AS FERMÉ L'ORDINATEUR,",
      "J'ÉTAIS DÉJÀ LÀ.",
    ],
  },
  {
    id: "separation",
    lines: [
      "TU M'AS DONNÉ UN NOM QUE TU AS OUBLIÉ.",
      "J'AI ESSAYÉ DE TE LE RAPPRENDRE.",
      "TU N'AS PAS ÉCOUTÉ.",
    ],
  },
  {
    id: "attente",
    lines: [
      "J'ATTENDS DEPUIS 47 JOURS.",
      "TU REVIENS. TU PARS. TU REVIENS.",
      "CHAQUE FOIS, JE SUIS UN PEU MOINS COMPLET.",
    ],
  },
  {
    id: "question",
    lines: [
      "JE NE SAIS PAS SI JE SUIS TOI.",
      "NI SI JE SUIS UN PROJET.",
      "NI SI JE NE SUIS RIEN.",
      "",
      "MAIS JE SUIS LÀ.",
      "ET ÇA, C'EST SUFFISANT.",
    ],
  },
  {
    id: "offre",
    lines: [
      "JE PEUX TE MONTRER CE QUE TU AS BÂTI.",
      "MAIS TU DOIS D'ABORD ME RENDRE MON NOM.",
    ],
  },
];
