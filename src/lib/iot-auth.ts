import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ConfigurationError, optionalSetting } from "@/lib/server-config";

const keySchema = z.record(
  z.string().regex(/^[A-Za-z0-9_-]{3,64}$/u),
  z.object({
    hiveId: z.uuid(),
    secret: z.string().min(32).max(512),
  }).strict(),
);

export type IoTIdentity = Readonly<{
  keyId: string;
  hiveId: string;
  ingestionId: string;
}>;

export type IoTAuthentication =
  | { ok: true; identity: IoTIdentity }
  | { ok: false; kind: "configuration" | "authentication" };

function configuredKeys() {
  const raw = optionalSetting("IOT_INGEST_KEYS");
  if (!raw) throw new ConfigurationError("IOT_INGEST_KEYS", "is required");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new ConfigurationError("IOT_INGEST_KEYS", "must be valid JSON");
  }
  const parsed = keySchema.safeParse(parsedJson);
  if (!parsed.success || Object.keys(parsed.data).length === 0 || Object.keys(parsed.data).length > 100) {
    throw new ConfigurationError("IOT_INGEST_KEYS", "must contain 1-100 valid device keys");
  }
  for (const value of Object.values(parsed.data)) {
    if (Buffer.byteLength(value.secret, "utf8") < 32) {
      throw new ConfigurationError("IOT_INGEST_KEYS", "every device secret must contain at least 32 bytes");
    }
  }
  return parsed.data;
}

function signatureToleranceSeconds() {
  const raw = optionalSetting("IOT_SIGNATURE_TOLERANCE_SECONDS") ?? "300";
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 30 || value > 900) {
    throw new ConfigurationError("IOT_SIGNATURE_TOLERANCE_SECONDS", "must be an integer between 30 and 900");
  }
  return value;
}

function safeEqualHex(received: string, expected: string) {
  if (!/^[a-f0-9]{64}$/u.test(received)) return false;
  const a = Buffer.from(received, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Authenticates a sensor request with a versioned HMAC over the exact raw body.
 * A timestamp limits replay time and ingestionId provides database-enforced
 * idempotency. Device keys are scoped to exactly one hive.
 */
export function authenticateIoTRequest(request: Request, rawBody: string): IoTAuthentication {
  let keys: ReturnType<typeof configuredKeys>;
  let tolerance: number;
  try {
    keys = configuredKeys();
    tolerance = signatureToleranceSeconds();
  } catch (error) {
    console.error("IoT authentication configuration is invalid", error instanceof ConfigurationError ? error.variable : "unknown");
    return { ok: false, kind: "configuration" };
  }

  const keyId = request.headers.get("x-ubc-key-id")?.trim() ?? "";
  const timestampText = request.headers.get("x-ubc-timestamp")?.trim() ?? "";
  const ingestionId = request.headers.get("x-ubc-idempotency-key")?.trim().toLowerCase() ?? "";
  const signatureHeader = request.headers.get("x-ubc-signature")?.trim().toLowerCase() ?? "";
  const signature = signatureHeader.startsWith("v1=") ? signatureHeader.slice(3) : "";
  const key = keys[keyId];

  if (!key || !/^\d{10,11}$/u.test(timestampText) || !z.uuid().safeParse(ingestionId).success) {
    return { ok: false, kind: "authentication" };
  }

  const timestamp = Number(timestampText);
  const now = Math.floor(Date.now() / 1_000);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > tolerance) {
    return { ok: false, kind: "authentication" };
  }

  const signedPayload = `${timestampText}\n${ingestionId}\n${rawBody}`;
  const expected = createHmac("sha256", key.secret).update(signedPayload, "utf8").digest("hex");
  if (!safeEqualHex(signature, expected)) return { ok: false, kind: "authentication" };

  return { ok: true, identity: { keyId, hiveId: key.hiveId, ingestionId } };
}

export function validateReadingTime(recordedAt: string) {
  const parsed = Date.parse(recordedAt);
  if (!Number.isFinite(parsed)) return false;
  const rawMaximumAge = optionalSetting("IOT_MAX_READING_AGE_SECONDS") ?? "604800";
  const maximumAge = Number(rawMaximumAge);
  if (!Number.isSafeInteger(maximumAge) || maximumAge < 300 || maximumAge > 2_592_000) {
    console.error("IoT reading age configuration is invalid", "IOT_MAX_READING_AGE_SECONDS");
    return false;
  }
  const differenceSeconds = (Date.now() - parsed) / 1_000;
  return differenceSeconds >= -300 && differenceSeconds <= maximumAge;
}
