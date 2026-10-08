import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { localDiaryEntries } from "@/lib/diary-posts";
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = ["", "/amazing-bees", "/dashboard", "/research", "/diary", "/contact", "/privacy"].map((path) => ({ url: `${siteConfig.url}${path}`, lastModified: new Date(), changeFrequency: path === "/dashboard" ? "hourly" : path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : .8 }));
  return [...pages, ...localDiaryEntries.map((entry) => ({ url: `${siteConfig.url}${entry.url}`, lastModified: entry.publishedAt, changeFrequency: "monthly" as const, priority: .7 }))];
}
