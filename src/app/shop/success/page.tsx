import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigurationError } from "@/lib/server-config";
import { isShopEnabled } from "@/lib/site";
import { getStripe, getStripeApplicationId } from "@/lib/stripe";

export const metadata: Metadata = { title: "購入結果", robots: { index: false, follow: false, noarchive: true } };

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export default async function ShopSuccessPage({ searchParams }: SuccessPageProps) {
  if (!isShopEnabled()) notFound();
  const candidate = (await searchParams).session_id;
  const sessionId = typeof candidate === "string" && /^cs_(?:test|live)_[A-Za-z0-9]{10,255}$/u.test(candidate)
    ? candidate
    : null;
  const stripe = getStripe();
  let applicationId: string | null = null;
  try {
    applicationId = getStripeApplicationId();
  } catch (error) {
    console.error("Stripe success-page configuration is invalid", error instanceof ConfigurationError ? error.variable : "unknown");
  }

  let verified = false;
  if (sessionId && stripe && applicationId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      verified = session.mode === "payment"
        && session.payment_status === "paid"
        && session.metadata?.applicationId === applicationId
        && session.metadata?.purpose === "shop";
    } catch (error) {
      console.error("Stripe Checkout verification failed", error instanceof Error ? error.name : "unknown_error");
    }
  }

  if (!verified) {
    return <Result icon="🌿" title="決済結果を確認できません" body="Stripeから届くメールをご確認ください。請求があるのにメールが届かない場合は、お問い合わせください。" href="/contact" link="問い合わせる" />;
  }
  return <Result icon="🍯" title="ご注文ありがとうございます" body="Stripeで決済済みであることを確認しました。Stripeから届くメールも大切に保管してください。" href="/" link="ホームへ" />;
}

function Result({ icon, title, body, href, link }: { icon: string; title: string; body: string; href: string; link: string }) {
  return <div className="page-shell grid min-h-[60vh] place-items-center py-20 text-center"><div><div className="text-7xl" aria-hidden="true">{icon}</div><h1 className="mt-5 text-4xl font-black">{title}</h1><p className="mt-4 text-bark/70">{body}</p><Link href={href} className="button-primary mt-8">{link}</Link></div></div>;
}
