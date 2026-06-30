import { createHmac } from "node:crypto";
import type Stripe from "stripe";
import { z } from "zod";
import { products } from "@/lib/fallback-data";
import { booleanSetting, ConfigurationError, optionalSetting, requiredSetting } from "@/lib/server-config";
import { emptyNoStore, jsonNoStore, readBodyWithLimit } from "@/lib/security";
import { isSalonEnabled, isShopEnabled } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe, getStripeApplicationId } from "@/lib/stripe";

type Database = NonNullable<ReturnType<typeof createServiceClient>>;
const SUPPORTED_EVENTS = new Set(["checkout.session.completed", "customer.subscription.updated", "customer.subscription.deleted"]);
const ACTIVE_MEMBERSHIP_STATUSES = new Set(["active", "trialing"]);

async function claimEvent(database: Database, event: Stripe.Event) {
  const now = new Date().toISOString();
  const inserted = await database.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    status: "processing",
    attempts: 1,
    processing_started_at: now,
    updated_at: now,
  });
  if (!inserted.error) return true;
  if (inserted.error.code !== "23505") throw new Error(`webhook_claim_insert:${inserted.error.code}`);

  const existingResult = await database
    .from("stripe_webhook_events")
    .select("status,attempts,processing_started_at,updated_at")
    .eq("event_id", event.id)
    .maybeSingle();
  if (existingResult.error || !existingResult.data) throw new Error(`webhook_claim_lookup:${existingResult.error?.code ?? "missing"}`);
  const existing = existingResult.data;
  if (existing.status === "completed") return false;
  const started = Date.parse(existing.processing_started_at);
  if (existing.status === "processing" && Number.isFinite(started) && started > Date.now() - 5 * 60_000) return false;

  const claimed = await database
    .from("stripe_webhook_events")
    .update({
      status: "processing",
      attempts: Number(existing.attempts) + 1,
      processing_started_at: now,
      error_code: null,
      updated_at: now,
    })
    .eq("event_id", event.id)
    .eq("updated_at", existing.updated_at)
    .select("event_id")
    .maybeSingle();
  if (claimed.error) throw new Error(`webhook_claim_update:${claimed.error.code}`);
  return Boolean(claimed.data);
}

async function markEvent(database: Database, eventId: string, status: "completed" | "failed", errorCode?: string) {
  const now = new Date().toISOString();
  const result = await database.from("stripe_webhook_events").update({
    status,
    completed_at: status === "completed" ? now : null,
    error_code: status === "failed" ? (errorCode ?? "handler_error").slice(0, 120) : null,
    updated_at: now,
  }).eq("event_id", eventId);
  if (result.error) throw new Error(`webhook_state_update:${result.error.code}`);
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const timestamp = subscription.items.data[0]?.current_period_end;
  return new Date(timestamp ? timestamp * 1_000 : Date.now()).toISOString();
}

function salonConfiguration() {
  const priceId = requiredSetting("STRIPE_SALON_PRICE_ID");
  const couponId = requiredSetting("STRIPE_SALON_COUPON_ID");
  const codeSecret = requiredSetting("DISCOUNT_CODE_HMAC_SECRET", 32);
  const codePrefix = (optionalSetting("DISCOUNT_CODE_PREFIX") ?? "BEE").toUpperCase();
  if (!priceId.startsWith("price_")) throw new ConfigurationError("STRIPE_SALON_PRICE_ID", "must be a Stripe Price ID");
  if (!/^[A-Z0-9]{2,8}$/u.test(codePrefix)) throw new ConfigurationError("DISCOUNT_CODE_PREFIX", "must be 2-8 uppercase letters or digits");
  return { priceId, couponId, codeSecret, codePrefix };
}

function discountCode(userId: string, prefix: string, secret: string) {
  const suffix = createHmac("sha256", secret).update(userId, "utf8").digest("hex").slice(0, 10).toUpperCase();
  return `${prefix}-${suffix}`;
}

