import Link from "next/link";

export function BeeLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-honey" aria-label="Urban Bee Club ホーム">
      <svg className={compact ? "h-10 w-10" : "h-12 w-12"} viewBox="0 0 100 100" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" className="text-bark">
          <path d="M28 12 47 23v22L28 56 9 45V23Z" />
          <path d="m66 12 19 11v22L66 56 47 45V23Z" />
          <path d="m47 45 19 11v22L47 89 28 78V56Z" />
        </g>
        <path d="M33 43c-8-9 4-19 12-11 8-8 20 2 12 11-6 6-12 10-12 10s-6-4-12-10Z" fill="#FFD85A" stroke="#562F00" strokeWidth="3" />
      </svg>
      {!compact && <span className="leading-tight"><b className="block text-base tracking-wide">Urban Bee Club</b><small className="block text-xs font-medium text-bark/70">小さな羽の研究室</small></span>}
    </Link>
  );
}
