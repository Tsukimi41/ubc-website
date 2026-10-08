import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PaperCard } from "@/components/ui";
import { formatJapaneseDate } from "@/lib/format";
import type { DiaryEntry } from "@/lib/types";

export function DiaryCard({ entry, headingLevel = 2 }: { entry: DiaryEntry; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const localUrl = entry.url?.startsWith("/diary/");
  return (
    <PaperCard className="article-card">
      <div className="article-card-visual" aria-hidden="true">
        {entry.imageUrl ? <Image src={entry.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /> : "✎"}
      </div>
      <div className="article-card-data">
        <div className="flex items-center justify-between text-xs">
          <span className="rounded-full bg-peach/60 px-3 py-1 font-bold">{entry.category}</span>
          <time dateTime={entry.publishedAt} className="text-bark/55">{formatJapaneseDate(entry.publishedAt)}</time>
        </div>
        <Heading className="mt-5 text-xl font-black">{entry.title}</Heading>
        <p className="mt-3 line-clamp-5 text-sm leading-7 text-bark/70">{entry.excerpt}</p>
        {entry.url ? localUrl ? (
          <Link href={entry.url} className="mt-5 inline-flex items-center gap-1 font-bold text-[#9D4712] hover:underline">全文を読む <ArrowRight size={17} /></Link>
        ) : (
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1 font-bold text-[#9D4712] hover:underline">全文を読む <ArrowUpRight size={17} /></a>
        ) : <p className="mt-5 text-xs font-bold text-leaf">デモ記事</p>}
      </div>
    </PaperCard>
  );
}
