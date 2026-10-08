import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { october2Diary as post } from "@/lib/diary-posts";

export const metadata: Metadata = {
  title: post.title,
  description: post.excerpt,
  alternates: { canonical: post.url },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.excerpt,
    url: post.url,
    publishedTime: "2026-10-02T00:00:00+09:00",
    images: [{ url: post.imageUrl, width: 1280, height: 721, alt: "ネットに囲まれた10月2日の養蜂場" }],
  },
};

export default function October2DiaryPage() {
  return (
    <article className="page-shell py-12 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/diary" className="inline-flex items-center gap-2 font-bold text-leaf hover:underline">
          <ArrowLeft size={18} />養蜂日誌の一覧へ
        </Link>
        <header className="mt-10">
          <p className="eyebrow">Bee diary / Field notes</p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="rounded-full bg-peach/60 px-3 py-1 font-bold">{post.category}</span>
            <time dateTime={post.publishedAt}>2026年10月2日</time>
          </div>
          <h1 className="mt-6 text-3xl font-black leading-relaxed sm:text-4xl">{post.title}</h1>
        </header>

        <div className="mt-10 space-y-10 text-base leading-9 text-bark/80 sm:text-lg">
          <section className="space-y-5">
            <h2 className="text-2xl font-black leading-relaxed text-bark">午後に6匹を捕獲</h2>
            <p>10月2日の午後、養蜂場でオオスズメバチを3匹、コガタスズメバチを3匹捕獲しました。巣箱の前に取り付けた捕獲器の様子と、巣箱の足元に残るミツバチの姿を写真に記録しています。</p>
            <p>スズメバチの飛来が続くなか、捕獲数だけでなく、巣箱の周囲やミツバチの状態も見ていきます。</p>
          </section>

          <section className="space-y-5 border-t border-bark/15 pt-10">
            <h2 className="text-2xl font-black leading-relaxed text-bark">張ったばかりのネットに穴</h2>
            <p>この前に掛けたネットに、もう穴が開いていました。穴は裏側にあります。今のところスズメバチに見つかっていないのでしょうか。穴のある場所だけでは、スズメバチが通ったかどうかは判断できません。</p>
            <p>小さな穴なら、DAISOなどで売られている網戸補修シールで直せるかもしれません。ただ、ネットとの相性や、穴が広がらずにふさがるかは確認が必要です。補修したという記録ではなく、現時点で考えている方法です。</p>
            <p>見た限りでは噛み切られたような形でもなく、燻煙器の熱で溶けた可能性も考えています。原因はまだ分かっていません。傷み方と周囲の状況を確かめてから、補修方法を決めたいと思います。</p>
          </section>
        </div>

        <div className="mt-12 grid items-start gap-x-6 gap-y-8 sm:grid-cols-2">
          {post.photos.map((photo, index) => (
            <figure key={photo.src}>
              <a href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={`${photo.alt}（元の写真を開く）`} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf">
                <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 436px"
                  priority={index === 0} className="h-auto w-full rounded-2xl" />
              </a>
              <figcaption className="mt-3 text-sm leading-7 text-bark/70">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>

        <Link href="/diary" className="button-secondary mt-12"><ArrowLeft size={18} />養蜂日誌の一覧へ</Link>
      </div>
    </article>
  );
}
