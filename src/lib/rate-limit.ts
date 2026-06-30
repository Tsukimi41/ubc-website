import "server-only";
import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { requestIp } from "@/lib/security";
import { createServiceClient } from "@/lib/supabase/server";

export type RateLimitPolicy = Readonly<{
  limit: number;
  windowSeconds: number;
}>;

export type RateLimitResult = Readonly<{
  available: boolean;
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}>;

type LocalBucket = { count: number; resetAt: number };
const localBuckets = new Map<string, LocalBucket>();

function validatePolicy(policy: RateLimitPolicy) {
  if (!Number.isSafeInteger(policy.limit) || policy.limit < 1 || policy.limit > 10_000) {
    throw new TypeError("Rate-limit limit must be between 1 and 10,000");
  }
  if (!Number.isSafeInteger(policy.windowSeconds) || policy.windowSeconds < 1 || policy.windowSeconds > 86_400) {
    throw new TypeError("Rate-limit window must be between 1 and 86,400 seconds");
  }
}

function consumeLocal(key: string, policy: RateLimitPolicy): RateLimitResult {
  const now = Date.now();
  const existing = localBuckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 1, resetAt: now + policy.windowSeconds * 1_000 }
    : { ...existing, count: existing.count + 1 };
  localBuckets.set(key, bucket);

  if (localBuckets.size > 2_000) {
    for (const [candidate, value] of localBuckets) {
      if (value.resetAt <= now) localBuckets.delete(candidate);
    }
  }

  return {
    available: true,
    allowed: bucket.count <= policy.limit,
    remaining: Math.max(0, policy.limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
  };
}

function unavailable(): RateLimitResult {
  return { available: false, allowed: false, remaining: 0, retryAfter: 60 };
}

/**
 * Uses an atomic PostgreSQL function in production so limits are shared by all
 * Serverless instances. Production deliberately fails closed if the shared
 * limiter or its HMAC secret is unavailable.
 */
export async function consumeRateLimit(
  request: NextRequest,
  scope: string,
  policy: RateLimitPolicy,
  subject?: string,
): Promise<RateLimitResult> {
  validatePolicy(policy);
  if (!/^[a-z0-9:_-]{1,80}$/u.test(scope)) throw new TypeError("Invalid rate-limit scope");

  const identifier = subject ?? requestIp(request);
  const secret = process.env.RATE_LIMIT_HMAC_SECRET?.trim();
  const backend = process.env.RATE_LIMIT_BACKEND?.trim().toLowerCase()
    ?? (process.env.NODE_ENV === "production" ? "database" : "memory");

  if (backend === "memory" && process.env.NODE_ENV !== "production") {
    return consumeLocal(`${scope}:${identifier}`, policy);
  }

  if (backend !== "database" || !secret || Buffer.byteLength(secret, "utf8") < 32) {
    console.error("Rate limiter unavailable: database backend and a 32-byte RATE_LIMIT_HMAC_SECRET are required");
    return unavailable();
  }

  const client = createServiceClient();
  if (!client) {
    console.error("Rate limiter unavailable: Supabase service client is not configured");
    return unavailable();
  }

  const bucketKey = createHmac("sha256", secret)
    .update(`${scope}\0${identifier}`, "utf8")
    .digest("hex");

  const { data, error } = await client
    .rpc("consume_rate_limit", {
      p_bucket_key: bucketKey,
      p_limit: policy.limit,
      p_window_seconds: policy.windowSeconds,
    })
    .single();

  if (error || !data) {
    console.error("Rate limiter database call failed", error?.code ?? "empty_result");
    return unavailable();
  }

  const row = data as { allowed?: unknown; remaining?: unknown; retry_after?: unknown };
  if (typeof row.allowed !== "boolean" || typeof row.remaining !== "number" || typeof row.retry_after !== "number") {
    console.error("Rate limiter database call returned an invalid result");
    return unavailable();
  }

  return {
    available: true,
    allowed: row.allowed,
    remaining: Math.max(0, Math.trunc(row.remaining)),
    retryAfter: Math.max(1, Math.trunc(row.retry_after)),
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Remaining": String(result.remaining),
    "Retry-After": String(result.retryAfter),
  };
}
