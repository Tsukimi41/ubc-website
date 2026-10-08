import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { september18Diary as post } from "@/lib/diary-posts";

const photoAlt = "巣箱の前に緑のテープで固定した黒い粘着シートと、その手前の金網の捕獲器";

export const metadata: Metadata = {
  title: post.title,
  description: post.excerpt,
  alternates: { canonical: post.url },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.excerpt,
    url: post.url,
    publishedTime: "2026-09-18T00:00:00+09:00",
    images: [{ url: post.imageUrl, width: 1280, height: 960, alt: photoAlt }],
  },
};

export default function September18DiaryPage() {
  return (
    <article className="page-shell py-12 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/diary" className="inline-flex items-center gap-2 font-bold text-leaf hover:underline"><ArrowLeft size={18} />養蜂日誌の一覧へ</Link>
        <header className="mt-10">
          <p className="eyebrow">Bee diary / Field notes</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="rounded-full bg-peach/60 px-3 py-1 font-bold">{post.category}</span>
            <time dateTime={post.publishedAt}>2026年9月18日</time>
          </div>
          <h1 className="mt-6 text-3xl font-black leading-relaxed sm:text-4xl">{post.title}</h1>
          <p className="mt-6 text-lg leading-9 text-bark/80">今日も、オオスズメバチとキイロスズメバチが養蜂場に来ています。9月16日に続き、スズメバチへの対応が続いています。</p>
        </header>

        <div className="mt-10 space-y-10 text-base leading-9 text-bark/80 sm:text-lg">
          <section className="space-y-5">
            <h2 className="text-2xl font-black leading-relaxed text-bark">午前に5匹、午後に2匹を捕獲</h2>
            <p>午前中にキイロスズメバチを5匹、午後にはオオスズメバチを2匹捕まえました。この日の捕獲は、合わせて7匹です。</p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-peach/25 p-6"><dt className="text-sm font-bold text-leaf">午前</dt><dd className="mt-2 font-black text-bark">キイロスズメバチ 5匹</dd></div>
              <div className="rounded-2xl bg-peach/25 p-6"><dt className="text-sm font-bold text-leaf">午後</dt><dd className="mt-2 font-black text-bark">オオスズメバチ 2匹</dd></div>
            </dl>
          </section>

          <section className="space-y-5 border-t border-bark/15 pt-8">
            <h2 className="text-2xl font-black leading-relaxed text-bark">防水性の粘着シートを追加しました</h2>
            <p>今日は、防水性の粘着シートも追加しました。写真は、巣箱の前に取り付けたシートと、その手前にある金網の捕獲器の様子です。</p>
            <figure className="pt-3">
              <a href={post.imageUrl} target="_blank" rel="noopener noreferrer" aria-label="9月18日の粘着シートと捕獲器の写真を元の大きさで開く" className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf">
                <Image src={post.imageUrl} alt={photoAlt} width={1280} height={960} sizes="(max-width: 960px) 100vw, 896px" priority className="h-auto w-full rounded-2xl" />
              </a>
              <figcaption className="mt-3 text-sm leading-7 text-bark/70">9月18日、防水性の粘着シートを追加。黒いシートを巣箱の前に固定し、巣門まわりの状況を記録しました。</figcaption>
            </figure>
            <p>スズメバチの飛来は続いています。ミツバチを守るため、その日の捕獲状況と対策を一つずつ記録していきます。</p>
          </section>
        </div>

        <aside className="mt-10 rounded-2xl border border-bark/15 p-6 text-sm leading-7">
          <h2 className="font-black">これまでの記録</h2>
          <ul className="mt-3 space-y-2">
            <li><Link href="/diary/2026-09-16-hive-decline" className="font-bold text-leaf underline underline-offset-4">9月16日：蜂の数が激減 — 秋の採蜜が難しい状況に</Link></li>
            <li><Link href="/diary/2026-09-14-hornet-defense" className="font-bold text-leaf underline underline-offset-4">9月14日：大型スズメバチの襲撃 — ミツバチを守るために</Link></li>
          </ul>
        </aside>
        <Link href="/diary" className="button-secondary mt-8"><ArrowLeft size={18} />養蜂日誌の一覧へ</Link>
      </div>
    </article>
  );
}
