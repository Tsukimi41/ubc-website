import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap { return ["", "/amazing-bees", "/dashboard", "/research", "/diary", "/contact", "/privacy"].map((path) => ({ url: `${siteConfig.url}${path}`, lastModified: new Date(), changeFrequency: path === "/dashboard" ? "hourly" : path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : .8 })); }
