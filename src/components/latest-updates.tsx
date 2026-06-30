import { ArrowUpRight, CalendarDays } from "lucide-react";
import Image from "next/image";
import { formatJapaneseDate } from "@/lib/format";
import type { Update } from "@/lib/types";

export function LatestUpdates({ updates }: { updates: Update[] }) {
  return (
    <div className="grid gap-7 md:grid-cols-3">
      {updates.slice(0, 6).map((update, index) => {
        const hasImage = Boolean(update.imageUrl);

        return (
          <article
            key={update.id}
            className={`paper-card group ${hasImage ? "update-card-image" : "article-card"} ${index === 0 ? "md:col-span-2" : ""}`}
          >
            {update.imageUrl && (
              <Image
                src={update.imageUrl}
                alt=""
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes={index === 0 ? "(min-width: 768px) 62vw, 90vw" : "(min-width: 768px) 30vw, 90vw"}
              />
            )}
            {!hasImage && <div className="article-card-visual" aria-hidden="true">✎</div>}
            <div className={hasImage ? "update-card-data" : "article-card-data"}>
              <div className="update-card-meta flex items-center gap-2 text-xs font-bold text-leaf">
                <CalendarDays size={15} aria-hidden="true" />
                <time dateTime={update.date}>{formatJapaneseDate(update.date)}</time>
              </div>
              <h3 className="mt-3 text-xl font-black sm:text-2xl">{update.title}</h3>
              <p className="update-card-copy mt-3 line-clamp-4 text-sm leading-7 text-bark/70">{update.body}</p>
              {update.url && (
                <a
                  href={update.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="update-card-link mt-5 inline-flex items-center gap-1 font-bold text-[#9D4712] underline-offset-4 hover:underline"
                >
                  投稿を見る <ArrowUpRight size={17} />
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
