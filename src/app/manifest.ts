import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Urban Bee Club", short_name: "UBC", description: "小さな羽の研究室", start_url: "/", display: "standalone", background_color: "#FFFDF1", theme_color: "#FF9644", lang: "ja" }; }
