# Portfolio — Alexis Michaux

Mon portfolio : qui je suis, ce que j'ai construit, d'où je viens et comment me contacter.

Il est pensé comme un **système que le visiteur active** plutôt que comme un site classique : un écran de
démarrage, des chapitres, de la 3D temps réel et une bande-son générée par le navigateur.

- **En ligne** : https://portfolio-wine-rho-18.vercel.app
- **Stack** : Next.js (App Router, export statique) · TypeScript · Tailwind CSS · Three.js · GSAP · Lenis · Web Audio API
- **Front-end uniquement** : aucun serveur, aucune base de données.

## Les pages

| Chapitre | Adresse | Contenu |
|---|---|---|
| 01 Identité | `/` | Accroche, portrait, présentation, téléchargement du CV |
| 02 Strates | `/strates/` | Projets : contexte, objectif, compétences, technologies, liens |
| 03 Fréquences | `/frequences/` | Compétences reliées aux projets, passions, inspirations |
| 04 Chronique | `/chronique/` | Parcours : formation et expériences hors école |
| 05 Fichier_Perso | `/fichier/` | Le CV : trajectoire, stack, diplômes, langues, disponibilité |
| 06 Journal | `/journal/` | Ce que j'apprends, version après version |
| 07 Connexion | `/connexion/` | Coordonnées, réseaux et formulaire de contact |

Le dock en bas de l'écran est présent sur toutes les pages : il indique le chapitre courant et mène aux autres.

## Structure du dépôt

```
public/                 Fichiers servis tels quels
  cv.pdf                Mon CV
  img/                  Portrait (WebP)
  icon*.png, og.png     Icônes et image de partage
src/
  app/                  Une route par dossier (page.tsx) + layout, styles, sitemap, robots, manifest
    globals.css         Jetons de design (couleurs, polices) et tous les styles
  components/
    pages/              Le contenu de chaque page
    system/             La coque : seuil, boot, dock, transitions, curseur, pluie digitale
    ui.tsx              Briques réutilisables (liens, texte qui se décode, machine à écrire…)
    Icons.tsx           Icônes SVG
  lib/
    content.ts          ★ Tous les textes et toutes les données du site
    audio.ts            Moteur sonore (ambiances et micro-sons synthétisés)
    signals.ts          Pont entre les pages et les scènes 3D
    store.ts            Accès à localStorage / sessionStorage
    three/              Renderer unique + une scène 3D par chapitre
  fonts/                Polices auto-hébergées
```

## Mettre le site à jour

Presque tout se passe dans **`src/lib/content.ts`** : ajouter un projet, une expérience, une compétence ou une
entrée de journal revient à ajouter un objet dans la liste correspondante. La liste « Modules » de la page
Strates se met à jour toute seule : elle lit mes dépôts publics via l'API GitHub.

Pour remplacer le CV, il suffit d'écraser `public/cv.pdf`.

## Lancer le projet

```bash
npm install
```

```bash
npm run dev
```

Le site est alors disponible sur http://localhost:3000.

```bash
npm run build
```

Cette commande génère le site statique dans le dossier `out/`.

## Publication

La publication est **automatique** : le dépôt est relié à Vercel, chaque `git push` sur `main` reconstruit le
site et le met en ligne, et chaque autre branche reçoit une adresse de prévisualisation. Le fichier
`vercel.json` indique à Vercel qu'il s'agit d'un projet Next.js.

Le site étant un export statique, il peut aussi être servi par GitHub Pages : il faut alors définir
`NEXT_PUBLIC_BASE_PATH=/portfolio` au moment du build.

### Réglages facultatifs (variables d'environnement)

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_FORM_ENDPOINT` | Adresse d'envoi du formulaire (par exemple Formspree). Sans elle, le formulaire ouvre la messagerie du visiteur avec le message pré-rempli. |
| `NEXT_PUBLIC_BOOKING_URL` | Lien de prise de rendez-vous (Cal.com, Calendly). |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Active les statistiques Plausible, sans cookie. |
| `NEXT_PUBLIC_SITE_URL` | Adresse publique du site, utilisée pour le sitemap et les aperçus de partage. |

## Accessibilité et performance

- Navigation complète au clavier, lien d'évitement, focus visible, contrastes conformes AA.
- `prefers-reduced-motion` : animations, particules et glitchs sont désactivés.
- Le son ne démarre qu'après un geste du visiteur et peut être coupé à tout moment.
- Sur mobile, la 3D WebGL est remplacée par des équivalents CSS et SVG.
- Aucun fichier audio et aucune police tierce à télécharger : tout est généré ou auto-hébergé.

## Crédits

- **Polices** (licence SIL Open Font) : JetBrains Mono, Space Grotesk, Inter, Archivo.
- **Bibliothèques** (licence MIT) : Next.js, React, Three.js, Lenis, Tailwind CSS. GSAP : licence standard gratuite.
- **Sons** : synthétisés dans le navigateur, aucun échantillon.
- **Photo, textes et code** : Alexis Michaux.
- Pokémon est une marque de Nintendo, Creatures Inc. et GAME FREAK Inc. ; le projet cité est un projet de fan non commercial.
