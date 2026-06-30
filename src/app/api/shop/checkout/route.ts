import type { NextRequest } from "next/server";
import { z } from "zod";
import { products } from "@/lib/fallback-data";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { ConfigurationError } from "@/lib/server-config";
import {
  emptyNoStore,
  jsonNoStore,
  readJsonWithLimit,
  requestIdempotencyKey,
  validateBrowserMutation,
} from "@/lib/security";
import { isShopEnabled, siteConfig } from "@/lib/site";
import { getStripe, getStripeApplicationId, isTrustedStripeRedirect } from "@/lib/stripe";

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1).max(80),
    quantity: z.number().int().min(1).max(10),
  }).strict()).min(1).max(10),
}).strict();

export async function POST(request: NextRequest) {
  if (!isShopEnabled()) return emptyNoStore(404);
  const mutation = validateBrowserMutation(request);
  if (!mutation.ok) return jsonNoStore({ message: mutation.message }, { status: mutation.status });

  const limit = await consumeRateLimit(request, "shop-checkout:ip", { limit: 10, windowSeconds: 3_600 });
  if (!limit.available) return jsonNoStore({ message: "決済機能を現在利用できません。" }, { status: 503 });
  if (!limit.allowed) return jsonNoStore({ message: "しばらく待ってお試しください。" }, { status: 429, headers: rateLimitHeaders(limit) });

  const idempotencyKey = requestIdempotencyKey(request);
  if (!idempotencyKey) return jsonNoStore({ message: "購入リクエストを識別できません。再読み込みしてください。" }, { status: 400 });
  const body = await readJsonWithLimit(request, 16 * 1_024);
  if (!body.ok) return jsonNoStore({ message: body.message }, { status: body.status });
  const parsed = checkoutSchema.safeParse(body.value);
  if (!parsed.success) return jsonNoStore({ message: "カートの内容を確認してください。" }, { status: 400 });

  const stripe = getStripe();
  if (!stripe) return jsonNoStore({ message: "決済は現在準備中です。" }, { status: 503 });
  let applicationId: string;
  try {
    applicationId = getStripeApplicationId();
  } catch (error) {
    console.error("Stripe metadata configuration is invalid", error instanceof ConfigurationError ? error.variable : "unknown");
    return jsonNoStore({ message: "決済は現在準備中です。" }, { status: 503 });
  }

  const lineItems = parsed.data.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product || !product.stripePriceId?.startsWith("price_") || item.quantity > Math.min(10, product.stock)) return null;
    return { price: product.stripePriceId, quantity: item.quantity };
  });
  if (lineItems.some((item) => !item)) return jsonNoStore({ message: "販売できない商品が含まれています。" }, { status: 400 });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems as Array<{ price: string; quantity: number }>,
      success_url: `${siteConfig.url}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteConfig.url}/shop`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["JP"] },
      expires_at: Math.floor(Date.now() / 1_000) + 30 * 60,
      metadata: {
        applicationId,
        purpose: "shop",
        productIds: parsed.data.items.map((item) => `${item.productId}:${item.quantity}`).join(","),
      },
      payment_intent_data: { metadata: { applicationId, purpose: "shop" } },
    }, { idempotencyKey: `shop:${idempotencyKey}` });

    if (!isTrustedStripeRedirect(session.url)) {
      console.error("Stripe returned an untrusted Checkout URL");
      return jsonNoStore({ message: "決済画面を開始できません。" }, { status: 502 });
    }
    return jsonNoStore({ url: session.url });
  } catch (error) {
    console.error("Stripe shop Checkout creation failed", error instanceof Error ? error.name : "unknown_error");
    return jsonNoStore({ message: "決済画面を開始できません。時間をおいてお試しください。" }, { status: 502 });
  }
}
