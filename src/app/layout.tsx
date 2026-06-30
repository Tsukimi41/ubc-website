import type { Metadata, Viewport } from "next";
import { Klee_One, Noto_Sans, Shippori_Antique, Shippori_Mincho } from "next/font/google";
import { headers } from "next/headers";
import "@/app/globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LoadingIntro } from "@/components/loading-intro";
import { getSecretLinks, siteConfig } from "@/lib/site";

const shipporiAntique = Shippori_Antique({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-shippori-antique" });
const kleeOne = Klee_One({ weight: ["400", "600"], subsets: ["latin"], display: "swap", variable: "--font-klee-one" });
const shipporiMincho = Shippori_Mincho({ weight: ["500", "700", "800"], subsets: ["latin"], display: "swap", variable: "--font-shippori-mincho" });
const notoSans = Noto_Sans({ weight: ["400", "500", "600", "700", "800"], subsets: ["latin"], display: "swap", variable: "--font-noto-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} | 小さな羽の研究室`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description, applicationName: siteConfig.name,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: { type: "website", locale: "ja_JP", title: siteConfig.name, description: siteConfig.description, images: [{ url: "/images/rooftop-apiary-hero.png", width: 1680, height: 941 }] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FFFDF1" };
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Reading request headers opts every page into dynamic rendering, which is
  // required for Next.js to attach the per-request CSP nonce to its scripts.
  await headers();
  const secretLinks = getSecretLinks();
  const fontVariables = `${shipporiAntique.variable} ${kleeOne.variable} ${shipporiMincho.variable} ${notoSans.variable}`;
  return <html lang="ja" className={fontVariables}><body className="font-body antialiased"><a href="#main" className="fixed left-3 top-3 z-[120] -translate-y-24 rounded-lg bg-bark px-4 py-3 font-bold text-cream focus:translate-y-0">本文へ移動</a><LoadingIntro /><Header nav={siteConfig.nav} secretLinks={secretLinks} /><main id="main">{children}</main><Footer secretLinks={secretLinks} /></body></html>;
}