async function ensureDiscount(
  stripe: Stripe,
  database: Database,
  userId: string,
  applicationId: string,
) {
  const config = salonConfiguration();
  const coupon = await stripe.coupons.retrieve(config.couponId);
  if (coupon.deleted
    || typeof coupon.percent_off !== "number"
    || !Number.isInteger(coupon.percent_off)
    || coupon.percent_off < 1
    || coupon.percent_off > 50
    || !coupon.valid) throw new Error("invalid_salon_coupon");

  const existingResult = await database
    .from("discount_codes")
    .select("id,stripe_promotion_code_id,active")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingResult.error) throw new Error(`discount_lookup:${existingResult.error.code}`);
  if (existingResult.data) {
    if (!existingResult.data.active) {
      await stripe.promotionCodes.update(existingResult.data.stripe_promotion_code_id, { active: true });
      const reactivated = await database.from("discount_codes").update({ active: true }).eq("id", existingResult.data.id);
      if (reactivated.error) throw new Error(`discount_reactivate:${reactivated.error.code}`);
    }
    return;
  }

  const code = discountCode(userId, config.codePrefix, config.codeSecret);
  const matching = await stripe.promotionCodes.list({ code, limit: 1 });
  const promotion = matching.data[0] ?? await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code,
    metadata: { applicationId, purpose: "salon", userId },
  }, { idempotencyKey: `salon-promotion:${userId}` });

  if (!promotion.active) await stripe.promotionCodes.update(promotion.id, { active: true });
  const inserted = await database.from("discount_codes").insert({
    user_id: userId,
    code,
    stripe_promotion_code_id: promotion.id,
    percentage: Math.round(coupon.percent_off),
    active: true,
  });
  if (inserted.error && inserted.error.code !== "23505") throw new Error(`discount_insert:${inserted.error.code}`);
}

async function setDiscountActive(stripe: Stripe, database: Database, userId: string, active: boolean) {
  const lookup = await database
    .from("discount_codes")
    .select("id,stripe_promotion_code_id,active")
    .eq("user_id", userId)
    .maybeSingle();
  if (lookup.error) throw new Error(`discount_status_lookup:${lookup.error.code}`);
  if (!lookup.data || lookup.data.active === active) return;
  await stripe.promotionCodes.update(lookup.data.stripe_promotion_code_id, { active });
  const updated = await database.from("discount_codes").update({ active }).eq("id", lookup.data.id);
  if (updated.error) throw new Error(`discount_status_update:${updated.error.code}`);
}

