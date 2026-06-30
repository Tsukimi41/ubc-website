import { ArrowRight, Microscope, Radio, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimatedStats } from "@/components/animated-stats";
import { BeeSwarm } from "@/components/bee-swarm";
import { LatestUpdates } from "@/components/latest-updates";
import { PaperCard, SectionHeading } from "@/components/ui";
import { getLatestUpdates } from "@/lib/cms";

export default async function Home() {
  const updates = await getLatestUpdates();
  return <>
    <section className="relative min-h-[min(780px,calc(100svh-5rem))] overflow-hidden">
      <Image src="/images/rooftop-apiary-hero.png" alt="朝日に照らされた大学屋上の木製巣箱と飛び交うミツバチ" fill priority className="object-cover object-[63%_center]" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/90 to-cream/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-cream via-transparent to-transparent" />
      <BeeSwarm />
      <div className="page-shell relative z-20 flex min-h-[min(780px,calc(100svh-5rem))] items-center py-20"><div data-hero-copy className="max-w-2xl"><p className="eyebrow">UEC Urban Bee Club</p><h1 className="display-title mt-4">小さな羽に、<br/><span className="relative text-[#9D4712]">驚くほどの知性。<svg className="absolute -bottom-3 left-0 h-3 w-full text-honey" viewBox="0 0 400 16" preserveAspectRatio="none" aria-hidden="true"><path d="M2 9c80-8 150 9 230-1s120 4 166 0" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /></svg></span></h1><p className="mt-9 max-w-xl text-lg font-medium leading-9 text-bark/80">ハチは踊り、数をかぞえ、仲間と都市を支えています。調布の屋上から、養蜂とテクノロジーでその世界を見つめます。</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/amazing-bees" className="button-primary">ハチのひみつをのぞく <ArrowRight size={20} /></Link><Link href="/dashboard" className="button-secondary">巣箱の今を見る</Link></div><p className="mt-6 text-sm font-bold text-bark/65">電気通信大学 公認サークル · 2023年7月設立</p></div></div>
    </section>
    <section className="page-shell -mt-4 relative z-20"><AnimatedStats /><p className="mt-3 text-right text-xs text-bark/55">※ ミツバチ数は季節・群勢による推定値です。</p></section>
    <section className="page-shell py-24"><SectionHeading eyebrow="Why bees?" title="かわいいだけじゃない。知れば知るほど、ふしぎ。" align="center"><p>小さな脳で高度な判断を行い、群れ全体でひとつの生命のように動くミツバチ。科学の入口が、ここにはぎゅっと詰まっています。</p></SectionHeading><div className="mt-12 grid gap-6 md:grid-cols-3"><PaperCard><Sparkles className="h-10 w-10 text-honey"/><h3 className="mt-5 text-xl font-black">感じ、覚え、考える</h3><p className="mt-3 leading-7 text-bark/70">顔のパターンを見分け、数量を学び、経験によって判断を変える認知能力。</p></PaperCard><PaperCard><Radio className="h-10 w-10 text-honey"/><h3 className="mt-5 text-xl font-black">ダンスで話す</h3><p className="mt-3 leading-7 text-bark/70">太陽をコンパスに、花の方向と距離を「8の字ダンス」で仲間へ伝えます。</p></PaperCard><PaperCard><Microscope className="h-10 w-10 text-honey"/><h3 className="mt-5 text-xl font-black">技術でそっと見守る</h3><p className="mt-3 leading-7 text-bark/70">IoTセンサーと羽音AIで、群れの変化をミツバチに負担なく読み解きます。</p></PaperCard></div><div className="mt-10 text-center"><Link className="button-secondary" href="/amazing-bees">6つのひみつを読む <ArrowRight size={19}/></Link></div></section>
    <section className="bg-[#f4efd9] py-24"><div className="page-shell"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><SectionHeading eyebrow="Latest updates" title="屋上から、今日の便り。"><p>養蜂の日常や研究の小さな発見を、いちばん新しい順にお届けします。</p></SectionHeading><span className="rounded-full bg-cream px-4 py-2 text-xs font-bold text-leaf">Tumblr と自動同期</span></div><div className="mt-10"><LatestUpdates updates={updates} /></div></div></section>
    <section className="page-shell py-24"><div className="relative overflow-hidden rounded-[2.5rem] bg-leaf px-6 py-14 text-cream shadow-paper sm:px-12 lg:px-20"><div className="absolute -right-12 -top-12 text-[14rem] opacity-10" aria-hidden="true">🍯</div><div className="relative max-w-2xl"><p className="font-black uppercase tracking-[.18em] text-pollen">Come fly with us</p><h2 className="mt-3 text-3xl font-black leading-snug sm:text-4xl">ミツバチを好きになるところから、<br/>一緒にはじめませんか。</h2><p className="mt-5 leading-8 text-cream/80">見学、入部、出前授業、研究交流。ハチに詳しくなくても大丈夫です。</p><Link href="/contact" className="button-primary mt-8">参加・問い合わせ <ArrowRight size={20}/></Link></div></div></section>
  </>;
}
