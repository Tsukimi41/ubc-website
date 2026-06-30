import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, children, align = "left" }: { eyebrow: string; title: string; children?: ReactNode; align?: "left" | "center" }) {
  return <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}><p className="eyebrow">{eyebrow}</p><h2 className="section-title mt-2">{title}</h2>{children && <div className="mt-4 text-base leading-8 text-bark/75">{children}</div>}</div>;
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <section className="relative overflow-hidden border-b border-bark/10 bg-[radial-gradient(circle_at_80%_10%,rgba(255,216,90,.55),transparent_25%),linear-gradient(135deg,#FFFDF1,#FFF1DB)]"><div className="page-shell relative py-16 sm:py-24"><div className="max-w-3xl"><p className="eyebrow">{eyebrow}</p><h1 className="display-title mt-3">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-9 text-bark/75">{description}</p>{children}</div><div className="absolute -right-8 top-8 select-none text-[9rem] opacity-10" aria-hidden="true">🐝</div></div></section>;
}

export function PaperCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <article className={`paper-card ${className}`}>{children}</article>;
}

export function StatusPill({ status }: { status: "live" | "cached" | "demo" }) {
  const labels = { live: "リアルタイム", cached: "最終取得データ", demo: "デモデータ" };
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${status === "live" ? "bg-green-100 text-green-900" : "bg-peach/60 text-bark"}`}><span className={`h-2 w-2 rounded-full ${status === "live" ? "animate-pulse bg-green-600" : "bg-honey"}`} />{labels[status]}</span>;
}