async function processSalonCheckout(
  stripe: Stripe,
  database: Database,
  session: Stripe.Checkout.Session,
  applicationId: string,
  eventCreated: number,
) {
  const userId = session.metadata?.userId;
  if (!userId || !z.uuid().safeParse(userId).success || !session.subscription || !session.customer) {
    throw new Error("invalid_salon_checkout_metadata");
  }
  const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
  const authUser = await database.auth.admin.getUserById(userId);
  if (authUser.error || !authUser.data.user) throw new Error("salon_user_not_found");
  const checkoutEmail = session.customer_details?.email?.toLowerCase();
  if (checkoutEmail && authUser.data.user.email?.toLowerCase() !== checkoutEmail) throw new Error("salon_user_email_mismatch");
  const config = salonConfiguration();
  const subscriptionPriceIds = subscription.items.data.map((item) => item.price.id);
  if (subscription.metadata.applicationId !== applicationId
    || subscription.metadata.purpose !== "salon"
    || subscription.metadata.userId !== userId
    || !subscriptionPriceIds.includes(config.priceId)) {
    throw new Error("salon_subscription_mismatch");
  }

  const upserted = await database.from("memberships").upsert({
    user_id: userId,
    stripe_customer_id: String(session.customer),
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_end: subscriptionPeriodEnd(subscription),
    stripe_event_created_at: eventCreated,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (upserted.error) throw new Error(`membership_upsert:${upserted.error.code}`);
  if (ACTIVE_MEMBERSHIP_STATUSES.has(subscription.status)) await ensureDiscount(stripe, database, userId, applicationId);
}

async function processShopCheckout(stripe: Stripe, database: Database, session: Stripe.Checkout.Session) {
  if (session.mode !== "payment" || session.payment_status !== "paid") throw new Error("shop_session_not_paid");
  const allowedPrices = new Set(products.map((product) => product.stripePriceId).filter((value): value is string => Boolean(value?.startsWith("price_"))));
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  if (!lineItems.data.length || lineItems.has_more || lineItems.data.some((item) => !item.price?.id || !allowedPrices.has(item.price.id) || !item.quantity || item.quantity > 10)) {
    throw new Error("shop_line_item_mismatch");
  }

  const order = await database.from("orders").upsert({
    stripe_session_id: session.id,
    stripe_customer_id: session.customer ? String(session.customer) : null,
    email: session.customer_details?.email,
    amount_total: session.amount_total,
    currency: session.currency,
    status: session.payment_status,
    items_summary: lineItems.data.map((item) => {
      const product = products.find((candidate) => candidate.stripePriceId === item.price?.id);
      return `${product?.id ?? "unknown"}:${item.quantity ?? 0}`;
    }).join(",").slice(0, 1_000),
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_session_id" });
  if (order.error) throw new Error(`order_upsert:${order.error.code}`);
}

async function processSubscriptionUpdate(stripe: Stripe, database: Database, subscription: Stripe.Subscription, eventCreated: number) {
  const config = salonConfiguration();
  if (!subscription.items.data.some((item) => item.price.id === config.priceId)) throw new Error("salon_subscription_price_mismatch");
  const membership = await database
    .from("memberships")
    .select("user_id,stripe_event_created_at")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (membership.error) throw new Error(`membership_lookup:${membership.error.code}`);
  // A superseded or not-yet-associated subscription must not overwrite the
  // current membership. Checkout completion independently retrieves the latest
  // subscription state, so ignoring an early update remains fail-safe.
  if (!membership.data) return;
  if (Number(membership.data.stripe_event_created_at) > eventCreated) return;

  const updated = await database.from("memberships").update({
    status: subscription.status,
    current_period_end: subscriptionPeriodEnd(subscription),
    stripe_event_created_at: eventCreated,
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subscription.id);
  if (updated.error) throw new Error(`membership_update:${updated.error.code}`);
  await setDiscountActive(stripe, database, membership.data.user_id, ACTIVE_MEMBERSHIP_STATUSES.has(subscription.status));
}

export async function POST(request: Request) {
  if (!isSalonEnabled() && !isShopEnabled()) return emptyNoStore(404);
  const stripe = getStripe();
  const secret = optionalSetting("STRIPE_WEBHOOK_SECRET");
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature || signature.length > 2_048) return emptyNoStore(503);

  const body = await readBodyWithLimit(request, 512 * 1_024, ["application/json"]);
  if (!body.ok) return emptyNoStore(body.status);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body.raw, signature, secret);
  } catch {
    return emptyNoStore(400);
  }

  let applicationId: string;
  let expectedLiveMode: boolean;
  try {
    applicationId = getStripeApplicationId();
    expectedLiveMode = booleanSetting("STRIPE_EXPECT_LIVE_MODE", true)!;
  } catch (error) {
    console.error("Stripe webhook configuration is invalid", error instanceof ConfigurationError ? error.variable : "unknown");
    return emptyNoStore(503);
  }
  if (event.livemode !== expectedLiveMode) return emptyNoStore(400);
  if (!SUPPORTED_EVENTS.has(event.type)) return jsonNoStore({ received: true, ignored: true });

  const object = event.data.object;
  const metadata = "metadata" in object ? object.metadata : null;
  if (metadata?.applicationId !== applicationId) return jsonNoStore({ received: true, ignored: true });
  const salonEvent = metadata.purpose === "salon";
  const shopEvent = metadata.purpose === "shop";
  if ((salonEvent && !isSalonEnabled()) || (shopEvent && !isShopEnabled()) || (!salonEvent && !shopEvent)) {
    return jsonNoStore({ received: true, ignored: true });
  }

  const database = createServiceClient();
  if (!database) return emptyNoStore(503);
  let claimed: boolean;
  try {
    claimed = await claimEvent(database, event);
  } catch (error) {
    console.error("Stripe event claim failed", event.id, error instanceof Error ? error.message.split(":", 1)[0] : "unknown");
    return emptyNoStore(500);
  }
  if (!claimed) return jsonNoStore({ received: true, duplicate: true });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (salonEvent) await processSalonCheckout(stripe, database, session, applicationId, event.created);
      else await processShopCheckout(stripe, database, session);
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await processSubscriptionUpdate(stripe, database, event.data.object, event.created);
    } else {
      throw new Error("unsupported_event_type");
    }
    await markEvent(database, event.id, "completed");
    return jsonNoStore({ received: true });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.split(":", 1)[0] : "unknown_error";
    console.error("Stripe webhook handling failed", event.id, errorCode);
    try {
      await markEvent(database, event.id, "failed", errorCode);
    } catch (markError) {
      console.error("Could not mark failed Stripe event", event.id, markError instanceof Error ? markError.message.split(":", 1)[0] : "unknown");
    }
    return emptyNoStore(500);
  }
}
