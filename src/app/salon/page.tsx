import type { Metadata } from "next";
import { Camera, Heart, KeyRound, Tag } from "lucide-react";
import { notFound } from "next/navigation";
import { MagicLinkForm } from "@/components/magic-link-form";
import { SalonActions } from "@/components/salon-actions";
import { PageHero, PaperCard } from "@/components/ui";
import { isSalonEnabled } from "@/lib/site";
import { createAuthClient } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "月額支援サロン",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function SalonPage() {
  if (!isSalonEnabled()) notFound();
  const auth = await createAuthClient();
  const userResult = auth ? await auth.auth.getUser() : null;
  const user = userResult?.data.user ?? null;
  let active = false;
  let discount: { code: string; percentage: number } | null = null;

  if (auth && user) {
    const membership = await auth
      .from("memberships")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();
    if (membership.error) throw new Error("Membership status is temporarily unavailable");
    active = Boolean(membership.data);

    if (active) {
      const discountResult = await auth
        .from("discount_codes")
        .select("code,percentage")
        .eq("active", true)
        .maybeSingle();
      if (discountResult.error) throw new Error("Member benefit is temporarily unavailable");
      if (discountResult.data && /^[A-Z0-9][A-Z0-9-]{5,31}$/u.test(discountResult.data.code)) {
        discount = { code: discountResult.data.code, percentage: Number(discountResult.data.percentage) };
      }
    }
  }

  return (
    <>
      <PageHero eyebrow="Bee friends salon" title="88円で、屋上の小さな営みを支える。" description="月に一度、缶ジュースより小さな応援。飼育用品、センサー、教育活動のために大切に使います。"/>
      <div className="page-shell py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="grid gap-5 sm:grid-cols-3">
            <Benefit icon={<Camera/>} title="限定ギャラリー" text="日々の内検や研究の舞台裏をお届け。"/>
            <Benefit icon={<Tag/>} title="ショップ特典" text="会員向け割引コードを自動発行。"/>
            <Benefit icon={<Heart/>} title="活動を応援" text="継続的な飼育と研究の土台に。"/>
          </div>
          <PaperCard variant="static" className="p-7 sm:p-9">
            {user ? (
              <>
                <div className="flex items-center gap-3"><KeyRound className="text-leaf"/><div><p className="text-sm text-bark/60">ログイン中</p><p className="font-bold">{user.email}</p></div></div>
                <h2 className="mt-7 text-2xl font-black">{active ? "ご支援ありがとうございます" : "サロンをはじめる"}</h2>
                <p className="mt-3 text-sm leading-7 text-bark/65">{active ? "限定コンテンツと特典をご利用いただけます。" : "決済はStripeで安全に行われ、いつでも解約できます。"}</p>
                {discount && <div className="mt-5 rounded-2xl bg-peach/35 p-4"><p className="text-xs font-bold text-leaf">会員割引 {discount.percentage}%</p><code className="mt-1 block break-all text-lg font-black">{discount.code}</code></div>}
                <SalonActions active={active}/>
                <form action="/api/auth/signout" method="post"><button className="mt-5 text-sm font-bold underline" type="submit">ログアウト</button></form>
              </>
            ) : (
              <><h2 className="text-2xl font-black">メールでログイン</h2><p className="mt-3 text-sm leading-7 text-bark/65">パスワードは不要です。メールに届く安全なリンクからログインできます。</p><MagicLinkForm/></>
            )}
          </PaperCard>
        </div>
        <p className="mt-8 text-xs leading-6 text-bark/55">支援金は返礼品の購入代金ではありません。限定ギャラリーと割引は、活動状況に応じて提供内容が変わる場合があります。</p>
      </div>
    </>
  );
}

function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <PaperCard><div className="text-honey [&>svg]:h-9 [&>svg]:w-9">{icon}</div><h2 className="mt-5 text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-7 text-bark/65">{text}</p></PaperCard>;
}
