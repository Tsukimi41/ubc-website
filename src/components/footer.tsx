import { Heart, Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { BeeLogo } from "@/components/bee-logo";
import { siteConfig } from "@/lib/site";

export function Footer({ secretLinks }: { secretLinks: { href: string; label: string }[] }) {
  return (
    <footer className="relative mt-24 overflow-hidden bg-bark text-cream">
      <div className="absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(90deg,#FFD85A_0_24px,#FF9644_24px_48px)]" />
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div><div className="inline-flex rounded-2xl bg-cream p-3 text-bark"><BeeLogo /></div><p className="mt-5 max-w-md text-sm leading-7 text-cream/80">ミツバチの驚くべき知性と都市の生態系を、養蜂・IoT・AIの実践から学び、伝えています。</p></div>
        <div><h2 className="font-bold text-pollen">サイト案内</h2><ul className="mt-4 grid gap-2 text-sm">{siteConfig.nav.map((item) => <li key={item.href}><Link className="underline-offset-4 hover:underline" href={item.href}>{item.label}</Link></li>)}<li><Link className="underline-offset-4 hover:underline" href="/diary">養蜂日誌</Link></li>{secretLinks.map((item) => <li key={item.href}><Link className="underline-offset-4 hover:underline" href={item.href}>{item.label}</Link></li>)}<li><Link className="text-cream/70 underline-offset-4 hover:underline" href="/privacy">プライバシー</Link></li></ul></div>
        <div><h2 className="font-bold text-pollen">つながる</h2><ul className="mt-4 grid gap-3 text-sm"><li><Link className="flex items-center gap-2 hover:underline" href="/contact"><Mail size={18} /> お問い合わせ</Link></li><li><span className="flex items-center gap-2 text-cream/60"><Instagram size={18} /> 公式SNS（準備中）</span></li></ul></div>
      </div>
      <div className="border-t border-cream/15 py-5 text-center text-xs text-cream/65"><p>© {new Date().getFullYear()} Urban Bee Club · <Heart className="inline h-3 w-3 fill-honey text-honey" aria-label="愛情をこめて" /> Built with care for bees and people.</p></div>
    </footer>
  );
}
