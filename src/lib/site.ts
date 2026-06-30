function publicSiteOrigin() {
  const fallback = "http://localhost:3000";
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return fallback;
  try {
    const url = new URL(configured);
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && localHttp)) return fallback;
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}

export const siteConfig = {
  name: "Urban Bee Club",
  japaneseName: "電気通信大学 Urban Bee Club",
  description: "小さな羽に宿る知性と、都市養蜂の研究を伝える電気通信大学公認サークルの公式サイト。",
  url: publicSiteOrigin(),
  nav: [
    { href: "/", label: "ホーム", short: "Home" },
    { href: "/amazing-bees", label: "ハチのひみつ", short: "Amazing Bees" },
    { href: "/dashboard", label: "スマート巣箱", short: "Dashboard" },
    { href: "/research", label: "活動と研究", short: "Research" },
    { href: "/contact", label: "参加・問合せ", short: "Join" },
  ],
} as const;

export const isShopEnabled = () => process.env.ENABLE_SECRET_SHOP === "true";
export const isSalonEnabled = () => process.env.ENABLE_SALON === "true";

export function getSecretLinks() {
  return [
    ...(isShopEnabled() ? [{ href: "/shop", label: "オンラインショップ" }] : []),
    ...(isSalonEnabled() ? [{ href: "/salon", label: "月額支援サロン" }] : []),
  ];
}
