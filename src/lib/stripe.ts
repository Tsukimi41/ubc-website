import "server-only";
import Stripe from "stripe";
import { ConfigurationError, optionalSetting } from "@/lib/server-config";

export function getStripe() {
  const key = optionalSetting("STRIPE_SECRET_KEY");
  if (!key) return null;
  if (!key.startsWith("sk_") || Buffer.byteLength(key, "utf8") < 24) {
    console.error("Stripe configuration is invalid", "STRIPE_SECRET_KEY");
    return null;
  }
  return new Stripe(key, {
    maxNetworkRetries: 2,
    timeout: 10_000,
    appInfo: { name: "Urban Bee Club website", version: "1.0.0" },
  });
}

export function getStripeApplicationId() {
  const value = optionalSetting("STRIPE_METADATA_APP_ID");
  if (!value || !/^[A-Za-z0-9_-]{8,64}$/u.test(value)) {
    throw new ConfigurationError("STRIPE_METADATA_APP_ID", "must be 8-64 letters, digits, underscores, or hyphens");
  }
  return value;
}

export function isTrustedStripeRedirect(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && ["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname);
  } catch {
    return false;
  }
}
