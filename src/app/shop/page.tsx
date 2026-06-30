import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopClient } from "@/components/shop-client";
import { PageHero } from "@/components/ui";
import { products } from "@/lib/fallback-data";
import { isShopEnabled } from "@/lib/site";

export const metadata: Metadata = { title: "オンラインショップ", robots: { index: false, follow: false } };
export default function ShopPage() {
  if (!isShopEnabled()) notFound();
  // Stripe Price IDs are not secrets, but they are server configuration and do
  // not belong in the serialized Client Component payload.
  const publicProducts = products.map(({ id, name, description, price, emoji, stock }) => ({
    id, name, description, price, emoji, stock,
  }));
  return <><PageHero eyebrow="Urban bee shop" title="屋上から届く、季節の恵み。" description="活動から生まれたはちみつと、みつろうの品々。収益はミツバチの飼育と研究活動に役立てます。"/><div className="page-shell py-16"><ShopClient products={publicProducts}/></div></>;
}
