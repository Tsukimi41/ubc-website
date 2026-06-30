/** Client-side defence in depth for URLs returned by payment APIs. */
export function trustedStripeNavigation(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return ["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

export function newIdempotencyKey() {
  if (!globalThis.crypto?.randomUUID) throw new Error("安全なリクエスト識別子を生成できません。ブラウザを更新してください。");
  return globalThis.crypto.randomUUID();
}
