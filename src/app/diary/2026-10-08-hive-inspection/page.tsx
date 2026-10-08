import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { october8Diary as post } from "@/lib/diary-posts";

export const metadata: Metadata = {
  title: post.title,
  description: post.excerpt,
  alternates: { canonical: post.url },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.excerpt,
    url: post.url,
    publishedTime: "2026-10-08T00:00:00+09:00",
    images: [{ url: post.imageUrl, width: 1280, height: 721, alt: "10月8日の養蜂場の巣箱" }],
  },
};

export default function October8DiaryPage() {
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
            <time dateTime={post.publishedAt}>2026年10月8日</time>
          </div>
          <h1 className="mt-6 text-3xl font-black leading-relaxed sm:text-4xl">{post.title}</h1>
        </header>

        <div className="mt-10 space-y-10 text-base leading-9 text-bark/80 sm:text-lg">
          <section className="space-y-5">
            <h2 className="text-2xl font-black leading-relaxed text-bark">今日の飛来はなし。それでも粘着シートには多数</h2>
            <p>10月8日、大学の養蜂農園ではスズメバチの飛来は見られませんでした。一方、粘着シートには多くのスズメバチがかかっていました。今日飛んでいる姿を見なかったことと、それまでに飛来していたことの両方が分かる記録です。</p>
            <p>粘着シートにはネズミもかかってしまいました。写真にはスズメバチとネズミが写っています。</p>
          </section>

          <section className="space-y-5 border-t border-bark/15 pt-10">
            <h2 className="text-2xl font-black leading-relaxed text-bark">弱群は産卵がほとんど見られず</h2>
            <p>弱い群を点検すると、産卵はほとんどありませんでした。群を合同することも考えるほどの状態です。合同を行ったということではなく、今後の対応が必要な状況として記録します。</p>
            <p>真ん中の群には害虫がたくさん見られました。種類や被害の程度は、今回の記録だけでは特定していません。</p>
          </section>

          <section className="space-y-5 border-t border-bark/15 pt-10">
            <h2 className="text-2xl font-black leading-relaxed text-bark">全ての巣箱をバーナーで焼く</h2>
            <p>この日は、全ての巣箱をバーナーで焼きました。スズメバチへの対応と並行して、弱群や害虫の状況を見ながら巣箱を管理しています。</p>
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
