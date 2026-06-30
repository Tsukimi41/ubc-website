import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getGalleryUpdates } from "@/lib/cms";
import { formatJapaneseDate } from "@/lib/format";
import { isSalonEnabled } from "@/lib/site";
import { createAuthClient } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "会員ギャラリー",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function GalleryPage() {
  if (!isSalonEnabled()) notFound();
  const auth = await createAuthClient();
  if (!auth) redirect("/salon");
  const userResult = await auth.auth.getUser();
  if (userResult.error || !userResult.data.user) redirect("/salon");

  const membership = await auth
    .from("memberships")
    .select("status")
    .eq("user_id", userResult.data.user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle();
  if (membership.error) throw new Error("Membership status is temporarily unavailable");
  if (!membership.data) redirect("/salon");

  const updates = await getGalleryUpdates();
  return (
    <>
      <section className="bg-bark py-16 text-cream"><div className="page-shell"><p className="font-black tracking-widest text-pollen">MEMBERS ONLY</p><h1 className="mt-3 text-4xl font-black">屋上の舞台裏</h1><p className="mt-4 text-cream/70">日々の内検、ハチたちの表情、研究の試行錯誤を会員のみなさんへ。</p></div></section>
      <div className="page-shell py-16">
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {updates.map((item, index) => (
            <article key={item.id} className="paper-card mb-6 break-inside-avoid">
              {item.imageUrl || index === 0 ? <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-2xl"><Image src={item.imageUrl ?? "/images/rooftop-apiary-hero.png"} alt="会員向け活動写真" fill className="object-cover" sizes="(min-width:1024px) 30vw, 90vw"/></div> : <div className="mb-5 grid aspect-[4/3] place-items-center rounded-2xl bg-peach/30 text-7xl">🐝</div>}
              <time className="text-xs font-bold text-leaf" dateTime={item.date}>{formatJapaneseDate(item.date)}</time>
              <h2 className="mt-2 text-lg font-black">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-bark/70">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
