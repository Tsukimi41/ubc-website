import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { september24Diary as post } from "@/lib/diary-posts";

export const metadata: Metadata = {
  title: post.title,
  description: post.excerpt,
  alternates: { canonical: post.url },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.excerpt,
    url: post.url,
    publishedTime: "2026-09-24T00:00:00+09:00",
    images: [{ url: post.imageUrl, width: 1280, height: 721, alt: "緑のネットに囲まれた9月24日の養蜂場" }],
  },
};

export default function September24DiaryPage() {
  return (
    <article className="page-shell py-12 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/diary" className="inline-flex items-center gap-2 font-bold text-leaf hover:underline">
          <ArrowLeft size={18} />養蜂日誌の一覧へ
        </Link>
        <header className="mt-10">
          <p className="eyebrow">Bee diary</p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="rounded-full bg-peach/60 px-3 py-1 font-bold">{post.category}</span>
            <time dateTime={post.publishedAt}>2026年9月24日</time>
          </div>
          <h1 className="mt-6 text-3xl font-black leading-relaxed sm:text-4xl">{post.title}</h1>
        </header>
        <div className="mt-8 space-y-5 text-base leading-9 text-bark/80 sm:text-lg">
          {post.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className="mt-12 space-y-10">
          {post.photos.map((photo, index) => (
            <figure key={photo.src}>
              <Image src={photo.src} alt={photo.alt} width={1280} height={721}
                sizes="(max-width: 960px) 100vw, 896px" priority={index === 0} className="h-auto w-full rounded-2xl" />
              <figcaption className="mt-3 text-sm leading-7 text-bark/70">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>
        <Link href="/diary" className="button-secondary mt-12"><ArrowLeft size={18} />養蜂日誌の一覧へ</Link>
      </div>
    </article>
  );
}
