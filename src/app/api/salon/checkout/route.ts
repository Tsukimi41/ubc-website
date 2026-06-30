import type { NextRequest } from "next/server";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { ConfigurationError, optionalSetting } from "@/lib/server-config";
import {
  emptyNoStore,
  jsonNoStore,
  requestIdempotencyKey,
  validateBrowserMutation,
} from "@/lib/security";
import { isSalonEnabled, siteConfig } from "@/lib/site";
import { createAuthClient } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe, getStripeApplicationId, isTrustedStripeRedirect } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!isSalonEnabled()) return emptyNoStore(404);
  const mutation = validateBrowserMutation(request);
  if (!mutation.ok) return jsonNoStore({ message: mutation.message }, { status: mutation.status });

  const ipLimit = await consumeRateLimit(request, "salon-checkout:ip", { limit: 10, windowSeconds: 3_600 });
  if (!ipLimit.available) return jsonNoStore({ message: "決済機能を現在利用できません。" }, { status: 503 });
  if (!ipLimit.allowed) return jsonNoStore({ message: "しばらく待ってお試しください。" }, { status: 429, headers: rateLimitHeaders(ipLimit) });

  const idempotencyKey = requestIdempotencyKey(request);
  if (!idempotencyKey) return jsonNoStore({ message: "リクエストを識別できません。再読み込みしてください。" }, { status: 400 });
  const auth = await createAuthClient();
  if (!auth) return jsonNoStore({ message: "ログイン機能を現在利用できません。" }, { status: 503 });
  const { data: { user }, error: userError } = await auth.auth.getUser();
  if (userError || !user?.email) return jsonNoStore({ message: "先にログインしてください。" }, { status: 401 });

  const userLimit = await consumeRateLimit(request, "salon-checkout:user", { limit: 5, windowSeconds: 3_600 }, user.id);
  if (!userLimit.available) return jsonNoStore({ message: "決済機能を現在利用できません。" }, { status: 503 });
  if (!userLimit.allowed) return jsonNoStore({ message: "しばらく待ってお試しください。" }, { status: 429, headers: rateLimitHeaders(userLimit) });

  const service = createServiceClient();
  if (!service) return jsonNoStore({ message: "会員情報を確認できません。" }, { status: 503 });
  const { data: membership, error: membershipError } = await service
    .from("memberships")
    .select("stripe_customer_id,status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) {
    console.error("Membership lookup failed", membershipError.code);
    return jsonNoStore({ message: "会員情報を確認できません。" }, { status: 503 });
  }
  if (membership && ["active", "trialing"].includes(membership.status)) {
    return jsonNoStore({ message: "すでにサロン会員です。" }, { status: 409 });
  }

  const stripe = getStripe();
  const price = optionalSetting("STRIPE_SALON_PRICE_ID");
  if (!stripe || !price?.startsWith("price_")) return jsonNoStore({ message: "決済は現在準備中です。" }, { status: 503 });
  let applicationId: string;
  try {
    applicationId = getStripeApplicationId();
  } catch (error) {
    console.error("Stripe metadata configuration is invalid", error instanceof ConfigurationError ? error.variable : "unknown");
    return jsonNoStore({ message: "決済は現在準備中です。" }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer: membership?.stripe_customer_id ?? undefined,
      customer_email: membership?.stripe_customer_id ? undefined : user.email,
      success_url: `${siteConfig.url}/salon?joined=true`,
      cancel_url: `${siteConfig.url}/salon`,
      client_reference_id: user.id,
      expires_at: Math.floor(Date.now() / 1_000) + 30 * 60,
      metadata: { applicationId, purpose: "salon", userId: user.id },
      subscription_data: { metadata: { applicationId, purpose: "salon", userId: user.id } },
    }, { idempotencyKey: `salon:${user.id}:${idempotencyKey}` });

    if (!isTrustedStripeRedirect(session.url)) {
      console.error("Stripe returned an untrusted subscription Checkout URL");
      return jsonNoStore({ message: "決済画面を開始できません。" }, { status: 502 });
    }
    return jsonNoStore({ url: session.url });
  } catch (error) {
    console.error("Stripe salon Checkout creation failed", error instanceof Error ? error.name : "unknown_error");
    return jsonNoStore({ message: "決済画面を開始できません。時間をおいてお試しください。" }, { status: 502 });
  }
}
