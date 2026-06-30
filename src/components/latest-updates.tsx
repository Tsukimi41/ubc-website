import { ArrowUpRight, CalendarDays } from "lucide-react";
import Image from "next/image";
import { formatJapaneseDate } from "@/lib/format";
import type { Update } from "@/lib/types";

export function LatestUpdates({ updates }: { updates: Update[] }) {
  return <div className="grid gap-5 md:grid-cols-3">{updates.slice(0, 6).map((update, index) => <article key={update.id} className={`paper-card group ${index === 0 ? "md:col-span-2 md:grid md:grid-cols-2 md:gap-6" : ""}`}>{update.imageUrl && <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl md:mb-0"><Image src={update.imageUrl} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 768px) 40vw, 90vw" /></div>}<div><div className="flex items-center gap-2 text-xs font-bold text-leaf"><CalendarDays size={15} aria-hidden="true" /><time dateTime={update.date}>{formatJapaneseDate(update.date)}</time></div><h3 className="mt-3 text-xl font-black">{update.title}</h3><p className="mt-3 line-clamp-4 text-sm leading-7 text-bark/70">{update.body}</p>{update.url && <a href={update.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1 font-bold text-[#9D4712] underline-offset-4 hover:underline">投稿を見る <ArrowUpRight size={17} /></a>}</div></article>)}</div>;
}
