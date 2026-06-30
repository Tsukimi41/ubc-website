import { describe, expect, it } from "vitest";
import { trustedStripeNavigation } from "@/lib/client-security";

describe("Stripe navigation", () => {
  it("allows only Stripe-owned HTTPS checkout and billing hosts", () => {
    expect(trustedStripeNavigation("https://checkout.stripe.com/c/pay/test")).toBe("https://checkout.stripe.com/c/pay/test");
    expect(trustedStripeNavigation("https://billing.stripe.com/p/session/test")).toBe("https://billing.stripe.com/p/session/test");
    expect(trustedStripeNavigation("https://checkout.stripe.com.attacker.example/test")).toBeNull();
    expect(trustedStripeNavigation("javascript:alert(1)")).toBeNull();
  });
});
