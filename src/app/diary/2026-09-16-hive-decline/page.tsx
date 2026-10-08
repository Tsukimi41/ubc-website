import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { september16Diary as post } from "@/lib/diary-posts";

export const metadata: Metadata = {
  title: post.title,
  description: post.excerpt,
  alternates: { canonical: post.url },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.excerpt,
    url: post.url,
    publishedTime: "2026-09-16T00:00:00+09:00",
    images: [{ url: post.imageUrl, width: 3840, height: 2881, alt: "9月16日、巣箱の内部と巣枠の上のミツバチ" }],
  },
};

function PhotoGallery({ photos, priority = false }: { photos: typeof post.photos; priority?: boolean }) {
  return <div className="mt-8 grid items-start gap-x-6 gap-y-8 sm:grid-cols-2">
    {photos.map((photo, index) => (
      <figure key={photo.src}>
        <a href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={`${photo.alt}（元の写真を開く）`} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf">
          <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height}
            sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 436px"
            priority={priority && index === 0} className="h-auto w-full rounded-2xl" />
        </a>
        <figcaption className="mt-3 text-sm leading-7 text-bark/70">{photo.caption}</figcaption>
      </figure>
    ))}
  </div>;
}

export default function September16DiaryPage() {
  return (
    <article className="page-shell py-12 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/diary" className="inline-flex items-center gap-2 font-bold text-leaf hover:underline"><ArrowLeft size={18} />養蜂日誌の一覧へ</Link>
        <header className="mt-10">
          <p className="eyebrow">Bee diary / Field notes</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="rounded-full bg-peach/60 px-3 py-1 font-bold">{post.category}</span>
            <time dateTime={post.publishedAt}>2026年9月16日</time>
          </div>
          <h1 className="mt-6 text-3xl font-black leading-relaxed sm:text-4xl">{post.title}</h1>
          <p className="mt-6 text-lg leading-9 text-bark/80">ミツバチの数が激減しています。いまの状況では、秋の採蜜は困難です。9月14日に続くスズメバチへの対応と、巣門まわりを見直す新たな考えを記録します。</p>
        </header>

        <div className="mt-10 space-y-12 text-base leading-9 text-bark/80 sm:text-lg">
          <section className="space-y-5">
            <h2 className="text-2xl font-black leading-relaxed text-bark">午後から対応。粘着シートには30匹以上</h2>
            <p>9月16日は、午後からスズメバチの駆除にあたりました。粘着シートには30匹以上がかかっており、朝のうちに多数が飛来していたようです。</p>
            <p>写真には、金網の捕獲器に入った多数のスズメバチと、巣門の前や巣箱の足元に残るミツバチの死骸が写っています。捕獲できていても、ミツバチの被害がなくなったわけではありません。</p>
            <PhotoGallery photos={post.photos.slice(0, 4)} priority />
          </section>

          <section className="space-y-5 border-t border-bark/15 pt-10">
            <h2 className="text-2xl font-black leading-relaxed text-bark">蜂が減り、秋の採蜜が難しい状況に</h2>
            <p>巣箱の中の様子も写真に残しました。現場で感じているのは、蜂の数が大きく減ってしまったことです。秋の採蜜を見込むには厳しい状況で、まずは残っているミツバチをどう守るかを考えなければなりません。</p>
            <p>以下は、この日に巣箱を開けて記録した写真です。写真に見える範囲だけで群れ全体の数や減少率を数値化することはできませんが、この日の状態を残しておきます。</p>
            <PhotoGallery photos={post.photos.slice(4)} />
          </section>

          <section className="space-y-5 border-t border-bark/15 pt-10">
            <h2 className="text-2xl font-black leading-relaxed text-bark">隙間だけでなく、「乗れる場所」に注目する</h2>
            <p><Link href="/diary/2026-09-14-hornet-defense" className="font-bold text-leaf underline underline-offset-4">9月14日の記録</Link>では、巣門の両脇や正面の隙間を狭める案を整理しました。今回はそれに加えて、隙間そのものよりも、スズメバチが乗って足場にできるスペースがあることが問題ではないか、と考えています。</p>
            <p>巣門の前に、途中で止まったり移動したりできる場所がある。その足場をできるだけなくし、スズメバチが近づくには巣門の金網まで来なければならない配置にできないか、という考えです。</p>
            <p>これは、巣門や金網を取り外すという意味ではありません。前面にある物や張り出しを見直し、どこに止まって、どこからミツバチへ近づいているのかを確かめる視点です。足場を減らすことが被害の軽減につながるかは、まだ確認できていません。</p>
          </section>

          <section className="space-y-5 border-t border-bark/15 pt-10">
            <h2 className="text-2xl font-black leading-relaxed text-bark">剣山のような部材を立てる案も</h2>
            <p>もう一つ挙がっているのが、鳥よけのように細長い突起を並べた、剣山状の部材を巣門前に立てる案です。</p>
            <div className="rounded-2xl border border-honey/40 bg-peach/20 p-6">
              <h3 className="font-black text-bark">この案で期待していること</h3>
              <p className="mt-3">大型のスズメバチは突起の間を動きにくくなり、上へ飛ぶ必要が生じる一方、小さなミツバチは突起の間を歩いて通り抜けられるのではないか。体の大きさと移動の仕方の違いを利用できないか、という仮説です。</p>
            </div>
            <p><strong className="text-bark">やってみないと、わからない。</strong>この時点ではアイデアであり、設置済みの対策や効果が実証された方法として紹介するものではありません。スズメバチが本当に上へ移動するか、ミツバチが無理なく通れるか、別の足場を使われないかを確かめる必要があります。</p>
            <p>試す場合にも、突起が人やミツバチを傷つけないこと、帰巣や出巣を妨げないことを含め、管理者が形状と配置を検討する必要があります。ここでは突起の長さや間隔を指定せず、現場で出た案として残します。</p>
          </section>

          <section className="space-y-5 border-t border-bark/15 pt-10">
            <h2 className="text-2xl font-black leading-relaxed text-bark">残っているミツバチを守るために</h2>
            <p>粘着シートの30匹以上という数と、巣箱の前に残ったミツバチの姿は、被害の厳しさを物語っています。秋の採蜜が難しくなったいま、捕獲数だけでなく、ミツバチへの襲撃をどれだけ減らせるかを見ていきたいと思います。</p>
            <p>隙間をふさぐことに加えて、足場を減らすこと、移動の経路を変えること。9月16日は、巣門の前の構造をもう一度考え直す一日となりました。</p>
          </section>
        </div>

        <p className="mt-10 text-sm leading-7 text-bark/60">本文は9月16日の現場メモに基づいています。写真はすべて同日の記録です。写真を選ぶと元の大きさで開けます。</p>
        <Link href="/diary" className="button-secondary mt-8"><ArrowLeft size={18} />養蜂日誌の一覧へ</Link>
      </div>
    </article>
  );
}
