"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BeeLogo } from "@/components/bee-logo";

type LinkItem = { href: string; label: string; short?: string };

export function Header({ nav, secretLinks }: { nav: readonly LinkItem[]; secretLinks: LinkItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-bark/10 bg-cream/95 shadow-[0_3px_18px_rgba(86,47,0,.08)] backdrop-blur-lg">
      <svg className="vine-path pointer-events-none absolute inset-x-0 bottom-[-9px] h-7 w-full text-leaf/80" preserveAspectRatio="none" viewBox="0 0 1200 30" aria-hidden="true">
        <path d="M0 12c140 24 210-18 355 4s230-9 355 1 290-18 490 1" fill="none" stroke="currentColor" strokeWidth="4" />
        <g className="vine-leaf" fill="currentColor"><ellipse cx="180" cy="16" rx="11" ry="5" transform="rotate(-25 180 16)"/><ellipse cx="405" cy="15" rx="11" ry="5" transform="rotate(22 405 15)"/><ellipse cx="760" cy="17" rx="11" ry="5" transform="rotate(-22 760 17)"/><ellipse cx="1060" cy="15" rx="11" ry="5" transform="rotate(24 1060 15)"/></g>
      </svg>
      <div className="page-shell flex h-20 items-center justify-between gap-4">
        <BeeLogo />
        <nav className="hidden items-stretch gap-1 lg:flex" aria-label="メインナビゲーション">
          {nav.map((item) => <NavLink key={item.href} item={item} active={pathname === item.href} />)}
        </nav>
        <button type="button" className="icon-button" aria-expanded={open} aria-controls="utility-menu" aria-label={open ? "メニューを閉じる" : "その他のメニューを開く"} onClick={() => setOpen((value) => !value)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <div id="utility-menu" className="absolute inset-x-0 top-full border-b border-bark/15 bg-cream p-4 shadow-paper">
          <nav className="page-shell grid gap-2 lg:hidden" aria-label="モバイルナビゲーション">
            {[...nav, { href: "/diary", label: "養蜂日誌" }, { href: "/privacy", label: "プライバシー" }, ...secretLinks].map((item) => <NavLink key={item.href} item={item} active={pathname === item.href} mobile />)}
          </nav>
          <nav className="page-shell hidden max-w-7xl grid-cols-3 gap-3 lg:grid" aria-label="その他のナビゲーション">
            {[{ href: "/diary", label: "養蜂日誌" }, { href: "/privacy", label: "プライバシー" }, ...secretLinks].map((item) => <NavLink key={item.href} item={item} active={pathname === item.href} mobile />)}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ item, active, mobile = false }: { item: LinkItem; active: boolean; mobile?: boolean }) {
  return <Link data-nav-item href={item.href} aria-current={active ? "page" : undefined} className={`${mobile ? "px-4 py-3" : "px-3 py-2"} rounded-xl text-sm font-bold transition hover:bg-peach/60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-honey ${active ? "bg-peach text-bark" : "text-bark/80"}`}>{item.label}</Link>;
}
