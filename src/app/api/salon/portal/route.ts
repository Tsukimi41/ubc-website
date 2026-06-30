import type { NextRequest } from "next/server";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import {
  emptyNoStore,
  jsonNoStore,
  requestIdempotencyKey,
  validateBrowserMutation,
} from "@/lib/security";
import { isSalonEnabled, siteConfig } from "@/lib/site";
import { createAuthClient } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe, isTrustedStripeRedirect } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!isSalonEnabled()) return emptyNoStore(404);
  const mutation = validateBrowserMutation(request);
  if (!mutation.ok) return jsonNoStore({ message: mutation.message }, { status: mutation.status });
  const idempotencyKey = requestIdempotencyKey(request);
  if (!idempotencyKey) return jsonNoStore({ message: "リクエストを識別できません。再読み込みしてください。" }, { status: 400 });

  const auth = await createAuthClient();
  if (!auth) return jsonNoStore({ message: "ログイン機能を現在利用できません。" }, { status: 503 });
  const { data: { user }, error: userError } = await auth.auth.getUser();
  if (userError || !user) return jsonNoStore({ message: "ログインしてください。" }, { status: 401 });

  const limit = await consumeRateLimit(request, "salon-portal:user", { limit: 10, windowSeconds: 3_600 }, user.id);
  if (!limit.available) return jsonNoStore({ message: "会員機能を現在利用できません。" }, { status: 503 });
  if (!limit.allowed) return jsonNoStore({ message: "しばらく待ってお試しください。" }, { status: 429, headers: rateLimitHeaders(limit) });

  const service = createServiceClient();
  if (!service) return jsonNoStore({ message: "会員情報を確認できません。" }, { status: 503 });
  const { data, error } = await service
    .from("memberships")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Membership portal lookup failed", error.code);
    return jsonNoStore({ message: "会員情報を確認できません。" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe || !data?.stripe_customer_id) return jsonNoStore({ message: "会員情報が見つかりません。" }, { status: 404 });

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${siteConfig.url}/salon`,
    }, { idempotencyKey: `portal:${user.id}:${idempotencyKey}` });
    if (!isTrustedStripeRedirect(session.url)) {
      console.error("Stripe returned an untrusted Billing Portal URL");
      return jsonNoStore({ message: "支払い管理画面を開始できません。" }, { status: 502 });
    }
    return jsonNoStore({ url: session.url });
  } catch (error) {
    console.error("Stripe Billing Portal creation failed", error instanceof Error ? error.name : "unknown_error");
    return jsonNoStore({ message: "支払い管理画面を開始できません。" }, { status: 502 });
  }
}
