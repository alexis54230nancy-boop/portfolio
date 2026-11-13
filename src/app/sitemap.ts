import type { MetadataRoute } from "next";
import { chapters, site } from "@/lib/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return chapters
    .filter((c) => !c.secret) // le Fragment reste un secret
    .map((c) => ({
      url: `${site.url}${c.href}`,
      changeFrequency: "monthly" as const,
      priority: c.id === "identite" ? 1 : 0.7,
    }));
}
