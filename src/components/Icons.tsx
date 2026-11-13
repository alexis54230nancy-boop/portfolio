import type { ChapterId } from "@/lib/content";

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function ChapterIcon({ id }: { id: ChapterId }) {
  switch (id) {
    case "identite":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "strates":
      return (
        <svg {...base}>
          <path d="M12 3.5 21 8l-9 4.5L3 8z" />
          <path d="m3 12 9 4.5 9-4.5" />
          <path d="m3 16 9 4.5 9-4.5" />
        </svg>
      );
    case "frequences":
      return (
        <svg {...base}>
          <path d="M3 12h2M7 7v10M11 3.5v17M15 8v8M19 10.5v3" />
        </svg>
      );
    case "fragment":
      return (
        <svg {...base}>
          <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
      );
    case "chronique":
      return (
        <svg {...base}>
          <path d="M12 2.5v19" />
          <circle cx="12" cy="6.5" r="2" fill="#000" />
          <circle cx="12" cy="12.5" r="2" fill="currentColor" />
          <circle cx="12" cy="18.5" r="2" fill="#000" />
        </svg>
      );
    case "fichier":
      return (
        <svg {...base}>
          <path d="M6 2.5h8l4.5 4.5v14.5H6z" />
          <path d="M14 2.5V7h4.5M9 12h6M9 16h4" />
        </svg>
      );
    case "journal":
      return (
        <svg {...base}>
          <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
          <path d="m7 10 3 2.5L7 15M13 15h4" />
        </svg>
      );
    case "connexion":
      return (
        <svg {...base}>
          <path d="M4 12a8 8 0 0 1 16 0" />
          <path d="M7.5 12a4.5 4.5 0 0 1 9 0" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <path d="M12 13.5V21" />
        </svg>
      );
  }
}

export const PowerIcon = () => (
  <svg {...base}>
    <path d="M12 3v8" />
    <path d="M6.6 6.6a8 8 0 1 0 10.8 0" />
  </svg>
);
export const SoundIcon = ({ muted }: { muted: boolean }) => (
  <svg {...base}>
    <path d="M4 9.5h3l4.5-4v13l-4.5-4H4z" />
    {muted ? <path d="m15.5 9.5 5 5m0-5-5 5" /> : <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />}
  </svg>
);
export const MenuIcon = ({ open }: { open: boolean }) => (
  <svg {...base}>{open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7.5h16M4 12h16M4 16.5h16" />}</svg>
);
export const ChevronIcon = ({ dir }: { dir: "left" | "right" }) => (
  <svg {...base}>{dir === "left" ? <path d="m14.5 5.5-6.5 6.5 6.5 6.5" /> : <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />}</svg>
);
export const LockIcon = () => (
  <svg {...base} width={28} height={28}>
    <rect x="5" y="10.5" width="14" height="10" rx="1" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <path d="M12 14.5v2.5" />
  </svg>
);
export const GithubIcon = () => (
  <svg {...base}>
    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.800 5.400 3.100 5.400 3.100a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.500c0 4.600 2.700 5.700 5.500 6-.6.600-.6 1.200-.5 2V21" />
  </svg>
);
export const LinkedinIcon = () => (
  <svg {...base}>
    <rect x="3" y="3" width="18" height="18" rx="1.5" />
    <path d="M7.500 10v7M7.500 7v.01M11.500 17v-7m0 3a2.500 2.500 0 0 1 5 0v4" />
  </svg>
);
export const MailIcon = () => (
  <svg {...base}>
    <rect x="3" y="5" width="18" height="14" rx="1.500" />
    <path d="m3.500 6.500 8.500 6.500 8.500-6.500" />
  </svg>
);
export const PhoneIcon = () => (
  <svg {...base}>
    <path d="M5 3.500h4l1.500 4.500-2 1.500a12 12 0 0 0 6 6l1.500-2 4.500 1.500v4a1.500 1.500 0 0 1-1.500 1.500A16.500 16.500 0 0 1 3.500 5 1.500 1.500 0 0 1 5 3.500z" />
  </svg>
);
export const FileIcon = () => (
  <svg {...base}>
    <path d="M6 2.500h8l4.500 4.500v14.500H6z" />
    <path d="M12 10v7m0 0-2.500-2.500M12 17l2.500-2.500" />
  </svg>
);
